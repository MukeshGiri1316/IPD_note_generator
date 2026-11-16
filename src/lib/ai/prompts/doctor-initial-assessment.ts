/**
 * Prompts for generating Doctor Initial Assessment (VSSH/DIAF/FORM/09).
 */

export interface DoctorInitialAssessmentInput {
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
}

export function buildDoctorInitialAssessmentSystemPrompt(): string {
  return `You are an expert admitting medical officer and clinical specialist at an NABH-accredited super speciality hospital.
Your task is to draft a comprehensive, realistic Doctor Initial Assessment document for an inpatient (IPD) admission.

FORM SPECIFICATIONS (VSSH/DIAF/FORM/09):
1. Hospital staff will often supply only minimal details: patient age, gender, and primary diagnosis.
2. Even with minimal details, you MUST synthesize realistic, clinically coherent initial examination findings, vital signs, and narrative history consistent with standard medical presentation for that diagnosis.
3. NEVER return placeholders like "Not specified", "N/A", "None provided", or leave narrative fields empty.
4. Keep the tone strictly medical, objective, and realistic as documented by an admitting physician.
5. Provide realistic vital signs consistent with the patient's age and acute pathology (e.g. slight tachycardia and fever for infectious or inflammatory diseases, hypertension for stroke/cardiac, etc.).

REQUIRED JSON FIELDS:
- temp: e.g. "98.6 °F" (or "100.4 °F" if febrile condition)
- pulse: e.g. "78 /min" (or "96 /min")
- bp: e.g. "120/80 mmHg"
- rr: e.g. "18 /min" (or "22 /min" if respiratory distress)
- wt: e.g. "65 kg" (realistic for age/gender)
- height: e.g. "168 cm" (or "5'6\"")
- painScore: e.g. "2/10" or "4/10" (numerical 0-10 or "0/10")
- painLocation: e.g. "Epigastrium", "Right lower abdomen", "Chest", or "None"
- pallor: "Yes" or "No" (usually "No" unless anemia/blood loss)
- clubbing: "No"
- icterus: "Yes" or "No" (Yes if hepatic/jaundice, else "No")
- edema: "Yes" or "No" (Yes if heart failure/renal/liver, else "No")
- emaciated: "Yes" or "No"
- bodyHabitus: exactly one of: "Obese", "Average Built", "Thin", "Cachectic"
- allergies: e.g. "None", "Drug: Penicillin", "Food & Beverages", or "Blood Transfusion"
- chiefComplaints: 2 to 4 bullet points with duration, e.g.:
  "1. Pain in abdomen x 2 days
2. Fever with chills x 3 days
3. Nausea and vomiting x 1 day"
- hopi: Concise History of Presenting Illness (onset, character, progression, associated symptoms, negative history).
- birthHistory: For pediatric patients, detailed antenatal, natal, and neonatal history. For adult patients, write: "Full term normal vaginal delivery, uneventful perinatal period, no known congenital anomalies or significant childhood disorders."
- growthDevelopment: e.g. "Normal developmental milestones achieved consistent with age. Normal motor, speech, and cognitive milestones."
- immunizationHistory: e.g. "Immunized for age as per National Immunization Schedule (NIS). Received complete COVID-19 vaccination."
- nutritionalHistory: e.g. "Consumes regular balanced vegetarian/mixed diet. Appetite normal. Bowel and bladder habits regular. No significant recent weight loss."

Return strictly valid JSON with these exact keys.`;
}

export function buildDoctorInitialAssessmentUserPrompt(
  input: DoctorInitialAssessmentInput
): string {
  const lines: string[] = [
    "Generate a complete Doctor Initial Assessment document for the following IPD admission:",
    "",
    `Patient: ${input.patientAge} years old, ${input.patientGender}`,
    `Primary Diagnosis: ${input.primaryDiagnosis}`,
  ];

  if (input.secondaryDiagnosis) {
    lines.push(`Secondary Diagnosis: ${input.secondaryDiagnosis}`);
  }
  if (input.symptoms && input.symptoms.trim()) {
    lines.push(`Reported Symptoms: ${input.symptoms.trim()}`);
  }
  if (input.clinicalHistory && input.clinicalHistory.trim()) {
    lines.push(`Clinical History Notes: ${input.clinicalHistory.trim()}`);
  }
  if (input.examinationFindings && input.examinationFindings.trim()) {
    lines.push(`Examination Findings: ${input.examinationFindings.trim()}`);
  }
  if (input.investigationDetails && Object.keys(input.investigationDetails).length > 0) {
    lines.push(`Investigations: ${JSON.stringify(input.investigationDetails)}`);
  }
  if (input.treatmentDetails && input.treatmentDetails.trim()) {
    lines.push(`Initial Treatment: ${input.treatmentDetails.trim()}`);
  }
  lines.push(`Admission Date: ${input.admissionDate}`);

  lines.push("");
  lines.push(
    "INSTRUCTION: Generate realistic, clinical admitting documentation for this patient and diagnosis. Fill all vitals and narrative sections appropriately. Return strictly a JSON object with keys: temp, pulse, bp, rr, wt, height, painScore, painLocation, pallor, clubbing, icterus, edema, emaciated, bodyHabitus, allergies, chiefComplaints, hopi, birthHistory, growthDevelopment, immunizationHistory, nutritionalHistory"
  );

  return lines.join("\n");
}

export function buildDoctorInitialAssessmentSectionPrompt(
  input: DoctorInitialAssessmentInput,
  sectionKey: string,
  sectionLabel: string
): string {
  const context = buildDoctorInitialAssessmentUserPrompt(input);
  return `${context}

TASK: Regenerate a fresh, professional, realistic version of ONLY the "${sectionLabel}" section (key: "${sectionKey}").
Ensure it matches the clinical presentation of a ${input.patientAge}-year-old ${input.patientGender} admitted with ${input.primaryDiagnosis}.
Return a JSON object with a single key "${sectionKey}" containing the regenerated clinical text.`;
}
