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

        // Color mapping based on Spanish names (for consistency)
        const colorMap: Record<string, string> = {
            'Creación de Imágenes': 'from-blue-700 to-blue-600',
            'Redacción y Contenido': 'from-green-700 to-green-600',
            'Desarrollo y Código': 'from-red-700 to-red-600',
            'Análisis de Datos': 'from-purple-700 to-purple-600',
            'Redes Sociales': 'from-indigo-700 to-indigo-600',
            'Video y Multimedia': 'from-teal-700 to-teal-600',
        };

        const textColorMap: Record<string, string> = {
            'Creación de Imágenes': 'text-blue-700',
            'Redacción y Contenido': 'text-green-700',
            'Desarrollo y Código': 'text-red-700',
            'Análisis de Datos': 'text-purple-700',
            'Redes Sociales': 'text-indigo-700',
            'Video y Multimedia': 'text-teal-700',
        };

        const borderColorMap: Record<string, string> = {
            'Creación de Imágenes': 'hover:border-blue-700 hover:border-t-4',
            'Redacción y Contenido': 'hover:border-green-700 hover:border-t-4',
            'Desarrollo y Código': 'hover:border-red-700 hover:border-t-4',
            'Análisis de Datos': 'hover:border-purple-700 hover:border-t-4',
            'Redes Sociales': 'hover:border-indigo-700 hover:border-t-4',
            'Video y Multimedia': 'hover:border-teal-700 hover:border-t-4',
        };

        const iconMap: Record<string, string> = {
            'Creación de Imágenes': 'Image',
            'Redacción y Contenido': 'Pencil',
            'Desarrollo y Código': 'Code',
            'Análisis de Datos': 'BarChart3',
            'Redes Sociales': 'Smartphone',
            'Video y Multimedia': 'Video',
        };

        return categories.map((category) => {
            const nameEs = category.nameEs.trim();

            return {
                id: category.id,
                name: language === 'en' ? category.nameEn : category.nameEs,
                description: language === 'en' ? category.descriptionEn : category.descriptionEs,
                icon: iconMap[nameEs] || 'Image',
                displayOrder: category.displayOrder,
                agentCount: category._count.agents,
                color: colorMap[nameEs] || 'from-slate-500 to-slate-400',
                textColor: textColorMap[nameEs] || 'text-slate-500',
                borderColor: borderColorMap[nameEs] || 'hover:border-slate-500 hover:border-t-4',
            };
        });
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
