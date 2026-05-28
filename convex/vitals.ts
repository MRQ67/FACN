import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    return await ctx.db
      .query("vitals")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    bloodPressure: v.string(),
    glucose: v.optional(v.number()),
    heartRate: v.optional(v.number()),
    oxygenSat: v.optional(v.number()),
    temp: v.optional(v.number()),
    notes: v.optional(v.string()),
    triageResult: v.optional(v.string()),
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
    if (user.role !== "NURSE") throw new ConvexError("Must be a nurse");

    const nurse = await ctx.db
      .query("nurses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!nurse) throw new ConvexError("Nurse profile not found");

    const vitalsId = await ctx.db.insert("vitals", {
      patientId: args.patientId,
      nurseId: nurse._id,
      bloodPressure: args.bloodPressure,
      glucose: args.glucose,
      heartRate: args.heartRate,
      oxygenSat: args.oxygenSat,
      temp: args.temp,
      notes: args.notes,
      triageResult: args.triageResult,
    });

    return await ctx.db.get("vitals", vitalsId);
  },
});
