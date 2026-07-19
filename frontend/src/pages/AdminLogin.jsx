import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../auth.js";
import { getCaptcha } from "../api.js";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function loadCaptcha() {
    setCaptcha("");
    try {
      const { token, svg } = await getCaptcha();
      setCaptchaToken(token);
      setCaptchaSvg(svg);
    } catch {
      setCaptchaSvg("");
    }
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(username, password, captchaToken, captcha);
      navigate("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Login gagal.");
      loadCaptcha(); // captcha sekali pakai -> ambil yang baru setiap gagal
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 p-4">
      <form
        onSubmit={submit}
        className="w-[22rem] rounded-2xl border border-slate-200 bg-white p-7 shadow-xl"
      >
        <div className="mb-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-2xl text-white shadow-lg shadow-teal-600/25">
            🛠️
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-800">Login Admin</h1>
          <p className="text-xs text-slate-400">WebSIG Faskes Bandung</p>
        </div>

        {err && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {err}
          </div>
        )}

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Username
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
          placeholder="Masukkan username"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
          placeholder="••••••••"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Captcha
        </label>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-12 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-slate-50">
            {captchaSvg ? (
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(captchaSvg)}`}
                alt="captcha"
                className="h-10"
              />
            ) : (
              <span className="text-xs text-slate-400">memuat…</span>
            )}
          </div>
          <button
            type="button"
            onClick={loadCaptcha}
            title="Ganti captcha"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-500 transition hover:bg-slate-50"
          >
            ↻
          </button>
        </div>
        <input
          value={captcha}
          onChange={(e) => setCaptcha(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
          placeholder="Ketik teks pada gambar"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-2.5 font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>

        <Link
          to="/"
          className="mt-3 block text-center text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          ← Kembali ke peta publik
        </Link>
      </form>
    </div>
  );
}
