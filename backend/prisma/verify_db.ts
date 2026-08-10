import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying Phase 2 PostgreSQL Database Records...\n');

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log(`👤 Users Count: ${users.length}`);
  users.forEach(u => console.log(`   - [${u.role}] ${u.name} (${u.email})`));

  const customers = await prisma.customer.findMany({ select: { id: true, name: true, customerType: true, status: true } });
  console.log(`\n🏢 Customers Count: ${customers.length}`);
  customers.forEach(c => console.log(`   - ${c.name} | Type: ${c.customerType} | Status: ${c.status}`));

  const products = await prisma.product.findMany({ select: { id: true, name: true, sku: true, currentStock: true, minStock: true, unitPrice: true } });
  console.log(`\n📦 Products Count: ${products.length}`);
  products.forEach(p => console.log(`   - ${p.name} (SKU: ${p.sku}) | Price: ₹${p.unitPrice} | Stock: ${p.currentStock}/${p.minStock}`));

  const challans = await prisma.challan.findMany({
    include: {
      customer: { select: { name: true } },
      items: true
    }
  });
  console.log(`\n📄 Challans Count: ${challans.length}`);
  challans.forEach(ch => {
    console.log(`   - Challan #${ch.challanNumber} | Customer: ${ch.customer.name} | Status: ${ch.status} | Total: ₹${ch.totalAmount}`);
    ch.items.forEach(item => {
      console.log(`     └─ Item Snapshot: Product='${item.productName}', SKU='${item.sku}', UnitPrice=₹${item.unitPrice}, Qty=${item.quantity}`);
    });
  });

  console.log('\n✅ Verification Complete!');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
