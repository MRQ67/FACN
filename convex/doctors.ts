import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "DOCTOR"))
      .collect();
  },
});

export const listAvailable = query({
  args: { 
    specialty: v.optional(v.string()),
    hospitalId: v.optional(v.id("hospitals")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let doctors;
    const hospitalId = args.hospitalId;
    if (hospitalId) {
      doctors = await ctx.db
        .query("doctors")
        .withIndex("by_hospitalId", (q) => q.eq("hospitalId", hospitalId))
        .filter((q) => q.eq(q.field("isAvailable"), true))
        .take(50);
    } else {
      doctors = await ctx.db
        .query("doctors")
        .withIndex("by_isAvailable", (q) => q.eq("isAvailable", true))
        .take(50);
    }

    if (args.specialty) {
      const term = args.specialty.toLowerCase();
      doctors = doctors.filter((d) =>
        d.specialty.toLowerCase().includes(term),
      );
    }

    const result = [];
    for (const doctor of doctors) {
      const user = await ctx.db.get(doctor.userId);
      const hospital = await ctx.db.get(doctor.hospitalId);
      if (!user || !hospital) continue;
      result.push({
        id: doctor._id,
        _id: doctor._id,
        user: { id: user._id, name: user.name, phone: user.phone },
        specialty: doctor.specialty,
        isAvailable: doctor.isAvailable,
        hospital: { id: hospital._id, name: hospital.name, location: hospital.location },
        waitTime: "15 min",
        waitMinutes: 15,
        nextAvailableSlot: null,
      });
    }

    return result;
  },
});

export const getById = query({
  args: { doctorId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db.get(args.doctorId);
    if (!user) return null;

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!doctor) return null;

    const hospital = await ctx.db.get(doctor.hospitalId);

    return { doctor, user, hospital };
  },
});

export const updateLocation = mutation({
  args: { lat: v.number(), lng: v.number() },
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
    if (user.role !== "DOCTOR") throw new ConvexError("Not a doctor");

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!doctor) throw new ConvexError("Doctor profile not found");

    await ctx.db.patch(doctor._id, {
      lastLat: args.lat,
      lastLng: args.lng,
    });

    return { ...doctor, lastLat: args.lat, lastLng: args.lng };
  },
});

export const toggleAvailability = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new ConvexError("User not found");
    if (user.role !== "DOCTOR") throw new ConvexError("Not a doctor");

    let doctor = await ctx.db
      .query("doctors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!doctor) {
      // Create a default doctor profile if it doesn't exist
      // We'll use the first hospital found as a default for now
      const hospital = await ctx.db.query("hospitals").first();
      if (!hospital) throw new ConvexError("No hospitals found in system");

      const doctorId = await ctx.db.insert("doctors", {
        userId: user._id,
        specialty: "General Medicine",
        hospitalId: hospital._id,
        licenseNumber: "PENDING",
        isAvailable: true,
      });
      return { _id: doctorId, isAvailable: true };
    }

    await ctx.db.patch(doctor._id, {
      isAvailable: !doctor.isAvailable,
    });

    return { ...doctor, isAvailable: !doctor.isAvailable };
  },
});
