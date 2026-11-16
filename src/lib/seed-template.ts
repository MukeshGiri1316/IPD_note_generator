import { prisma } from "./prisma";
import { TEMPLATES } from "@/templates/registry";
import { NoteType } from "@prisma/client";

export async function ensureDefaultTemplates(): Promise<void> {
  for (const template of Object.values(TEMPLATES)) {
    await prisma.template.upsert({
      where: { slug: template.id },
      update: {
        name: template.name,
        noteType: template.noteType as NoteType,
        componentKey: template.componentKey,
        version: template.version,
        placeholders: [...template.placeholders],
        description: template.description,
        isActive: true,
      },
      create: {
        name: template.name,
        slug: template.id,
        noteType: template.noteType as NoteType,
        componentKey: template.componentKey,
        version: template.version,
        placeholders: [...template.placeholders],
        description: template.description,
        isActive: true,
      },
    });
  }
}
