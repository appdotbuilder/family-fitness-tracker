
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, workoutsTable, equipmentTable, exerciseLogsTable } from '../db/schema';
import { type CreateExerciseLogInput } from '../schema';
import { createExerciseLog } from '../handlers/create_exercise_log';
import { eq } from 'drizzle-orm';

describe('createExerciseLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let familyMemberId: number;
  let workoutId: number;
  let equipmentId: number;

  beforeEach(async () => {
    // Create prerequisite family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      })
      .returning()
      .execute();
    familyMemberId = familyMemberResult[0].id;

    // Create prerequisite workout
    const workoutResult = await db.insert(workoutsTable)
      .values({
        family_member_id: familyMemberId,
        name: 'Test Workout',
        duration_minutes: 60,
        workout_date: '2024-01-15'
      })
      .returning()
      .execute();
    workoutId = workoutResult[0].id;

    // Create prerequisite equipment
    const equipmentResult = await db.insert(equipmentTable)
      .values({
        name: 'Test Equipment',
        description: 'Equipment for testing',
        category: 'Weights'
      })
      .returning()
      .execute();
    equipmentId = equipmentResult[0].id;
  });

  it('should create an exercise log with all fields', async () => {
    const testInput: CreateExerciseLogInput = {
      workout_id: workoutId,
      equipment_id: equipmentId,
      exercise_name: 'Bench Press',
      sets: 3,
      repetitions: 10,
      weight_lbs: 135.5,
      notes: 'Good form maintained'
    };

    const result = await createExerciseLog(testInput);

    // Basic field validation
    expect(result.workout_id).toEqual(workoutId);
    expect(result.equipment_id).toEqual(equipmentId);
    expect(result.exercise_name).toEqual('Bench Press');
    expect(result.sets).toEqual(3);
    expect(result.repetitions).toEqual(10);
    expect(result.weight_lbs).toEqual(135.5);
    expect(typeof result.weight_lbs).toEqual('number');
    expect(result.notes).toEqual('Good form maintained');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an exercise log with nullable fields as null', async () => {
    const testInput: CreateExerciseLogInput = {
      workout_id: workoutId,
      equipment_id: null,
      exercise_name: 'Bodyweight Squats',
      sets: 4,
      repetitions: 15,
      weight_lbs: null,
      notes: null
    };

    const result = await createExerciseLog(testInput);

    expect(result.workout_id).toEqual(workoutId);
    expect(result.equipment_id).toBeNull();
    expect(result.exercise_name).toEqual('Bodyweight Squats');
    expect(result.sets).toEqual(4);
    expect(result.repetitions).toEqual(15);
    expect(result.weight_lbs).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save exercise log to database', async () => {
    const testInput: CreateExerciseLogInput = {
      workout_id: workoutId,
      equipment_id: equipmentId,
      exercise_name: 'Deadlift',
      sets: 5,
      repetitions: 5,
      weight_lbs: 225.75,
      notes: 'Personal record!'
    };

    const result = await createExerciseLog(testInput);

    // Query using proper drizzle syntax
    const exerciseLogs = await db.select()
      .from(exerciseLogsTable)
      .where(eq(exerciseLogsTable.id, result.id))
      .execute();

    expect(exerciseLogs).toHaveLength(1);
    expect(exerciseLogs[0].workout_id).toEqual(workoutId);
    expect(exerciseLogs[0].equipment_id).toEqual(equipmentId);
    expect(exerciseLogs[0].exercise_name).toEqual('Deadlift');
    expect(exerciseLogs[0].sets).toEqual(5);
    expect(exerciseLogs[0].repetitions).toEqual(5);
    expect(parseFloat(exerciseLogs[0].weight_lbs!)).toEqual(225.75);
    expect(exerciseLogs[0].notes).toEqual('Personal record!');
    expect(exerciseLogs[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal weights correctly', async () => {
    const testInput: CreateExerciseLogInput = {
      workout_id: workoutId,
      equipment_id: equipmentId,
      exercise_name: 'Dumbbell Curls',
      sets: 3,
      repetitions: 12,
      weight_lbs: 22.5,
      notes: null
    };

    const result = await createExerciseLog(testInput);

    expect(result.weight_lbs).toEqual(22.5);
    expect(typeof result.weight_lbs).toEqual('number');

    // Verify in database
    const exerciseLogs = await db.select()
      .from(exerciseLogsTable)
      .where(eq(exerciseLogsTable.id, result.id))
      .execute();

    expect(parseFloat(exerciseLogs[0].weight_lbs!)).toEqual(22.5);
  });
});
