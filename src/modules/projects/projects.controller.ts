import { Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service';
import { AuthRequest } from '../../middleware/auth';
import { createProjectSchema, updateProjectSchema } from './projects.dto';

const projectsService = new ProjectsService();

export class ProjectsController {
    async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createProjectSchema.parse(req.body);
            const project = await projectsService.create(req.user!.userId, validatedData);
            res.status(201).json(project);
        } catch (error) {
            next(error);
        }
    }

    async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const includeArchived = req.query.includeArchived === 'true';
            const projects = await projectsService.findAll(req.user!.userId, includeArchived);
            res.json({ projects });
        } catch (error) {
            next(error);
        }
    }

    async findOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const project = await projectsService.findOne(req.params.id, req.user!.userId);
            res.json(project);
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateProjectSchema.parse(req.body);
            const project = await projectsService.update(
                req.params.id,
                req.user!.userId,
                validatedData
            );
            res.json(project);
        } catch (error) {
            next(error);
        }
    }

    async archive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { isArchived } = req.body;
            const project = await projectsService.archive(
                req.params.id,
                req.user!.userId,
                isArchived
            );
            res.json(project);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await projectsService.delete(req.params.id, req.user!.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
