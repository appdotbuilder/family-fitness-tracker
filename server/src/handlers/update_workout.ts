
import { db } from '../db';
import { workoutsTable } from '../db/schema';
import { type UpdateWorkoutInput, type Workout } from '../schema';
import { eq } from 'drizzle-orm';

export const updateWorkout = async (input: UpdateWorkoutInput): Promise<Workout> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.duration_minutes !== undefined) {
      updateData.duration_minutes = input.duration_minutes;
    }
    
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    
    if (input.workout_date !== undefined) {
      updateData.workout_date = input.workout_date;
    }

    // Update the workout
    const result = await db.update(workoutsTable)
      .set(updateData)
      .where(eq(workoutsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Workout with id ${input.id} not found`);
    }

    // Convert workout_date from string to Date for return type
    const workout = result[0];
    return {
      ...workout,
      workout_date: new Date(workout.workout_date)
    };
  } catch (error) {
    console.error('Workout update failed:', error);
    throw error;
  }
};
