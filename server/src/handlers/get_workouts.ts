
import { db } from '../db';
import { workoutsTable } from '../db/schema';
import { type Workout } from '../schema';

export const getWorkouts = async (): Promise<Workout[]> => {
  try {
    const results = await db.select()
      .from(workoutsTable)
      .execute();

    // Convert workout_date strings to Date objects to match schema
    return results.map(workout => ({
      ...workout,
      workout_date: new Date(workout.workout_date)
    }));
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    throw error;
  }
};
