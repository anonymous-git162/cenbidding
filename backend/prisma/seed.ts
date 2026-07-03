import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing seed data for idempotent re-runs (order matters: children before parents)
  await prisma.ebiddingResponse.deleteMany();
  await prisma.ebiddingRound.deleteMany();
  await prisma.evaluatorReview.deleteMany();
  await prisma.evaluatorAssignment.deleteMany();
  await prisma.evaluationConsolidation.deleteMany();
  await prisma.vendorInvitation.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.procurementResult.deleteMany();
  await prisma.rfqSubmission.deleteMany();
  await prisma.procurementTimeline.deleteMany();
  await prisma.procurement.deleteMany();

  const password = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ebidding.com' },
    update: {},
    create: { email: 'admin@ebidding.com', passwordHash: password, fullName: 'System Admin', role: 'ADMIN' },
  });

  const requester = await prisma.user.upsert({
    where: { email: 'requester@ebidding.com' },
    update: {},
    create: { email: 'requester@ebidding.com', passwordHash: password, fullName: 'John Requester', role: 'REQUESTER' },
  });

  const procurement = await prisma.user.upsert({
    where: { email: 'procurement@ebidding.com' },
    update: {},
    create: { email: 'procurement@ebidding.com', passwordHash: password, fullName: 'Jane Procurement', role: 'PROCUREMENT' },
  });

  const evaluator = await prisma.user.upsert({
    where: { email: 'evaluator@ebidding.com' },
    update: {},
    create: { email: 'evaluator@ebidding.com', passwordHash: password, fullName: 'Bob Evaluator', role: 'EVALUATOR' },
  });

  const leadEvaluator = await prisma.user.upsert({
    where: { email: 'lead@ebidding.com' },
    update: {},
    create: { email: 'lead@ebidding.com', passwordHash: password, fullName: 'Alice Lead Evaluator', role: 'LEAD_EVALUATOR' },
  });

  const approver = await prisma.user.upsert({
    where: { email: 'approver@ebidding.com' },
    update: {},
    create: { email: 'approver@ebidding.com', passwordHash: password, fullName: 'Charlie Approver', role: 'APPROVER' },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@ebidding.com' },
    update: {},
    create: { email: 'vendor@ebidding.com', passwordHash: password, fullName: 'Vendor Manager', role: 'VENDOR' },
  });

  // Centara Hotels & Resorts - 53 properties with 10 departments each
  const centaraProperties = [
    { code: 'AMD', name: 'AMD' },
    { code: 'CAK', name: 'CAK' },
    { code: 'CNK', name: 'CNK' },
    { code: 'CAY', name: 'CAY' },
    { code: 'CGCW', name: 'CGCW' },
    { code: 'CGLB', name: 'CGLB' },
    { code: 'CHBR', name: 'CHBR' },
    { code: 'CPBR', name: 'CPBR' },
    { code: 'CGOJ', name: 'CGOJ' },
    { code: 'CGLM', name: 'CGLM' },
    { code: 'CMBR', name: 'CMBR' },
    { code: 'CHY', name: 'CHY' },
    { code: 'CKR', name: 'CKR' },
    { code: 'CKV', name: 'CKV' },
    { code: 'CKT', name: 'CKT' },
    { code: 'CKC', name: 'CKC' },
    { code: 'CKD', name: 'CKD' },
    { code: 'CCH', name: 'CCH' },
    { code: 'CGC', name: 'CGC' },
    { code: 'CBP', name: 'CBP' },
    { code: 'CMS', name: 'CMS' },
    { code: 'CSA', name: 'CSA' },
    { code: 'CMJ', name: 'CMJ' },
    { code: 'CLOJ', name: 'CLOJ' },
    { code: 'CPP', name: 'CPP' },
    { code: 'CWR', name: 'CWR' },
    { code: 'CDD', name: 'CDD' },
    { code: 'CMLM', name: 'CMLM' },
    { code: 'CMV', name: 'CMV' },
    { code: 'CMO', name: 'CMO' },
    { code: 'NVP', name: 'NVP' },
    { code: 'CPY', name: 'CPY' },
    { code: 'CRF', name: 'CRF' },
    { code: 'CRS', name: 'CRS' },
    { code: 'CCM', name: 'CCM' },
    { code: 'CSS', name: 'CSS' },
    { code: 'CUB', name: 'CUB' },
    { code: 'CUD', name: 'CUD' },
    { code: 'CPI', name: 'CPI' },
    { code: 'CVP', name: 'CVP' },
    { code: 'CSV', name: 'CSV' },
    { code: 'CWB', name: 'CWB' },
    { code: 'CWQ', name: 'CWQ' },
    { code: 'CZKA', name: 'CZKA' },
    { code: 'CZPN', name: 'CZPN' },
    { code: 'CZSC', name: 'CZSC' },
    { code: 'CZVL', name: 'CZVL' },
    { code: 'HHN', name: 'HHN' },
    { code: 'CIRM', name: 'CIRM' },
    { code: 'RKK', name: 'RKK' },
    { code: 'SSA', name: 'SSA' },
    { code: 'VKP', name: 'VKP' },
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

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      companyName: 'Tech Solutions Co., Ltd.',
      taxId: '0105555123456',
      contactName: 'Diana Vendor',
      contactEmail: 'vendor@ebidding.com',
      phone: '+66-2-123-4567',
      address: '123 Tech Park, Bangkok',
      userId: vendorUser.id,
    },
  });

  const vendor2User = await prisma.user.upsert({
    where: { email: 'vendor2@ebidding.com' },
    update: {},
    create: { email: 'vendor2@ebidding.com', passwordHash: password, fullName: 'Vendor 2 Manager', role: 'VENDOR' },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { userId: vendor2User.id },
    update: {},
    create: {
      companyName: 'Digital Partners Ltd.',
      contactName: 'Eric Partner',
      contactEmail: 'vendor2@ebidding.com',
      phone: '+66-2-987-6543',
      userId: vendor2User.id,
    },
  });

  // Create sample procurement using first Centara property
  const firstProp = await prisma.property.findFirst({ where: { code: 'AMD' } });
  const firstDept = await prisma.department.findFirst({ where: { code: 'AMD-IT' } });

  const procurementItem = await prisma.procurement.create({
    data: {
      requestNo: 'RFP-20260620-0001',
      requestType: 'RFP',
      title: 'IT Infrastructure Upgrade 2026',
      description: 'Complete upgrade of network infrastructure across all departments including switches, routers, and wireless access points.',
      businessNeed: 'Current infrastructure is outdated and causing frequent downtime',
      propertyId: firstProp?.id,
      departmentId: firstDept?.id,
      category: 'IT Infrastructure',
      budgetEstimate: 500000,
      justification: 'Critical infrastructure upgrade needed for business continuity',
      requesterId: requester.id,
      status: 'DRAFT',
      currentOwnerRole: 'REQUESTER',
    },
  });

  await prisma.procurementTimeline.create({
    data: {
      procurementId: procurementItem.id,
      eventType: 'DRAFT_CREATED',
      actorRole: 'REQUESTER',
      actorId: requester.id,
    },
  });

  console.log('Seed data created successfully!');
  console.log('---');
  console.log('Login credentials (all passwords: Password123):');
  console.log('Admin:       admin@ebidding.com');
  console.log('Requester:   requester@ebidding.com');
  console.log('Procurement: procurement@ebidding.com');
  console.log('Evaluator:   evaluator@ebidding.com');
  console.log('Lead Eval:   lead@ebidding.com');
  console.log('Approver:    approver@ebidding.com');
  console.log('Vendor:      vendor@ebidding.com');
  console.log('Vendor 2:    vendor2@ebidding.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
