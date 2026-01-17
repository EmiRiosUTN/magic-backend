import { prisma } from '../../config/database';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';

export class ProjectsService {
    async create(userId: string, data: CreateProjectDto) {
        const project = await prisma.project.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                color: data.color,
            },
        });

        return project;
    }

    async findAll(userId: string, includeArchived: boolean = false) {
        const projects = await prisma.project.findMany({
            where: {
                userId,
                ...(includeArchived ? {} : { isArchived: false }),
            },
            include: {
                sections: {
                    orderBy: { position: 'asc' },
                    include: {
                        cards: {
                            orderBy: { position: 'asc' },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return projects;
    }

    async findOne(id: string, userId: string) {
        const project = await prisma.project.findFirst({
            where: { id, userId },
            include: {
                sections: {
                    orderBy: { position: 'asc' },
                    include: {
                        cards: {
                            orderBy: { position: 'asc' },
                        },
                    },
                },
            },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        return project;
    }

    async update(id: string, userId: string, data: UpdateProjectDto) {
        // Verify ownership
        const project = await prisma.project.findFirst({
            where: { id, userId },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        const updated = await prisma.project.update({
            where: { id },
            data,
        });

        return updated;
    }

    async archive(id: string, userId: string, isArchived: boolean) {
        return this.update(id, userId, { isArchived });
    }

    async delete(id: string, userId: string) {
        // Verify ownership
        const project = await prisma.project.findFirst({
            where: { id, userId },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        // Only allow deletion of archived projects
        if (!project.isArchived) {
            throw new Error('Only archived projects can be deleted');
        }

        await prisma.project.delete({
            where: { id },
        });

        return { message: 'Project deleted successfully' };
    }
}
