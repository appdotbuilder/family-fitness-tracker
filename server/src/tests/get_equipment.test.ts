
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { equipmentTable } from '../db/schema';
import { getEquipment } from '../handlers/get_equipment';

describe('getEquipment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no equipment exists', async () => {
    const result = await getEquipment();
    expect(result).toEqual([]);
  });

  it('should return all equipment', async () => {
    // Create test equipment
    await db.insert(equipmentTable)
      .values([
        {
          name: 'Treadmill',
          description: 'Cardio equipment for running',
          category: 'Cardio'
        },
        {
          name: 'Dumbbells',
          description: 'Weight training equipment',
          category: 'Strength'
        },
        {
          name: 'Yoga Mat',
          description: null,
          category: null
        }
      ])
      .execute();

    const result = await getEquipment();

    expect(result).toHaveLength(3);
    
    // Verify first equipment
    expect(result[0].name).toEqual('Treadmill');
    expect(result[0].description).toEqual('Cardio equipment for running');
    expect(result[0].category).toEqual('Cardio');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second equipment
    expect(result[1].name).toEqual('Dumbbells');
    expect(result[1].description).toEqual('Weight training equipment');
    expect(result[1].category).toEqual('Strength');

    // Verify third equipment with nullable fields
    expect(result[2].name).toEqual('Yoga Mat');
    expect(result[2].description).toBeNull();
    expect(result[2].category).toBeNull();
  });

  it('should return equipment in insertion order', async () => {
    // Create equipment in specific order
    await db.insert(equipmentTable)
      .values({
        name: 'First Equipment',
        description: 'First item',
        category: 'Test'
      })
      .execute();

    await db.insert(equipmentTable)
      .values({
        name: 'Second Equipment',
        description: 'Second item',
        category: 'Test'
      })
      .execute();

    const result = await getEquipment();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Equipment');
    expect(result[1].name).toEqual('Second Equipment');
    
    // Verify IDs are in ascending order
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
