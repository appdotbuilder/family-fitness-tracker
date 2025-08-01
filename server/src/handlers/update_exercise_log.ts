
import { db } from '../db';
import { exerciseLogsTable } from '../db/schema';
import { type UpdateExerciseLogInput, type ExerciseLog } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExerciseLog = async (input: UpdateExerciseLogInput): Promise<ExerciseLog> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};

    if (input.equipment_id !== undefined) {
      updateData['equipment_id'] = input.equipment_id;
    }
    if (input.exercise_name !== undefined) {
      updateData['exercise_name'] = input.exercise_name;
    }
    if (input.sets !== undefined) {
      updateData['sets'] = input.sets;
    }
    if (input.repetitions !== undefined) {
      updateData['repetitions'] = input.repetitions;
    }
    if (input.weight_lbs !== undefined) {
      updateData['weight_lbs'] = input.weight_lbs ? input.weight_lbs.toString() : null;
    }
    if (input.notes !== undefined) {
      updateData['notes'] = input.notes;
    }

    // Update exercise log record
    const result = await db.update(exerciseLogsTable)
      .set(updateData)
      .where(eq(exerciseLogsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Exercise log with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const exerciseLog = result[0];
    return {
      ...exerciseLog,
      weight_lbs: exerciseLog.weight_lbs ? parseFloat(exerciseLog.weight_lbs) : null
    };
  } catch (error) {
    console.error('Exercise log update failed:', error);
    throw error;
  }
};
