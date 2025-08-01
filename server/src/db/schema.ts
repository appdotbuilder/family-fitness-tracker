
import { serial, text, pgTable, timestamp, integer, numeric, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const familyMembersTable = pgTable('family_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Nullable by default
  age: integer('age'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentTable = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  category: text('category'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutsTable = pgTable('workouts', {
  id: serial('id').primaryKey(),
  family_member_id: integer('family_member_id').notNull(),
  name: text('name').notNull(),
  duration_minutes: integer('duration_minutes'), // Nullable by default
  notes: text('notes'), // Nullable by default
  workout_date: date('workout_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const exerciseLogsTable = pgTable('exercise_logs', {
  id: serial('id').primaryKey(),
  workout_id: integer('workout_id').notNull(),
  equipment_id: integer('equipment_id'), // Nullable by default
  exercise_name: text('exercise_name').notNull(),
  sets: integer('sets').notNull(),
  repetitions: integer('repetitions').notNull(),
  weight_lbs: numeric('weight_lbs', { precision: 6, scale: 2 }), // Nullable by default
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const familyMembersRelations = relations(familyMembersTable, ({ many }) => ({
  workouts: many(workoutsTable),
}));

export const workoutsRelations = relations(workoutsTable, ({ one, many }) => ({
  familyMember: one(familyMembersTable, {
    fields: [workoutsTable.family_member_id],
    references: [familyMembersTable.id],
  }),
  exerciseLogs: many(exerciseLogsTable),
}));

export const exerciseLogsRelations = relations(exerciseLogsTable, ({ one }) => ({
  workout: one(workoutsTable, {
    fields: [exerciseLogsTable.workout_id],
    references: [workoutsTable.id],
  }),
  equipment: one(equipmentTable, {
    fields: [exerciseLogsTable.equipment_id],
    references: [equipmentTable.id],
  }),
}));

export const equipmentRelations = relations(equipmentTable, ({ many }) => ({
  exerciseLogs: many(exerciseLogsTable),
}));

// TypeScript types for the table schemas
export type FamilyMember = typeof familyMembersTable.$inferSelect;
export type NewFamilyMember = typeof familyMembersTable.$inferInsert;

export type Equipment = typeof equipmentTable.$inferSelect;
export type NewEquipment = typeof equipmentTable.$inferInsert;

export type Workout = typeof workoutsTable.$inferSelect;
export type NewWorkout = typeof workoutsTable.$inferInsert;

export type ExerciseLog = typeof exerciseLogsTable.$inferSelect;
export type NewExerciseLog = typeof exerciseLogsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  familyMembers: familyMembersTable,
  equipment: equipmentTable,
  workouts: workoutsTable,
  exerciseLogs: exerciseLogsTable,
};
