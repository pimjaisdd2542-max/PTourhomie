/* =====================================================================
   Our Homie — Service Worker
   หน้าที่: (1) รับ push event จาก Supabase Edge Function แล้วเด้ง
   notification ขึ้นจอ (2) ทำให้แอปติดตั้งเป็น PWA ได้ (จำเป็นสำหรับ iOS)
   ===================================================================== */

const APP_URL = './our-homie-app.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ----- รับ push message จากเซิร์ฟเวอร์ (Supabase Edge Function) -----
self.addEventListener('push', (event) => {
  let payload = { title: 'Our Homie', body: 'คุณมีการแจ้งเตือนใหม่', url: APP_URL };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    // ถ้า payload ไม่ใช่ JSON ให้ fallback เป็นข้อความธรรมดา
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: payload.url || APP_URL },
    vibrate: [100, 50, 100],
    tag: payload.tag || 'our-homie-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// ----- กดที่ notification แล้วเปิด/โฟกัสแอป -----
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || APP_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes('our-homie-app.html'));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
