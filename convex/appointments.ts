import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listMy = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    let appointments;
    if (user.role === "PATIENT") {
      const patient = await ctx.db
        .query("patients")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!patient) return [];

      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
        .take(50);
    } else if (user.role === "DOCTOR") {
      const doctor = await ctx.db
        .query("doctors")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!doctor) return [];

      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
        .take(50);
    } else {
      return [];
    }

    const result = [];
    for (const apt of appointments) {
      const doctor = await ctx.db.get("doctors", apt.doctorId);
      const patient = await ctx.db.get("patients", apt.patientId);
      if (!doctor || !patient) continue;

      const doctorUser = await ctx.db.get("users", doctor.userId);
      const patientUser = await ctx.db.get("users", patient.userId);
      if (!doctorUser || !patientUser) continue;

      result.push({
        id: apt._id,
        _id: apt._id,
        _creationTime: apt._creationTime,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        scheduledAt: apt.scheduledAt,
        status: apt.status,
        type: apt.type,
        doctor: {
          id: doctor._id,
          userId: doctor.userId,
          specialty: doctor.specialty,
          hospitalId: doctor.hospitalId,
          isAvailable: doctor.isAvailable,
          workingHours: doctor.workingHours,
          lastLat: doctor.lastLat,
          lastLng: doctor.lastLng,
          user: {
            id: doctorUser._id,
            name: doctorUser.name,
            phone: doctorUser.phone,
            email: doctorUser.email,
            role: doctorUser.role,
          },
        },
        patient: {
          id: patient._id,
          userId: patient.userId,
          dateOfBirth: patient.dateOfBirth,
          bloodType: patient.bloodType,
          chronicConditions: patient.chronicConditions,
          user: {
            id: patientUser._id,
            name: patientUser.name,
            phone: patientUser.phone,
            email: patientUser.email,
            role: patientUser.role,
          },
        },
      });
    }

    return result;
  },
});

export const create = mutation({
  args: {
    doctorId: v.id("doctors"),
    scheduledAt: v.number(),
    type: v.union(v.literal("IN_PERSON"), v.literal("REMOTE")),
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
    if (user.role !== "PATIENT") throw new ConvexError("Must be a patient");

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!patient) throw new ConvexError("Patient profile not found");

    const appointmentId = await ctx.db.insert("appointments", {
      patientId: patient._id,
      doctorId: args.doctorId,
      scheduledAt: args.scheduledAt,
      status: "PENDING",
      type: args.type,
    });

    return await ctx.db.get("appointments", appointmentId);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("appointments"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
    ),
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

    const appointment = await ctx.db.get("appointments", args.id);
    if (!appointment) throw new ConvexError("Appointment not found");

    await ctx.db.patch("appointments", args.id, { status: args.status });

    return { ...appointment, status: args.status };
  },
});
