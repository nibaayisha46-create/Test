import { Router } from 'express';
import {
  getFilterOptions,
  getSummary,
  getUserReport,
} from '../controllers/reportController.js';
import { validate } from '../middleware/validate.js';
import { listQueryRules } from '../validators/userValidator.js';

const router = Router();

router.get('/users', listQueryRules, validate, getUserReport);
router.get('/summary', listQueryRules, validate, getSummary);
router.get('/filters', getFilterOptions);

export default router;
