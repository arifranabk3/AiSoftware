import { DEPARTMENTS, SPECIALIST_PROFILES, CEO_ORCHESTRATOR } from '@ai-command-center/shared';
import { mongoDbService } from './mongodb.js';

export async function seedOrganization(mongoUri?: string): Promise<{
  departmentsSeeded: number;
  specialistsSeeded: number;
  ceoSeeded: boolean;
}> {
  const status = await mongoDbService.connect(
    mongoUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_command_center'
  );
  if (!status.success) {
    throw new Error(`Cannot seed organization: ${status.error}`);
  }

  const db = mongoDbService.getDb();

  // 1. Seed 7 Departments
  const deptCollection = db.collection('departments');
  for (const dept of Object.values(DEPARTMENTS)) {
    await deptCollection.updateOne(
      { id: dept.id },
      {
        $set: {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.description,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  // 2. Seed Separate CEO Orchestrator
  const specialistCollection = db.collection('specialists');
  await specialistCollection.updateOne(
    { id: CEO_ORCHESTRATOR.id },
    {
      $set: {
        id: CEO_ORCHESTRATOR.id,
        roleNumber: 0,
        title: CEO_ORCHESTRATOR.title,
        departmentId: CEO_ORCHESTRATOR.departmentId,
        responsibilities: CEO_ORCHESTRATOR.responsibilities,
        allowedTools: CEO_ORCHESTRATOR.allowedTools,
        permissionLevel: CEO_ORCHESTRATOR.permissionLevel,
        approvalRequired: CEO_ORCHESTRATOR.approvalRequired,
        isActive: CEO_ORCHESTRATOR.isActive,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  // 3. Seed 55 Specialist Roles
  for (const spec of SPECIALIST_PROFILES) {
    await specialistCollection.updateOne(
      { id: spec.id },
      {
        $set: {
          id: spec.id,
          roleNumber: spec.roleNumber,
          title: spec.title,
          departmentId: spec.departmentId,
          responsibilities: spec.responsibilities,
          allowedTools: spec.allowedTools,
          permissionLevel: spec.permissionLevel,
          approvalRequired: spec.approvalRequired,
          isActive: spec.isActive,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  const deptCount = await deptCollection.countDocuments();
  const specCount = await specialistCollection.countDocuments({ roleNumber: { $gt: 0 } });

  return {
    departmentsSeeded: deptCount,
    specialistsSeeded: specCount,
    ceoSeeded: true
  };
}
