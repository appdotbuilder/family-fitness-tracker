
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutsTable, familyMembersTable } from '../db/schema';
import { type CreateWorkoutInput } from '../schema';
import { createWorkout } from '../handlers/create_workout';
import { eq } from 'drizzle-orm';

describe('createWorkout', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let familyMemberId: number;

  beforeEach(async () => {
    // Create a test family member first
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'Test Member',
        email: 'test@example.com',
        age: 25
      })
      .returning()
      .execute();
    
    familyMemberId = familyMemberResult[0].id;
  });

  const testInput: CreateWorkoutInput = {
    family_member_id: 0, // Will be set in test
    name: 'Morning Cardio',
    duration_minutes: 30,
    notes: 'High intensity workout',
    workout_date: new Date('2024-01-15')
  };

  it('should create a workout', async () => {
    const input = { ...testInput, family_member_id: familyMemberId };
    const result = await createWorkout(input);

    // Basic field validation
    expect(result.family_member_id).toEqual(familyMemberId);
    expect(result.name).toEqual('Morning Cardio');
    expect(result.duration_minutes).toEqual(30);
    expect(result.notes).toEqual('High intensity workout');
    expect(result.workout_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout to database', async () => {
    const input = { ...testInput, family_member_id: familyMemberId };
    const result = await createWorkout(input);

    // Query using proper drizzle syntax
    const workouts = await db.select()
      .from(workoutsTable)
      .where(eq(workoutsTable.id, result.id))
      .execute();

    expect(workouts).toHaveLength(1);
    expect(workouts[0].family_member_id).toEqual(familyMemberId);
    expect(workouts[0].name).toEqual('Morning Cardio');
    expect(workouts[0].duration_minutes).toEqual(30);
    expect(workouts[0].notes).toEqual('High intensity workout');
    expect(new Date(workouts[0].workout_date)).toEqual(new Date('2024-01-15'));
    expect(workouts[0].created_at).toBeInstanceOf(Date);
  });

  it('should create workout with nullable fields', async () => {
    const inputWithNulls: CreateWorkoutInput = {
      family_member_id: familyMemberId,
      name: 'Simple Workout',
      duration_minutes: null,
      notes: null,
      workout_date: new Date('2024-01-15')
    };

    const result = await createWorkout(inputWithNulls);

    expect(result.name).toEqual('Simple Workout');
    expect(result.duration_minutes).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.workout_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
  });

  it('should throw error for non-existent family member', async () => {
    const input = { ...testInput, family_member_id: 99999 };

    await expect(createWorkout(input)).rejects.toThrow(/family member.*does not exist/i);
  });

  it('should handle different workout dates correctly', async () => {
    const pastDate = new Date('2023-12-01');
    const futureDate = new Date('2024-12-31');

    const pastInput = { ...testInput, family_member_id: familyMemberId, workout_date: pastDate };
    const futureInput = { ...testInput, family_member_id: familyMemberId, workout_date: futureDate };

    const pastResult = await createWorkout(pastInput);
    const futureResult = await createWorkout(futureInput);

    expect(pastResult.workout_date).toEqual(pastDate);
    expect(futureResult.workout_date).toEqual(futureDate);
  });
});
