import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { captureException, isSentryConfigured } from '@/lib/sentry';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  sentryEventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      sentryEventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Capture to Sentry
    const sentryEventId = await captureException(error, {
      route: window.location.pathname,
      component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'unknown',
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ sentryEventId });

    // Log to runtime_errors table
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('runtime_errors').insert({
        user_id: user?.id || null,
        error_message: error.message,
        error_stack: error.stack || null,
        route: window.location.pathname,
        component: errorInfo.componentStack?.split('\n')[1]?.trim() || null,
        user_agent: navigator.userAgent,
        sentry_event_id: sentryEventId,
      });
    } catch (dbError) {
      console.error('[ErrorBoundary] Failed to log error to database:', dbError);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      sentryEventId: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                We've encountered an unexpected error. Our team has been notified
                and we're working to fix it.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted/50 rounded-md p-3 text-left">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {this.state.sentryEventId && (
              <p className="text-xs text-muted-foreground">
                Error ID: <code className="bg-muted px-1 rounded">{this.state.sentryEventId}</code>
              </p>
            )}

            {!isSentryConfigured() && (
              <p className="text-xs text-amber-500">
                ⚠️ Sentry not configured - error logged locally only
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
