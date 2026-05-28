import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    role: v.union(
      v.literal("PATIENT"),
      v.literal("NURSE"),
      v.literal("DOCTOR"),
      v.literal("RURAL_HO"),
      v.literal("ADMIN"),
    ),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    isVerified: v.boolean(),
    isApproved: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  patients: defineTable({
    userId: v.id("users"),
    dateOfBirth: v.number(),
    bloodType: v.optional(v.string()),
    chronicConditions: v.optional(v.string()),
    assignedNurseId: v.optional(v.id("nurses")),
  })
    .index("by_userId", ["userId"])
    .index("by_assignedNurse", ["assignedNurseId"]),

  doctors: defineTable({
    userId: v.id("users"),
    specialty: v.string(),
    hospitalId: v.id("hospitals"),
    licenseNumber: v.string(),
    isAvailable: v.boolean(),
    workingHours: v.optional(v.string()),
    lastLat: v.optional(v.number()),
    lastLng: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_hospitalId", ["hospitalId"])
    .index("by_licenseNumber", ["licenseNumber"])
    .index("by_isAvailable", ["isAvailable"]),

  nurses: defineTable({
    userId: v.id("users"),
    assignedZone: v.optional(v.string()),
    supervisorDoctorId: v.optional(v.id("doctors")),
  })
    .index("by_userId", ["userId"]),

  appointments: defineTable({
    patientId: v.id("patients"),
    doctorId: v.id("doctors"),
    scheduledAt: v.number(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
    ),
    type: v.union(v.literal("IN_PERSON"), v.literal("REMOTE")),
  })
    .index("by_patientId", ["patientId"])
    .index("by_doctorId", ["doctorId"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_status", ["status"]),

  vitals: defineTable({
    patientId: v.id("patients"),
    nurseId: v.id("nurses"),
    bloodPressure: v.string(),
    glucose: v.optional(v.number()),
    heartRate: v.optional(v.number()),
    oxygenSat: v.optional(v.number()),
    temp: v.optional(v.number()),
    notes: v.optional(v.string()),
    triageResult: v.optional(v.string()),
  })
    .index("by_patientId", ["patientId"])
    .index("by_nurseId", ["nurseId"]),

  prescriptions: defineTable({
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    medications: v.string(),
    notes: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    pharmacyId: v.optional(v.id("pharmacies")),
  })
    .index("by_doctorId", ["doctorId"])
    .index("by_patientId", ["patientId"])
    .index("by_pharmacyId", ["pharmacyId"]),

  consultations: defineTable({
    requesterId: v.id("users"),
    specialistId: v.optional(v.id("users")),
    status: v.string(),
    notes: v.optional(v.string()),
    endedAt: v.optional(v.number()),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_specialistId", ["specialistId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    isRead: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userAndRead", ["userId", "isRead"]),

  labResults: defineTable({
    patientId: v.id("patients"),
    doctorId: v.id("doctors"),
    testName: v.string(),
    resultValue: v.optional(v.string()),
    unit: v.optional(v.string()),
    status: v.string(),
    labName: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_patientId", ["patientId"])
    .index("by_doctorId", ["doctorId"])
    .index("by_status", ["status"]),

  hospitals: defineTable({
    name: v.string(),
    location: v.string(),
    totalDoctors: v.number(),
    availableDoctors: v.number(),
    specialties: v.string(),
  })
    .index("by_name", ["name"]),

  pharmacies: defineTable({
    name: v.string(),
    location: v.string(),
    phone: v.string(),
  })
    .index("by_name", ["name"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_action", ["action"]),
});
