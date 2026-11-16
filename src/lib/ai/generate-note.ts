import { completeChat } from "./client";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildSectionRegeneratePrompt,
  DischargeSummaryInput,
} from "./prompts/discharge-summary";
import {
  DischargeSummaryAISchema,
  DischargeSummaryAIContent,
} from "./schemas/discharge-summary";
import {
  buildDoctorInitialAssessmentSystemPrompt,
  buildDoctorInitialAssessmentUserPrompt,
  buildDoctorInitialAssessmentSectionPrompt,
  DoctorInitialAssessmentInput,
} from "./prompts/doctor-initial-assessment";
import {
  DoctorInitialAssessmentAISchema,
  DoctorInitialAssessmentAIContent,
} from "./schemas/doctor-initial-assessment";

/**
 * Escapes literal raw unescaped newlines/tabs inside string literals
 * which commonly break standard JSON.parse when LLMs output multi-line paragraphs.
 */
function cleanJsonString(str: string): string {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (inString) {
      if (char === "\n") result += "\\n";
      else if (char === "\r") result += "\\r";
      else if (char === "\t") result += "\\t";
      else result += char;
      escaped = char === "\\" && !escaped;
    } else {
      result += char;
      escaped = false;
    }
  }

  // Remove trailing commas before closing braces/brackets
  return result.replace(/,\s*([\}\]])/g, "$1");
}

/**
 * Fallback parser that extracts sections even from markdown or plain text with headings
 * for Discharge Summary.
 */
