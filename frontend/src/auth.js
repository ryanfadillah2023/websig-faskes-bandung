// Autentikasi admin berbasis token JWT dari backend.
// Keamanan sebenarnya ada di backend (endpoint admin memverifikasi token).
import { loginRequest } from "./api.js";

const KEY = "websig_token";

// Login: minta token ke backend, simpan bila berhasil. Throw bila gagal.
export async function login(username, password, captchaToken, captcha) {
  const { token } = await loginRequest(username, password, captchaToken, captcha);
  sessionStorage.setItem(KEY, token);
  return true;
}

export function logout() {
  sessionStorage.removeItem(KEY);
}

export function getToken() {
  return sessionStorage.getItem(KEY);
}

// Cek token ada dan belum kedaluwarsa (untuk guard tampilan saja)
export function isAuthed() {
  const t = getToken();
  if (!t) return false;
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
