import { prisma } from '../../config/database';

export class CategoriesService {
    async getAll(language: string = 'es') {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: {
                    select: { agents: { where: { isActive: true } } },
                },
            },
        });

        return categories.map((category) => ({
            id: category.id,
            name: language === 'en' ? category.nameEn : category.nameEs,
            description: language === 'en' ? category.descriptionEn : category.descriptionEs,
            icon: category.icon,
            displayOrder: category.displayOrder,
            agentCount: category._count.agents,
        }));
    }

    async getById(id: string, language: string = 'es') {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { agents: { where: { isActive: true } } },
                },
            },
        });

        if (!category) {
            throw new Error('Category not found');
        }

        return {
            id: category.id,
            name: language === 'en' ? category.nameEn : category.nameEs,
            description: language === 'en' ? category.descriptionEn : category.descriptionEs,
            icon: category.icon,
            displayOrder: category.displayOrder,
            agentCount: category._count.agents,
        };
    }

    async create(data: {
        nameEs: string;
        nameEn: string;
        descriptionEs?: string;
        descriptionEn?: string;
        icon?: string;
        displayOrder?: number;
    }) {
        const category = await prisma.category.create({
            data: {
                nameEs: data.nameEs,
                nameEn: data.nameEn,
                descriptionEs: data.descriptionEs,
                descriptionEn: data.descriptionEn,
                icon: data.icon,
                displayOrder: data.displayOrder || 0,
            },
        });

        return category;
    }

    async update(id: string, data: Partial<{
        nameEs: string;
        nameEn: string;
        descriptionEs: string;
        descriptionEn: string;
        icon: string;
        displayOrder: number;
        isActive: boolean;
    }>) {
        const category = await prisma.category.update({
            where: { id },
            data,
        });

        return category;
    }

    async delete(id: string) {
        // Soft delete by setting isActive to false
        await prisma.category.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Category deleted successfully' };
    }
}
