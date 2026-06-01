import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByPatient = query({
  args: { patientId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("prescriptions")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    patientId: v.id("users"),
    medications: v.union(v.string(), v.array(v.string())),
    notes: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    pharmacyId: v.optional(v.id("pharmacies")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];
    if (user.role !== "DOCTOR") throw new ConvexError("Must be a doctor");

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!doctor) throw new ConvexError("Doctor profile not found");

    const medicationsString = Array.isArray(args.medications) 
      ? args.medications.join("\n") 
      : args.medications;

    const prescriptionId = await ctx.db.insert("prescriptions", {
      doctorId: user._id,
      patientId: args.patientId,
      medications: medicationsString,
      notes: args.notes,
      expiresAt: args.expiresAt,
      pharmacyId: args.pharmacyId,
    });

    return await ctx.db.get(prescriptionId);
  },
});

export const getPendingSignatureForDoctor = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const doctor = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();
    if (!doctor) return [];

    const prescriptions = await ctx.db
      .query("prescriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();

    return await Promise.all(
      prescriptions.map(async (p) => {
        const patient = await ctx.db.get(p.patientId);
        return { ...p, patientName: patient?.name ?? "Unknown" };
      })
    );
  },
});

export const sign = mutation({
  args: { id: v.id('prescriptions') },
  handler: async (ctx, args) => {
    return { success: true };
  },
});
