import Image from 'next/image'
import Link from 'next/link'
import { Users, Clapperboard, Settings, Film, Star, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ocean-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative w-72 h-40 md:w-96 md:h-52">
            <Image
              src="/logo.png"
              alt="FINCCA — Festival Internacional de Cinema de Cabo Frio"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <p className="text-primary-400 text-sm font-medium tracking-widest uppercase">
              Sistema Oficial de Votação
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary-500" />
              <Film className="w-4 h-4 text-primary-500" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary-500" />
            </div>
          </div>
        </div>

        {/* Cards de acesso */}
        <div className="w-full max-w-lg flex flex-col gap-4 animate-slide-up">
          {/* Júri Popular */}
          <Link href="/votar" className="group block">
            <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-6 transition-all duration-200 hover:border-primary-500/70 hover:bg-ocean-700 card-glow">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">
                    Júri Popular
                  </h2>
                  <p className="text-sm text-[#94a3b8] mt-0.5">
                    Vote no seu filme favorito e deixe um comentário
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                </div>
              </div>
            </div>
          </Link>

          {/* Júri Técnico */}
          <Link href="/jurado/login" className="group block">
            <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-6 transition-all duration-200 hover:border-gold-500/70 hover:bg-ocean-700">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                  <Clapperboard className="w-7 h-7 text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white group-hover:text-gold-300 transition-colors">
                    Júri Técnico
                  </h2>
                  <p className="text-sm text-[#94a3b8] mt-0.5">
                    Área restrita para jurados credenciados
                  </p>
                </div>
                <Award className="w-6 h-6 text-gold-500/60" />
              </div>
            </div>
          </Link>

          {/* Admin */}
          <Link href="/admin/login" className="group block">
            <div className="rounded-2xl border border-ocean-600 bg-ocean-900 p-5 transition-all duration-200 hover:border-ocean-400/50">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-ocean-700 border border-ocean-500 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#64748b]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-[#94a3b8] group-hover:text-white transition-colors">
                    Painel Administrativo
                  </h2>
                  <p className="text-xs text-[#4a6080] mt-0.5">Acesso restrito à organização</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-ocean-700">
        <p className="text-xs text-[#4a6080]">
          © {new Date().getFullYear()} FINCCA — EcoBúzios / Associação Bem Querer
        </p>
      </footer>
    </main>
  )
}
