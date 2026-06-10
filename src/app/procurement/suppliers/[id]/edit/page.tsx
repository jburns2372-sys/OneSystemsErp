import { prisma } from '@/lib/prisma';
import EditSupplierClient from './EditSupplierClient';

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supplier = await prisma.supplier.findUnique({
    where: { id }
  });

  if (!supplier) {
    return <div style={{ padding: '40px', color: 'red' }}>Supplier not found.</div>;
  }

  return <EditSupplierClient supplier={supplier} />;
}
