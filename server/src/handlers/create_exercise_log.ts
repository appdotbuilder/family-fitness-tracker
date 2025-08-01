
import { db } from '../db';
import { exerciseLogsTable } from '../db/schema';
import { type CreateExerciseLogInput, type ExerciseLog } from '../schema';

export const createExerciseLog = async (input: CreateExerciseLogInput): Promise<ExerciseLog> => {
  try {
    // Insert exercise log record
    const result = await db.insert(exerciseLogsTable)
      .values({
        workout_id: input.workout_id,
        equipment_id: input.equipment_id,
        exercise_name: input.exercise_name,
        sets: input.sets,
        repetitions: input.repetitions,
        weight_lbs: input.weight_lbs ? input.weight_lbs.toString() : null, // Convert number to string for numeric column
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const exerciseLog = result[0];
    return {
      ...exerciseLog,
      weight_lbs: exerciseLog.weight_lbs ? parseFloat(exerciseLog.weight_lbs) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Exercise log creation failed:', error);
    throw error;
  }
};
