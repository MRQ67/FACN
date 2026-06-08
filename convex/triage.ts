import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getRecentForPatient = query({
  args: { patientId: v.id("users") },
  handler: async (ctx, args) => {
    const vitals = await ctx.db
      .query("vitals")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .first();

    if (!vitals) return null;

    return {
      severity: vitals.triageResult ?? "LOW",
      recommendation: vitals.notes ?? "Regular follow-up recommended.",
      _creationTime: vitals._creationTime,
    };
  },
});

export const getAllPendingForNurse = query({
  args: {},
  handler: async (ctx) => {
    const patients = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "PATIENT"))
      .order("desc")
      .take(10);

    const result = [];
    for (const p of patients) {
      const profile = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", p._id))
        .unique();
      
      const dob = profile?.dateOfBirth ?? 0;
      const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

      result.push({
        _id: p._id,
        name: p.name,
        age,
        complaint: "Awaiting assessment",
        severity: "UNASSESSED",
        _creationTime: p._creationTime,
      });
    }
    return result;
  },
});

export const storeTriageResult = mutation({
  args: {
    patientId: v.id("users"),
    triageResult: v.string(),
    symptoms: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    await ctx.db.insert("vitals", {
      patientId: args.patientId,
      nurseId: args.patientId,
      bloodPressure: "N/A",
      heartRate: 0,
      oxygenSat: 0,
      temp: 0,
      glucose: 0,
      triageResult: args.triageResult,
      notes: args.symptoms,
    });
  },
});

export const submit = mutation({
  args: {
    patientId: v.id("users"),
    complaint: v.string(),
    symptoms: v.array(v.string()),
    severity: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return { success: true };
  },
});
