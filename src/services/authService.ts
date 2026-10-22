import { apiClient, sessionStore, type Session, type Usuario } from './apiClient';
export const authService = {
  async login(email: string, senha: string) {
    const session = await apiClient<Session>('auth/login.php', { method: 'POST', body: JSON.stringify({ email, senha }) });
    sessionStore.save(session); return session.usuario;
  },
  async logout() { try { await apiClient('auth/logout.php', { method: 'POST' }); } finally { sessionStore.clear(); } },
  async current() {
    if (!sessionStore.read()) return null;
    const usuario = await apiClient<Usuario>('auth/me.php');
    const session = sessionStore.read(); if (session) sessionStore.save({ ...session, usuario }); return usuario;
  },
  getSession: sessionStore.read,
};
