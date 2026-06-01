"use node";

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are a clinical triage assistant for a
telemedicine platform in Dire Dawa, Ethiopia. Analyze the following
patient information and provide a structured triage assessment.

Patient Symptoms: ${args.symptoms}
Blood Pressure: ${args.bloodPressure || "Not provided"}
Heart Rate: ${args.heartRate || "Not provided"} BPM
Temperature: ${args.temperature || "Not provided"} \u00B0C
Oxygen Saturation: ${args.oxygenSat || "Not provided"}%
Medical History: ${args.medicalHistory || "None provided"}

Respond in this EXACT JSON format with no markdown, no backticks,
no extra text \u2014 just raw JSON:
{
  "severity": "LOW" or "MODERATE" or "CRITICAL",
  "summary": "2-3 sentence clinical summary of the patient's condition",
  "recommendation": "Specific actionable recommendation for the healthcare worker",
  "urgency": "Timeframe for care e.g. Immediate, Within 24 hours, Within 1 week",
  "flags": ["list", "of", "clinical", "red", "flags", "if", "any"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      parsed = {
        severity: "MODERATE",
        summary: text,
        recommendation: "Please consult with a healthcare professional.",
        urgency: "Within 24 hours",
        flags: [],
      };
    }

    return parsed;
  },
});
