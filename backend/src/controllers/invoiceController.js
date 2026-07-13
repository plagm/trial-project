import Invoice from '../models/Invoice.js';
import Setting from '../models/Setting.js';
import { z } from 'zod';
import { buildInvoicePDF } from '../utils/pdfGenerator.js';
import { sendEmail } from '../utils/email.js';
import { Parser } from 'json2csv';

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  rate: z.number().min(0),
  amount: z.number().min(0),
});

const invoiceSchema = z.object({
  client: z.string().min(1),
  invoiceNumber: z.string().min(1),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']).optional(),
  issueDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  items: z.array(invoiceItemSchema).min(1),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client', 'name email address');
    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const validatedData = invoiceSchema.parse(req.body);
    const invoice = new Invoice({
      ...validatedData,
      user: req.user._id,
    });
    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const validatedData = invoiceSchema.partial().parse(req.body);
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

    if (invoice) {
      Object.assign(invoice, validatedData);
      const updatedInvoice = await invoice.save();
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (invoice) {
      res.json({ message: 'Invoice removed' });
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const stream = res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment;filename=invoice_${invoice.invoiceNumber}.pdf`,
    });

    const settings = await Setting.findOne({ user: req.user._id });

    buildInvoicePDF(
      invoice,
      settings,
      (chunk) => stream.write(chunk),
      () => stream.end()
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const targetEmail = req.body.email || (invoice.client && invoice.client.email);

    if (!targetEmail) {
      return res.status(400).json({ message: 'No email address provided or found for client' });
    }

    const settings = await Setting.findOne({ user: req.user._id });

    // Generate PDF in memory
    const chunks = [];
    buildInvoicePDF(
      invoice,
      settings,
      (chunk) => chunks.push(chunk),
      async () => {
        const pdfBuffer = Buffer.concat(chunks);
        
        try {
          await sendEmail({
            to: targetEmail,
            subject: `Invoice ${invoice.invoiceNumber} from ${settings?.companyName || 'Us'}`,
            text: `Please find attached your invoice ${invoice.invoiceNumber}.`,
            attachments: [
              {
                filename: `invoice_${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
          });
          
          invoice.status = 'Sent';
          await invoice.save();

          res.json({ message: 'Email sent successfully', invoice });
        } catch (emailError) {
          res.status(500).json({ message: 'Failed to send email: ' + emailError.message });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportInvoicesCSV = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).populate('client', 'name email');
    
    const formattedInvoices = invoices.map(invoice => ({
      InvoiceNumber: invoice.invoiceNumber,
      ClientName: invoice.client ? invoice.client.name : 'N/A',
      ClientEmail: invoice.client ? invoice.client.email : 'N/A',
      Status: invoice.status,
      IssueDate: invoice.issueDate ? invoice.issueDate.toISOString().split('T')[0] : '',
      DueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : '',
      Subtotal: invoice.subtotal,
      TaxRate: invoice.taxRate,
      TaxAmount: invoice.taxAmount,
      TotalAmount: invoice.totalAmount,
      AmountPaid: invoice.amountPaid,
    }));

    if (formattedInvoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found to export' });
    }

    const fields = Object.keys(formattedInvoices[0]);
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(formattedInvoices);

    res.header('Content-Type', 'text/csv');
    res.attachment('invoices_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting invoices CSV:', error);
    res.status(500).json({ message: 'Failed to export invoices CSV' });
  }
};
