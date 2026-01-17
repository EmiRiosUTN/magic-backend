import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Patterns that indicate invalid agents
const invalidPatterns = [
    /ramones/i,
    /postmortem/i,
    /illustration for teenagers/i,
    /Недвижимость/i,
    /side silhouette/i,
    /quiero mejorar este montaje/i,
    /create a new markdown file/i,
    /^abogado tecnol[oó]gico/i,
];

// Patterns in system prompts that indicate it's likely a conversation/specific request
const conversationPatterns = [
    /^quiero /i,
    /^necesito /i,
    /^create a new /i,
    /^genera /i,
    /^haz /i,
    /\${subject}/i, // Template variables suggest it's an image prompt
    /panoramic sea view/i,
    /Montenegro/i,
];

async function main() {
    const agents = await prisma.agent.findMany({
        include: { category: true },
        orderBy: { nameEs: 'asc' }
    });

    console.log(`\n📋 Analizando ${agents.length} agentes...\n`);

    const invalidAgents: any[] = [];
    const duplicates = new Map<string, any[]>();

    // Find invalid agents
    agents.forEach(agent => {
        let isInvalid = false;
        let reason = '';

        // Check name patterns
        for (const pattern of invalidPatterns) {
            if (pattern.test(agent.nameEs) || pattern.test(agent.nameEn)) {
                isInvalid = true;
                reason = `Nombre inválido: ${agent.nameEs}`;
                break;
            }
        }

        // Check system prompt patterns
        if (!isInvalid) {
            for (const pattern of conversationPatterns) {
                if (pattern.test(agent.systemPrompt)) {
                    isInvalid = true;
                    reason = `System prompt parece conversación: ${agent.systemPrompt.substring(0, 50)}...`;
                    break;
                }
            }
        }

        // Check if description is in system prompt (indicates it's not a proper agent)
        if (!isInvalid && agent.descriptionEs) {
            if (agent.systemPrompt.includes(agent.descriptionEs.substring(0, 30))) {
                isInvalid = true;
                reason = 'Description equals system prompt (likely invalid)';
            }
        }

        if (isInvalid) {
            invalidAgents.push({ ...agent, reason });
        }

        // Track duplicates by name
        const key = `${agent.nameEs}_${agent.nameEn}`;
        if (!duplicates.has(key)) {
            duplicates.set(key, []);
        }
        duplicates.get(key)!.push(agent);
    });

    // Report invalid agents
    console.log(`\n❌ AGENTES INVÁLIDOS (${invalidAgents.length}):\n`);
    console.log('='.repeat(100));
    invalidAgents.forEach((agent, i) => {
        console.log(`\n${i + 1}. ${agent.nameEs} (${agent.id})`);
        console.log(`   Razón: ${agent.reason}`);
        console.log(`   Prompt: ${agent.systemPrompt.substring(0, 80)}...`);
    });

    // Report duplicates
    const duplicateGroups = Array.from(duplicates.entries()).filter(([_, agents]) => agents.length > 1);
    console.log(`\n\n🔄 AGENTES DUPLICADOS (${duplicateGroups.length} grupos):\n`);
    console.log('='.repeat(100));
    duplicateGroups.slice(0, 20).forEach(([name, agents]) => {
        console.log(`\n${name}: ${agents.length} copias`);
        agents.forEach(a => console.log(`   - ${a.id} (creado: ${a.createdAt})`));
    });

    console.log(`\n\n📊 RESUMEN:`);
    console.log(`   Total agentes: ${agents.length}`);
    console.log(`   Inválidos: ${invalidAgents.length}`);
    console.log(`   Grupos duplicados: ${duplicateGroups.length}`);
    console.log(`   Total duplicados: ${duplicateGroups.reduce((sum, [_, agents]) => sum + agents.length - 1, 0)}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
