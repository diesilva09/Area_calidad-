import webpush from 'web-push';
import pool from '@/lib/db';

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error('VAPID env vars faltantes. Define NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT');
  }

  return { publicKey, privateKey, subject };
}

function ensureWebPushConfigured() {
  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushToAll(payload: { title: string; message: string; url?: string }) {
  ensureWebPushConfigured();

  const res = await pool.query<PushSubscriptionRow>(
    `SELECT endpoint, p256dh, auth
     FROM notificaciones.push_subscriptions`
  );

  const subs = res.rows || [];

  await Promise.all(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: {
          p256dh: s.p256dh,
          auth: s.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription as any, JSON.stringify(payload));
      } catch (err: any) {
        const statusCode = Number(err?.statusCode);
        if (statusCode === 404 || statusCode === 410) {
          try {
            await pool.query('DELETE FROM notificaciones.push_subscriptions WHERE endpoint = $1', [s.endpoint]);
          } catch {
            // ignore
          }
          return;
        }
        console.error('Error enviando push:', err);
      }
    })
  );
}

export async function getVapidPublicKey() {
  const { publicKey } = getVapidConfig();
  return publicKey;
}
