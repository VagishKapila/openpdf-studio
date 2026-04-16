import { db } from '../../shared/db';
import { payments, documents, signatureRequests, auditLog } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import Stripe from 'stripe';
import { createNotification } from '../../shared/services/notification.service';

// Initialize Stripe (lazy — only when keys are available)
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
    stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// ===== TYPES =====
export interface CreateCheckoutInput {
  documentId: string;
  creatorId: string;
  amount: number;        // in cents
  currency?: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  payerEmail?: string;
}

// ===== CREATE STRIPE CHECKOUT SESSION =====
export async function createCheckoutSession(input: CreateCheckoutInput) {
  const s = getStripe();

  // 1. Create Stripe Checkout Session
  const session = await s.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: input.currency || 'usd',
        product_data: {
          name: input.description || 'Document Signing Payment',
          description: 'Payment for signed document via OpenPDF Studio',
        },
        unit_amount: input.amount,
      },
      quantity: 1,
    }],
    customer_email: input.payerEmail || undefined,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      documentId: input.documentId,
      creatorId: input.creatorId,
    },
  });

  // 2. Create payment record in DB
  const [payment] = await db.insert(payments).values({
    documentId: input.documentId,
    creatorId: input.creatorId,
    amount: input.amount,
    currency: input.currency || 'usd',
    description: input.description,
    provider: 'stripe',
    providerPaymentId: session.id,
    paymentLink: session.url,
    status: 'pending',
    payerEmail: input.payerEmail,
  }).returning();

  // 3. Update document status
  await db.update(documents)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(eq(documents.id, input.documentId));

  // 4. Audit log
  await db.insert(auditLog).values({
    documentId: input.documentId,
    userId: input.creatorId,
    action: 'payment.created',
    metadata: { amount: input.amount, currency: input.currency || 'usd', sessionId: session.id },
  });

  return {
    payment,
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

// ===== GET PAYMENT STATUS =====
export async function getPaymentStatus(paymentId: string) {
  const [payment] = await db.select()
    .from(payments)
    .where(eq(payments.id, paymentId));

  return payment || null;
}

// ===== GET PAYMENT BY DOCUMENT =====
export async function getPaymentByDocument(documentId: string) {
  const [payment] = await db.select()
    .from(payments)
    .where(eq(payments.documentId, documentId));

  return payment || null;
}

// ===== HANDLE STRIPE WEBHOOK =====
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const documentId = session.metadata?.documentId;
      const requestId = session.metadata?.requestId;

      if (documentId) {
        // Update payment status
        const [payment] = await db.update(payments)
          .set({
            status: 'paid',
            paidAt: new Date(),
            payerEmail: session.customer_email || undefined,
          })
          .where(eq(payments.providerPaymentId, session.id))
          .returning();

        // Update document status to completed
        await db.update(documents)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        // If this is a signing-flow payment, update signature request status
        if (requestId) {
          const [request] = await db.select()
            .from(signatureRequests)
            .where(eq(signatureRequests.id, requestId));

          if (request) {
            await db.update(signatureRequests)
              .set({ status: 'paid' })
              .where(eq(signatureRequests.id, requestId));

            // Create notification for sender - payment received
            try {
              const [doc] = await db.select()
                .from(documents)
                .where(eq(documents.id, documentId));

              const amount = payment.amount ? (payment.amount / 100).toFixed(2) : '0.00';
              const docName = doc?.fileName || 'Document';

              await createNotification({
                userId: request.senderId,
                orgId: doc?.orgId || undefined,
                type: 'payment.received',
                title: 'Payment Received',
                message: `$${amount} ${request.paymentCurrency?.toUpperCase() || 'USD'} received for "${docName}"`,
                data: {
                  documentId,
                  requestId,
                  paymentId: payment.id,
                  amount,
                  recipientEmail: request.recipientEmail,
                },
              });
            } catch (err) {
              console.warn('[payment] Failed to create payment received notification:', err);
            }
          }
        }

        // Audit log
        await db.insert(auditLog).values({
          documentId,
          action: 'payment.completed',
          metadata: {
            sessionId: session.id,
            amount: session.amount_total,
            payerEmail: session.customer_email,
            requestId,
          },
        });
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.update(payments)
        .set({ status: 'expired' })
        .where(eq(payments.providerPaymentId, session.id));
      break;
    }

    default:
      // Unhandled event type
      break;
  }
}
