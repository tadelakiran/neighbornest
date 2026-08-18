import { useKeepAlive } from '@/hooks/useKeepAlive';

/**
 * Invisible keep-alive mount point.
 *
 * Renders nothing and does not touch the UI. When enabled via
 * `VITE_ENABLE_KEEP_ALIVE=true` it periodically pings `GET /health` on the
 * API Gateway; when disabled (the default) it is a no-op. Mounted once at the
 * app root, outside the router, so it can never interfere with routing,
 * rendering, auth, or the chat WebSockets.
 */
export default function KeepAlive(): null {
  useKeepAlive();
  return null;
}
