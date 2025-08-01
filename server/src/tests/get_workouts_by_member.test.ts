
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, workoutsTable } from '../db/schema';
import { type GetWorkoutsByMemberInput, type CreateFamilyMemberInput } from '../schema';
import { getWorkoutsByMember } from '../handlers/get_workouts_by_member';

// Test data
const testFamilyMember: CreateFamilyMemberInput = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

describe('getWorkoutsByMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when family member has no workouts', async () => {
    // Create family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const input: GetWorkoutsByMemberInput = {
      family_member_id: familyMemberResult[0].id
    };

    const result = await getWorkoutsByMember(input);

    expect(result).toEqual([]);
  });

  it('should return workouts for a family member', async () => {
    // Create family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const memberId = familyMemberResult[0].id;

    // Create workouts for the family member (note: workout_date expects string format)
    await db.insert(workoutsTable)
      .values([
        {
          family_member_id: memberId,
          name: 'Morning Run',
          duration_minutes: 30,
          notes: 'Easy pace',
          workout_date: '2024-01-15'
        },
        {
          family_member_id: memberId,
          name: 'Evening Walk',
          duration_minutes: 45,
          notes: 'Moderate pace',
          workout_date: '2024-01-16'
        }
      ])
      .execute();

    const input: GetWorkoutsByMemberInput = {
      family_member_id: memberId
    };

    const result = await getWorkoutsByMember(input);

    expect(result).toHaveLength(2);
    expect(result[0].family_member_id).toEqual(memberId);
    expect(result[1].family_member_id).toEqual(memberId);
    
    // Check workout details
    const workoutNames = result.map(w => w.name).sort();
    expect(workoutNames).toEqual(['Evening Walk', 'Morning Run']);
    
    // Verify all fields are present and workout_date is converted to Date
    result.forEach(workout => {
      expect(workout.id).toBeDefined();
      expect(workout.name).toBeDefined();
      expect(workout.workout_date).toBeInstanceOf(Date);
      expect(workout.created_at).toBeInstanceOf(Date);
    });
  });

  it('should only return workouts for the specified family member', async () => {
    // Create two family members
    const member1Result = await db.insert(familyMembersTable)
      .values({ ...testFamilyMember, name: 'John Doe' })
      .returning()
      .execute();

    const member2Result = await db.insert(familyMembersTable)
      .values({ ...testFamilyMember, name: 'Jane Doe', email: 'jane@example.com' })
      .returning()
      .execute();

    const member1Id = member1Result[0].id;
    const member2Id = member2Result[0].id;

    // Create workouts for both members
    await db.insert(workoutsTable)
      .values([
        {
          family_member_id: member1Id,
          name: 'John Workout 1',
          duration_minutes: 30,
          notes: null,
          workout_date: '2024-01-15'
        },
        {
          family_member_id: member1Id,
          name: 'John Workout 2',
          duration_minutes: 45,
          notes: null,
          workout_date: '2024-01-16'
        },
        {
          family_member_id: member2Id,
          name: 'Jane Workout 1',
          duration_minutes: 60,
          notes: null,
          workout_date: '2024-01-17'
        }
      ])
      .execute();

    const input: GetWorkoutsByMemberInput = {
      family_member_id: member1Id
    };

    const result = await getWorkoutsByMember(input);

    expect(result).toHaveLength(2);
    result.forEach(workout => {
      expect(workout.family_member_id).toEqual(member1Id);
      expect(workout.name).toMatch(/John Workout/);
    });
  });

  it('should throw error when family member does not exist', async () => {
    const input: GetWorkoutsByMemberInput = {
      family_member_id: 999 // Non-existent ID
    };

    expect(getWorkoutsByMember(input)).rejects.toThrow(/Family member with id 999 not found/i);
  });

  it('should handle workout dates correctly', async () => {
    // Create family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values(testFamilyMember)
      .returning()
      .execute();

    const memberId = familyMemberResult[0].id;

    // Create workout with specific date (string format for database)
    await db.insert(workoutsTable)
      .values({
        family_member_id: memberId,
        name: 'Test Workout',
        duration_minutes: 30,
        notes: 'Test notes',
        workout_date: '2024-03-15'
      })
      .execute();

    const input: GetWorkoutsByMemberInput = {
      family_member_id: memberId
    };

    const result = await getWorkoutsByMember(input);

    expect(result).toHaveLength(1);
    expect(result[0].workout_date).toBeInstanceOf(Date);
    expect(result[0].workout_date.getFullYear()).toEqual(2024);
    expect(result[0].workout_date.getMonth()).toEqual(2); // March is month 2 (0-indexed)
    expect(result[0].workout_date.getDate()).toEqual(15);
  });
});
