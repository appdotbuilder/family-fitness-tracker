
import { db } from '../db';
import { equipmentTable } from '../db/schema';
import { type UpdateEquipmentInput, type Equipment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEquipment = async (input: UpdateEquipmentInput): Promise<Equipment> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      description: string | null;
      category: string | null;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    // Update equipment record
    const result = await db.update(equipmentTable)
      .set(updateData)
      .where(eq(equipmentTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Equipment with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Equipment update failed:', error);
    throw error;
  }
};
