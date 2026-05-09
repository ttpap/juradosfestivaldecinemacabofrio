import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Film } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/filmes', label: 'Filmes', icon: Film },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ocean-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 flex-col border-r border-ocean-700 bg-ocean-900 fixed top-0 left-0 h-full z-20">
        <div className="p-5 border-b border-ocean-700">
          <Image src="/logo.png" alt="FINCCA" width={110} height={60} className="object-contain" />
          <p className="text-xs text-[#4a6080] mt-1.5 font-medium uppercase tracking-wider">Administração</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#64748b] hover:text-white hover:bg-ocean-700 transition-all"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-ocean-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#4a6080] hover:text-white hover:bg-ocean-700 transition-all"
          >
            ← Início
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-ocean-900 border-t border-ocean-700 flex">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[#64748b] hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Conteúdo principal */}
      <div className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
