import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { validate } from '../../middleware/validation';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { i18nMiddleware } from '../../middleware/i18n';
import {
    createCategorySchema,
    updateCategorySchema,
    deleteCategorySchema,
} from './categories.validation';

const router = Router();
const categoriesController = new CategoriesController();

// Public routes (with i18n)
router.get('/', authenticate, i18nMiddleware, categoriesController.getAll.bind(categoriesController));
router.get('/:id', authenticate, i18nMiddleware, categoriesController.getById.bind(categoriesController));

// Admin only routes
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), categoriesController.create.bind(categoriesController));
router.put('/:id', authenticate, requireAdmin, validate(updateCategorySchema), categoriesController.update.bind(categoriesController));
router.delete('/:id', authenticate, requireAdmin, validate(deleteCategorySchema), categoriesController.delete.bind(categoriesController));

export default router;
