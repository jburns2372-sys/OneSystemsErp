const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const suppliers = [
    {
      name: "Acme Hardware Supplies",
      address: "123 Industrial Ave, Manila",
      tin: "111-222-333-000",
      contactPerson: "John Doe",
      contactNumber: "0917-123-4567",
      paymentTerms: "30 Days",
      isVatable: true
    },
    {
      name: "Global Steel Works",
      address: "456 Metal Rd, Quezon City",
      tin: "222-333-444-001",
      contactPerson: "Jane Smith",
      contactNumber: "0918-234-5678",
      paymentTerms: "15 Days",
      isVatable: true
    },
    {
      name: "Local Lumber Co.",
      address: "789 Wood St, Pasig",
      tin: "333-444-555-002",
      contactPerson: "Bob Johnson",
      contactNumber: "0919-345-6789",
      paymentTerms: "Cash on Delivery",
      isVatable: false
    },
    {
      name: "City Pipes & Plumbing",
      address: "321 Water Way, Makati",
      tin: "444-555-666-003",
      contactPerson: "Alice Brown",
      contactNumber: "0920-456-7890",
      paymentTerms: "60 Days",
      isVatable: true
    },
    {
      name: "Quick Fix Electricals",
      address: "654 Wire Blvd, Taguig",
      tin: "555-666-777-004",
      contactPerson: "Charlie Davis",
      contactNumber: "0921-567-8901",
      paymentTerms: "7 Days",
      isVatable: false
    }
  ];

  for (const s of suppliers) {
    await prisma.supplier.create({ data: s });
  }
  console.log("Seeded 5 suppliers.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
