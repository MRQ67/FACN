import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    return await ctx.db
      .query("labResults")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    testName: v.string(),
    resultValue: v.optional(v.string()),
    unit: v.optional(v.string()),
    status: v.string(),
    labName: v.optional(v.string()),
    completedAt: v.optional(v.number()),
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

    const labResultId = await ctx.db.insert("labResults", {
      patientId: args.patientId,
      doctorId: doctor._id,
      testName: args.testName,
      resultValue: args.resultValue,
      unit: args.unit,
      status: args.status,
      labName: args.labName,
      completedAt: args.completedAt,
    });

    return await ctx.db.get("labResults", labResultId);
  },
});
