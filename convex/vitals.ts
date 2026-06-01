import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByPatient = query({
  args: { patientId: v.id("users") },
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
    patientId: v.id("users"),
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

    if (!user) throw new ConvexError("User not found");

    const vitalsId = await ctx.db.insert("vitals", {
      patientId: args.patientId,
      nurseId: user._id,
      bloodPressure: args.bloodPressure,
      glucose: args.glucose,
      heartRate: args.heartRate,
      oxygenSat: args.oxygenSat,
      temp: args.temp,
      notes: args.notes,
      triageResult: args.triageResult,
    });

    return await ctx.db.get(vitalsId);
  },
});

// TODO: implement api.vitals.getOverduePatients
export const getOverduePatients = query({
  args: {},
  handler: async (ctx) => {
    return [];
  },
});

// TODO: implement api.vitals.record
export const record = mutation({
  args: {
    patientId: v.id('users'),
    temperature: v.number(),
    bpSystolic: v.number(),
    bpDiastolic: v.number(),
    heartRate: v.number(),
    oxSaturation: v.number(),
    respRate: v.number(),
    weight: v.number(),
    notes: v.optional(v.string()),
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

    if (!user) throw new ConvexError("User not found");

    const vitalsId = await ctx.db.insert("vitals", {
      patientId: args.patientId,
      nurseId: user._id,
      bloodPressure: `${args.bpSystolic}/${args.bpDiastolic}`,
      temp: args.temperature,
      heartRate: args.heartRate,
      oxygenSat: args.oxSaturation,
      notes: args.notes,
      // Map other fields if possible, or skip if not in schema
    });

    return await ctx.db.get(vitalsId);
  },
});
