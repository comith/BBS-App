// pages/api/test-push.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // เรียก API send-notification
      const response = await fetch(`${req.headers.origin}/api/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'ทดสอบ Push Notification',
          body: 'นี่คือข้อความทดสอบจาก Server!',
          icon: '/favicon.ico',
          url: '/'
        })
      });

      const result = await response.json();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}