
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type CreateFamilyMemberInput } from '../schema';
import { createFamilyMember } from '../handlers/create_family_member';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateFamilyMemberInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30
};

// Test input with nullable fields as null
const testInputWithNulls: CreateFamilyMemberInput = {
  name: 'Jane Smith',
  email: null,
  age: null
};

describe('createFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a family member with all fields', async () => {
    const result = await createFamilyMember(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.age).toEqual(30);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a family member with nullable fields as null', async () => {
    const result = await createFamilyMember(testInputWithNulls);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.age).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save family member to database', async () => {
    const result = await createFamilyMember(testInput);

    // Query using proper drizzle syntax
    const familyMembers = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, result.id))
      .execute();

    expect(familyMembers).toHaveLength(1);
    expect(familyMembers[0].name).toEqual('John Doe');
    expect(familyMembers[0].email).toEqual('john.doe@example.com');
    expect(familyMembers[0].age).toEqual(30);
    expect(familyMembers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple family members with unique IDs', async () => {
    const result1 = await createFamilyMember(testInput);
    const result2 = await createFamilyMember(testInputWithNulls);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('John Doe');
    expect(result2.name).toEqual('Jane Smith');

    // Verify both are in database
    const allMembers = await db.select()
      .from(familyMembersTable)
      .execute();

    expect(allMembers).toHaveLength(2);
  });
});
