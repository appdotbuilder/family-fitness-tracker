
import { db } from '../db';
import { exerciseLogsTable } from '../db/schema';
import { type GetExerciseLogsByWorkoutInput, type ExerciseLog } from '../schema';
import { eq } from 'drizzle-orm';

export const getExerciseLogsByWorkout = async (input: GetExerciseLogsByWorkoutInput): Promise<ExerciseLog[]> => {
  try {
    const results = await db.select()
      .from(exerciseLogsTable)
      .where(eq(exerciseLogsTable.workout_id, input.workout_id))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(log => ({
      ...log,
      weight_lbs: log.weight_lbs ? parseFloat(log.weight_lbs) : null
    }));
  } catch (error) {
    console.error('Failed to get exercise logs by workout:', error);
    throw error;
  }
};
