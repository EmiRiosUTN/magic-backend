import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing Image Generation Agent (UUID issue)...');

    const TARGET_CAT_ID = 'fc7fb674-b89f-4b87-af61-601b376a9568';
    const INVALID_AGENT_ID = 'nano-banana-agent-001';
    const VALID_AGENT_ID = 'a0000000-0000-4000-0000-000000000000'; // Valid UUID v4-ish

    // 1. Delete Agent with Invalid ID if exists
    try {
        await prisma.agent.delete({ where: { id: INVALID_AGENT_ID } });
        console.log('Deleted invalid agent ID:', INVALID_AGENT_ID);
    } catch (e) {
        console.log('Invalid agent ID not found (good).');
    }

    // 2. Upsert Agent with VALID UUID and OLD creation date
    await prisma.agent.upsert({
        where: { id: VALID_AGENT_ID },
        update: {
            categoryId: TARGET_CAT_ID,
            createdAt: new Date('2000-01-01T00:00:00Z'), // Pin to top
            aiProvider: 'GEMINI',
            systemPrompt: "Eres un asistente creativo experto en generar imágenes. Tu única función es tomar el prompt del usuario, mejorarlo si es necesario para tener más detalles artísticos (estilo, iluminación, composición) y llamar a tu herramienta de generación de imágenes.",
        },
        create: {
            id: VALID_AGENT_ID,
            categoryId: TARGET_CAT_ID,
            nameEs: 'Generar imágenes',
            nameEn: 'Generate Images',
            descriptionEs: 'Crea imágenes increíbles usando Nano Banana (Gemini)',
            descriptionEn: 'Create amazing images using Nano Banana (Gemini)',
            systemPrompt: "Eres un asistente creativo experto en generar imágenes. Tu única función es tomar el prompt del usuario, mejorarlo si es necesario para tener más detalles artísticos (estilo, iluminación, composición) y llamar a tu herramienta de generación de imágenes.",
            aiProvider: 'GEMINI',
            modelName: 'gemini-1.5-flash',
            hasTools: true,
            toolsConfig: {
                tools: ['generateImage']
            },
            isActive: true,
            createdAt: new Date('2000-01-01T00:00:00Z'), // Pin to top
        },
    });

    console.log('Agent created/updated with valid UUID:', VALID_AGENT_ID);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
