export const ADMIN_EMAILS = [
  'antonpap@gmail.com',
  'lucasmuller.ocean@gmail.com',
] as const

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return (ADMIN_EMAILS as readonly string[]).includes(email)
}
