const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const centaraProperties = [
  { code: 'AMD', name: 'AMD' }, { code: 'CAK', name: 'CAK' },
  { code: 'CNK', name: 'CNK' }, { code: 'CAY', name: 'CAY' },
  { code: 'CGCW', name: 'CGCW' }, { code: 'CGLB', name: 'CGLB' },
  { code: 'CHBR', name: 'CHBR' }, { code: 'CPBR', name: 'CPBR' },
  { code: 'CGOJ', name: 'CGOJ' }, { code: 'CGLM', name: 'CGLM' },
  { code: 'CMBR', name: 'CMBR' }, { code: 'CHY', name: 'CHY' },
  { code: 'CKR', name: 'CKR' }, { code: 'CKV', name: 'CKV' },
  { code: 'CKT', name: 'CKT' }, { code: 'CKC', name: 'CKC' },
  { code: 'CKD', name: 'CKD' }, { code: 'CCH', name: 'CCH' },
  { code: 'CGC', name: 'CGC' }, { code: 'CBP', name: 'CBP' },
  { code: 'CMS', name: 'CMS' }, { code: 'CSA', name: 'CSA' },
  { code: 'CMJ', name: 'CMJ' }, { code: 'CLOJ', name: 'CLOJ' },
  { code: 'CPP', name: 'CPP' }, { code: 'CWR', name: 'CWR' },
  { code: 'CDD', name: 'CDD' }, { code: 'CMLM', name: 'CMLM' },
  { code: 'CMV', name: 'CMV' }, { code: 'CMO', name: 'CMO' },
  { code: 'NVP', name: 'NVP' }, { code: 'CPY', name: 'CPY' },
  { code: 'CRF', name: 'CRF' }, { code: 'CRS', name: 'CRS' },
  { code: 'CCM', name: 'CCM' }, { code: 'CSS', name: 'CSS' },
  { code: 'CUB', name: 'CUB' }, { code: 'CUD', name: 'CUD' },
  { code: 'CPI', name: 'CPI' }, { code: 'CVP', name: 'CVP' },
  { code: 'CSV', name: 'CSV' }, { code: 'CWB', name: 'CWB' },
  { code: 'CWQ', name: 'CWQ' }, { code: 'CZKA', name: 'CZKA' },
  { code: 'CZPN', name: 'CZPN' }, { code: 'CZSC', name: 'CZSC' },
  { code: 'CZVL', name: 'CZVL' }, { code: 'HHN', name: 'HHN' },
  { code: 'CIRM', name: 'CIRM' }, { code: 'RKK', name: 'RKK' },
  { code: 'SSA', name: 'SSA' }, { code: 'VKP', name: 'VKP' },
  { code: 'WSP', name: 'WSP' },
];

const centaraDepts = [
  { code: 'FRONT-OFFICE', name: 'FRONT-OFFICE' },
  { code: 'HOUSEKEEPING', name: 'HOUSEKEEPING' },
  { code: 'F&B', name: 'F&B' },
  { code: 'ENGINEERING', name: 'ENGINEERING' },
  { code: 'FINANCE', name: 'FINANCE' },
  { code: 'HR', name: 'HR' },
  { code: 'SALES', name: 'SALES' },
  { code: 'PROCUREMENT', name: 'PROCUREMENT' },
  { code: 'IT', name: 'IT' },
  { code: 'SECURITY', name: 'SECURITY' },
];

async function main() {
  const password = await bcrypt.hash('Password123', 10);

  // 1) Global users
  const globalUsers = [
    { email: 'admin@ebidding.com', fullName: 'System Admin', role: 'ADMIN' },
    { email: 'requester@ebidding.com', fullName: 'John Requester', role: 'REQUESTER' },
    { email: 'procurement@ebidding.com', fullName: 'Jane Procurement', role: 'PROCUREMENT' },
    { email: 'evaluator@ebidding.com', fullName: 'Bob Evaluator', role: 'EVALUATOR' },
    { email: 'lead@ebidding.com', fullName: 'Alice Lead Evaluator', role: 'LEAD_EVALUATOR' },
    { email: 'approver@ebidding.com', fullName: 'Charlie Approver', role: 'APPROVER' },
    { email: 'vendor@ebidding.com', fullName: 'Vendor Manager', role: 'VENDOR' },
    { email: 'vendor2@ebidding.com', fullName: 'Vendor 2 Manager', role: 'VENDOR' },
  ];

  for (const u of globalUsers) {
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

  // 2) Centara properties + departments
  for (const p of centaraProperties) {
    const prop = await prisma.property.upsert({ where: { code: p.code }, update: { name: p.name }, create: p });
    for (const d of centaraDepts) {
      const deptCode = `${p.code}-${d.code}`;
      const existing = await prisma.department.findFirst({ where: { code: deptCode } });
      if (!existing) {
        await prisma.department.create({ data: { code: deptCode, name: d.name, propertyId: prop.id } });
      }
    }
  }
  console.log(`Seeded ${centaraProperties.length} Centara properties with ${centaraDepts.length} departments each.`);

  // 3) Per-property users (requester + approver)
  const allProps = await prisma.property.findMany({ orderBy: { code: 'asc' } });
  for (const prop of allProps) {
    const reqEmail = `requester-${prop.code.toLowerCase()}@centara.com`;
    const existingReq = await prisma.user.findUnique({ where: { email: reqEmail } });
    if (!existingReq) {
      await prisma.user.create({
        data: { email: reqEmail, passwordHash: password, fullName: `Requester ${prop.code}`, role: 'REQUESTER', propertyId: prop.id },
      });
    }

    const apEmail = `approver-${prop.code.toLowerCase()}@centara.com`;
    const existingAp = await prisma.user.findUnique({ where: { email: apEmail } });
    if (!existingAp) {
      await prisma.user.create({
        data: { email: apEmail, passwordHash: password, fullName: `Approver ${prop.code}`, role: 'APPROVER', propertyId: prop.id },
      });
    }
  }
  console.log(`Seeded ${allProps.length * 2} per-property users (requester + approver).`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
