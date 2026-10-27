import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui';

// Catches render errors so one broken component cannot white-screen the whole app
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-[70vh] bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
        <div role="alert" className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This page hit an unexpected error. Reloading usually fixes it — your data is safe.
          </p>

          {isDev && (
            <pre className="text-left text-xs bg-gray-50 dark:bg-gray-950 text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-800 rounded-xl p-3 mb-6 overflow-x-auto whitespace-pre-wrap break-words">
              {this.state.error?.message || String(this.state.error)}
            </pre>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-center">
            {/* Plain <a>: the router may be the thing that broke */}
            <Button variant="secondary" href="/" icon={Home}>Go home</Button>
            <Button icon={RefreshCw} onClick={() => window.location.reload()}>Reload page</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
