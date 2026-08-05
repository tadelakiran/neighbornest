import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches render-time errors anywhere in the tree and
 * shows a friendly fallback with a reload action instead of a blank screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log the full error details for diagnostics.
    console.error('NeighborNest UI error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="mesh-gradient flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10">
            <AlertTriangle className="h-8 w-8 text-rose-400" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">
            An unexpected error occurred while rendering this page. Reload to continue.
          </p>
          {this.state.error && (
            <p className="mt-4 break-words rounded-md border border-white/10 bg-deep px-4 py-3 font-mono text-xs text-muted">
              {this.state.error.message}
            </p>
          )}
          <Button
            variant="primary"
            className="mt-6"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={this.handleReload}
          >
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
