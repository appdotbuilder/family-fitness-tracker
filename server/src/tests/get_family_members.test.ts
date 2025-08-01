
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { getFamilyMembers } from '../handlers/get_family_members';

describe('getFamilyMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no family members exist', async () => {
    const result = await getFamilyMembers();
    expect(result).toEqual([]);
  });

  it('should return all family members', async () => {
    // Create test family members
    await db.insert(familyMembersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        },
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          age: 28
        },
        {
          name: 'Child Doe',
          email: null,
          age: 8
        }
      ])
      .execute();

    const result = await getFamilyMembers();

    expect(result).toHaveLength(3);
    
    // Check first member
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].age).toEqual(30);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second member
    expect(result[1].name).toEqual('Jane Doe');
    expect(result[1].email).toEqual('jane@example.com');
    expect(result[1].age).toEqual(28);

    // Check third member with null values
    expect(result[2].name).toEqual('Child Doe');
    expect(result[2].email).toBeNull();
    expect(result[2].age).toEqual(8);
  });

  it('should return family members ordered by creation time', async () => {
    // Create family members with slight delay to ensure different timestamps
    await db.insert(familyMembersTable)
      .values({ name: 'First Member', email: 'first@example.com', age: 25 })
      .execute();

    await db.insert(familyMembersTable)
      .values({ name: 'Second Member', email: 'second@example.com', age: 35 })
      .execute();

    const result = await getFamilyMembers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Member');
    expect(result[1].name).toEqual('Second Member');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
