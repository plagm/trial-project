import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  exportInvoicePdf,
  emailInvoice,
  exportInvoicesCSV
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getInvoices);
router.get('/export/csv', exportInvoicesCSV);
router.post('/', createInvoice);
router.route('/:id').get(protect, getInvoiceById).put(protect, updateInvoice).delete(protect, deleteInvoice);
router.route('/:id/export').get(protect, exportInvoicePdf);
router.route('/:id/email').post(protect, emailInvoice);

export default router;
