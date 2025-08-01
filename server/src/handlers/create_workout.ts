
import { db } from '../db';
import { workoutsTable, familyMembersTable } from '../db/schema';
import { type CreateWorkoutInput, type Workout } from '../schema';
import { eq } from 'drizzle-orm';

export const createWorkout = async (input: CreateWorkoutInput): Promise<Workout> => {
  try {
    // Verify that the family member exists
    const familyMember = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.family_member_id))
      .execute();

    if (familyMember.length === 0) {
      throw new Error(`Family member with id ${input.family_member_id} does not exist`);
    }

    // Insert workout record - convert Date to string for date column
    const result = await db.insert(workoutsTable)
      .values({
        family_member_id: input.family_member_id,
        name: input.name,
        duration_minutes: input.duration_minutes,
        notes: input.notes,
        workout_date: input.workout_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    // Convert workout_date string back to Date before returning
    const workout = result[0];
    return {
      ...workout,
      workout_date: new Date(workout.workout_date)
    };
  } catch (error) {
    console.error('Workout creation failed:', error);
    throw error;
  }
};
