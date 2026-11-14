import { PrismaClient, NoteType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.template.upsert({
    where: { slug: "discharge-summary" },
    update: {
      name: "Discharge Summary",
      noteType: NoteType.DISCHARGE_SUMMARY,
      componentKey: "discharge-summary",
      version: 1,
      placeholders: [
        "clinicalHistory",
        "examination",
        "investigationSummary",
        "hospitalCourse",
        "conditionAtDischarge",
        "dischargeAdvice",
      ],
      description: "Standard discharge summary for IPD patients.",
      isActive: true,
    },
    create: {
      name: "Discharge Summary",
      slug: "discharge-summary",
      noteType: NoteType.DISCHARGE_SUMMARY,
      componentKey: "discharge-summary",
      version: 1,
      placeholders: [
        "clinicalHistory",
        "examination",
        "investigationSummary",
        "hospitalCourse",
        "conditionAtDischarge",
        "dischargeAdvice",
      ],
      description: "Standard discharge summary for IPD patients.",
      isActive: true,
    },
  });

  console.log("Database seeded successfully with default templates.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
