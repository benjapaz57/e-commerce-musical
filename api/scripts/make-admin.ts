// Da (o quita) el rol de administrador a una cuenta existente.
// Uso:  npm run admin:make -- email@ejemplo.com
//       npm run admin:make -- email@ejemplo.com --quitar
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Indicá el email: npm run admin:make -- email@ejemplo.com');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const role = flag === '--quitar' ? Role.USER : Role.ADMIN;

try {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    console.error(`No existe una cuenta con el email ${email}. Registrala primero desde la web.`);
    process.exit(1);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role } }),
    prisma.auditLog.create({
      data: {
        actorId: null,
        action: role === Role.ADMIN ? 'usuario.hacer-admin' : 'usuario.quitar-admin',
        entityType: 'usuario',
        entityId: user.id,
        before: { role: user.role },
        after: { role },
        reason: 'Script de consola',
      },
    }),
  ]);
  console.log(`${user.email} ahora tiene rol ${role}.`);
} finally {
  await prisma.$disconnect();
}
