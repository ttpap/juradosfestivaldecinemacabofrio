import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FINCCA — Sistema de Votação',
  description: 'Festival Internacional de Cinema de Cabo Frio — Sistema oficial de votação do Júri Popular e Júri Técnico.',
  icons: { icon: '/logo.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06111e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
