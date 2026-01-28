import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create default subscription type
    const freeSubscription = await prisma.subscriptionType.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Free',
            maxConversationsPerAgent: 5,
            maxMessagesPerConversation: 100,
            maxAgentsAccess: null, // Unlimited
        },
    });

    console.log('✅ Created subscription type:', freeSubscription.name);

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@magicai.com' },
        update: {},
        create: {
            email: 'admin@magicai.com',
            passwordHash: adminPassword,
            fullName: 'Admin User',
            role: 'ADMIN',
            subscriptionTypeId: freeSubscription.id,
            onboardingCompleted: true,
        },
    });

    console.log('✅ Created admin user:', admin.email);

    // Create admin settings
    await prisma.userSettings.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            language: 'ES',
        },
    });

    // Create sample categories
    const categories = [
        {
            nameEs: 'Creación de Imágenes',
            nameEn: 'Image Creation',
            descriptionEs: 'Genera imágenes especializadas para diferentes propósitos',
            descriptionEn: 'Generate specialized images for different purposes',
            icon: '🎨',
            displayOrder: 1,
        },
        {
            nameEs: 'Redacción y Contenido',
            nameEn: 'Writing and Content',
            descriptionEs: 'Crea contenido profesional para cualquier necesidad',
            descriptionEn: 'Create professional content for any need',
            icon: '✍️',
            displayOrder: 2,
        },
        {
            nameEs: 'Desarrollo y Código',
            nameEn: 'Development and Code',
            descriptionEs: 'Asistencia experta en programación y desarrollo',
            descriptionEn: 'Expert assistance in programming and development',
            icon: '💻',
            displayOrder: 3,
        },
        {
            nameEs: 'Análisis de Datos',
            nameEn: 'Data Analysis',
            descriptionEs: 'Procesa y analiza información compleja',
            descriptionEn: 'Process and analyze complex information',
            icon: '📊',
            displayOrder: 4,
        },
        {
            nameEs: 'Redes Sociales',
            nameEn: 'Social Media',
            descriptionEs: 'Optimiza tu presencia en redes sociales',
            descriptionEn: 'Optimize your social media presence',
            icon: '📱',
            displayOrder: 5,
        },
        {
            nameEs: 'Video y Multimedia',
            nameEn: 'Video and Multimedia',
            descriptionEs: 'Crea y edita contenido audiovisual',
            descriptionEn: 'Create and edit audiovisual content',
            icon: '🎬',
            displayOrder: 6,
        },
    ];

    for (const category of categories) {
        const existing = await prisma.category.findFirst({
            where: { nameEs: category.nameEs },
        });

        if (!existing) {
            const created = await prisma.category.create({
                data: category,
            });
            console.log('✅ Created category:', created.nameEs);
        } else {
            console.log('⏭️  Category already exists:', existing.nameEs);
        }
    }

    // Create sample agents
    const writingCategory = await prisma.category.findFirst({
        where: { nameEs: 'Redacción y Contenido' },
    });

    if (writingCategory) {
        await prisma.agent.upsert({
            where: { id: '00000000-0000-0000-0000-000000000001' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000001',
                categoryId: writingCategory.id,
                nameEs: 'Asistente de Redacción',
                nameEn: 'Writing Assistant',
                descriptionEs: 'Ayuda con textos profesionales y creativos',
                descriptionEn: 'Help with professional and creative texts',
                systemPrompt:
                    'Eres un asistente experto en redacción. Ayudas a los usuarios a escribir textos profesionales, creativos y bien estructurados. Siempre respondes en el idioma en que te hablan.',
                aiProvider: 'OPENAI',
                modelName: 'gpt-4o-mini',
                hasTools: false,
                createdById: admin.id,
            },
        });

        console.log('✅ Created sample agent: Asistente de Redacción');
    }

    const codeCategory = await prisma.category.findFirst({
        where: { nameEs: 'Desarrollo y Código' },
    });

    if (codeCategory) {
        await prisma.agent.upsert({
            where: { id: '00000000-0000-0000-0000-000000000002' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000002',
                categoryId: codeCategory.id,
                nameEs: 'Asistente de Programación',
                nameEn: 'Programming Assistant',
                descriptionEs: 'Experto en código y desarrollo de software',
                descriptionEn: 'Expert in code and software development',
                systemPrompt:
                    'Eres un asistente experto en programación. Ayudas a los usuarios con código, debugging, arquitectura de software y mejores prácticas. Siempre respondes en el idioma en que te hablan.',
                aiProvider: 'GEMINI',
                modelName: 'gemini-pro',
                hasTools: false,
                createdById: admin.id,
            },
        });

        console.log('✅ Created sample agent: Asistente de Programación');
    }

    const videoCategory = await prisma.category.findFirst({
        where: { nameEs: 'Video y Multimedia' },
    });

    if (videoCategory) {
        await prisma.agent.upsert({
            where: { id: '00000000-0000-0000-0000-000000000003' },
            update: {
                hasTools: true,
                toolsConfig: { tools: ['generateVideo'] },
            },
            create: {
                id: '00000000-0000-0000-0000-000000000003',
                categoryId: videoCategory.id,
                nameEs: 'Generar vídeos',
                nameEn: 'Video Generator',
                descriptionEs: 'Genera videos impresionantes a partir de texto con Veo',
                descriptionEn: 'Generate impressive videos from text with Veo',
                systemPrompt:
                    'Eres un asistente experto en creación de video. Ayudas a los usuarios a generar videos a partir de sus descripciones. Tu objetivo es convertir sus ideas en prompts detallados para generar el mejor video posible. Siempre respondes en el idioma en que te hablan.',
                aiProvider: 'GEMINI',
                modelName: 'veo-3.1-generate-preview',
                hasTools: true,
                toolsConfig: { tools: ['generateVideo'] },
                createdById: admin.id,
            },
        });
        console.log('✅ Created sample agent: Generador de Videos (Veo 3.1)');
    }

    console.log('🎉 Database seed completed!');
    console.log('\n📝 Admin credentials:');
    console.log('   Email: admin@magicai.com');
    console.log('   Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
