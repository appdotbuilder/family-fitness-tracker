
import { db } from '../db';
import { equipmentTable } from '../db/schema';
import { type CreateEquipmentInput, type Equipment } from '../schema';

export const createEquipment = async (input: CreateEquipmentInput): Promise<Equipment> => {
  try {
    // Insert equipment record
    const result = await db.insert(equipmentTable)
      .values({
        name: input.name,
        description: input.description,
        category: input.category
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Equipment creation failed:', error);
    throw error;
  }
};
