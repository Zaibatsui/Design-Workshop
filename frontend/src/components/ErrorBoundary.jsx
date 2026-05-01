import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Top-level error boundary. Catches uncaught render errors and shows a
 * recovery banner instead of a blank screen. Recovery is always a hard
 * reload — chunk-load failures and dev-server HMR wedges are by far the
 * most common causes, and a reload fixes both.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const message = this.state.error?.message || "Something went wrong.";
    const isChunkError = /chunk|loading css|loading script|webpack|hot/i.test(
      message
    );
    return (
      <div
        data-testid="error-boundary"
        className="min-h-screen flex items-center justify-center bg-slate-50 p-6"
      >
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[#E01839]" />
          </div>
          <h1 className="font-heading text-lg font-semibold tracking-tight mb-2">
            {isChunkError
              ? "We need to reload the editor"
              : "Something broke"}
          </h1>
          <p className="text-sm text-slate-500 mb-1">
            {isChunkError
              ? "A new build is available — refreshing will pick it up."
              : "An unexpected error stopped the page from rendering."}
          </p>
          <p className="text-xs text-slate-400 font-mono break-all mb-6 mt-3">
            {message.slice(0, 240)}
          </p>
          <Button
            onClick={this.handleReload}
            data-testid="error-boundary-reload"
            className="bg-[#E01839] hover:bg-[#c01530] text-white"
          >
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
