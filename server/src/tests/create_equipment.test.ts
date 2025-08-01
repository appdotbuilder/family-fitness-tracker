
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { equipmentTable } from '../db/schema';
import { type CreateEquipmentInput } from '../schema';
import { createEquipment } from '../handlers/create_equipment';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateEquipmentInput = {
  name: 'Treadmill',
  description: 'High-quality treadmill for cardio workouts',
  category: 'Cardio'
};

describe('createEquipment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create equipment', async () => {
    const result = await createEquipment(testInput);

    // Basic field validation
    expect(result.name).toEqual('Treadmill');
    expect(result.description).toEqual('High-quality treadmill for cardio workouts');
    expect(result.category).toEqual('Cardio');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save equipment to database', async () => {
    const result = await createEquipment(testInput);

    // Query using proper drizzle syntax
    const equipment = await db.select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, result.id))
      .execute();

    expect(equipment).toHaveLength(1);
    expect(equipment[0].name).toEqual('Treadmill');
    expect(equipment[0].description).toEqual('High-quality treadmill for cardio workouts');
    expect(equipment[0].category).toEqual('Cardio');
    expect(equipment[0].created_at).toBeInstanceOf(Date);
  });

  it('should create equipment with nullable fields', async () => {
    const inputWithNulls: CreateEquipmentInput = {
      name: 'Basic Equipment',
      description: null,
      category: null
    };

    const result = await createEquipment(inputWithNulls);

    expect(result.name).toEqual('Basic Equipment');
    expect(result.description).toBeNull();
    expect(result.category).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const equipment = await db.select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, result.id))
      .execute();

    expect(equipment[0].description).toBeNull();
    expect(equipment[0].category).toBeNull();
  });

  it('should create equipment with only required fields', async () => {
    const minimalInput: CreateEquipmentInput = {
      name: 'Dumbbells',
      description: null,
      category: null
    };

    const result = await createEquipment(minimalInput);

    expect(result.name).toEqual('Dumbbells');
    expect(result.description).toBeNull();
    expect(result.category).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
