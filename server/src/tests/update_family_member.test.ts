
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type UpdateFamilyMemberInput, type CreateFamilyMemberInput } from '../schema';
import { updateFamilyMember } from '../handlers/update_family_member';
import { eq } from 'drizzle-orm';

// Test setup data
const testFamilyMember: CreateFamilyMemberInput = {
  name: 'Original Name',
  email: 'original@example.com',
  age: 25
};

describe('updateFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a family member with all fields', async () => {
    // Create a family member first
    const created = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const createdMember = created[0];

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      name: 'Updated Name',
      email: 'updated@example.com',
      age: 30
    };

    const result = await updateFamilyMember(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdMember.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.age).toEqual(30);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdMember.created_at);
  });

  it('should update only specified fields', async () => {
    // Create a family member first
    const created = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const createdMember = created[0];

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      name: 'Only Name Updated'
    };

    const result = await updateFamilyMember(updateInput);

    // Verify only name was updated, other fields unchanged
    expect(result.id).toEqual(createdMember.id);
    expect(result.name).toEqual('Only Name Updated');
    expect(result.email).toEqual('original@example.com');
    expect(result.age).toEqual(25);
    expect(result.created_at).toEqual(createdMember.created_at);
  });

  it('should update nullable fields to null', async () => {
    // Create a family member first
    const created = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const createdMember = created[0];

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      email: null,
      age: null
    };

    const result = await updateFamilyMember(updateInput);

    // Verify nullable fields were set to null
    expect(result.id).toEqual(createdMember.id);
    expect(result.name).toEqual('Original Name'); // Unchanged
    expect(result.email).toBeNull();
    expect(result.age).toBeNull();
    expect(result.created_at).toEqual(createdMember.created_at);
  });

  it('should save updated data to database', async () => {
    // Create a family member first
    const created = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const createdMember = created[0];

    const updateInput: UpdateFamilyMemberInput = {
      id: createdMember.id,
      name: 'Database Updated Name',
      age: 35
    };

    await updateFamilyMember(updateInput);

    // Query database to verify update was persisted
    const members = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, createdMember.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].name).toEqual('Database Updated Name');
    expect(members[0].email).toEqual('original@example.com'); // Unchanged
    expect(members[0].age).toEqual(35);
    expect(members[0].created_at).toEqual(createdMember.created_at);
  });

  it('should throw error when family member does not exist', async () => {
    const updateInput: UpdateFamilyMemberInput = {
      id: 999999, // Non-existent ID
      name: 'This Should Fail'
    };

    await expect(updateFamilyMember(updateInput)).rejects.toThrow(/family member with id 999999 not found/i);
  });
});
