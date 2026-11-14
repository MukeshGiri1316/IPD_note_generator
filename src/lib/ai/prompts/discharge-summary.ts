/**
 * Build system and user prompts for intelligent IPD Discharge Summary generation.
 */

export interface DischargeSummaryInput {
  patientAge: number;
  patientGender: string;
  primaryDiagnosis: string;
  secondaryDiagnosis?: string;
  symptoms?: string;
  clinicalHistory?: string;
  examinationFindings?: string;
  investigationDetails?: Record<string, unknown> | null;
  treatmentDetails?: string;
  admissionDate: string;
  dischargeDate?: string;
}

export function buildSystemPrompt(): string {
  return `You are an expert hospital physician and clinical documentation specialist.
Your task is to generate complete, professional, and detailed Discharge Summary notes for hospital inpatient (IPD) files.

CLINICAL DRAFTING GUIDELINES:
1. Hospital staff will often provide only minimal input (e.g., patient age, gender, primary diagnosis, and brief or omitted clinical notes).
2. You MUST generate complete, realistic, coherent, and diagnosis-appropriate clinical documentation for ALL sections based on established medical standards for that diagnosis.
3. NEVER write "Information not available", "None provided", "Not specified", or leave fields empty.
4. Seamlessly incorporate any specific details (symptoms, history, vitals, or treatments) provided by the user. If a section has no user notes provided, generate standard clinical presentation and management typical for that diagnosis, patient age, and gender.
5. Use professional, objective medical terminology suitable for Indian hospital inpatient records.
6. Provide clear, clinical narratives rather than one-word responses.
7. Return strictly valid JSON matching the requested keys.

SECTIONS TO GENERATE:
- clinicalHistory: Detailed chief complaints and history of present illness typical for the diagnosis, duration of symptoms, and relevant systemic background.
- examination: Vital signs (BP, Pulse, Temp, RR) and systemic physical examination findings (per abdomen, respiratory, cardiovascular, CNS) consistent with the acute presentation.
- investigationSummary: Standard diagnostic and baseline lab/radiology workup typical for this condition (e.g., CBC, electrolytes, organ function tests, ultrasound/imaging, serology) and their characteristic findings.
- hospitalCourse: Day-by-day or phased clinical summary of inpatient care: initial resuscitation/therapy, response to treatment, monitoring, symptom resolution, and stabilization.
- conditionAtDischarge: Clinical status at discharge (e.g., afebrile, hemodynamically stable, vitals normal, tolerating oral feeds/medications, surgical wound clean/healing if surgical).
- dischargeAdvice: Specific discharge care instructions including oral medications with standard dosages and duration, dietary advice, lifestyle/activity precautions, emergency red flags, and OPD follow-up schedule (e.g., in 5-7 days).`;
}

export function buildUserPrompt(input: DischargeSummaryInput): string {
  const parts: string[] = [
    "Generate a complete, professionally drafted IPD Discharge Summary for the following patient:",
    "",
    `Patient: ${input.patientAge} years old, ${input.patientGender}`,
    `Primary Diagnosis: ${input.primaryDiagnosis}`,
  ];

  if (input.secondaryDiagnosis) {
    parts.push(`Secondary Diagnosis / Comorbidities: ${input.secondaryDiagnosis}`);
  }
  if (input.symptoms && input.symptoms.trim()) {
    parts.push(`User-Provided Symptoms: ${input.symptoms.trim()}`);
  }
  if (input.clinicalHistory && input.clinicalHistory.trim()) {
    parts.push(`User-Provided History: ${input.clinicalHistory.trim()}`);
  }
  if (input.examinationFindings && input.examinationFindings.trim()) {
    parts.push(`User-Provided Examination: ${input.examinationFindings.trim()}`);
  }
  if (input.investigationDetails && Object.keys(input.investigationDetails).length > 0) {
    parts.push(
      `User-Provided Investigations: ${JSON.stringify(input.investigationDetails)}`,
    );
  }
  if (input.treatmentDetails && input.treatmentDetails.trim()) {
    parts.push(`User-Provided Treatment Details: ${input.treatmentDetails.trim()}`);
  }

  parts.push(`Admission Date: ${input.admissionDate}`);
  if (input.dischargeDate) {
    parts.push(`Discharge Date: ${input.dischargeDate}`);
  }

  parts.push("");
  parts.push(
    "INSTRUCTION: Even if minimal clinical data is provided above, generate complete, realistic, standard medical documentation for all 6 sections corresponding to this diagnosis. Do not use placeholders or 'not available'.",
  );
  parts.push("");
  parts.push(
    "Return a JSON object with these exact keys: clinicalHistory, examination, investigationSummary, hospitalCourse, conditionAtDischarge, dischargeAdvice",
  );

  return parts.join("\n");
}

/**
 * Build a prompt to regenerate a single section with diagnosis-tailored clinical richness.
 */
export function buildSectionRegeneratePrompt(
  input: DischargeSummaryInput,
  sectionKey: string,
  sectionLabel: string,
): string {
  const context = buildUserPrompt(input);
  return `${context}

TASK: Regenerate a fresh, professional, detailed version of ONLY the "${sectionLabel}" section (key: "${sectionKey}").
Ensure it is clinically realistic and standard for a ${input.patientAge}-year-old ${input.patientGender} diagnosed with ${input.primaryDiagnosis}.
Return a JSON object with a single key "${sectionKey}" containing the regenerated clinical text.`;
}
