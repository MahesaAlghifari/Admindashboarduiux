import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error", error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-lg rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-bold text-slate-900">Aplikasi mengalami masalah</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Halaman tidak dapat ditampilkan. Muat ulang aplikasi untuk mencoba kembali.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-6 rounded-lg bg-[#e94640] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d63d38]"
          >
            Muat ulang
          </button>
        </section>
      </main>
    );
  }
}
