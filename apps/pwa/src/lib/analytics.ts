/**
 * FormIQ → Varshyl Dashboard Master analytics.
 * Currently a no-op — hub.varshyl.com is being restored.
 * Will activate automatically once VITE_VARSHYL_WEBHOOK_URL is added to Railway env vars.
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
        ...(webhookSecret ? { 'x-api-key': webhookSecret } : {}),
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
