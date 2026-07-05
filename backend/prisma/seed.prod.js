const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const password = await bcrypt.hash('Password123', 10);

  const users = [
    { email: 'admin@ebidding.com', fullName: 'System Admin', role: 'ADMIN' },
    { email: 'requester@ebidding.com', fullName: 'John Requester', role: 'REQUESTER' },
    { email: 'procurement@ebidding.com', fullName: 'Jane Procurement', role: 'PROCUREMENT' },
    { email: 'evaluator@ebidding.com', fullName: 'Bob Evaluator', role: 'EVALUATOR' },
    { email: 'lead@ebidding.com', fullName: 'Alice Lead Evaluator', role: 'LEAD_EVALUATOR' },
    { email: 'approver@ebidding.com', fullName: 'Charlie Approver', role: 'APPROVER' },
    { email: 'vendor@ebidding.com', fullName: 'Vendor Manager', role: 'VENDOR' },
    { email: 'vendor2@ebidding.com', fullName: 'Vendor 2 Manager', role: 'VENDOR' },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, passwordHash: password, fullName: u.fullName, role: u.role },
    });
    console.log(`Seeded user: ${u.email} (${u.role})`);

    if (u.role === 'VENDOR') {
      await prisma.vendor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          companyName: u.email === 'vendor@ebidding.com' ? 'Tech Solutions Co., Ltd.' : 'Digital Partners Ltd.',
          contactName: u.fullName,
          contactEmail: u.email,
          userId: user.id,
        },
      });
      console.log(`  → vendor record created for ${u.email}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
