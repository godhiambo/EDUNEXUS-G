import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ChevronDown, ChevronUp, Bug, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  title?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });

    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error('Error executing onReset callback:', err);
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.compact) {
        return (
          <div className="p-4 bg-rose-50/90 border border-rose-200/80 rounded-2xl text-rose-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{this.props.title || 'Component temporary issue'}</span>
              </div>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-[11px] rounded-lg transition cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            {this.state.error?.message && (
              <p className="text-[11px] text-rose-700 font-mono line-clamp-1 bg-rose-100/50 p-1.5 rounded-md">
                {this.state.error.message}
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="my-6 p-6 md:p-8 bg-gradient-to-b from-rose-50/90 to-amber-50/40 border border-rose-200/80 rounded-3xl text-slate-800 shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base md:text-lg text-slate-900">
                {this.props.title || 'An unexpected rendering error occurred'}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                We encountered an issue displaying this part of the application. You can reset the view without losing your main session.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="bg-white/80 border border-rose-100 rounded-2xl p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-rose-700 font-semibold">
                <Bug className="w-3.5 h-3.5" />
                <span className="truncate">{this.state.error.name}: {this.state.error.message}</span>
              </div>
              
              {this.state.errorInfo?.componentStack && (
                <div>
                  <button
                    type="button"
                    onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                    className="flex items-center gap-1 text-[11px] font-sans font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer mt-1"
                  >
                    {this.state.showDetails ? (
                      <>Hide stack trace <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Show stack trace <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                  
                  {this.state.showDetails && (
                    <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] leading-normal overflow-x-auto max-h-48 whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5f6f52] hover:bg-[#4a573e] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset & Try Again
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

