
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, workoutsTable, exerciseLogsTable, equipmentTable } from '../db/schema';
import { type GetExerciseLogsByWorkoutInput } from '../schema';
import { getExerciseLogsByWorkout } from '../handlers/get_exercise_logs_by_workout';

describe('getExerciseLogsByWorkout', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return exercise logs for a specific workout', async () => {
    // Create family member first
    const [familyMember] = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      })
      .returning()
      .execute();

    // Create equipment
    const [equipment] = await db.insert(equipmentTable)
      .values({
        name: 'Dumbbells',
        description: 'Set of dumbbells',
        category: 'Weights'
      })
      .returning()
      .execute();

    // Create workout
    const [workout] = await db.insert(workoutsTable)
      .values({
        family_member_id: familyMember.id,
        name: 'Upper Body Workout',
        duration_minutes: 45,
        notes: 'Focus on chest and arms',
        workout_date: '2024-01-15'
      })
      .returning()
      .execute();

    // Create exercise logs for this workout
    const exerciseLogData = [
      {
        workout_id: workout.id,
        equipment_id: equipment.id,
        exercise_name: 'Bench Press',
        sets: 3,
        repetitions: 10,
        weight_lbs: '135.50',
        notes: 'Good form'
      },
      {
        workout_id: workout.id,
        equipment_id: equipment.id,
        exercise_name: 'Bicep Curls',
        sets: 3,
        repetitions: 12,
        weight_lbs: '25.00',
        notes: null
      },
      {
        workout_id: workout.id,
        equipment_id: null,
        exercise_name: 'Push-ups',
        sets: 2,
        repetitions: 15,
        weight_lbs: null,
        notes: 'Bodyweight exercise'
      }
    ];

    await db.insert(exerciseLogsTable)
      .values(exerciseLogData)
      .execute();

    // Test the handler
    const input: GetExerciseLogsByWorkoutInput = {
      workout_id: workout.id
    };

    const result = await getExerciseLogsByWorkout(input);

    // Should return all 3 exercise logs
    expect(result).toHaveLength(3);

    // Check first exercise log
    const benchPress = result.find(log => log.exercise_name === 'Bench Press');
    expect(benchPress).toBeDefined();
    expect(benchPress!.workout_id).toEqual(workout.id);
    expect(benchPress!.equipment_id).toEqual(equipment.id);
    expect(benchPress!.sets).toEqual(3);
    expect(benchPress!.repetitions).toEqual(10);
    expect(benchPress!.weight_lbs).toEqual(135.50);
    expect(typeof benchPress!.weight_lbs).toBe('number');
    expect(benchPress!.notes).toEqual('Good form');
    expect(benchPress!.created_at).toBeInstanceOf(Date);

    // Check exercise log with null weight
    const pushUps = result.find(log => log.exercise_name === 'Push-ups');
    expect(pushUps).toBeDefined();
    expect(pushUps!.equipment_id).toBeNull();
    expect(pushUps!.weight_lbs).toBeNull();
    expect(pushUps!.notes).toEqual('Bodyweight exercise');
  });

  it('should return empty array when workout has no exercise logs', async () => {
    // Create family member first
    const [familyMember] = await db.insert(familyMembersTable)
      .values({
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25
      })
      .returning()
      .execute();

    // Create workout with no exercise logs
    const [workout] = await db.insert(workoutsTable)
      .values({
        family_member_id: familyMember.id,
        name: 'Empty Workout',
        duration_minutes: 30,
        notes: 'No exercises logged',
        workout_date: '2024-01-16'
      })
      .returning()
      .execute();

    const input: GetExerciseLogsByWorkoutInput = {
      workout_id: workout.id
    };

    const result = await getExerciseLogsByWorkout(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent workout', async () => {
    const input: GetExerciseLogsByWorkoutInput = {
      workout_id: 99999 // Non-existent workout ID
    };

    const result = await getExerciseLogsByWorkout(input);

    expect(result).toHaveLength(0);
  });

  it('should handle exercise logs with different weight values correctly', async () => {
    // Create family member
    const [familyMember] = await db.insert(familyMembersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        age: 28
      })
      .returning()
      .execute();

    // Create workout
    const [workout] = await db.insert(workoutsTable)
      .values({
        family_member_id: familyMember.id,
        name: 'Weight Test Workout',
        duration_minutes: 60,
        notes: 'Testing different weights',
        workout_date: '2024-01-17'
      })
      .returning()
      .execute();

    // Create exercise logs with various weight formats
    const exerciseLogData = [
      {
        workout_id: workout.id,
        equipment_id: null,
        exercise_name: 'Light Exercise',
        sets: 1,
        repetitions: 5,
        weight_lbs: '0.50', // Fractional weight
        notes: null
      },
      {
        workout_id: workout.id,
        equipment_id: null,
        exercise_name: 'Heavy Exercise',
        sets: 1,
        repetitions: 5,
        weight_lbs: '999.99', // Large weight
        notes: null
      }
    ];

    await db.insert(exerciseLogsTable)
      .values(exerciseLogData)
      .execute();

    const input: GetExerciseLogsByWorkoutInput = {
      workout_id: workout.id
    };

    const result = await getExerciseLogsByWorkout(input);

    expect(result).toHaveLength(2);

    const lightExercise = result.find(log => log.exercise_name === 'Light Exercise');
    expect(lightExercise!.weight_lbs).toEqual(0.5);
    expect(typeof lightExercise!.weight_lbs).toBe('number');

    const heavyExercise = result.find(log => log.exercise_name === 'Heavy Exercise');
    expect(heavyExercise!.weight_lbs).toEqual(999.99);
    expect(typeof heavyExercise!.weight_lbs).toBe('number');
  });
});
