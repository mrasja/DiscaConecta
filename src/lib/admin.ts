// Single source of truth para la lista de emails admin — usado tanto en
// componentes cliente (mostrar/ocultar UI) como en el servidor (auth-server.ts).
// IMPORTANTE: esto es solo para conveniencia de UI en el cliente; la autorización
// real de cada endpoint siempre se valida server-side con el token verificado.
export const ADMIN_EMAILS = ['m_rasja@hotmail.com', 'mrasja@gmail.com'];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}
