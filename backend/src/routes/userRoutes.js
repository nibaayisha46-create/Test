import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import {
  createUserRules,
  idParamRule,
  listQueryRules,
  updateUserRules,
} from '../validators/userValidator.js';

const router = Router();

router
  .route('/')
  .get(listQueryRules, validate, listUsers)
  .post(createUserRules, validate, createUser);

router
  .route('/:id')
  .get(idParamRule, validate, getUser)
  .put(updateUserRules, validate, updateUser)
  .delete(idParamRule, validate, deleteUser);

export default router;
