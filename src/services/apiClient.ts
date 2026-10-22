export interface Envelope<T> { status: 'success' | 'error'; data: T; error: string | null; timestamp: string }
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}
const SESSION_KEY = 'thera.session';
export interface Usuario { id: number; nome: string; email: string; perfil: 'bpo_adm' | 'bpo_operador' | 'cliente_diretor' | 'cliente_gerente' | 'cliente_coordenador' | 'cliente_usuario'; cliente_id: number | null }
export interface Session { token: string; usuario: Usuario }
export const sessionStore = {
  read(): Session | null {
    try { const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return value && typeof value.token === 'string' && value.usuario ? value : null; } catch { return null; }
  },
  save(value: Session) { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); window.dispatchEvent(new Event('thera:session')); },
  clear() { localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event('thera:session')); },
};
export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const session = sessionStore.read();
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api/${path}`, { ...options, headers, credentials: 'omit', cache: 'no-store' });
  if (response.status === 401) sessionStore.clear();
  let body: Envelope<T>;
  try { body = await response.json(); } catch { throw new ApiError(response.status, 'Resposta inválida do servidor.'); }
  if (!response.ok || body.status !== 'success') throw new ApiError(response.status, body.error || 'Não foi possível concluir a operação.');
  return body.data;
}
export function params(values: object): string {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.set(key, String(value)); });
  return query.toString();
}
