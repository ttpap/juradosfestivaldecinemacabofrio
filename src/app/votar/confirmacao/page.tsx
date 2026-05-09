import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Star } from 'lucide-react'

export default function ConfirmacaoPage() {
  return (
    <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        <Image src="/logo.png" alt="FINCCA" width={200} height={110} className="object-contain" />

        {/* Ícone de sucesso */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary-400" />
          </div>
          {/* Estrelas decorativas */}
          <Star className="absolute -top-2 -right-2 w-5 h-5 text-gold-500 fill-gold-500" />
          <Star className="absolute -bottom-1 -left-3 w-4 h-4 text-gold-400 fill-gold-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-3">Voto registrado!</h1>
          <p className="text-[#94a3b8] leading-relaxed">
            Obrigado por participar da votação do Júri Popular do FINCCA. Seu voto foi registrado com sucesso.
          </p>
        </div>

        <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-5 text-sm text-primary-200 w-full">
          <p>
            Os resultados serão divulgados ao final do festival pela organização do FINCCA. Até lá, continue aproveitando os filmes! 🎬
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/votar"
            className="flex items-center justify-center gap-2 rounded-xl border border-ocean-500 bg-ocean-800 px-6 py-3 text-sm font-medium text-white hover:bg-ocean-700 hover:border-primary-500/50 transition-all"
          >
            Votar em outro filme
          </Link>
          <Link
            href="/"
            className="text-sm text-[#64748b] hover:text-white transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  )
}
