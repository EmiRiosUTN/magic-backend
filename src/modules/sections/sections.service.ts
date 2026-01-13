import { prisma } from '../../config/database';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './sections.dto';

export class SectionsService {
    async create(userId: string, data: CreateSectionDto) {
        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: { id: data.projectId, userId },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        // Get the highest position in this project
        const lastSection = await prisma.section.findFirst({
            where: { projectId: data.projectId },
            orderBy: { position: 'desc' },
        });

        const position = lastSection ? lastSection.position + 1 : 0;

        const section = await prisma.section.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                position,
            },
        });

        return section;
    }

    async update(id: string, userId: string, data: UpdateSectionDto) {
        // Verify ownership through project
        const section = await prisma.section.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!section || section.project.userId !== userId) {
            throw new Error('Section not found');
        }

        const updated = await prisma.section.update({
            where: { id },
            data: { name: data.name },
        });

        return updated;
    }

    async reorder(userId: string, data: ReorderSectionsDto) {
        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: { id: data.projectId, userId },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        // Update positions in a transaction
        await prisma.$transaction(
            data.sections.map((section) =>
                prisma.section.update({
                    where: { id: section.id },
                    data: { position: section.position },
                })
            )
        );

        return { message: 'Sections reordered successfully' };
    }

    async delete(id: string, userId: string) {
        // Verify ownership through project
        const section = await prisma.section.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!section || section.project.userId !== userId) {
            throw new Error('Section not found');
        }

        await prisma.section.delete({
            where: { id },
        });

        return { message: 'Section deleted successfully' };
    }
}
