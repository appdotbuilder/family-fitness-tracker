
import { db } from '../db';
import { equipmentTable } from '../db/schema';
import { type Equipment } from '../schema';

export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const results = await db.select()
      .from(equipmentTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Equipment retrieval failed:', error);
    throw error;
  }
};
