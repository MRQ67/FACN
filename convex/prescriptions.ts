import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    return await ctx.db
      .query("prescriptions")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    medications: v.string(),
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

    const prescriptionId = await ctx.db.insert("prescriptions", {
      doctorId: doctor._id,
      patientId: args.patientId,
      medications: args.medications,
      notes: args.notes,
      expiresAt: args.expiresAt,
      pharmacyId: args.pharmacyId,
    });

    return await ctx.db.get("prescriptions", prescriptionId);
  },
});
