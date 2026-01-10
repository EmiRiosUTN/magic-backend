import { prisma } from '../../config/database';

export class AgentsService {
    async getByCategory(categoryId: string, language: string = 'es') {
        const agents = await prisma.agent.findMany({
            where: {
                categoryId,
                isActive: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return agents.map((agent) => ({
            id: agent.id,
            name: language === 'en' ? agent.nameEn : agent.nameEs,
            description: language === 'en' ? agent.descriptionEn : agent.descriptionEs,
            aiProvider: agent.aiProvider,
            hasTools: agent.hasTools,
        }));
    }

    async getById(id: string, language: string = 'es') {
        const agent = await prisma.agent.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        return {
            id: agent.id,
            name: language === 'en' ? agent.nameEn : agent.nameEs,
            description: language === 'en' ? agent.descriptionEn : agent.descriptionEs,
            aiProvider: agent.aiProvider,
            modelName: agent.modelName,
            hasTools: agent.hasTools,
            category: {
                id: agent.category.id,
                name: language === 'en' ? agent.category.nameEn : agent.category.nameEs,
            },
        };
    }

    async create(
        data: {
            categoryId: string;
            nameEs: string;
            nameEn: string;
            descriptionEs?: string;
            descriptionEn?: string;
            systemPrompt: string;
            aiProvider: 'OPENAI' | 'GEMINI';
            modelName: string;
        },
        createdById: string
    ) {
        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw new Error('Category not found');
        }

        const agent = await prisma.agent.create({
            data: {
                categoryId: data.categoryId,
                nameEs: data.nameEs,
                nameEn: data.nameEn,
                descriptionEs: data.descriptionEs,
                descriptionEn: data.descriptionEn,
                systemPrompt: data.systemPrompt,
                aiProvider: data.aiProvider,
                modelName: data.modelName,
                hasTools: false, // Only simple agents for now
                createdById,
            },
        });

        return agent;
    }

    async update(
        id: string,
        data: Partial<{
            categoryId: string;
            nameEs: string;
            nameEn: string;
            descriptionEs: string;
            descriptionEn: string;
            systemPrompt: string;
            aiProvider: 'OPENAI' | 'GEMINI';
            modelName: string;
            isActive: boolean;
        }>
    ) {
        const agent = await prisma.agent.update({
            where: { id },
            data,
        });

        return agent;
    }

    async delete(id: string) {
        // Soft delete
        await prisma.agent.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Agent deleted successfully' };
    }

    async getAll(language: string = 'es') {
        const agents = await prisma.agent.findMany({
            where: { isActive: true },
            include: {
                category: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return agents.map((agent) => ({
            id: agent.id,
            name: language === 'en' ? agent.nameEn : agent.nameEs,
            description: language === 'en' ? agent.descriptionEn : agent.descriptionEs,
            aiProvider: agent.aiProvider,
            hasTools: agent.hasTools,
            category: {
                id: agent.category.id,
                name: language === 'en' ? agent.category.nameEn : agent.category.nameEs,
            },
        }));
    }
}
