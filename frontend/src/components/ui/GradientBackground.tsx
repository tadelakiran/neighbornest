import { memo } from 'react';

/**
 * Animated mesh gradient backdrop.
 * Light mode: soft blue/white blobs on white.
 * Dark mode: deep blue blobs on navy (via CSS vars --blob-a/b/c).
 * Fixed, pointer-events-none, z-0.
 */
export const GradientBackground = memo(function GradientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Mesh base */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Animated blobs */}
      <div className="mesh-blob mesh-blob-a absolute left-[10%] top-[10%] h-[60vw] w-[60vw] max-h-[700px] max-w-[700px]" />
      <div className="mesh-blob mesh-blob-b absolute right-[5%]  top-[5%]  h-[45vw] w-[45vw] max-h-[500px] max-w-[500px]" />
      <div className="mesh-blob mesh-blob-c absolute bottom-[5%] left-[20%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px]" />
      <div className="mesh-blob mesh-blob-d absolute bottom-[15%] right-[15%] h-[35vw] w-[35vw] max-h-[400px] max-w-[400px]" />

      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent-100/40 to-transparent [data-theme='dark']:from-accent-900/20" />
    </div>
  );
});
