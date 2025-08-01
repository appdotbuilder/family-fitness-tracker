
import { z } from 'zod';

// Family Member schema
export const familyMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  age: z.number().int().nullable(),
  created_at: z.coerce.date()
});

export type FamilyMember = z.infer<typeof familyMemberSchema>;

// Equipment schema
export const equipmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Equipment = z.infer<typeof equipmentSchema>;

// Workout schema
export const workoutSchema = z.object({
  id: z.number(),
  family_member_id: z.number(),
  name: z.string(),
  duration_minutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  workout_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Workout = z.infer<typeof workoutSchema>;

// Exercise Log schema
export const exerciseLogSchema = z.object({
  id: z.number(),
  workout_id: z.number(),
  equipment_id: z.number().nullable(),
  exercise_name: z.string(),
  sets: z.number().int(),
  repetitions: z.number().int(),
  weight_lbs: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ExerciseLog = z.infer<typeof exerciseLogSchema>;

// Input schemas for creating entities
export const createFamilyMemberInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable(),
  age: z.number().int().positive().nullable()
});

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberInputSchema>;

export const createEquipmentInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable()
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentInputSchema>;

export const createWorkoutInputSchema = z.object({
  family_member_id: z.number(),
  name: z.string().min(1),
  duration_minutes: z.number().int().positive().nullable(),
  notes: z.string().nullable(),
  workout_date: z.coerce.date()
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutInputSchema>;

export const createExerciseLogInputSchema = z.object({
  workout_id: z.number(),
  equipment_id: z.number().nullable(),
  exercise_name: z.string().min(1),
  sets: z.number().int().positive(),
  repetitions: z.number().int().positive(),
  weight_lbs: z.number().positive().nullable(),
  notes: z.string().nullable()
});

export type CreateExerciseLogInput = z.infer<typeof createExerciseLogInputSchema>;

// Update schemas
export const updateFamilyMemberInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  age: z.number().int().positive().nullable().optional()
});

export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberInputSchema>;

export const updateEquipmentInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional()
});

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentInputSchema>;

export const updateWorkoutInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  workout_date: z.coerce.date().optional()
});

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutInputSchema>;

export const updateExerciseLogInputSchema = z.object({
  id: z.number(),
  equipment_id: z.number().nullable().optional(),
  exercise_name: z.string().min(1).optional(),
  sets: z.number().int().positive().optional(),
  repetitions: z.number().int().positive().optional(),
  weight_lbs: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateExerciseLogInput = z.infer<typeof updateExerciseLogInputSchema>;

// Query parameter schemas
export const getWorkoutsByMemberInputSchema = z.object({
  family_member_id: z.number()
});

export type GetWorkoutsByMemberInput = z.infer<typeof getWorkoutsByMemberInputSchema>;

export const getExerciseLogsByWorkoutInputSchema = z.object({
  workout_id: z.number()
});

export type GetExerciseLogsByWorkoutInput = z.infer<typeof getExerciseLogsByWorkoutInputSchema>;
