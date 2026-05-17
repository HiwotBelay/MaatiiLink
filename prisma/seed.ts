import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("ChangeMe123!", 12);

  const branches = [
    {
      branchCode: "HQ001",
      name: "Head Office - DX Valley Pilot",
      district: "Bole",
      region: "Addis Ababa",
      isSmartBranch: false,
    },
    {
      branchCode: "SM001",
      name: "Smart Branch Pilot - Bole",
      district: "Bole",
      region: "Addis Ababa",
      isSmartBranch: true,
    },
    {
      branchCode: "TR001",
      name: "Traditional Branch - Merkato",
      district: "Merkato",
      region: "Addis Ababa",
      isSmartBranch: false,
    },
    {
      branchCode: "EB001",
      name: "Eco Branch Pilot - Adama",
      district: "Adama",
      region: "Oromia",
      isSmartBranch: false,
    },
    {
      branchCode: "SM002",
      name: "Smart Branch Pilot - Hawassa",
      district: "Hawassa",
      region: "SNNPR",
      isSmartBranch: true,
    },
  ];

  const createdBranches = [];
  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { branchCode: b.branchCode },
      update: { isPilotBranch: true },
      create: { ...b, isPilotBranch: true },
    });
    createdBranches.push(branch);
  }

  const [hq, smart, traditional] = createdBranches;

  await prisma.user.upsert({
    where: { email: "admin@maatiilink.local" },
    update: {},
    create: {
      email: "admin@maatiilink.local",
      name: "HO Admin (Dev)",
      passwordHash,
      role: Role.HO_ADMIN,
      branchId: hq.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@maatiilink.local" },
    update: {},
    create: {
      email: "manager@maatiilink.local",
      name: "Branch Manager (Dev)",
      passwordHash,
      role: Role.BRANCH_MANAGER,
      branchId: smart.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager2@maatiilink.local" },
    update: {},
    create: {
      email: "manager2@maatiilink.local",
      name: "Branch Manager Merkato (Dev)",
      passwordHash,
      role: Role.BRANCH_MANAGER,
      branchId: traditional.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "supervisor@maatiilink.local" },
    update: {},
    create: {
      email: "supervisor@maatiilink.local",
      name: "District Supervisor (Dev)",
      passwordHash,
      role: Role.SUPERVISOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "auditor@maatiilink.local" },
    update: {},
    create: {
      email: "auditor@maatiilink.local",
      name: "Internal Auditor (Dev)",
      passwordHash,
      role: Role.AUDITOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@maatiilink.local" },
    update: {},
    create: {
      email: "staff@maatiilink.local",
      name: "Branch Staff (Dev)",
      passwordHash,
      role: Role.BRANCH_STAFF,
      branchId: smart.id,
    },
  });

  console.log(
    "Seed complete:",
    createdBranches.map((b) => b.branchCode),
  );
  console.log("Dev logins (change passwords before pilot):");
  console.log("  admin@maatiilink.local / ChangeMe123!");
  console.log("  manager@maatiilink.local / ChangeMe123!");
  console.log("  manager2@maatiilink.local / ChangeMe123!");
  console.log("  supervisor@maatiilink.local / ChangeMe123!");
  console.log("  auditor@maatiilink.local / ChangeMe123!");
  console.log("  staff@maatiilink.local / ChangeMe123!");
  console.log("All seed branches flagged isPilotBranch=true for Phase 5 dev.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
