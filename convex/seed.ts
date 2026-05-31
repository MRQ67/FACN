import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // 0. Check if already seeded
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", "https://clerk.dev|user_demo_abebe")
      )
      .first();
    if (existing) return "Already seeded";

    // 1. HOSPITALS
    const h1Id = await ctx.db.insert("hospitals", {
      name: "Dil Chora Referral Hospital",
      location: "Kezira, Dire Dawa, Ethiopia",
      totalDoctors: 24,
      availableDoctors: 18,
      specialties: "General Medicine, Surgery, Pediatrics, Obstetrics",
    });
    const h2Id = await ctx.db.insert("hospitals", {
      name: "Sabian Health Center",
      location: "Sabian, Dire Dawa, Ethiopia",
      totalDoctors: 8,
      availableDoctors: 6,
      specialties: "General Medicine, Maternal Health",
    });
    const h3Id = await ctx.db.insert("hospitals", {
      name: "Haramaya University Referral Hospital",
      location: "Haramaya, Oromia, Ethiopia",
      totalDoctors: 31,
      availableDoctors: 22,
      specialties: "General Medicine, Surgery, Oncology, Cardiology",
    });

    // 2. PHARMACIES
    const p1Id = await ctx.db.insert("pharmacies", {
      name: "Dire Dawa Central Pharmacy",
      location: "Megala, Dire Dawa, Ethiopia",
      phone: "+251913456789",
    });
    const p2Id = await ctx.db.insert("pharmacies", {
      name: "Kezira Medical Pharmacy",
      location: "Kezira, Dire Dawa, Ethiopia",
      phone: "+251912345678",
    });

    // 3. USERS
    const u1 = await ctx.db.insert("users", { name: "Dr. Abebe Girma", email: "abebe.girma@dilchora.et", phone: "+251911234567", role: "DOCTOR", tokenIdentifier: "https://clerk.dev|user_demo_abebe", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u2 = await ctx.db.insert("users", { name: "Dr. Fatuma Hassan", email: "fatuma.hassan@dilchora.et", phone: "+251922345678", role: "DOCTOR", tokenIdentifier: "https://clerk.dev|user_demo_fatuma", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u3 = await ctx.db.insert("users", { name: "Nurse Tigist Bekele", email: "tigist.bekele@dilchora.et", phone: "+251933456789", role: "NURSE", tokenIdentifier: "https://clerk.dev|user_demo_tigist", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u4 = await ctx.db.insert("users", { name: "Nurse Dawit Haile", email: "dawit.haile@dilchora.et", phone: "+251944567890", role: "NURSE", tokenIdentifier: "https://clerk.dev|user_demo_dawit", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u5 = await ctx.db.insert("users", { name: "Amina Yusuf", email: "amina.yusuf@gmail.com", phone: "+251955678901", role: "PATIENT", tokenIdentifier: "https://clerk.dev|user_demo_amina", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u6 = await ctx.db.insert("users", { name: "Kebede Tadesse", email: "kebede.tadesse@gmail.com", phone: "+251966789012", role: "PATIENT", tokenIdentifier: "https://clerk.dev|user_demo_kebede", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u7 = await ctx.db.insert("users", { name: "Maryam Ibrahim", email: "maryam.ibrahim@gmail.com", phone: "+251977890123", role: "PATIENT", tokenIdentifier: "https://clerk.dev|user_demo_maryam", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u8 = await ctx.db.insert("users", { name: "Admin Solomon Tesfaye", email: "solomon.tesfaye@fcn.et", phone: "+251988901234", role: "ADMIN", tokenIdentifier: "https://clerk.dev|user_demo_solomon", isVerified: true, isApproved: true, createdAt: Date.now() });
    const u9 = await ctx.db.insert("users", { name: "Hawa Mussa", email: "hawa.mussa@fcn.et", phone: "+251999012345", role: "RURAL_HO", tokenIdentifier: "https://clerk.dev|user_demo_hawa", isVerified: true, isApproved: true, createdAt: Date.now() });

    // 4. DOCTOR PROFILES
    await ctx.db.insert("doctors", { userId: u1, specialty: "General Medicine", hospitalId: h1Id, licenseNumber: "ETH-MED-2019-4821", isAvailable: true });
    await ctx.db.insert("doctors", { userId: u2, specialty: "Pediatrics", hospitalId: h1Id, licenseNumber: "ETH-MED-2021-6234", isAvailable: true });

    // 5. PATIENT PROFILES
    await ctx.db.insert("patients", { userId: u5, dateOfBirth: new Date("1990-04-15").getTime(), bloodType: "O+", chronicConditions: "Mild hypertension" });
    await ctx.db.insert("patients", { userId: u6, dateOfBirth: new Date("1985-11-22").getTime(), bloodType: "A+" });
    await ctx.db.insert("patients", { userId: u7, dateOfBirth: new Date("1998-07-08").getTime(), bloodType: "B+", chronicConditions: "Type 2 Diabetes" });

    // 6. NURSE PROFILES
    await ctx.db.insert("nurses", { userId: u3, assignedZone: "Ward A - General" });
    await ctx.db.insert("nurses", { userId: u4, assignedZone: "Ward B - Pediatrics" });

    // 7. APPOINTMENTS
    const apt1 = await ctx.db.insert("appointments", { patientId: u5, doctorId: u1, scheduledAt: Date.now() - 10 * 86400000, status: "COMPLETED", type: "IN_PERSON" });
    const apt2 = await ctx.db.insert("appointments", { patientId: u6, doctorId: u2, scheduledAt: Date.now() - 7 * 86400000, status: "COMPLETED", type: "IN_PERSON" });
    const apt3 = await ctx.db.insert("appointments", { patientId: u5, doctorId: u1, scheduledAt: Date.now(), status: "IN_PROGRESS", type: "IN_PERSON" });
    const apt4 = await ctx.db.insert("appointments", { patientId: u7, doctorId: u2, scheduledAt: Date.now(), status: "CONFIRMED", type: "REMOTE" });
    const apt5 = await ctx.db.insert("appointments", { patientId: u6, doctorId: u1, scheduledAt: Date.now() + 4 * 86400000, status: "PENDING", type: "IN_PERSON" });
    const apt6 = await ctx.db.insert("appointments", { patientId: u7, doctorId: u1, scheduledAt: Date.now() + 6 * 86400000, status: "PENDING", type: "REMOTE" });

    // 8. VITALS
    await ctx.db.insert("vitals", { patientId: u5, nurseId: u3, bloodPressure: "128/84", heartRate: 78, temp: 37.1, oxygenSat: 97, glucose: 105, notes: "Patient reports mild dizziness", triageResult: "MODERATE" });
    await ctx.db.insert("vitals", { patientId: u6, nurseId: u4, bloodPressure: "120/78", heartRate: 72, temp: 36.8, oxygenSat: 99, glucose: 92, triageResult: "LOW" });
    await ctx.db.insert("vitals", { patientId: u7, nurseId: u3, bloodPressure: "145/92", heartRate: 88, temp: 37.4, oxygenSat: 96, glucose: 178, notes: "Blood glucose elevated", triageResult: "MODERATE" });
    await ctx.db.insert("vitals", { patientId: u5, nurseId: u4, bloodPressure: "132/86", heartRate: 81, temp: 37.0, oxygenSat: 97, glucose: 110, triageResult: "MODERATE" });

    // 9. PRESCRIPTIONS
    await ctx.db.insert("prescriptions", { doctorId: u1, patientId: u5, medications: "Amlodipine 5mg - Once daily for 30 days", notes: "Take in the evening.", expiresAt: Date.now() + 30 * 86400000 });
    await ctx.db.insert("prescriptions", { doctorId: u2, patientId: u7, medications: "Metformin 500mg - Twice daily", notes: "Monitor glucose.", expiresAt: Date.now() + 60 * 86400000 });
    await ctx.db.insert("prescriptions", { doctorId: u1, patientId: u6, medications: "Amoxicillin 500mg - 3x daily", notes: "Complete course.", expiresAt: Date.now() + 7 * 86400000 });

    // 10. LAB RESULTS
    await ctx.db.insert("labResults", { patientId: u5, doctorId: u1, testName: "CBC", resultValue: "WBC: 7.2", unit: "cells/μL", status: "COMPLETED", labName: "Dil Chora Lab", completedAt: Date.now() - 5 * 86400000 });
    await ctx.db.insert("labResults", { patientId: u7, doctorId: u2, testName: "HbA1c", resultValue: "7.8", unit: "%", status: "COMPLETED", labName: "Dil Chora Lab", completedAt: Date.now() - 3 * 86400000 });
    await ctx.db.insert("labResults", { patientId: u6, doctorId: u1, testName: "Lipid Panel", resultValue: "198", unit: "mg/dL", status: "PENDING", labName: "Dil Chora Lab" });

    // 11. CONSULTATIONS
    await ctx.db.insert("consultations", { requesterId: u5, specialistId: u2, status: "COMPLETED", notes: "Hypertension management review.", endedAt: Date.now() - 8 * 86400000 });
    await ctx.db.insert("consultations", { requesterId: u7, specialistId: u1, status: "IN_PROGRESS", notes: "Diabetes management review." });

    // 12. AUDIT LOGS
    const now = Date.now();
    await ctx.db.insert("auditLogs", { userId: u8, action: "USER_CREATED", entity: "users", entityId: "demo" });
    await ctx.db.insert("auditLogs", { userId: u8, action: "APPOINTMENT_CREATED", entity: "appointments", entityId: apt3 });
    await ctx.db.insert("auditLogs", { userId: u8, action: "TRIAGE_COMPLETED", entity: "vitals", entityId: "v1" });
    await ctx.db.insert("auditLogs", { userId: u8, action: "PRESCRIPTION_ISSUED", entity: "prescriptions", entityId: "p1" });
    await ctx.db.insert("auditLogs", { userId: u8, action: "LAB_RESULT_UPLOADED", entity: "labResults", entityId: "l1" });
    await ctx.db.insert("auditLogs", { userId: u8, action: "APPOINTMENT_UPDATED", entity: "appointments", entityId: apt3 });
  },
});
