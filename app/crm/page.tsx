import CustomerList from '@/components/crm/CustomerList'

export default function CRMPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-[--accent] uppercase tracking-wide mb-1.5">Kunder</p>
        <h1 className="text-2xl font-semibold text-[--text-primary] tracking-tight">CRM</h1>
        <p className="text-[--text-muted] text-sm mt-1.5">
          Oversigt over kunder med tilknyttede repos, notater og filer.
        </p>
      </div>
      <CustomerList />
    </div>
  )
}
