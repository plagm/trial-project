import express from 'express';
import { getExpenses, createExpense, deleteExpense, exportExpensesCSV } from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getExpenses);
router.get('/export/csv', exportExpensesCSV);
router.post('/', createExpense);

router.delete('/:id', deleteExpense);

export default router;
