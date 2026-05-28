import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";

export const analyze = action({
  args: {
    symptoms: v.string(),
    bloodPressure: v.optional(v.string()),
    heartRate: v.optional(v.number()),
    temp: v.optional(v.number()),
    oxygenSat: v.optional(v.number()),
    patientHistory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new ConvexError("CLAUDE_API_KEY not configured");

    let clinicalData = "";
    if (args.bloodPressure)
      clinicalData += `\nBlood Pressure: ${args.bloodPressure}`;
    if (args.heartRate !== undefined)
      clinicalData += `\nHeart Rate: ${args.heartRate} bpm`;
    if (args.temp !== undefined)
      clinicalData += `\nTemperature: ${args.temp}°C`;
    if (args.oxygenSat !== undefined)
      clinicalData += `\nOxygen Saturation: ${args.oxygenSat}%`;
    if (args.patientHistory)
      clinicalData += `\nPatient History: ${args.patientHistory}`;

    const prompt = `You are a medical triage assistant. Analyze the following patient data and provide a triage assessment.

Symptoms: ${args.symptoms}${clinicalData}

Provide a JSON response with:
- triageLevel: "EMERGENCY" | "URGENT" | "SEMI_URGENT" | "NON_URGENT"
- summary: A brief summary of the assessment
- recommendations: Array of recommended actions
- warningFlags: Array of any concerning findings`;

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ConvexError(
        `Claude API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();

    let parsed;
    try {
      const text = data.content?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { raw: text };
      }
    } catch {
      parsed = { raw: data.content?.[0]?.text || JSON.stringify(data) };
    }

    return parsed;
  },
});
