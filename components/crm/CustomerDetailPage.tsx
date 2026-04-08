'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Check, X, Plus, Trash2,
  ExternalLink, Upload, FileText, GitBranch, StickyNote,
  Mail, Phone, Building2
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Customer, CustomerRepo, CustomerNote, CustomerFile, CustomerStatus } from '@/types'

const STATUS = {
  lead:     { label: 'Lead',    cls: 'bg-amber-500/15 text-amber-400' },
  active:   { label: 'Aktiv',   cls: 'bg-emerald-500/15 text-emerald-400' },
  inactive: { label: 'Inaktiv', cls: 'bg-white/8 text-[--text-muted]' },
} as const

const inputCls = 'w-full px-3.5 py-2.5 bg-[--bg-elevated] border border-[--border-subtle] hover:border-[--border-default] focus:border-[--accent]/40 rounded-xl text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none transition-colors'

function formatBytes(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function CustomerDetailPage({ id }: { id: string }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'repos' | 'notes' | 'files'>('repos')

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '', status: 'lead' as CustomerStatus })
  const [saving, setSaving] = useState(false)

  // Repos
  const [repos, setRepos] = useState<CustomerRepo[]>([])
  const [repoForm, setRepoForm] = useState({ repo_url: '', repo_name: '', description: '' })
  const [addingRepo, setAddingRepo] = useState(false)
  const [savingRepo, setSavingRepo] = useState(false)

  // Notes
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Files
  const [files, setFiles] = useState<CustomerFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
    const supabase = getSupabase()
    const [{ data: cust }, { data: reposData }, { data: notesData }, { data: filesData }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('customer_repos').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('customer_notes').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('customer_files').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    ])
    if (cust) {
      setCustomer(cust as Customer)
      setEditForm({ name: cust.name, email: cust.email ?? '', phone: cust.phone ?? '', company: cust.company ?? '', status: cust.status })
    }
    setRepos(reposData ?? [])
    setNotes(notesData ?? [])
    setFiles(filesData ?? [])
    setLoading(false)
  }

  // ── Customer edit ──────────────────────────────────────
  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.name.trim()) return
    setSaving(true)
    const { data, error } = await getSupabase()
      .from('customers')
      .update({ name: editForm.name.trim(), email: editForm.email || null, phone: editForm.phone || null, company: editForm.company || null, status: editForm.status })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) { setCustomer(data as Customer); setEditing(false) }
    setSaving(false)
  }

  async function handleDeleteCustomer() {
    if (!confirm(`Slet kunden "${customer?.name}"? Dette kan ikke fortrydes.`)) return
    await getSupabase().from('customers').delete().eq('id', id)
    router.push('/crm')
  }

  // ── Repos ──────────────────────────────────────────────
  async function handleAddRepo(e: React.FormEvent) {
    e.preventDefault()
    if (!repoForm.repo_url.trim() || !repoForm.repo_name.trim()) return
    setSavingRepo(true)
    const { data, error } = await getSupabase()
      .from('customer_repos')
      .insert({ customer_id: id, ...repoForm, description: repoForm.description || null })
      .select()
      .single()
    if (!error && data) {
      setRepos(prev => [data as CustomerRepo, ...prev])
      setRepoForm({ repo_url: '', repo_name: '', description: '' })
      setAddingRepo(false)
    }
    setSavingRepo(false)
  }

  async function handleDeleteRepo(repoId: string) {
    await getSupabase().from('customer_repos').delete().eq('id', repoId)
    setRepos(prev => prev.filter(r => r.id !== repoId))
  }

  // ── Notes ──────────────────────────────────────────────
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    setSavingNote(true)
    const { data, error } = await getSupabase()
      .from('customer_notes')
      .insert({ customer_id: id, content: noteText.trim() })
      .select()
      .single()
    if (!error && data) {
      setNotes(prev => [data as CustomerNote, ...prev])
      setNoteText('')
    }
    setSavingNote(false)
  }

  async function handleDeleteNote(noteId: string) {
    await getSupabase().from('customer_notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  // ── Files ──────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    // Sanitér filnavn: fjern tegn der ikke er tilladt i Storage-stier
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${id}/${Date.now()}-${safeName}`
    const supabase = getSupabase()
    const { error: storageError } = await supabase.storage.from('customer-files').upload(path, file)
    if (storageError) {
      setUploadError(`Upload fejlede: ${storageError.message}`)
    } else {
      const { data, error: dbError } = await supabase
        .from('customer_files')
        .insert({ customer_id: id, file_name: file.name, file_path: path, file_size: file.size, mime_type: file.type })
        .select()
        .single()
      if (!dbError && data) setFiles(prev => [data as CustomerFile, ...prev])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownloadFile(file: CustomerFile) {
    const { data } = await getSupabase().storage.from('customer-files').createSignedUrl(file.file_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDeleteFile(file: CustomerFile) {
    await getSupabase().storage.from('customer-files').remove([file.file_path])
    await getSupabase().from('customer_files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      <div className="h-8 w-48 bg-[--bg-surface] rounded-xl animate-pulse" />
      <div className="h-32 bg-[--bg-surface] rounded-2xl animate-pulse" />
      <div className="h-64 bg-[--bg-surface] rounded-2xl animate-pulse" />
    </div>
  )

  if (!customer) return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-center text-[--text-muted]">Kunde ikke fundet</div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <button onClick={() => router.push('/crm')} className="flex items-center gap-1.5 text-[--text-muted] hover:text-[--text-secondary] text-sm mb-6 transition-colors cursor-pointer">
        <ArrowLeft size={15} /> CRM
      </button>

      {/* Customer header */}
      <div className="p-5 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl mb-6">
        {editing ? (
          <form onSubmit={handleSaveCustomer} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Navn *" className={inputCls} />
              <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} placeholder="Virksomhed" className={inputCls} />
              <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className={inputCls} />
              <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefon" type="tel" className={inputCls} />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs text-[--text-muted]">Status:</span>
              {(['lead', 'active', 'inactive'] as CustomerStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setEditForm(f => ({ ...f, status: s }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${editForm.status === s ? STATUS[s].cls + ' ring-1 ring-inset ring-current/30' : 'text-[--text-muted] hover:text-[--text-secondary] bg-white/4'}`}
                >
                  {STATUS[s].label}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-[--text-muted] hover:text-[--text-secondary] rounded-lg hover:bg-white/4 transition-colors cursor-pointer">
                  Annuller
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                  <Check size={13} />{saving ? 'Gemmer...' : 'Gem'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[--accent]/15 border border-[--accent]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[--accent] font-bold text-lg">{customer.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-[--text-primary]">{customer.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS[customer.status].cls}`}>
                  {STATUS[customer.status].label}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {customer.company && (
                  <p className="text-sm text-[--text-muted] flex items-center gap-1.5"><Building2 size={13} />{customer.company}</p>
                )}
                {customer.email && (
                  <p className="text-sm text-[--text-muted] flex items-center gap-1.5"><Mail size={13} />{customer.email}</p>
                )}
                {customer.phone && (
                  <p className="text-sm text-[--text-muted] flex items-center gap-1.5"><Phone size={13} />{customer.phone}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-[--text-muted] hover:text-[--text-secondary] hover:bg-white/6 transition-colors cursor-pointer" title="Rediger">
                <Pencil size={14} />
              </button>
              <button onClick={handleDeleteCustomer} className="p-2 rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-500/8 transition-colors cursor-pointer" title="Slet kunde">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-[--bg-surface] border border-[--border-subtle] rounded-xl w-fit">
        {(['repos', 'notes', 'files'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${tab === t ? 'bg-white/10 text-[--text-primary]' : 'text-[--text-muted] hover:text-[--text-secondary]'}`}
          >
            {t === 'repos' ? `Repos (${repos.length})` : t === 'notes' ? `Notater (${notes.length})` : `Filer (${files.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Repos */}
      {tab === 'repos' && (
        <div className="space-y-3">
          <button
            onClick={() => setAddingRepo(a => !a)}
            className="flex items-center gap-1.5 text-sm text-[--text-muted] hover:text-[--text-secondary] transition-colors cursor-pointer"
          >
            {addingRepo ? <X size={14} /> : <Plus size={14} />}
            {addingRepo ? 'Annuller' : 'Tilknyt repo'}
          </button>

          {addingRepo && (
            <form onSubmit={handleAddRepo} className="p-4 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={repoForm.repo_name}
                  onChange={e => setRepoForm(f => ({ ...f, repo_name: e.target.value }))}
                  placeholder="Repo-navn *"
                  className={inputCls}
                />
                <input
                  required
                  value={repoForm.repo_url}
                  onChange={e => setRepoForm(f => ({ ...f, repo_url: e.target.value }))}
                  placeholder="GitHub URL *"
                  type="url"
                  className={inputCls}
                />
              </div>
              <input
                value={repoForm.description}
                onChange={e => setRepoForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Beskrivelse (valgfri)"
                className={inputCls}
              />
              <div className="flex justify-end">
                <button type="submit" disabled={savingRepo} className="px-4 py-1.5 bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                  {savingRepo ? 'Tilknytter...' : 'Tilknyt'}
                </button>
              </div>
            </form>
          )}

          {repos.length === 0 && !addingRepo ? (
            <p className="text-center py-10 text-[--text-muted] text-sm">Ingen repos tilknyttet endnu</p>
          ) : (
            repos.map(repo => (
              <div key={repo.id} className="flex items-start gap-3 p-4 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl group">
                <GitBranch size={16} className="text-[--text-muted] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[--text-primary]">{repo.repo_name}</p>
                    <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" className="text-[--text-muted] hover:text-[--accent] transition-colors">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  {repo.description && <p className="text-xs text-[--text-muted] mt-0.5">{repo.description}</p>}
                  <p className="text-xs text-[--text-muted] mt-0.5 truncate opacity-60">{repo.repo_url}</p>
                </div>
                <button onClick={() => handleDeleteRepo(repo.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-500/8 transition-all cursor-pointer">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === 'notes' && (
        <div className="space-y-3">
          <form onSubmit={handleAddNote} className="flex gap-2">
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Skriv en note..."
              rows={2}
              className="flex-1 px-3.5 py-2.5 bg-[--bg-surface] border border-[--border-subtle] hover:border-[--border-default] focus:border-[--accent]/40 rounded-xl text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={savingNote || !noteText.trim()}
              className="px-3.5 py-2.5 bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-30 text-white rounded-xl transition-colors cursor-pointer flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          </form>

          {notes.length === 0 ? (
            <p className="text-center py-10 text-[--text-muted] text-sm">Ingen notater endnu</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="flex gap-3 p-4 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl group">
                <StickyNote size={14} className="text-[--text-muted] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[--text-primary] whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-[--text-muted] mt-1.5 opacity-60">
                    {new Date(note.created_at).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-500/8 transition-all cursor-pointer flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Files */}
      {tab === 'files' && (
        <div className="space-y-3">
          <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[--bg-surface] border border-dashed border-[--border-default] hover:border-[--accent]/40 rounded-xl text-sm text-[--text-muted] hover:text-[--text-secondary] transition-colors cursor-pointer disabled:opacity-50 w-full justify-center"
          >
            <Upload size={15} />
            {uploading ? 'Uploader...' : 'Upload fil'}
          </button>

          {uploadError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {uploadError}
            </p>
          )}

          {files.length === 0 && !uploading ? (
            <p className="text-center py-10 text-[--text-muted] text-sm">Ingen filer uploadet endnu</p>
          ) : (
            files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-4 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl group">
                <FileText size={15} className="text-[--text-muted] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[--text-primary] truncate">{file.file_name}</p>
                  <p className="text-xs text-[--text-muted] mt-0.5">
                    {formatBytes(file.file_size)}
                    {file.file_size ? ' · ' : ''}
                    {new Date(file.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownloadFile(file)} className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--accent] hover:bg-[--accent]/8 transition-colors cursor-pointer" title="Download">
                    <ExternalLink size={13} />
                  </button>
                  <button onClick={() => handleDeleteFile(file)} className="p-1.5 rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-500/8 transition-colors cursor-pointer" title="Slet">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
