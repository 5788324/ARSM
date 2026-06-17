import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    // Re-hash password on every run to keep it fresh after schema changes
    await prisma.user.update({
      where: { username },
      data: { passwordHash, isAdmin: true },
    });
    console.log(`Admin user "${username}" updated.`);
  } else {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        isAdmin: true,
      },
    });
    console.log(`Admin user "${username}" created.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
