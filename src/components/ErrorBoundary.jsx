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
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full rounded-2xl bg-custom-yellow-1 shadow-[inset_0_0_20px_-2px_#000] p-6 flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-[#7a5530] text-[#f1dcb7] flex items-center justify-center text-2xl shadow-[0_4px_10px_-4px_#000]">
            !
          </span>
          <h2 className="font-bold text-lg text-gray-800">Terjadi kesalahan</h2>
          <p className="text-[13px] text-gray-600 leading-snug">
            Maaf, terjadi gangguan saat memuat halaman. Silakan muat ulang.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 py-2.5 px-8 rounded-full bg-[#7a5530] text-[#f1dcb7] text-sm font-semibold shadow-[0_4px_10px_-4px_#000] active:scale-95 transition-transform"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
