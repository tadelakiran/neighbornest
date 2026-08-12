/**
 * Raw STOMP-over-TCP probe against the RabbitMQ STOMP plugin (port 61613).
 * Tests which SUBSCRIBE destination formats RabbitMQ accepts/rejects.
 */
import net from 'node:net';

const HOST = '127.0.0.1';
const PORT = 61613;
const USER = 'neighbornest';
const PASS = 'neighbornest';

const destinations = [
  '/topic/nest/1/messages',   // slash topic — expected REJECT
  '/topic/nest.1.messages',   // dot topic — expected ACCEPT
  '/queue/user/4/dm',         // slash queue — expected REJECT
  '/queue/user.4.dm',         // dot queue — expected ACCEPT
];

function testDestination(dest) {
  return new Promise((resolve) => {
    const socket = net.connect(PORT, HOST, () => {
      socket.write(`CONNECT\naccept-version:1.2\nhost:/\nlogin:${USER}\npasscode:${PASS}\n\n\x00`);
    });
    let buf = '';
    const timer = setTimeout(() => {
      socket.destroy();
      resolve('TIMEOUT');
    }, 4000);

    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let idx;
      while ((idx = buf.indexOf('\x00')) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        const lines = frame.split('\n');
        const cmd = lines[0];
        if (cmd === 'CONNECTED') {
          socket.write(`SUBSCRIBE\nid:s1\ndestination:${dest}\nack:auto\nreceipt:r1\n\n\x00`);
        } else if (cmd === 'RECEIPT') {
          clearTimeout(timer);
          socket.end();
          resolve('ACCEPT');
        } else if (cmd === 'ERROR') {
          clearTimeout(timer);
          socket.end();
          resolve('REJECT');
        }
      }
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve('SOCKET_ERROR');
    });
  });
}

for (const dest of destinations) {
  const result = await testDestination(dest);
  console.log(`${result === 'ACCEPT' ? '✓' : '✗'} ${result.padEnd(10)} ${dest}`);
}
process.exit(0);
