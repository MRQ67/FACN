import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getMyPatient = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return null;

    if (user.role !== "PATIENT") return null;

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return patient ?? null;
  },
});

export const listPatients = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    const allowedRoles = ["DOCTOR", "NURSE", "ADMIN", "RURAL_HO"];
    if (!allowedRoles.includes(user.role)) return [];

    let patientUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "PATIENT"))
      .take(50);

    if (args.search) {
      const term = args.search.toLowerCase();
      patientUsers = patientUsers.filter((u) =>
        u.name.toLowerCase().includes(term),
      );
    }

    const result = [];
    for (const patientUser of patientUsers) {
      const patient = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", patientUser._id))
        .unique();
      if (patient) {
        result.push({
          id: patient._id,
          userId: patientUser._id,
          dateOfBirth: patient.dateOfBirth,
          bloodType: patient.bloodType,
          chronicConditions: patient.chronicConditions,
          user: {
            id: patientUser._id,
            name: patientUser.name,
            phone: patientUser.phone,
            email: patientUser.email,
          },
        });
      }
    }

    return result;
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return patient ?? null;
  },
});
