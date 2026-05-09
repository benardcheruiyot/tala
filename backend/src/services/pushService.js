const webpush = require('web-push');

// In-memory subscription store (keyed by userId)
const subscriptions = new Map();

function configure() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@tala.mkopaji.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

function saveSubscription(userId, subscription) {
  subscriptions.set(String(userId), subscription);
}

function removeSubscription(userId) {
  subscriptions.delete(String(userId));
}

async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    // 410 Gone = subscription expired/unsubscribed
    if (err.statusCode === 410) {
      return 'gone';
    }
    console.error('Push send error:', err.message);
    return false;
  }
}

async function sendToUser(userId, payload) {
  const sub = subscriptions.get(String(userId));
  if (!sub) return 'not_subscribed';
  const result = await sendNotification(sub, payload);
  if (result === 'gone') subscriptions.delete(String(userId));
  return result;
}

const HOURLY_MESSAGES = [
  { title: 'Tala Mkopo', body: 'Need quick cash? Apply for a loan in minutes — no paperwork needed!' },
  { title: 'Tala Mkopo 💰', body: 'Your next loan is one tap away. Fast approval, flexible repayment.' },
  { title: 'Loan Ready for You', body: 'Get up to KES 100,000 today. Apply now and receive funds instantly.' },
  { title: 'Tala Mkopo Reminder', body: 'Don\'t let money hold you back. Apply for your loan right now.' },
  { title: 'Quick Cash Available', body: 'Low processing fee, high loan amounts. Start your application today!' },
  { title: 'Tala Mkopo', body: 'Pay school fees, rent, or bills — get a loan in under 5 minutes.' },
  { title: 'Funds When You Need Them', body: 'Emergency cash? Tala Mkopo has you covered. Apply now.' },
  { title: 'Tala Mkopo 🏦', body: 'Top up your business, pay bills, or cover emergencies. Loans start at KES 5,500.' },
  { title: 'Apply for a Loan Today', body: 'Repay in 30, 60, or 90 days — terms that work for you.' },
  { title: 'Tala Mkopo', body: 'Still thinking about it? Your loan application takes less than 2 minutes.' },
  { title: 'Money in Minutes', body: 'M-Pesa directly to your phone. Fast, safe, and affordable.' },
  { title: 'Tala Mkopo Reminder', body: 'Thousands of Kenyans trust Tala Mkopo. Join them — apply now.' },
  { title: 'Tala Mkopo 🔔', body: 'Morning or night — we\'re always open. Apply for your loan anytime.' },
  { title: 'Got Bills to Pay?', body: 'Cover your expenses with a Tala Mkopo loan. Quick and hassle-free.' },
  { title: 'Tala Mkopo', body: 'Your financial solution is here. Apply for a loan and get funded today.' },
  { title: 'Don\'t Wait — Apply Now', body: 'Loan applications are open 24/7. Get your cash before you need it.' },
  { title: 'Tala Mkopo 💡', body: 'Smart borrowing, flexible repayment. Apply for a loan with Tala Mkopo.' },
  { title: 'Tala Mkopo', body: 'We believe in you. Get the funds you need to move forward — apply now.' },
  { title: 'Instant Loan Offer', body: 'Qualify for up to KES 100,000. Check your eligibility and apply today.' },
  { title: 'Tala Mkopo Reminder', body: 'Turn your plans into action. A loan from Tala Mkopo can make it happen.' },
  { title: 'Tala Mkopo 🌟', body: 'No long queues, no paperwork. Just fast cash via M-Pesa.' },
  { title: 'Tala Mkopo', body: 'Your future doesn\'t have to wait. Apply for a loan and take charge today.' },
  { title: 'Need Extra Cash?', body: 'Tala Mkopo loans are affordable and fast. Apply in under 2 minutes.' },
  { title: 'Tala Mkopo', body: 'Pay less in fees, get more in funds. Apply for your loan right now.' },
];

let hourlyMessageIndex = 0;

function getNextHourlyMessage() {
  const msg = HOURLY_MESSAGES[hourlyMessageIndex % HOURLY_MESSAGES.length];
  hourlyMessageIndex++;
  return msg;
}

async function broadcastHourlyReminder() {
  if (subscriptions.size === 0) return;

  const { title, body } = getNextHourlyMessage();
  const payload = {
    title,
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: 'https://tala.mkopaji.com',
  };

  const stale = [];
  for (const [userId, sub] of subscriptions.entries()) {
    const result = await sendNotification(sub, payload);
    if (result === 'gone') stale.push(userId);
  }
  stale.forEach((id) => subscriptions.delete(id));
}

module.exports = { configure, saveSubscription, removeSubscription, sendToUser, broadcastHourlyReminder };
