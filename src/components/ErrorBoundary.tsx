import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-[#f7f9fb] p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Something went wrong</h1>
          <p className="text-[#45464d] max-w-md bg-white p-4 rounded-lg border border-red-100 shadow-sm">
            We apologize, but the application encountered an unexpected error. Please refresh the page or try again later.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-2 bg-[#0D9488] text-white font-semibold rounded-lg hover:bg-[#0b7a70] transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;