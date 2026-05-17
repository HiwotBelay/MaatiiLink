import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("ChangeMe123!", 12);

  const hq = await prisma.branch.upsert({
    where: { branchCode: "HQ001" },
    update: {},
    create: {
      branchCode: "HQ001",
      name: "Head Office - DX Valley Pilot",
      district: "Bole",
      region: "Addis Ababa",
      isSmartBranch: false,
    },
  });

  const smart = await prisma.branch.upsert({
    where: { branchCode: "SM001" },
    update: {},
    create: {
      branchCode: "SM001",
      name: "Smart Branch Pilot - Bole",
      district: "Bole",
      region: "Addis Ababa",
      isSmartBranch: true,
    },
  });

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
    where: { email: "supervisor@maatiilink.local" },
    update: {},
    create: {
      email: "supervisor@maatiilink.local",
      name: "District Supervisor (Dev)",
      passwordHash,
      role: Role.SUPERVISOR,
    },
  });

  console.log("Seed complete:", { branches: [hq.branchCode, smart.branchCode] });
  console.log("Dev logins (change passwords before pilot):");
  console.log("  admin@maatiilink.local / ChangeMe123!");
  console.log("  manager@maatiilink.local / ChangeMe123!");
  console.log("  supervisor@maatiilink.local / ChangeMe123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
