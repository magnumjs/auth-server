const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

/**
 * Seeds the database with a test tenant and user.
 *
 * @returns {Promise<void>} Resolves when the seeding is complete.
 */
module.exports = async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'consumer.example.com' },
    update: {},
    create: {
      name: 'ConsumerApp',
      domain: 'consumer.example.com',
    },
  });

  const password = await bcrypt.hash('testpass', 10);

  await prisma.user.upsert({
    where: { email: 'test@example.com', tenantId: tenant.id },
    update: {},
    create: {
      email: 'test@example.com',
      password,
      roles: ['USER'],
      tenantId: tenant.id,
    }
  });
}

// main().finally(() => prisma.$disconnect());