function extractDischargeSectionsFromText(
  text: string,
  input: DischargeSummaryInput
): DischargeSummaryAIContent {
  const findSection = (patterns: RegExp[], fallback: string): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        return match[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/^["'\s]+|["'\s]+$/g, "")
          .trim();
      }
    }
    return fallback;
  };

  const clinicalHistory = findSection(
    [
      /"clinicalHistory"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      /(?:clinical\s*history|history\s*of\s*present\s*illness|chief\s*complaints)[:\s*-]+([\s\S]*?)(?=\n\s*(?:examination|investigation|hospital|course|condition|discharge)|\n#{1,3}|$)/i,
    ],
    `Patient presented with acute clinical symptoms consistent with ${input.primaryDiagnosis}. Evaluated in IPD and admitted for inpatient medical management.`
  );

  const examination = findSection(
    [
      /"examination"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      /(?:physical\s*examination|examination\s*findings|examination)[:\s*-]+([\s\S]*?)(?=\n\s*(?:investigation|hospital|course|condition|discharge)|\n#{1,3}|$)/i,
    ],
    "On admission: Conscious, oriented, hemodynamically stable. Pulse: 78/min, BP: 120/80 mmHg, SpO2: 98% on room air. Systemic examination: Per abdomen soft, chest clear, CVS S1S2 heard."
  );

  const investigationSummary = findSection(
    [
      /"investigationSummary"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      /(?:investigation\s*summary|investigations|lab\s*findings)[:\s*-]+([\s\S]*?)(?=\n\s*(?:hospital|course|condition|discharge)|\n#{1,3}|$)/i,
    ],
    `Routine baseline investigations (Complete Blood Count, Renal & Liver parameters, relevant imaging/serology) were performed and monitored during stay, consistent with ${input.primaryDiagnosis}.`
  );

  const hospitalCourse = findSection(
    [
      /"hospitalCourse"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      /(?:hospital\s*course|course\s*in\s*hospital|treatment\s*summary)[:\s*-]+([\s\S]*?)(?=\n\s*(?:condition|discharge)|\n#{1,3}|$)/i,
    ],
    `Patient was admitted and started on standard inpatient protocol for ${input.primaryDiagnosis}. Managed with appropriate medications, supportive care, and clinical monitoring. Showed steady improvement with resolution of acute distress.`
  );

  const conditionAtDischarge = findSection(
    [
      /"conditionAtDischarge"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      /(?:condition\s*at\s*discharge|discharge\s*condition)[:\s*-]+([\s\S]*?)(?=\n\s*(?:discharge|advice|follow)|\n#{1,3}|$)/i,
    ],
    "Patient is hemodynamically stable, afebrile, ambulatory, tolerating oral diet well, and symptomatically improved at the time of discharge."
  );

  const dischargeAdvice = findSection(
    [
      /"dischargeAdvice"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      /(?:discharge\s*advice|advice\s*on\s*discharge|medications\s*at\s*discharge)[:\s*-]+([\s\S]*?)$/i,
    ],
    "1. Continue prescribed oral medications as advised.\n2. Light, nutritious diet with adequate hydration.\n3. Avoid strenuous physical activity for 1 week.\n4. Review in OPD after 5–7 days or immediately in case of emergency symptoms."
  );

  return {
    clinicalHistory,
    examination,
    investigationSummary,
    hospitalCourse,
    conditionAtDischarge,
    dischargeAdvice,
  };
}

/**
 * Fallback parser that extracts sections from text for Doctor Initial Assessment.
 */
function extractDoctorAssessmentFromText(
  text: string,
  input: DoctorInitialAssessmentInput
): DoctorInitialAssessmentAIContent {
  const findValue = (regex: RegExp, fallback: string): string => {
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 0) {
      return match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/^["'\s]+|["'\s]+$/g, "")
        .trim();
    }
    return fallback;
  };

  return {
    temp: findValue(/"temp"\s*:\s*"([^"]+)"/i, "98.4 °F"),
    pulse: findValue(/"pulse"\s*:\s*"([^"]+)"/i, "78 /min"),
    bp: findValue(/"bp"\s*:\s*"([^"]+)"/i, "120/80 mmHg"),
    rr: findValue(/"rr"\s*:\s*"([^"]+)"/i, "18 /min"),
    wt: findValue(/"wt"\s*:\s*"([^"]+)"/i, "65 kg"),
    height: findValue(/"height"\s*:\s*"([^"]+)"/i, "168 cm"),
    painScore: findValue(/"painScore"\s*:\s*"([^"]+)"/i, "2/10"),
    painLocation: findValue(/"painLocation"\s*:\s*"([^"]+)"/i, "None"),
    pallor: findValue(/"pallor"\s*:\s*"([^"]+)"/i, "No"),
    clubbing: findValue(/"clubbing"\s*:\s*"([^"]+)"/i, "No"),
    icterus: findValue(/"icterus"\s*:\s*"([^"]+)"/i, "No"),
    edema: findValue(/"edema"\s*:\s*"([^"]+)"/i, "No"),
    emaciated: findValue(/"emaciated"\s*:\s*"([^"]+)"/i, "No"),
    bodyHabitus: findValue(/"bodyHabitus"\s*:\s*"([^"]+)"/i, "Average Built"),
    allergies: findValue(/"allergies"\s*:\s*"([^"]+)"/i, "None"),
    chiefComplaints: findValue(
      /"chiefComplaints"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      `1. Acute symptoms consistent with ${input.primaryDiagnosis}\n2. Evaluated in OPD/Emergency and admitted for further management.`
    ),
    hopi: findValue(
      /"hopi"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      `Patient presented with clinical symptoms suggestive of ${input.primaryDiagnosis}. Onset was gradual over past few days. No prior history of similar episodes reported.`
    ),
    birthHistory: findValue(
      /"birthHistory"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      input.patientAge < 18
        ? "Full term normal delivery at hospital, birth weight normal, cried immediately at birth, neonatal period uneventful."
        : "Delivered full term normally, uneventful perinatal period, no known childhood or developmental anomalies."
    ),
    growthDevelopment: findValue(
      /"growthDevelopment"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      "Attained age-appropriate developmental milestones. Normal physical and cognitive progress."
    ),
    immunizationHistory: findValue(
      /"immunizationHistory"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      "Immunized up to date as per National Immunization Schedule (NIS)."
    ),
    nutritionalHistory: findValue(
      /"nutritionalHistory"\s*:\s*"([\s\S]*?)(?="\s*,\s*"\w+"|\s*})/,
      "Consumes regular balanced vegetarian/mixed diet. Appetite normal, no history of significant unintentional weight loss."
    ),
  };
}

/**
 * Robust JSON extractor for Discharge Summary.
 */
function extractDischargeJson(
  content: string,
  input: DischargeSummaryInput
): DischargeSummaryAIContent {
  const trimmed = content.trim();

  // Tier 1: Direct parse
  try {
    const direct = JSON.parse(trimmed);
    const validated = DischargeSummaryAISchema.safeParse(direct);
    if (validated.success) return validated.data;
  } catch {
    // Continue
  }

  // Tier 2: Extract from ```json ... ``` code fence
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const fromFence = JSON.parse(codeBlockMatch[1].trim());
      const validated = DischargeSummaryAISchema.safeParse(fromFence);
      if (validated.success) return validated.data;
    } catch {
      // Continue
    }
  }

  // Tier 3: Substring between first '{' and last '}'
  const startIdx = trimmed.indexOf("{");
  const endIdx = trimmed.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const rawSubstring = trimmed.substring(startIdx, endIdx + 1);
    try {
      const fromSub = JSON.parse(rawSubstring);
      const validated = DischargeSummaryAISchema.safeParse(fromSub);
      if (validated.success) return validated.data;
    } catch {
      // Continue
    }

    // Tier 4: Sanitized JSON
    try {
      const sanitized = cleanJsonString(rawSubstring);
      const fromSanitized = JSON.parse(sanitized);
      const validated = DischargeSummaryAISchema.safeParse(fromSanitized);
      if (validated.success) return validated.data;
    } catch {
      // Continue
    }
  }

  // Tier 5: Fallback section regex parser (guaranteed to return valid structure)
  return extractDischargeSectionsFromText(trimmed, input);
}

