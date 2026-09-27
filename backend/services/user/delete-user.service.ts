import { db } from '@db';
import { users } from '@db/schema/user';
import { eq } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@utils/errors';
import { userLogger, auditLogger } from '@utils/logger';
import { deleteUserCascade } from './delete-user-cascade.util';

export class DeleteUserService {
  static async deleteUser(userId: string, performedBy?: { id: string; role: string }) {
    if (performedBy?.id && String(performedBy.id) === String(userId)) {
      throw new ValidationError('You cannot delete your own account');
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    let deletedUser;

    // If user is already inactive (or permanently deleting), remove all associated records and user record
    if (!existing.isActive) {
      const [removed] = await deleteUserCascade(userId);
      deletedUser = removed || existing;
    } else {
      // Soft delete - set isActive to false
      const [updated] = await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          phoneNumber: users.phoneNumber,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      deletedUser = updated;
    }

    // =========================
    // LOGGING
    // =========================
    const logData = {
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        role: deletedUser.role,
        phoneNumber: deletedUser.phoneNumber,
      },
      performedBy,
      action: 'delete_user',
      timestamp: new Date().toISOString(),
    };

    userLogger.info(logData);
    auditLogger.info(logData);

    return deletedUser;
  }
}
