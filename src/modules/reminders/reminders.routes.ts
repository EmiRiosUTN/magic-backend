import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { remindersController } from './reminders.controller';

const router = Router();

router.use(authenticate);

router.post('/', remindersController.create.bind(remindersController));
router.get('/', remindersController.getAll.bind(remindersController));
router.delete('/:id', remindersController.delete.bind(remindersController));

export default router;