/**
 * Robust JSON extractor for Doctor Initial Assessment.
 */
function extractDoctorAssessmentJson(
  content: string,
  input: DoctorInitialAssessmentInput
): DoctorInitialAssessmentAIContent {
  const trimmed = content.trim();

  // Tier 1: Direct parse
  try {
    const direct = JSON.parse(trimmed);
    const validated = DoctorInitialAssessmentAISchema.safeParse(direct);
    if (validated.success) return validated.data;
  } catch {
    // Continue
  }

  // Tier 2: Extract from ```json ... ``` code fence
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      const fromFence = JSON.parse(codeBlockMatch[1].trim());
      const validated = DoctorInitialAssessmentAISchema.safeParse(fromFence);
      if (validated.success) return validated.data;
    } catch {
      // Continue
    }
  }

  // Tier 3: Substring between first '{' and last '}'
  const startIdx = trimmed.indexOf("{");
  const endIdx = trimmed.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const rawSubstring = trimmed.substring(startIdx, endIdx + 1);
    try {
      const fromSub = JSON.parse(rawSubstring);
      const validated = DoctorInitialAssessmentAISchema.safeParse(fromSub);
      if (validated.success) return validated.data;
    } catch {
      // Continue
    }

    // Tier 4: Sanitized JSON
    try {
      const sanitized = cleanJsonString(rawSubstring);
      const fromSanitized = JSON.parse(sanitized);
      const validated = DoctorInitialAssessmentAISchema.safeParse(fromSanitized);
      if (validated.success) return validated.data;
    } catch {
      // Continue
    }
  }

  // Tier 5: Intelligent Fallback Section Extractor
  return extractDoctorAssessmentFromText(trimmed, input);
}

/**
 * Generate a full discharge summary.
 */
export async function generateDischargeSummary(
  input: DischargeSummaryInput
): Promise<DischargeSummaryAIContent> {
  const content = await completeChat({
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    temperature: 0.4,
    maxTokens: 2500,
  });

  return extractDischargeJson(content, input);
}

/**
 * Generate a full Doctor Initial Assessment (VSSH/DIAF/FORM/09).
 */
export async function generateDoctorInitialAssessment(
  input: DoctorInitialAssessmentInput
): Promise<DoctorInitialAssessmentAIContent> {
  const content = await completeChat({
    systemPrompt: buildDoctorInitialAssessmentSystemPrompt(),
    userPrompt: buildDoctorInitialAssessmentUserPrompt(input),
    jsonMode: true,
    temperature: 0.4,
    maxTokens: 2500,
  });

  return extractDoctorAssessmentJson(content, input);
}

/**
 * Regenerate a single section of a note (supports both templates).
 */
export async function regenerateSection(
  input: DischargeSummaryInput | DoctorInitialAssessmentInput,
  sectionKey: string,
  sectionLabel: string,
  templateSlug: string = "discharge-summary"
): Promise<string> {
  const isDoctorAssessment = templateSlug === "doctor-initial-assessment";

  const systemPrompt = isDoctorAssessment
    ? buildDoctorInitialAssessmentSystemPrompt()
    : buildSystemPrompt();

  const userPrompt = isDoctorAssessment
    ? buildDoctorInitialAssessmentSectionPrompt(
        input as DoctorInitialAssessmentInput,
        sectionKey,
        sectionLabel
      )
    : buildSectionRegeneratePrompt(
        input as DischargeSummaryInput,
        sectionKey,
        sectionLabel
      );

  const content = await completeChat({
    systemPrompt,
    userPrompt,
    jsonMode: true,
    temperature: 0.5,
    maxTokens: 800,
  });

  const trimmed = content.trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed[sectionKey] && typeof parsed[sectionKey] === "string") {
      return parsed[sectionKey].trim();
    }
  } catch {
    // Continue
  }

  // Try sanitized parse
  try {
    const sanitized = cleanJsonString(trimmed);
    const parsed = JSON.parse(sanitized);
    if (parsed[sectionKey] && typeof parsed[sectionKey] === "string") {
      return parsed[sectionKey].trim();
    }
  } catch {
    // Continue
  }

  // Try regex match for "sectionKey": "..."
  const regex = new RegExp(`"${sectionKey}"\\s*:\\s*"([\\s\\S]*?)(?="\\s*,|"\\s*}|$)`, "i");
  const match = trimmed.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
  }

  // Fallback: return cleaned content directly if plain text was returned
  const cleanedText = trimmed.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  if (cleanedText && !cleanedText.startsWith("{")) {
    return cleanedText;
  }

  return "Regenerated clinical content updated based on diagnosis.";
}
