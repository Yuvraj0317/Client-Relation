import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 2 database seed script...');

  // 1. Clean existing records in reverse dependency order
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Hash default password with bcrypt
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Required Roles (One Admin, One Sales, One Warehouse, One Accounts)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fundsroom.com',
      password: passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@fundsroom.com',
      password: passwordHash,
      name: 'Sales Manager',
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      email: 'warehouse@fundsroom.com',
      password: passwordHash,
      name: 'Warehouse Lead',
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      email: 'accounts@fundsroom.com',
      password: passwordHash,
      name: 'Accounts Officer',
      role: Role.ACCOUNTS,
    },
  });

  console.log('✅ Created 4 Users: Admin, Sales, Warehouse, Accounts.');

  // 4. Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Apex Trading Corp',
      companyName: 'Apex Electronics Pvt Ltd',
      email: 'contact@apex.com',
      phone: '+91 9876543210',
      address: 'Plot 42, Industrial Zone, Mumbai',
      customerType: CustomerType.WHOLESALE,
      status: CustomerStatus.ACTIVE,
      createdById: salesUser.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Metro Retail Outlets',
      companyName: 'Metro Chains Ltd',
      email: 'procurement@metro.com',
      phone: '+91 9123456789',
      address: 'Suite 101, Retail Plaza, Bengaluru',
      customerType: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      createdById: salesUser.id,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Zenith Logistics Hub',
      companyName: 'Zenith Distribution India',
      email: 'orders@zenith.in',
      phone: '+91 9988776655',
      address: 'Warehouse 9, Transport City, Delhi',
      customerType: CustomerType.DISTRIBUTOR,
      status: CustomerStatus.LEAD,
      createdById: salesUser.id,
    },
  });

  // Sample Customer Follow-up note
  await prisma.customerFollowUp.create({
    data: {
      customerId: customer1.id,
      note: 'Client requested catalog for barcode scanner hardware and quarterly discount slab.',
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      createdById: salesUser.id,
    },
  });

  console.log('✅ Created 3 Sample Customers with Follow-up notes.');

  // 5. Create Sample Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Industrial Fiber Router X500',
      sku: 'SKU-ROUT-500',
      category: 'Networking',
      unitPrice: 14500.00,
      currentStock: 45,
      minStock: 10,
      location: 'Warehouse A - Rack 4',
      createdById: warehouseUser.id,
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Wireless Barcode Scanner HD',
      sku: 'SKU-SCAN-100',
      category: 'Peripherals',
      unitPrice: 3200.00,
      currentStock: 3, // Low Stock Alert
      minStock: 10,
      location: 'Warehouse A - Rack 1',
      createdById: warehouseUser.id,
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Thermal Receipt Printer 80mm',
      sku: 'SKU-PRIN-080',
      category: 'Printers',
      unitPrice: 6800.00,
      currentStock: 25,
      minStock: 5,
      location: 'Warehouse B - Rack 2',
      createdById: warehouseUser.id,
    },
  });

  // Log initial Stock Movements (IN)
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        type: MovementType.IN,
        quantity: 45,
        remarks: 'Initial stock intake',
        createdById: warehouseUser.id,
      },
      {
        productId: prod2.id,
        type: MovementType.IN,
        quantity: 3,
        remarks: 'Initial stock intake',
        createdById: warehouseUser.id,
      },
      {
        productId: prod3.id,
        type: MovementType.IN,
        quantity: 25,
        remarks: 'Initial stock intake',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Created 3 Sample Products with Stock Movement records.');

  // 6. Create Sample Challan with Snapshot ChallanItems
  const challan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-202608-0001',
      customerId: customer1.id,
      status: ChallanStatus.CONFIRMED,
      totalAmount: 43500.00,
      notes: 'Initial delivery note dispatch',
      createdById: salesUser.id,
      confirmedById: warehouseUser.id,
      confirmedAt: new Date(),
      items: {
        create: [
          {
            productId: prod1.id,
            productName: prod1.name, // Snapshot
            sku: prod1.sku,         // Snapshot
            unitPrice: prod1.unitPrice, // Snapshot
            quantity: 3,
          },
        ],
      },
    },
  });

  console.log(`✅ Created Sample Challan ${challan.challanNumber} with product snapshots.`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
