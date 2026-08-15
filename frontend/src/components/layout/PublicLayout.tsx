import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-primary">
      {/* Mesh gradient base */}
      <div className="mesh-gradient fixed inset-0" aria-hidden="true" />
      
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 left-1/4 h-[500px] w-[600px] rounded-full bg-accent-500/[0.08] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-accent-400/[0.05] blur-[90px]" />
        <div className="absolute left-0 top-1/3 h-[300px] w-[300px] rounded-full bg-sky-400/[0.07] blur-[80px]" />
      </div>

      <div className="relative min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}