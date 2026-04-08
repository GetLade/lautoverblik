'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, ChevronRight, X, Building2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Customer, CustomerStatus } from '@/types'

const STATUS = {
  lead:     { label: 'Lead',    cls: 'bg-amber-500/15 text-amber-400' },
  active:   { label: 'Aktiv',   cls: 'bg-emerald-500/15 text-emerald-400' },
  inactive: { label: 'Inaktiv', cls: 'bg-white/8 text-[--text-muted]' },
} as const

type FilterStatus = 'all' | CustomerStatus

const inputCls = 'w-full px-3.5 py-2.5 bg-[--bg-elevated] border border-[--border-subtle] hover:border-[--border-default] focus:border-[--accent]/40 rounded-xl text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none transition-colors'

const emptyForm = { name: '', email: '', phone: '', company: '', status: 'lead' as CustomerStatus }

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await getSupabase()
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    setCustomers(data ?? [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await getSupabase()
      .from('customers')
      .insert({ ...form, name: form.name.trim() })
      .select()
      .single()
    if (!error && data) {
      setCustomers(prev => [data as Customer, ...prev])
      setForm(emptyForm)
      setAdding(false)
    }
    setSaving(false)
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg kunder..."
            className="w-full pl-9 pr-4 py-2.5 bg-[--bg-surface] border border-[--border-subtle] hover:border-[--border-default] focus:border-[--accent]/40 rounded-xl text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[--accent] hover:bg-[--accent-hover] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
        >
          {adding ? <X size={15} /> : <Plus size={15} />}
          <span className="hidden sm:inline">{adding ? 'Annuller' : 'Ny kunde'}</span>
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl space-y-3">
          <p className="text-sm font-medium text-[--text-primary]">Ny kunde</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Navn *" className={inputCls} />
            <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Virksomhed" className={inputCls} />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className={inputCls} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefon" type="tel" className={inputCls} />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-[--text-muted]">Status:</span>
            {(['lead', 'active', 'inactive'] as CustomerStatus[]).map(s => (
              <button
                key={s} type="button"
                onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${form.status === s ? STATUS[s].cls + ' ring-1 ring-inset ring-current/30' : 'text-[--text-muted] hover:text-[--text-secondary] bg-white/4'}`}
              >
                {STATUS[s].label}
              </button>
            ))}
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="ml-auto px-4 py-1.5 bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {saving ? 'Gemmer...' : 'Opret'}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'lead', 'active', 'inactive'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filter === s ? 'bg-white/10 text-[--text-primary]' : 'text-[--text-muted] hover:text-[--text-secondary] hover:bg-white/4'}`}
          >
            {s === 'all' ? 'Alle' : STATUS[s].label}
            <span className="ml-1.5 opacity-60">
              {s === 'all' ? customers.length : customers.filter(c => c.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-[72px] bg-[--bg-surface] rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[--text-muted] text-sm">
          {search ? 'Ingen kunder matcher søgningen' : 'Ingen kunder endnu – tilføj din første'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/crm/${c.id}`}
              className="group flex items-center gap-4 p-4 bg-[--bg-surface] border border-[--border-subtle] hover:border-[--border-default] rounded-2xl transition-all duration-150 cursor-pointer hover:bg-[--bg-elevated]"
            >
              <div className="w-10 h-10 rounded-xl bg-[--accent]/15 border border-[--accent]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[--accent] font-semibold text-sm">{c.name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[--text-primary] truncate">{c.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS[c.status].cls}`}>
                    {STATUS[c.status].label}
                  </span>
                </div>
                {c.company && (
                  <p className="text-xs text-[--text-muted] mt-0.5 flex items-center gap-1">
                    <Building2 size={11} />{c.company}
                  </p>
                )}
              </div>
              <ChevronRight size={15} className="text-[--text-muted] flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
