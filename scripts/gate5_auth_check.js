const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        status: true,
        emailVerified: true,
        passwordHash: true
      }
    });

    const output = users.map(u => ({
      email: u.email,
      active: u.status === 'ACTIVE',
      hasPassword: !!u.passwordHash,
      provider: !!u.passwordHash ? 'CREDENTIALS' : 'OAUTH',
      emailVerified: !!u.emailVerified,
      applicationAccessResult: u.status === 'ACTIVE' ? 'ACTOR_INTERACTIVE_LOGIN_REQUIRED' : 'LOCKED_OR_INACTIVE'
    }));

    console.log(JSON.stringify(output, null, 2));
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
