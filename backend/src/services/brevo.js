const axios = require('axios');

const BREVO_BASE = 'https://api.brevo.com/v3';

function client() {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  return axios.create({
    baseURL: BREVO_BASE,
    headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    timeout: 10000,
  });
}

async function addSubscriber({ email, name }) {
  const c = client();
  if (!c) throw new Error('BREVO_API_KEY not configured');
  const listId = parseInt(process.env.BREVO_LIST_ID || '0', 10);
  if (!listId) throw new Error('BREVO_LIST_ID not configured');
  const [firstName, ...rest] = (name || '').trim().split(/\s+/);
  try {
    await c.post('/contacts', {
      email,
      listIds: [listId],
      updateEnabled: true,
      attributes: { FIRSTNAME: firstName || '', LASTNAME: rest.join(' ') },
    });
    return true;
  } catch (err) {
    const code = err?.response?.data?.code;
    // Already in list → treat as success
    if (code === 'duplicate_parameter') return true;
    throw new Error(err?.response?.data?.message || err.message);
  }
}

async function getSubscriberCount() {
  const c = client();
  if (!c) return null;
  const listId = parseInt(process.env.BREVO_LIST_ID || '0', 10);
  if (!listId) return null;
  try {
    const { data } = await c.get(`/contacts/lists/${listId}`);
    return data?.totalSubscribers ?? data?.uniqueSubscribers ?? null;
  } catch {
    return null;
  }
}

module.exports = { addSubscriber, getSubscriberCount };
