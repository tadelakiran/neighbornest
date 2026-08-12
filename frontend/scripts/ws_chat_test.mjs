/**
 * End-to-end WebSocket chat test.
 *
 * Connects two seeded users (Priya, profile 1 / Sneha, profile 4) to the
 * chat-service STOMP endpoint through the API Gateway, then:
 *   1. Sneha sends a NEST group message → Priya receives it on /topic/nest/1/messages
 *   2. Priya starts a DM with Sneha and sends a message → Sneha receives it on
 *      /queue/user/4/dm
 *
 * Run from frontend/ so node_modules resolves:
 *   node scripts/ws_chat_test.mjs
 */
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const BASE = 'http://localhost:8080';

async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login failed for ${email}: ${JSON.stringify(data)}`);
  return data.access_token;
}

function connect(token, label) {
  return new Promise((resolve, reject) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE}/ws/chat`),
      reconnectDelay: 0,
      connectHeaders: { token },
      debug: (msg) => console.log(`[${label}] ${msg.trim()}`),
    });
    client.onConnect = () => resolve(client);
    client.onStompError = (f) => reject(new Error(`STOMP error: ${f.headers?.message ?? 'unknown'}`));
    client.onWebSocketError = (e) => reject(new Error(`WS error: ${e.message}`));
    client.activate();
  });
}

function subscribeOnce(client, dest, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let sub;
    const timer = setTimeout(() => {
      try { sub?.unsubscribe(); } catch { /* ignore */ }
      reject(new Error(`timeout waiting for ${dest}`));
    }, timeoutMs);
    sub = client.subscribe(dest, (frame) => {
      clearTimeout(timer);
      resolve(JSON.parse(frame.body));
    });
  });
}

const results = {};

try {
  const priyaToken = await apiLogin('priya.hyd@neighbornest.dev', 'Demo@1234');
  const snehaToken = await apiLogin('sneha.hyd@neighbornest.dev', 'Demo@1234');

  const priya = await connect(priyaToken, 'priya');
  console.log('✓ Priya connected (profile 1)');
  const sneha = await connect(snehaToken, 'sneha');
  console.log('✓ Sneha connected (profile 4)');

  // ── 1. GROUP CHAT (dot-separated topic: RabbitMQ STOMP rejects slashes) ──
  const NEST_ID = 1;
  const groupPromise = subscribeOnce(priya, `/topic/nest.${NEST_ID}.messages`);
  sneha.publish({
    destination: `/app/chat/nest/${NEST_ID}/send`,
    body: JSON.stringify({
      roomType: 'NEST_GROUP',
      nestId: NEST_ID,
      content: 'Group chat E2E test from Sneha!',
    }),
  });
  const groupMsg = await groupPromise;
  console.log(`✓ Group message received by Priya: "${groupMsg.content}" (sender: ${groupMsg.sender_name})`);
  results.groupChat = true;
  results.groupMessageId = groupMsg.id;

  // ── 2. DIRECT MESSAGE ──
  const convRes = await fetch(`${BASE}/api/chat/dm/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${priyaToken}` },
    body: JSON.stringify({ participantId: 4 }),
  });
  const conv = await convRes.json();
  if (!convRes.ok) throw new Error(`DM start failed: ${JSON.stringify(conv)}`);
  console.log(`✓ Conversation started: id=${conv.id} with ${conv.participant_name}`);
  results.convId = conv.id;

  const dmPromise = subscribeOnce(sneha, `/queue/user.4.dm`);
  priya.publish({
    destination: `/app/chat/dm/${conv.id}/send`,
    body: JSON.stringify({
      roomType: 'DIRECT',
      conversationId: conv.id,
      content: 'DM E2E test from Priya!',
    }),
  });
  const dmMsg = await dmPromise;
  console.log(`✓ DM received by Sneha: "${dmMsg.content}" (from: ${dmMsg.sender_name})`);
  results.dmChat = true;
  results.dmMessageId = dmMsg.id;

  try { priya.deactivate(); } catch { /* ignore */ }
  try { sneha.deactivate(); } catch { /* ignore */ }
} catch (err) {
  console.error('✗ TEST FAILED:', err.message);
  process.exit(1);
}

console.log('RESULT ' + JSON.stringify(results));
process.exit(0);
