
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type UpdateFamilyMemberInput, type FamilyMember } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFamilyMember = async (input: UpdateFamilyMemberInput): Promise<FamilyMember> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof familyMembersTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    
    if (input.age !== undefined) {
      updateData.age = input.age;
    }

    // Update family member record
    const result = await db.update(familyMembersTable)
      .set(updateData)
      .where(eq(familyMembersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Family member with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Family member update failed:', error);
    throw error;
  }
};
