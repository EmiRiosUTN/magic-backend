import { Router } from 'express';
import { SectionsController } from './sections.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const sectionsController = new SectionsController();

// All routes require authentication
router.use(authenticate);

router.post('/', sectionsController.create.bind(sectionsController));
router.put('/:id', sectionsController.update.bind(sectionsController));
router.patch('/reorder', sectionsController.reorder.bind(sectionsController));
router.delete('/:id', sectionsController.delete.bind(sectionsController));

export default router;
