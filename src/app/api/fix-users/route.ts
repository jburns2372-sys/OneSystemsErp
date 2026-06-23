import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSystemRole } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    let updatedCount = 0;

    for (const user of users) {
      let correctRole = '';
      
      if (user.name && user.name.toUpperCase().startsWith('DEMO ')) {
        // e.g. "DEMO PROCUREMENT OFFICER" -> "PROCUREMENT_OFFICER"
        correctRole = user.name.substring(5).trim().replace(/\s+/g, '_').toUpperCase();
      } else if (user.email && user.email.endsWith('@demo.com')) {
        // Fallback to email: "project_engineer@demo.com" -> "PROJECT_ENGINEER"
        correctRole = user.email.split('@')[0].toUpperCase();
      }

      if (correctRole) {
        // Don't touch the actual system admin
        if (correctRole === 'JBURNS' || correctRole === 'ADMIN' || correctRole.includes('SUPER')) continue;

        // Ensure the system role exists
        const roleResult = await createSystemRole(correctRole);
        
        if (roleResult.success && roleResult.name) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: roleResult.name }
          });

          // Optional: Link to RBAC via UserRole table
          const rbacRole = await prisma.role.findFirst({
            where: { roleCode: roleResult.name }
          });
          
          if (rbacRole) {
            // Ensure link exists
            const existingLink = await prisma.userRole.findFirst({
              where: { userId: user.id, roleId: rbacRole.id }
            });
            if (!existingLink) {
              await prisma.userRole.create({
                data: {
                  userId: user.id,
                  roleId: rbacRole.id
                }
              });
            }
          }

          updatedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully fixed ${updatedCount} demo users to match their correct roles instead of SUPER_ADMIN!` 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
