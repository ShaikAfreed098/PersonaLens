import { NextRequest, NextResponse } from "next/server";
import { Question } from "@/utils/trait-engine";

// Helper to resolve question text from questions.json
import { QUESTIONS } from "@/utils/questions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentId, userId, responses, traits } = body;

    if (!assessmentId || !responses || !traits) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Check if API key is configured
    if (!geminiApiKey || geminiApiKey === "your-google-gemini-api-key") {
      console.warn("GEMINI_API_KEY is not configured. Returning custom simulated analysis report.");
      const mockReport = generateMockReport(traits, responses);
      return NextResponse.json({ ...mockReport, id: "mock-report-id-" + Math.random().toString(36).substr(2, 9) });
    }

    // Map responses to include question text and types for Gemini context
    const responsesWithDetails = responses.map((r: any) => {
      const q = QUESTIONS.find(temp => temp.id === r.questionId);
      return {
        questionId: r.questionId,
        category: q?.category || "Unknown",
        section: q?.section || "Unknown",
        question: q?.question || "Unknown",
        type: q?.type || "Unknown",
        answer: r.answer,
        responseTimeMs: r.responseTimeMs
      };
    });

    // Construct prompt for Gemini
    const systemInstructions = `
You are PersonaLens, a state-of-the-art adaptive AI behavioral intelligence platform.
Your task is to analyze a user's responses to a behavioral assessment and generate a comprehensive, highly insightful behavioral report.

CRITICAL DISCLOSURE RULES:
1. Never diagnose mental illness or psychological disorders.
2. Never claim absolute psychological certainty. Present all insights as estimated behavioral tendencies and patterns.
3. Do not recommend clinical therapy or psychiatric intervention.
4. Maintain a highly professional, supportive, and growth-oriented corporate/coaching tone.

BEHAVIORAL EVIDENCE RULES:
For each trait score returned, explain the evidence behind the score based on the user's answers. Use direct behavioral evidence, such as "Indicated preference for data-driven decisions over intuition when selecting role candidates" or "Expressed strong recovery persistence in open-ended setbacks reflection".
`;

    const promptText = `
Analyze the following behavioral assessment responses:

USER PROFILE/TRAIT RAW baseline:
${JSON.stringify(traits, null, 2)}

QUESTION RESPONSES:
${JSON.stringify(responsesWithDetails, null, 2)}

Please perform a deep semantic analysis of the open-ended text answers, forced choice priorities, and response times.
Provide a high-quality behavioral profiling report.

CRITICAL INSTRUCTION FOR finalTraits SPEED OPTIMIZATION:
To optimize generation speed, do NOT return all 43 traits in the finalTraits object.
ONLY return a subset of 6 to 10 traits that had the most significant qualitative evidence or updates based on the user's answers.
For each of these traits, refine the score (10-90) and confidence (0.0 to 1.0) and write exactly ONE short, highly-specific sentence of behavioral evidence (e.g., "Reflected analytical patience in open-ended decision explanations").
Do not include any other traits in finalTraits.

Return the final report strictly in JSON format conforming to the following structure:
{
  "primaryArchetype": "Primary personality archetype, e.g., 'Strategic Builder', 'Adaptive Explorer', 'Resilient Optimist'",
  "secondaryArchetype": "Secondary personality archetype, e.g., 'Collaborative Catalyst'",
  "summary": "A 3-4 sentence comprehensive summary of their overall behavioral tendencies.",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "blindSpots": ["Blind spot 1", "Blind spot 2"],
  "stressResponses": "A detailed explanation of how this person behaves under high organizational stress.",
  "leadershipStyle": "A detailed description of their leadership and collaboration style.",
  "relationshipStyle": "A description of how they interact and build trust in professional relationships.",
  "growthOpportunities": ["Growth recommendation 1", "Growth recommendation 2"],
  "finalTraits": {
    "Risk Tolerance": { "score": number, "confidence": number, "evidence": ["Single concise sentence of evidence."] }
  }
}
`;

    // Make fetch request to Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemInstructions + "\n\n" + promptText }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      throw new Error("Failed to contact Gemini API");
    }

    const resJson = await response.json();
    const resultText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    // Parse the JSON output from Gemini
    const reportJson = JSON.parse(resultText.trim());
    
    // Merge baseline traits with finalTraits returned by Gemini to ensure all 43 traits exist
    const mergedTraits = { ...traits };
    if (reportJson.finalTraits) {
      for (const [traitName, traitData] of Object.entries(reportJson.finalTraits)) {
        if (mergedTraits[traitName]) {
          const tData = traitData as any;
          mergedTraits[traitName] = {
            ...mergedTraits[traitName],
            score: typeof tData.score === "number" ? tData.score : mergedTraits[traitName].score,
            confidence: typeof tData.confidence === "number" ? tData.confidence : mergedTraits[traitName].confidence,
            evidence: Array.isArray(tData.evidence) ? tData.evidence : mergedTraits[traitName].evidence
          };
        }
      }
    }
    reportJson.finalTraits = mergedTraits;

    return NextResponse.json({ ...reportJson, id: "report-" + Math.random().toString(36).substr(2, 9) });

  } catch (error: any) {
    console.error("Gemini submission handler error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

// Simulated final analyzer report generator for offline/local fallback mode
function generateMockReport(traits: any, responses: any[]) {
  // Simple heuristic calculation to customize the archetype based on raw scores
  const riskTolerance = traits["Risk Tolerance"]?.score || 50;
  const analytical = traits["Analytical Thinking"]?.score || 50;
  const initiative = traits["Initiative"]?.score || 50;
  const recovery = traits["Recovery Speed"]?.score || 50;

  let primaryArchetype = "Adaptive Builder";
  let secondaryArchetype = "Collaborative Coach";
  let summary = "You display a highly versatile and balanced behavioral profile. You are comfortable acting both as a logical problem-solver and an empathetic team member.";
  let strengths = [
    "High versatility when working under changing conditions",
    "Balanced focus on long-term strategy and short-term execution",
    "Empathetic listening and constructive feedback approach"
  ];
  let blindSpots = [
    "May delay decisions when seeking complete consensus",
    "Risk of burnout due to overcommitting in high-morale phases"
  ];

  if (riskTolerance > 65 && initiative > 65) {
    primaryArchetype = "Strategic Explorer";
    secondaryArchetype = "Dynamic Catalyst";
    summary = "You show high risk-tolerance and strong initiative, moving quickly to seize opportunities. You thrive in unstructured environments where you can set creative directions.";
    strengths = [
      "Decisive action in highly ambiguous settings",
      "Proactive risk-taking to establish new growth opportunities",
      "Visionary leadership that inspires collaborative action"
    ];
    blindSpots = [
      "Can underestimate capital protection and operational risks",
      "May conflict with highly structured processes or rules"
    ];
  } else if (analytical > 65 && riskTolerance < 40) {
    primaryArchetype = "Analytical Architect";
    secondaryArchetype = "Risk Mitigator";
    summary = "You prioritize security, data validation, and capital protection. You make decisions methodically and plan projects thoroughly to eliminate unexpected fail-points.";
    strengths = [
      "Extremely disciplined execution and project scoping",
      "Rigorous logical analysis to prevent operational failures",
      "Strong values of stability, autonomy, and integrity"
    ];
    blindSpots = [
      "Analysis paralysis: may miss critical window opportunities",
      "Struggles to pivot quickly when instructions are chaotic"
    ];
  } else if (recovery > 65) {
    primaryArchetype = "Resilient Anchor";
    secondaryArchetype = "Empathetic Leader";
    summary = "You show exceptional recovery speed and criticism tolerance, processing setbacks as learning loops. You maintain a calm, stable presence under intense team stress.";
  }

  // Refine final traits: add simulated Gemini evidence for traits that were touched
  const finalTraits = { ...traits };
  for (const trait of Object.keys(finalTraits)) {
    const data = finalTraits[trait];
    if (data.confidence > 0 && data.evidence.length === 0) {
      data.evidence = [`Demonstrated typical behavioral markers matching standard ${trait} dynamics.`];
    }
  }

  return {
    primaryArchetype,
    secondaryArchetype,
    summary,
    strengths,
    blindSpots,
    stressResponses: "Under organizational stress, you double down on your core strength, focusing on logical triaging or encouraging relationship harmony.",
    leadershipStyle: "Empathetic, clear, and goal-oriented. You prefer to lead by coaching rather than micro-managing.",
    relationshipStyle: "Authentic, direct, and relationship-centric. You build trust by holding boundaries transparently.",
    growthOpportunities: [
      "Practice fast-prototyping to reduce decision latency",
      "Delegate lower-stakes execution items to empower team members"
    ],
    finalTraits
  };
}
