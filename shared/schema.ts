import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Status options for a parking space
export const SPACE_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance"
} as const;

// Parking spaces table
export const parkingSpaces = pgTable("parking_spaces", {
  id: serial("id").primaryKey(),
  spaceNumber: text("space_number").notNull().unique(), // e.g., "A-101"
  area: text("area").notNull(), // e.g., "A", "B", "C"
  status: text("status").notNull().$type<keyof typeof SPACE_STATUS>().default(SPACE_STATUS.AVAILABLE),
  notes: text("notes"),
});

// Insert schema for parking spaces
export const insertParkingSpaceSchema = createInsertSchema(parkingSpaces).omit({
  id: true,
});

// Households table
export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  householdNumber: text("household_number").notNull().unique(), // e.g., "1201"
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
});

// Insert schema for households
export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
});

// Rentals table
export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  parkingSpaceId: integer("parking_space_id").notNull(),
  householdId: integer("household_id").notNull(),
  licensePlate: text("license_plate").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schema for rentals
export const insertRentalSchema = createInsertSchema(rentals).omit({
  id: true,
  createdAt: true,
});

// Activity log table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(), // e.g., "NEW_RENTAL", "RENTAL_ENDED", "SPACE_UPDATED"
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  relatedId: integer("related_id"), // ID of the related entity (e.g., rental ID, space ID)
});

// Insert schema for activity logs
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Define the types
export type ParkingSpace = typeof parkingSpaces.$inferSelect;
export type InsertParkingSpace = z.infer<typeof insertParkingSpaceSchema>;

export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;

export type Rental = typeof rentals.$inferSelect;
export type InsertRental = z.infer<typeof insertRentalSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Extended schemas with additional validations for forms
export const parkingSpaceFormSchema = insertParkingSpaceSchema.extend({
  spaceNumber: z.string().min(1, "車位號碼不可為空 / Space number is required"),
  area: z.string().min(1, "區域不可為空 / Area is required"),
});

export const rentalFormSchema = insertRentalSchema.extend({
  startDate: z.coerce.date().min(new Date(new Date().setHours(0, 0, 0, 0)), "開始日期不能早於今天 / Start date cannot be in the past"),
  endDate: z.coerce.date(),
  licensePlate: z.string().min(1, "車牌號碼不可為空 / License plate is required"),
}).refine((data) => data.endDate > data.startDate, {
  message: "結束日期必須在開始日期之後 / End date must be after start date",
  path: ["endDate"],
});

export const householdFormSchema = insertHouseholdSchema.extend({
  householdNumber: z.string().min(1, "戶號不可為空 / Household number is required"),
});
