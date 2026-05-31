export interface TraitScore {
  score: number;
  confidence: number;
  evidence: string[];
}

export interface TraitState {
  [traitName: string]: TraitScore;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: number;
  category: string;
  section: string;
  question: string;
  type: string; // "Forced Choice" | "Open-Ended" | "Ranking" | "Likert" | "Scenario Chain"
  options: QuestionOption[];
  traits: string[];
  weight: number;
}

export interface UserResponse {
  questionId: number;
  answer: string | string[]; // Selected option label(s), ordered labels, or text input
  responseTimeMs: number;
}

// 43 core traits under 8 behavioral dimensions
export const CORE_TRAITS = [
  // Decision Making
  "Risk Tolerance", "Risk Aversion", "Analytical Thinking", "Intuitive Thinking",
  "Long-Term Orientation", "Short-Term Orientation", "Planning Style", "Spontaneity",
  // Leadership
  "Initiative", "Accountability", "Delegation", "Strategic Thinking", "Team Building", "Conflict Resolution",
  // Emotional Resilience
  "Stress Management", "Recovery Speed", "Criticism Tolerance", "Persistence", "Emotional Stability",
  // Social Orientation
  "Collaboration", "Communication Style", "Networking", "Empathy", "Social Energy",
  // Motivation
  "Achievement Drive", "Purpose Orientation", "Recognition Need", "Security Need", "Growth Orientation",
  // Adaptability
  "Change Readiness", "Learning Agility", "Uncertainty Tolerance", "Flexibility",
  // Creativity
  "Idea Generation", "Innovation", "Curiosity", "Problem Solving",
  // Values
  "Integrity", "Ethics", "Autonomy", "Service", "Growth", "Stability"
];

// Seed initial state
export function getInitialTraitState(): TraitState {
  const state: TraitState = {};
  for (const trait of CORE_TRAITS) {
    state[trait] = {
      score: 50, // Midpoint
      confidence: 0.0, // No answers yet
      evidence: []
    };
  }
  return state;
}

/**
 * Updates trait scores and confidence values based on a single response
 */
export function updateTraits(
  currentState: TraitState,
  question: Question,
  response: UserResponse
): TraitState {
  const state = JSON.parse(JSON.stringify(currentState)) as TraitState;
  const { answer } = response;
  const targetedTraits = question.traits;
  const weight = question.weight || 1.0;

  if (targetedTraits.length === 0) return state;

  // Track the primary trait and secondary trait
  const primaryTrait = targetedTraits[0];
  const secondaryTrait = targetedTraits[1] || null;

  let scoreDelta = 0;
  let opposingDelta = 0;
  let evidenceStr = "";

  if (question.type === "Forced Choice") {
    const selectedLabel = String(answer);
    const selectedOptionText = question.options.find(o => o.label === selectedLabel)?.text || "";

    if (selectedLabel === "A") {
      scoreDelta = 15;
      opposingDelta = -15;
    } else if (selectedLabel === "B") {
      scoreDelta = -15;
      opposingDelta = 15;
    } else {
      const offset = selectedLabel.charCodeAt(0) - 65;
      scoreDelta = offset % 2 === 0 ? 10 : -10;
      opposingDelta = -scoreDelta;
    }
    evidenceStr = `Responded: "${selectedOptionText}"`;

  } else if (question.type === "Likert") {
    const selectedLabel = String(answer);
    const selectedOptionText = question.options.find(o => o.label === selectedLabel)?.text || "";
    
    const likertMap: Record<string, number> = {
      A: 20,
      B: 10,
      C: 0,
      D: -10,
      E: -20
    };
    scoreDelta = likertMap[selectedLabel] ?? 0;
    opposingDelta = -scoreDelta;
    evidenceStr = `Self-assessed: "${selectedOptionText}"`;

  } else if (question.type === "Ranking") {
    const orderedLabels = Array.isArray(answer) ? answer : [String(answer)];
    
    if (primaryTrait) {
      const primaryIndex = question.options.findIndex(o => o.label === orderedLabels[0]);
      if (primaryIndex === 0) {
        scoreDelta = 15;
      } else if (primaryIndex === question.options.length - 1) {
        scoreDelta = -15;
      }
    }
    evidenceStr = `Ranked preference order: ${orderedLabels.join(" > ")}`;

  } else if (question.type === "Open-Ended") {
    evidenceStr = "Provided detailed written reflection";
    scoreDelta = 0;
  }

  // Helper to update a specific trait score & confidence
  const applyUpdate = (trait: string, delta: number) => {
    if (!state[trait]) return;
    const current = state[trait];
    
    const isHighContradiction = 
      (current.score > 65 && delta < -10) || 
      (current.score < 35 && delta > 10);

    const prevScore = current.score;
    current.score = Math.max(10, Math.min(90, Math.round(current.score + delta * weight)));

    if (isHighContradiction) {
      current.confidence = Math.max(0.1, current.confidence - 0.10);
    } else {
      current.confidence = Math.min(1.0, current.confidence + 0.15 * weight);
    }

    if (evidenceStr && !current.evidence.includes(evidenceStr)) {
      current.evidence.push(evidenceStr);
      if (current.evidence.length > 3) {
        current.evidence.shift();
      }
    }
  };

  // Apply scores
  if (primaryTrait) applyUpdate(primaryTrait, scoreDelta);
  if (secondaryTrait) applyUpdate(secondaryTrait, opposingDelta);

  // Small exposure confidence boost for remaining traits
  for (let idx = 2; idx < targetedTraits.length; idx++) {
    const otherTrait = targetedTraits[idx];
    if (state[otherTrait]) {
      state[otherTrait].confidence = Math.min(1.0, state[otherTrait].confidence + 0.05 * weight);
    }
  }

  return state;
}

