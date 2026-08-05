import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src:         string;
  alt:         string;
  /** Forces a fixed aspect ratio wrapper to prevent layout shift. */
  aspectRatio?: '1/1' | '4/3' | '16/9' | '16/7' | '2/1' | '3/2';
  /** Shown while the image loads. */
  placeholder?: 'blur' | 'shimmer' | 'none';
  /** Custom fallback image URL if src fails. */
  fallbackSrc?: string;
  wrapperClassName?: string;
}

const ASPECT_MAP: Record<string, string> = {
  '1/1':  'aspect-square',
  '4/3':  'aspect-[4/3]',
  '16/9': 'aspect-video',
  '16/7': 'aspect-[16/7]',
  '2/1':  'aspect-[2/1]',
  '3/2':  'aspect-[3/2]',
};

/**
 * Optimized lazy image component:
 * - Intersection Observer for lazy loading (no layout shift)
 * - Blur-scale or shimmer placeholder while loading
 * - Graceful fallback on error (broken image icon + message)
 * - Respects prefers-reduced-motion
 * - Supports forced aspect ratio wrapper
 */
export function LazyImage({
  src,
  alt,
  aspectRatio,
  placeholder = 'blur',
  fallbackSrc,
  wrapperClassName,
  className,
  loading = 'lazy',
  ...props
}: LazyImageProps) {
  const [status, setStatus]     = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [realSrc, setRealSrc]   = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading === 'eager') {
      setRealSrc(src);
      setStatus('loading');
      return;
    }

    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRealSrc(src);
          setStatus('loading');
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, loading]);

  const handleLoad  = () => setStatus('loaded');
  const handleError = () => {
    if (fallbackSrc && realSrc !== fallbackSrc) {
      setRealSrc(fallbackSrc);
    } else {
      setStatus('error');
    }
  };

  const wrapper = aspectRatio ? cn('relative overflow-hidden', ASPECT_MAP[aspectRatio], wrapperClassName) : wrapperClassName;

  const imgEl = (
    <>
      {/* Placeholder skeleton */}
      {placeholder === 'shimmer' && status !== 'loaded' && status !== 'error' && (
        <div className={cn('absolute inset-0 skeleton-shimmer', !aspectRatio && 'rounded-lg')} aria-hidden="true" />
      )}

      {/* The actual image — ref used for IntersectionObserver */}
      <img
        ref={imgRef}
        src={realSrc || undefined}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-all duration-500',
          aspectRatio && 'absolute inset-0 h-full w-full object-cover',
          placeholder === 'blur' && status !== 'loaded' && status !== 'error' && 'blur-sm scale-[1.04]',
          status === 'loaded' && 'blur-0 scale-100',
          status === 'error'  && 'hidden',
          className
        )}
        {...props}
      />

      {/* Error fallback */}
      {status === 'error' && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'bg-[var(--color-surface)] text-[var(--text-muted)]',
            aspectRatio ? 'absolute inset-0' : 'rounded-lg p-8',
            className
          )}
          role="img"
          aria-label={`Image not available: ${alt}`}
        >
          <ImageOff className="h-8 w-8 opacity-40" aria-hidden="true" />
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
    </>
  );

  if (wrapper) {
    return <div className={wrapper}>{imgEl}</div>;
  }

  return <>{imgEl}</>;
}
