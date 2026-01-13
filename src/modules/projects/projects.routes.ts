import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const projectsController = new ProjectsController();

// All routes require authentication
router.use(authenticate);

router.post('/', projectsController.create.bind(projectsController));
router.get('/', projectsController.findAll.bind(projectsController));
router.get('/:id', projectsController.findOne.bind(projectsController));
router.put('/:id', projectsController.update.bind(projectsController));
router.patch('/:id/archive', projectsController.archive.bind(projectsController));
router.delete('/:id', projectsController.delete.bind(projectsController));

export default router;