/**
 * Calculates overall assessment statistics
 */
export function getAssessmentMetrics(state: TraitState, completedCount: number) {
  let totalConfidence = 0;
  let activeTraitsCount = 0;

  for (const trait of CORE_TRAITS) {
    totalConfidence += state[trait].confidence;
    activeTraitsCount++;
  }

  const averageConfidence = totalConfidence / activeTraitsCount;
  
  // Test ends EXACTLY at 20 questions
  const shouldStop = completedCount >= 20;
  const progressPercent = Math.min(100, Math.round((completedCount / 20) * 100));

  return {
    averageConfidence,
    shouldStop,
    progressPercent
  };
}

/**
 * Selection algorithm: selects the next question dynamically with new rules:
 * - Exactly 15 forced (Forced Choice, Likert, Ranking)
 * - Exactly 5 open-ended
 * - Completely randomized on refresh (top candidate chosen randomly)
 */
export function selectNextQuestion(
  state: TraitState,
  allQuestions: Question[],
  completedResponses: UserResponse[]
): Question {
  const completedIds = new Set(completedResponses.map(r => r.questionId));

  // Count types of completed questions
  let openCount = 0;
  let forcedCount = 0;
  
  for (const resp of completedResponses) {
    const q = allQuestions.find(temp => temp.id === resp.questionId);
    if (q) {
      if (q.type === "Open-Ended") {
        openCount++;
      } else {
        forcedCount++;
      }
    }
  }

  // Determine allowed types
  let allowedTypes: string[] = [];
  if (forcedCount < 15 && openCount < 5) {
    // Both allowed. Mix them randomly or pick based on step.
    // Let's do a loose check: if question index is a multiple of 4, suggest open ended, else forced.
    // This distributes the 5 open-ended questions evenly across the 20 questions!
    const nextIndex = completedResponses.length;
    if (nextIndex % 4 === 3) {
      allowedTypes = ["Open-Ended"];
    } else {
      allowedTypes = ["Forced Choice", "Likert", "Ranking"];
    }
  } else if (forcedCount < 15) {
    allowedTypes = ["Forced Choice", "Likert", "Ranking"];
  } else if (openCount < 5) {
    allowedTypes = ["Open-Ended"];
  } else {
    // Safety fallback
    allowedTypes = ["Forced Choice", "Likert", "Ranking"];
  }

  // Filter available questions matching the allowed types
  const availableQuestions = allQuestions.filter(
    q => !completedIds.has(q.id) && allowedTypes.includes(q.type)
  );

  if (availableQuestions.length === 0) {
    // If no matching types (should never happen), fall back to any unshown question
    const backupQuestions = allQuestions.filter(q => !completedIds.has(q.id));
    if (backupQuestions.length === 0) return allQuestions[0];
    return backupQuestions[Math.floor(Math.random() * backupQuestions.length)];
  }

  // Sort traits by lowest confidence to target them adaptively
  const lowConfidenceTraits = Object.entries(state)
    .map(([trait, data]) => ({ trait, confidence: data.confidence }))
    .sort((a, b) => a.confidence - b.confidence);

  // Score available questions
  const scoredQuestions = availableQuestions.map(q => {
    let relevanceScore = 0;
    for (const qTrait of q.traits) {
      const traitIndex = lowConfidenceTraits.findIndex(t => t.trait === qTrait);
      if (traitIndex !== -1) {
        const traitConfidence = lowConfidenceTraits[traitIndex].confidence;
        relevanceScore += (1.0 - traitConfidence) * 10;
        if (traitIndex < 5) {
          relevanceScore += 5;
        }
      }
    }
    
    // Add a tiny random jitter to ensure same-score questions get shuffled
    relevanceScore += Math.random() * 2;
    
    return { q, score: relevanceScore };
  });

  // Sort by score descending (highest relevance first)
  scoredQuestions.sort((a, b) => b.score - a.score);

  // To make it completely random on refresh while preserving adaptive intelligence,
  // we select randomly from the top 12 candidate questions!
  const poolSize = Math.min(scoredQuestions.length, 12);
  const selectedIndex = Math.floor(Math.random() * poolSize);
  
  return scoredQuestions[selectedIndex].q;
}
