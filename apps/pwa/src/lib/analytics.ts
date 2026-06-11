/**
 * FormIQ → Varshyl Dashboard Master analytics.
 * Sends events to hub.varshyl.com via the VSAA webhook.
 * Auth header: X-Varshyl-Key (matches hub.varshyl.com/webhook/formiq contract).
 */

export async function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>
): Promise<void> {
  const webhookUrl = import.meta.env.VITE_VARSHYL_WEBHOOK_URL;
  const webhookSecret = import.meta.env.VITE_VARSHYL_WEBHOOK_SECRET;

  // No-op if webhook not configured yet
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // X-Varshyl-Key is the auth header expected by hub.varshyl.com
        ...(webhookSecret ? { 'X-Varshyl-Key': webhookSecret } : {}),
      },
      body: JSON.stringify({
        product: 'formiq',
        event: name,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        props: props ?? {},
      }),
    });
  } catch {
    // Never let analytics break the app
  }
}

