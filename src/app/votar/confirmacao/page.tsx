import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Star } from 'lucide-react'

export default function ConfirmacaoPage() {
  return (
    <main className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <Image src="/logo.png" alt="FINCCA" width={120} height={65} className="object-contain mb-10" />

      <div className="w-16 h-16 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-8 h-8 text-gold-400" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">Voto registrado!</h1>
      <p className="text-ocean-300 max-w-sm mb-2">
        Obrigado por participar do Júri Popular do FINCCA.
      </p>
      <p className="text-ocean-500 text-sm mb-10">
        Seu voto foi computado com sucesso.
      </p>

      <div className="flex gap-1 mb-10">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-6 h-6 fill-gold-500 text-gold-500" />
        ))}
      </div>

      <Link href="/" className="text-sm text-ocean-400 hover:text-gold-400 transition-colors">
        ← Voltar ao início
      </Link>
    </main>
  )
}
