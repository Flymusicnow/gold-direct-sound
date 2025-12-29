import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft, RefreshCw, Music2 } from "lucide-react";
import { captureException } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  artistId?: string;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ArtistErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ArtistErrorBoundary caught an error:", error, errorInfo);
    
    // Log to Sentry with artist context
    captureException(error, {
      component: "ArtistErrorBoundary",
      extra: {
        artistId: this.props.artistId,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleGoToStudio = () => {
    window.location.href = "/studio";
  };

  handleGoToExplore = () => {
    window.location.href = "/explore";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full border-destructive/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                
                <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                <p className="text-muted-foreground mb-6">
                  We encountered an error loading this artist page. Please try again.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-6 text-left">
                    <p className="text-xs font-mono text-destructive break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={this.handleGoBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                  </Button>
                  
                  <Button
                    onClick={this.handleRetry}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.handleGoToStudio}
                      className="gap-2 text-muted-foreground"
                    >
                      <Music2 className="h-4 w-4" />
                      Go to My Studio
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.handleGoToExplore}
                      className="gap-2 text-muted-foreground"
                    >
                      <Home className="h-4 w-4" />
                      Explore Artists
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
