import { Component } from "react";

/**
 * Catches render/lifecycle errors anywhere below it and shows a recoverable
 * fallback instead of a blank white page. Without this, a single uncaught throw
 * unmounts the whole React tree.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-bg text-ink">
        <div className="max-w-sm w-full rounded-2xl bg-surface border border-line shadow-[0_16px_34px_-16px_rgba(60,40,10,.55)] p-6 flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-accent text-accent-ink flex items-center justify-center text-2xl">
            !
          </span>
          <h2 className="font-bold text-lg text-ink">Terjadi kesalahan</h2>
          <p className="text-[13px] text-ink-dim leading-snug">
            Maaf, terjadi gangguan saat memuat halaman. Silakan muat ulang.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 py-2.5 px-8 rounded-2xl bg-accent text-accent-ink text-sm font-bold shadow-[0_10px_24px_-12px_rgba(13,107,110,.6)] active:scale-95 transition-transform"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
