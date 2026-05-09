'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Award, GripVertical } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { PageLoader } from '@/components/LoadingSpinner'
import type { AwardCategory } from '@/types'

export default function CategoriasPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<AwardCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const load = async () => {
    const { data: fest } = await supabase
      .from('festivals').select('id').order('created_at', { ascending: false }).limit(1).single()
    const { data } = await supabase
      .from('award_categories').select('*')
      .eq('festival_id', fest?.id)
      .order('order_index')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data: fest } = await supabase
      .from('festivals').select('id').order('created_at', { ascending: false }).limit(1).single()
    const { error, data } = await supabase
      .from('award_categories')
      .insert({ name: newName.trim(), festival_id: fest?.id, order_index: categories.length })
      .select().single()
    if (error) {
      setToast({ message: 'Erro ao adicionar categoria.', type: 'error' })
    } else {
      setCategories((prev) => [...prev, data])
      setNewName('')
    }
    setSaving(false)
  }

  const toggleActive = async (cat: AwardCategory) => {
    const { error } = await supabase
      .from('award_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    if (!error) setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
  }

  const remove = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return
    const { error } = await supabase.from('award_categories').delete().eq('id', id)
    if (!error) setCategories((prev) => prev.filter((c) => c.id !== id))
    else setToast({ message: 'Erro ao remover categoria.', type: 'error' })
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Categorias de Premiação</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Gerencie as categorias do Júri Técnico</p>
      </div>

      {/* Adicionar nova */}
      <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-5 mb-6 flex gap-3">
        <Input
          placeholder="Nome da categoria..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="flex-1"
        />
        <Button size="md" loading={saving} onClick={add} disabled={!newName.trim()}>
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {categories.length === 0 && (
          <div className="rounded-2xl border border-ocean-500 bg-ocean-800 p-10 text-center">
            <Award className="w-10 h-10 text-[#4a6080] mx-auto mb-3" />
            <p className="text-[#64748b]">Nenhuma categoria cadastrada.</p>
          </div>
        )}

        {categories.map((cat, idx) => (
          <div key={cat.id} className="rounded-xl border border-ocean-500 bg-ocean-800 p-4 flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-[#4a6080] shrink-0" />
            <span className="text-xs text-[#4a6080] w-6 text-center">{idx + 1}</span>
            <p className="flex-1 text-sm font-medium text-white">{cat.name}</p>
            <Badge variant={cat.is_active ? 'success' : 'default'}>
              {cat.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
            <button
              onClick={() => toggleActive(cat)}
              className="text-xs text-[#64748b] hover:text-primary-400 transition-colors px-2 py-1 rounded"
            >
              {cat.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <button onClick={() => remove(cat.id)} className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
