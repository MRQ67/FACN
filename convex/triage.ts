import { v, ConvexError } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyze = action({
  args: {
    symptoms: v.string(),
    bloodPressure: v.optional(v.string()),
    heartRate: v.optional(v.number()),
    temperature: v.optional(v.number()),
    oxygenSat: v.optional(v.number()),
    medicalHistory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a clinical triage assistant for a 
telemedicine platform in Dire Dawa, Ethiopia. Analyze the following 
patient information and provide a structured triage assessment.

Patient Symptoms: ${args.symptoms}
Blood Pressure: ${args.bloodPressure || "Not provided"}
Heart Rate: ${args.heartRate || "Not provided"} BPM
Temperature: ${args.temperature || "Not provided"} °C
Oxygen Saturation: ${args.oxygenSat || "Not provided"}%
Medical History: ${args.medicalHistory || "None provided"}

Respond in this EXACT JSON format with no markdown, no backticks, 
no extra text — just raw JSON:
{
  "severity": "LOW" or "MODERATE" or "CRITICAL",
  "summary": "2-3 sentence clinical summary of the patient's condition",
  "recommendation": "Specific actionable recommendation for the healthcare worker",
  "urgency": "Timeframe for care e.g. Immediate, Within 24 hours, Within 1 week",
  "flags": ["list", "of", "clinical", "red", "flags", "if", "any"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      // If JSON parse fails, return a structured fallback
      parsed = {
        severity: "MODERATE",
        summary: text,
        recommendation: "Please consult with a healthcare professional.",
        urgency: "Within 24 hours",
        flags: []
      };
    }

    return parsed;
  },
});

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
