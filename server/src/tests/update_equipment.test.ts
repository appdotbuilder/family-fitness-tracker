
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { equipmentTable } from '../db/schema';
import { type CreateEquipmentInput, type UpdateEquipmentInput } from '../schema';
import { updateEquipment } from '../handlers/update_equipment';
import { eq } from 'drizzle-orm';

// Test inputs
const createInput: CreateEquipmentInput = {
  name: 'Original Equipment',
  description: 'Original description',
  category: 'Original category'
};

const updateInput: UpdateEquipmentInput = {
  id: 1, // Will be set after creation
  name: 'Updated Equipment',
  description: 'Updated description',
  category: 'Updated category'
};

describe('updateEquipment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update equipment with all fields', async () => {
    // Create equipment first
    const created = await db.insert(equipmentTable)
      .values(createInput)
      .returning()
      .execute();

    const equipmentId = created[0].id;
    const updateData = { ...updateInput, id: equipmentId };

    const result = await updateEquipment(updateData);

    // Verify updated fields
    expect(result.id).toEqual(equipmentId);
    expect(result.name).toEqual('Updated Equipment');
    expect(result.description).toEqual('Updated description');
    expect(result.category).toEqual('Updated category');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update equipment with partial fields', async () => {
    // Create equipment first
    const created = await db.insert(equipmentTable)
      .values(createInput)
      .returning()
      .execute();

    const equipmentId = created[0].id;
    const partialUpdate: UpdateEquipmentInput = {
      id: equipmentId,
      name: 'Partially Updated Name'
    };

    const result = await updateEquipment(partialUpdate);

    // Verify only name was updated, others remain unchanged
    expect(result.id).toEqual(equipmentId);
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.description).toEqual('Original description');
    expect(result.category).toEqual('Original category');
  });

  it('should update equipment with nullable fields', async () => {
    // Create equipment first
    const created = await db.insert(equipmentTable)
      .values(createInput)
      .returning()
      .execute();

    const equipmentId = created[0].id;
    const nullUpdate: UpdateEquipmentInput = {
      id: equipmentId,
      description: null,
      category: null
    };

    const result = await updateEquipment(nullUpdate);

    // Verify nullable fields were set to null
    expect(result.id).toEqual(equipmentId);
    expect(result.name).toEqual('Original Equipment'); // Unchanged
    expect(result.description).toBeNull();
    expect(result.category).toBeNull();
  });

  it('should save updated equipment to database', async () => {
    // Create equipment first
    const created = await db.insert(equipmentTable)
      .values(createInput)
      .returning()
      .execute();

    const equipmentId = created[0].id;
    const updateData = { ...updateInput, id: equipmentId };

    await updateEquipment(updateData);

    // Verify changes were persisted
    const equipment = await db.select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, equipmentId))
      .execute();

    expect(equipment).toHaveLength(1);
    expect(equipment[0].name).toEqual('Updated Equipment');
    expect(equipment[0].description).toEqual('Updated description');
    expect(equipment[0].category).toEqual('Updated category');
  });

  it('should throw error for non-existent equipment', async () => {
    const nonExistentUpdate: UpdateEquipmentInput = {
      id: 999,
      name: 'Non-existent Equipment'
    };

    expect(updateEquipment(nonExistentUpdate)).rejects.toThrow(/not found/i);
  });
});
