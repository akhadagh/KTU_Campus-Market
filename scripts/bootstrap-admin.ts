import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = process.env["ADMIN_BOOTSTRAP_EMAIL"]?.trim().toLowerCase();
  const password = process.env["ADMIN_BOOTSTRAP_PASSWORD"];
  const fullName = process.env["ADMIN_BOOTSTRAP_NAME"]?.trim() || "Campus Market Admin";

  if (!email || !password) {
    console.error(
      "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD before running this script.",
    );
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { name: "admin" }, select: { id: true } });
  if (!role) {
    console.error("The admin role does not exist. Run `pnpm db:seed` first.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });

  let userId: string;
  if (existing) {
    userId = existing.id;
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        status: "ACTIVE",
      },
    });
    console.log(`Existing user ${email} kept. Password was not changed.`);
  } else {
    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });
    userId = created.id;
    console.log(`Created admin user ${email}.`);
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
  console.log(`Granted the admin role to ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
