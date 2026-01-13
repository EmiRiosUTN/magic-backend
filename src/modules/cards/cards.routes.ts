import { Router } from 'express';
import { CardsController } from './cards.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const cardsController = new CardsController();

// All routes require authentication
router.use(authenticate);

router.post('/', cardsController.create.bind(cardsController));
router.put('/:id', cardsController.update.bind(cardsController));
router.patch('/:id/move', cardsController.move.bind(cardsController));
router.patch('/reorder', cardsController.reorder.bind(cardsController));
router.delete('/:id', cardsController.delete.bind(cardsController));

export default router;
