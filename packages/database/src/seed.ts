import { DEPARTMENTS, SPECIALIST_PROFILES, CEO_ORCHESTRATOR } from '@ai-command-center/shared';
import { prisma, dbService } from '../src/index.js';

export async function seedOrganization(): Promise<{
  departmentsSeeded: number;
  specialistsSeeded: number;
  ceoSeeded: boolean;
}> {
  const status = await dbService.connect();
  if (!status.success) {
    throw new Error(`Cannot seed organization: ${status.error}`);
  }

  // 1. Seed 7 Departments
  for (const dept of Object.values(DEPARTMENTS)) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {
        name: dept.name,
        code: dept.code,
        description: dept.description
      },
      create: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description
      }
    });
  }

  // 2. Seed Separate CEO Orchestrator
  await prisma.specialist.upsert({
    where: { id: CEO_ORCHESTRATOR.id },
    update: {
      title: CEO_ORCHESTRATOR.title,
      departmentId: CEO_ORCHESTRATOR.departmentId,
      responsibilities: CEO_ORCHESTRATOR.responsibilities,
      allowedTools: CEO_ORCHESTRATOR.allowedTools,
      permissionLevel: CEO_ORCHESTRATOR.permissionLevel,
      approvalRequired: CEO_ORCHESTRATOR.approvalRequired,
      isActive: CEO_ORCHESTRATOR.isActive
    },
    create: {
      id: CEO_ORCHESTRATOR.id,
      roleNumber: 0, // Unique reserved index for CEO
      title: CEO_ORCHESTRATOR.title,
      departmentId: CEO_ORCHESTRATOR.departmentId,
      responsibilities: CEO_ORCHESTRATOR.responsibilities,
      allowedTools: CEO_ORCHESTRATOR.allowedTools,
      permissionLevel: CEO_ORCHESTRATOR.permissionLevel,
      approvalRequired: CEO_ORCHESTRATOR.approvalRequired,
      isActive: CEO_ORCHESTRATOR.isActive
    }
  });

  // 3. Seed 55 Specialist Roles
  for (const spec of SPECIALIST_PROFILES) {
    await prisma.specialist.upsert({
      where: { id: spec.id },
      update: {
        roleNumber: spec.roleNumber,
        title: spec.title,
        departmentId: spec.departmentId,
        responsibilities: spec.responsibilities,
        allowedTools: spec.allowedTools,
        permissionLevel: spec.permissionLevel,
        approvalRequired: spec.approvalRequired,
        isActive: spec.isActive
      },
      create: {
        id: spec.id,
        roleNumber: spec.roleNumber,
        title: spec.title,
        departmentId: spec.departmentId,
        responsibilities: spec.responsibilities,
        allowedTools: spec.allowedTools,
        permissionLevel: spec.permissionLevel,
        approvalRequired: spec.approvalRequired,
        isActive: spec.isActive
      }
    });
  }

  const deptCount = await prisma.department.count();
  const specCount = await prisma.specialist.count({
    where: { roleNumber: { gt: 0 } }
  });

  return {
    departmentsSeeded: deptCount,
    specialistsSeeded: specCount,
    ceoSeeded: true
  };
}
