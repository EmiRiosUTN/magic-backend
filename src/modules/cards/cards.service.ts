import { prisma } from '../../config/database';
import { CreateCardDto, UpdateCardDto, MoveCardDto, ReorderCardsDto } from './cards.dto';

export class CardsService {
    async create(userId: string, data: CreateCardDto) {
        // Verify section ownership through project
        const section = await prisma.section.findUnique({
            where: { id: data.sectionId },
            include: { project: true },
        });

        if (!section || section.project.userId !== userId) {
            throw new Error('Section not found');
        }

        // Get the highest position in this section
        const lastCard = await prisma.card.findFirst({
            where: { sectionId: data.sectionId },
            orderBy: { position: 'desc' },
        });

        const position = lastCard ? lastCard.position + 1 : 0;

        const card = await prisma.card.create({
            data: {
                sectionId: data.sectionId,
                title: data.title,
                description: data.description,
                priority: data.priority || 'MEDIUM',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                position,
            },
        });

        return card;
    }

    async update(id: string, userId: string, data: UpdateCardDto) {
        // Verify ownership through section and project
        const card = await prisma.card.findUnique({
            where: { id },
            include: {
                section: {
                    include: { project: true },
                },
            },
        });

        if (!card || card.section.project.userId !== userId) {
            throw new Error('Card not found');
        }

        const updated = await prisma.card.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
        });

        return updated;
    }

    async move(id: string, userId: string, data: MoveCardDto) {
        console.log('🔧 [MOVE CARD] Starting:', { cardId: id, targetSection: data.targetSectionId, newPosition: data.newPosition });

        // Verify card ownership
        const card = await prisma.card.findUnique({
            where: { id },
            include: {
                section: {
                    include: { project: true },
                },
            },
        });

        if (!card || card.section.project.userId !== userId) {
            throw new Error('Card not found');
        }

        // Verify target section ownership
        const targetSection = await prisma.section.findUnique({
            where: { id: data.targetSectionId },
            include: { project: true },
        });

        if (!targetSection || targetSection.project.userId !== userId) {
            throw new Error('Target section not found');
        }

        const sourceSectionId = card.sectionId;
        const targetSectionId = data.targetSectionId;
        const isSameSection = sourceSectionId === targetSectionId;

        await prisma.$transaction(async (tx) => {
            if (isSameSection) {
                // Reordering within the same section
                const oldPosition = card.position;
                const newPosition = data.newPosition;

                if (oldPosition === newPosition) return;

                if (oldPosition < newPosition) {
                    // Moving down: shift cards between old and new position up
                    await tx.card.updateMany({
                        where: {
                            sectionId: sourceSectionId,
                            position: {
                                gt: oldPosition,
                                lte: newPosition,
                            },
                        },
                        data: {
                            position: {
                                decrement: 1,
                            },
                        },
                    });
                } else {
                    // Moving up: shift cards between new and old position down
                    await tx.card.updateMany({
                        where: {
                            sectionId: sourceSectionId,
                            position: {
                                gte: newPosition,
                                lt: oldPosition,
                            },
                        },
                        data: {
                            position: {
                                increment: 1,
                            },
                        },
                    });
                }

                // Update the moved card
                await tx.card.update({
                    where: { id },
                    data: { position: newPosition },
                });
            } else {
                // Moving to a different section

                // 1. Shift cards in source section (fill the gap)
                await tx.card.updateMany({
                    where: {
                        sectionId: sourceSectionId,
                        position: { gt: card.position },
                    },
                    data: {
                        position: {
                            decrement: 1,
                        },
                    },
                });

                // 2. Make space in target section
                await tx.card.updateMany({
                    where: {
                        sectionId: targetSectionId,
                        position: { gte: data.newPosition },
                    },
                    data: {
                        position: {
                            increment: 1,
                        },
                    },
                });

                // 3. Move the card to new section and position
                await tx.card.update({
                    where: { id },
                    data: {
                        sectionId: targetSectionId,
                        position: data.newPosition,
                    },
                });
            }
        });

        return { message: 'Card moved successfully' };
    }

    async reorder(userId: string, data: ReorderCardsDto) {
        // Verify section ownership
        const section = await prisma.section.findUnique({
            where: { id: data.sectionId },
            include: { project: true },
        });

        if (!section || section.project.userId !== userId) {
            throw new Error('Section not found');
        }

        // Update positions in a transaction
        await prisma.$transaction(
            data.cards.map((card) =>
                prisma.card.update({
                    where: { id: card.id },
                    data: { position: card.position },
                })
            )
        );

        return { message: 'Cards reordered successfully' };
    }

    async delete(id: string, userId: string) {
        // Verify ownership through section and project
        const card = await prisma.card.findUnique({
            where: { id },
            include: {
                section: {
                    include: { project: true },
                },
            },
        });

        if (!card || card.section.project.userId !== userId) {
            throw new Error('Card not found');
        }

        await prisma.card.delete({
            where: { id },
        });

        return { message: 'Card deleted successfully' };
    }
}
