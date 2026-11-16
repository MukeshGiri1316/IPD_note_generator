import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { launchBrowser } from "@/lib/pdf";
import { renderDischargeSummaryHtml } from "@/templates/discharge-summary/html-renderer";
import { renderDoctorInitialAssessmentHtml } from "@/templates/doctor-initial-assessment/html-renderer";
import { TemplateProps } from "@/templates/registry";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let browser = null;
  try {
    await requireSession();
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        admission: {
          include: { patient: true },
        },
        template: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { admission } = doc;
    const { patient } = admission;

    const templateProps: TemplateProps = {
      patientData: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        patientNumber: patient.patientNumber,
        ipdNumber: admission.ipdNumber,
        admissionDate: admission.admissionDate.toISOString().split("T")[0],
        dischargeDate: admission.dischargeDate
          ? admission.dischargeDate.toISOString().split("T")[0]
          : undefined,
        primaryDiagnosis: admission.primaryDiagnosis,
        secondaryDiagnosis: admission.secondaryDiagnosis || undefined,
      },
      generatedContent: (doc.finalContent as Record<string, string>) || {},
    };

    const isDoctorAssessment =
      doc.template?.slug === "doctor-initial-assessment" ||
      doc.noteType === "DOCTOR_INITIAL_ASSESSMENT";

    const html = isDoctorAssessment
      ? renderDoctorInitialAssessmentHtml(templateProps)
      : renderDischargeSummaryHtml(templateProps);

    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });

    // Wait briefly for font rendering
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
    });

    await page.close();

    const safePatientName = patient.name.replace(/[^a-zA-Z0-9]/g, "_");
    const prefix = isDoctorAssessment ? "Doctor_Initial_Assessment" : "Discharge_Summary";
    const filename = `${prefix}_${admission.ipdNumber}_${safePatientName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/generate-pdf/ipd error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
