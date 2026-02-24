import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for all users
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ciberplatform.com' },
    update: {},
    create: {
      email: 'admin@ciberplatform.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created/Updated Admin:', admin.email);

  // Create Instructor User
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@ciberplatform.com' },
    update: {},
    create: {
      email: 'instructor@ciberplatform.com',
      passwordHash: hashedPassword,
      name: 'Instructor User',
      role: 'INSTRUCTOR',
    },
  });
  console.log('✅ Created/Updated Instructor:', instructor.email);

  // Create Student User
  const student = await prisma.user.upsert({
    where: { email: 'student@ciberplatform.com' },
    update: {},
    create: {
      email: 'student@ciberplatform.com',
      passwordHash: hashedPassword,
      name: 'Student User',
      role: 'STUDENT',
    },
  });
  console.log('✅ Created/Updated Student:', student.email);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📧 Test Users:');
  console.log('   Admin:      admin@ciberplatform.com / Admin123!');
  console.log('   Instructor: instructor@ciberplatform.com / Admin123!');
  console.log('   Student:    student@ciberplatform.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
