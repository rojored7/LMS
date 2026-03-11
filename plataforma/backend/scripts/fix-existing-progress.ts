/**
 * Script to recalculate progress for all existing enrollments
 * This fixes enrollments that have incorrect progress due to the previous bug
 */

import { PrismaClient } from '@prisma/client';
import progressService from '../src/services/progress.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting progress recalculation for all enrollments...\n');

  // Get all enrollments
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
      course: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log(`📊 Found ${enrollments.length} enrollments to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const enrollment of enrollments) {
    try {
      // Calculate correct progress using progressService
      const correctProgress = await progressService.getCourseProgress(
        enrollment.userId,
        enrollment.courseId
      );

      // Update enrollment with correct progress
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: correctProgress,
          progressPercentage: correctProgress,
          completedAt: correctProgress === 100 ? new Date() : null,
        },
      });

      console.log(
        `✅ ${enrollment.user.email} - ${enrollment.course.title}: ${enrollment.progress}% → ${correctProgress}%`
      );

      successCount++;
    } catch (error) {
      console.error(
        `❌ Error processing enrollment ${enrollment.id} (${enrollment.user.email}):`,
        error
      );
      errorCount++;
    }
  }

  console.log(`\n✨ Progress recalculation completed!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
