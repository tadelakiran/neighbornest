import { Outlet } from 'react-router-dom';

/**
 * Public (unauthenticated) layout — full-bleed Blue Dynasty backdrop.
 *
 * The login/register pages are standalone split-screen designs with their own
 * brand panels and footers, so this shell intentionally adds no chrome — it
 * only provides the ambient mesh background and renders the nested route.
 */
export function PublicLayout() {
  return (
    <div className="mesh-gradient relative min-h-screen overflow-x-hidden text-primary">
      <div className="relative min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
