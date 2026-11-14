import { prisma } from "./prisma";
import { TEMPLATES } from "@/templates/registry";
import { NoteType } from "@prisma/client";

export async function ensureDefaultTemplates(): Promise<void> {
  const discharge = TEMPLATES["discharge-summary"];
  if (!discharge) return;

  await prisma.template.upsert({
    where: { slug: discharge.id },
    update: {
      name: discharge.name,
      noteType: discharge.noteType as NoteType,
      componentKey: discharge.componentKey,
      version: discharge.version,
      placeholders: [...discharge.placeholders],
      description: discharge.description,
      isActive: true,
    },
    create: {
      name: discharge.name,
      slug: discharge.id,
      noteType: discharge.noteType as NoteType,
      componentKey: discharge.componentKey,
      version: discharge.version,
      placeholders: [...discharge.placeholders],
      description: discharge.description,
      isActive: true,
    },
  });
}
