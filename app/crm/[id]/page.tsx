import CustomerDetailPage from '@/components/crm/CustomerDetailPage'

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerDetailPage id={id} />
}
