
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, workoutsTable, exerciseLogsTable, equipmentTable } from '../db/schema';
import { type UpdateExerciseLogInput } from '../schema';
import { updateExerciseLog } from '../handlers/update_exercise_log';
import { eq } from 'drizzle-orm';

describe('updateExerciseLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let familyMemberId: number;
  let workoutId: number;
  let exerciseLogId: number;
  let equipmentId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const familyMember = await db.insert(familyMembersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        age: 30
      })
      .returning()
      .execute();
    familyMemberId = familyMember[0].id;

    const workout = await db.insert(workoutsTable)
      .values({
        family_member_id: familyMemberId,
        name: 'Test Workout',
        duration_minutes: 60,
        notes: 'Test workout notes',
        workout_date: '2024-01-15'
      })
      .returning()
      .execute();
    workoutId = workout[0].id;

    const equipment = await db.insert(equipmentTable)
      .values({
        name: 'Dumbbells',
        description: 'Set of dumbbells',
        category: 'Weights'
      })
      .returning()
      .execute();
    equipmentId = equipment[0].id;

    const exerciseLog = await db.insert(exerciseLogsTable)
      .values({
        workout_id: workoutId,
        equipment_id: equipmentId,
        exercise_name: 'Original Exercise',
        sets: 3,
        repetitions: 10,
        weight_lbs: '50.00',
        notes: 'Original notes'
      })
      .returning()
      .execute();
    exerciseLogId = exerciseLog[0].id;
  });

  it('should update exercise log with all fields', async () => {
    const updateInput: UpdateExerciseLogInput = {
      id: exerciseLogId,
      equipment_id: null,
      exercise_name: 'Updated Exercise',
      sets: 4,
      repetitions: 12,
      weight_lbs: 60.5,
      notes: 'Updated notes'
    };

    const result = await updateExerciseLog(updateInput);

    expect(result.id).toEqual(exerciseLogId);
    expect(result.workout_id).toEqual(workoutId);
    expect(result.equipment_id).toBeNull();
    expect(result.exercise_name).toEqual('Updated Exercise');
    expect(result.sets).toEqual(4);
    expect(result.repetitions).toEqual(12);
    expect(result.weight_lbs).toEqual(60.5);
    expect(typeof result.weight_lbs).toBe('number');
    expect(result.notes).toEqual('Updated notes');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update exercise log with partial fields', async () => {
    const updateInput: UpdateExerciseLogInput = {
      id: exerciseLogId,
      exercise_name: 'Partially Updated Exercise',
      sets: 5
    };

    const result = await updateExerciseLog(updateInput);

    expect(result.id).toEqual(exerciseLogId);
    expect(result.workout_id).toEqual(workoutId);
    expect(result.equipment_id).toEqual(equipmentId); // Should remain unchanged
    expect(result.exercise_name).toEqual('Partially Updated Exercise');
    expect(result.sets).toEqual(5);
    expect(result.repetitions).toEqual(10); // Should remain unchanged
    expect(result.weight_lbs).toEqual(50); // Should remain unchanged
    expect(result.notes).toEqual('Original notes'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateExerciseLogInput = {
      id: exerciseLogId,
      exercise_name: 'Persisted Exercise',
      weight_lbs: 75.25
    };

    await updateExerciseLog(updateInput);

    const exerciseLogs = await db.select()
      .from(exerciseLogsTable)
      .where(eq(exerciseLogsTable.id, exerciseLogId))
      .execute();

    expect(exerciseLogs).toHaveLength(1);
    expect(exerciseLogs[0].exercise_name).toEqual('Persisted Exercise');
    expect(parseFloat(exerciseLogs[0].weight_lbs!)).toEqual(75.25);
    expect(exerciseLogs[0].sets).toEqual(3); // Unchanged
  });

  it('should handle null weight_lbs correctly', async () => {
    const updateInput: UpdateExerciseLogInput = {
      id: exerciseLogId,
      weight_lbs: null
    };

    const result = await updateExerciseLog(updateInput);

    expect(result.weight_lbs).toBeNull();

    // Verify in database
    const exerciseLogs = await db.select()
      .from(exerciseLogsTable)
      .where(eq(exerciseLogsTable.id, exerciseLogId))
      .execute();

    expect(exerciseLogs[0].weight_lbs).toBeNull();
  });

  it('should throw error for non-existent exercise log', async () => {
    const updateInput: UpdateExerciseLogInput = {
      id: 99999,
      exercise_name: 'Non-existent'
    };

    expect(updateExerciseLog(updateInput)).rejects.toThrow(/not found/i);
  });
});
