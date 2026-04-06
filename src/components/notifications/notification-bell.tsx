'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  dedupe_key?: string | null;
  created_at?: string | null;
  is_read?: boolean;
};

type NotificationsResponse = {
  items: NotificationItem[];
  unread_count: number;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState<'unknown' | 'enabled' | 'disabled' | 'unsupported'>('unknown');
  const [pushBusy, setPushBusy] = useState(false);

  const topItems = useMemo(() => items.slice(0, 10), [items]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=30', { credentials: 'include' });
      
      // Si retorna 401, el usuario no está autenticado - es normal, solo ignorar silenciosamente
      if (res.status === 401) {
        setItems([]);
        setUnreadCount(0);
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error desconocido');
        throw new Error(errorText);
      }
      
      const data = (await res.json()) as NotificationsResponse;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(Number(data?.unread_count ?? 0));
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (notificationId: number) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      });
      
      if (res.status === 401) {
        // Usuario no autenticado, ignorar silenciosamente
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error desconocido');
        throw new Error(errorText);
      }
      
      await load();
    } catch (e) {
      console.error('Error marcando notificación como leída:', e);
    }
  };

  const refreshPushStatus = async () => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushStatus('unsupported');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setPushStatus('disabled');
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      setPushStatus(sub ? 'enabled' : 'disabled');
    } catch {
      setPushStatus('disabled');
    }
  };

  const enablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setPushStatus('unsupported');
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPushStatus('disabled');
        return;
      }

      const keyRes = await fetch('/api/push/vapid-public-key', { credentials: 'include' });
      
      if (keyRes.status === 401) {
        setPushStatus('disabled');
        return;
      }
      
      if (!keyRes.ok) {
        const errorText = await keyRes.text().catch(() => 'Error desconocido');
        throw new Error(errorText);
      }
      
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error('VAPID public key no configurada');

      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const subscription =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(String(publicKey)),
        }));

      const payload = subscription.toJSON();

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (saveRes.status === 401) {
        setPushStatus('disabled');
        return;
      }

      if (!saveRes.ok) {
        const errorText = await saveRes.text().catch(() => 'Error desconocido');
        throw new Error(errorText);
      }
      
      setPushStatus('enabled');
    } catch (e) {
      console.error('Error habilitando Web Push:', e);
      setPushStatus('disabled');
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestPush = async () => {
    try {
      const res = await fetch('/api/push/test', { method: 'POST', credentials: 'include' });
      
      if (res.status === 401) {
        // Usuario no autenticado, ignorar silenciosamente
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error desconocido');
        throw new Error(errorText);
      }
    } catch (e) {
      console.error('Error enviando push de prueba:', e);
    }
  };

  useEffect(() => {
    load();
    refreshPushStatus();
    const id = window.setInterval(() => load(), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
    refreshPushStatus();
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative bg-white border-gray-200 hover:bg-gray-50 shadow-md hover:shadow-lg p-2 sm:p-3">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : String(unreadCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="text-sm font-semibold">Notificaciones</div>
          <div className="text-xs text-muted-foreground">{loading ? 'Cargando…' : `${unreadCount} sin leer`}</div>
        </div>

        <div className="px-2 pb-2">
          {pushStatus === 'unsupported' ? (
            <div className="text-xs text-muted-foreground">Tu navegador no soporta Web Push.</div>
          ) : pushStatus === 'enabled' ? (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">Notificaciones del navegador: activas</div>
              <Button type="button" variant="outline" size="sm" onClick={sendTestPush} className="h-7 px-2 text-xs">
                Probar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">Notificaciones del navegador: desactivadas</div>
              <Button type="button" variant="outline" size="sm" disabled={pushBusy} onClick={enablePush} className="h-7 px-2 text-xs">
                {pushBusy ? 'Activando…' : 'Activar'}
              </Button>
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-auto">
          {topItems.length === 0 ? (
            <div className="px-2 py-6 text-sm text-muted-foreground">No hay notificaciones.</div>
          ) : (
            <div className="divide-y">
              {topItems.map((n) => (
                <button
                  key={String(n.id)}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-2 py-2.5 hover:bg-gray-50 ${n.is_read ? '' : 'bg-blue-50/40'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium break-words">{n.title}</div>
                      <div className="text-xs text-muted-foreground break-words mt-0.5">{n.message}</div>
                    </div>
                    {!n.is_read && (
                      <Badge className="shrink-0 bg-blue-100 text-blue-800 hover:bg-blue-100">Nuevo</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
