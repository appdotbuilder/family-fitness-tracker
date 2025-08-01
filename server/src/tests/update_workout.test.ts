
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, workoutsTable } from '../db/schema';
import { type UpdateWorkoutInput } from '../schema';
import { updateWorkout } from '../handlers/update_workout';
import { eq } from 'drizzle-orm';

describe('updateWorkout', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testFamilyMemberId: number;
  let testWorkoutId: number;

  beforeEach(async () => {
    // Create a family member first
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        age: 30
      })
      .returning()
      .execute();
    
    testFamilyMemberId = familyMemberResult[0].id;

    // Create a workout to update - workout_date expects string format
    const workoutResult = await db.insert(workoutsTable)
      .values({
        family_member_id: testFamilyMemberId,
        name: 'Original Workout',
        duration_minutes: 60,
        notes: 'Original notes',
        workout_date: '2024-01-01'
      })
      .returning()
      .execute();
    
    testWorkoutId = workoutResult[0].id;
  });

  it('should update workout name', async () => {
    const input: UpdateWorkoutInput = {
      id: testWorkoutId,
      name: 'Updated Workout Name'
    };

    const result = await updateWorkout(input);

    expect(result.id).toEqual(testWorkoutId);
    expect(result.name).toEqual('Updated Workout Name');
    expect(result.family_member_id).toEqual(testFamilyMemberId);
    expect(result.duration_minutes).toEqual(60); // Should remain unchanged
    expect(result.notes).toEqual('Original notes'); // Should remain unchanged
    expect(result.workout_date).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const newDate = new Date('2024-02-01');
    const input: UpdateWorkoutInput = {
      id: testWorkoutId,
      name: 'New Name',
      duration_minutes: 90,
      notes: 'Updated notes',
      workout_date: newDate
    };

    const result = await updateWorkout(input);

    expect(result.name).toEqual('New Name');
    expect(result.duration_minutes).toEqual(90);
    expect(result.notes).toEqual('Updated notes');
    expect(result.workout_date).toEqual(newDate);
  });

  it('should handle nullable fields', async () => {
    const input: UpdateWorkoutInput = {
      id: testWorkoutId,
      duration_minutes: null,
      notes: null
    };

    const result = await updateWorkout(input);

    expect(result.duration_minutes).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.name).toEqual('Original Workout'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateWorkoutInput = {
      id: testWorkoutId,
      name: 'Database Test',
      duration_minutes: 45
    };

    await updateWorkout(input);

    // Verify changes were persisted
    const workouts = await db.select()
      .from(workoutsTable)
      .where(eq(workoutsTable.id, testWorkoutId))
      .execute();

    expect(workouts).toHaveLength(1);
    expect(workouts[0].name).toEqual('Database Test');
    expect(workouts[0].duration_minutes).toEqual(45);
    expect(workouts[0].notes).toEqual('Original notes'); // Should remain unchanged
  });

  it('should throw error for non-existent workout', async () => {
    const input: UpdateWorkoutInput = {
      id: 99999,
      name: 'Non-existent'
    };

    expect(updateWorkout(input)).rejects.toThrow(/not found/i);
  });

  it('should preserve unchanged fields', async () => {
    const input: UpdateWorkoutInput = {
      id: testWorkoutId,
      name: 'Only Name Changed'
    };

    const result = await updateWorkout(input);

    expect(result.name).toEqual('Only Name Changed');
    expect(result.family_member_id).toEqual(testFamilyMemberId);
    expect(result.duration_minutes).toEqual(60);
    expect(result.notes).toEqual('Original notes');
    expect(result.workout_date).toEqual(new Date('2024-01-01'));
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
