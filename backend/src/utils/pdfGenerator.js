import PDFDocument from 'pdfkit';

export const buildInvoicePDF = (invoice, settings, dataCallback, endCallback) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  if (settings && settings.companyName) {
    doc.fontSize(16).text(settings.companyName, 50, 50);
    if (settings.companyAddress) {
      doc.fontSize(10).text(settings.companyAddress, 50, 70, { width: 200 });
    }
  }

  doc
    .fontSize(20)
    .text('INVOICE', 50, 50, { align: 'right' })
    .moveDown();

  let yPos = settings && settings.companyAddress ? 120 : 100;

  doc
    .fontSize(10)
    .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, yPos)
    .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, yPos + 15)
    .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 50, yPos + 30)
    .moveDown();

  doc
    .fontSize(14)
    .text('Billed To:')
    .fontSize(10)
    .text(invoice.client.name)
    .text(invoice.client.email)
    .moveDown();

  const tableTop = 250;
  let y = tableTop;

  doc.text('Description', 50, y);
  doc.text('Qty', 280, y, { width: 50, align: 'right' });
  doc.text('Rate', 350, y, { width: 70, align: 'right' });
  doc.text('Amount', 450, y, { width: 70, align: 'right' });

  doc.moveTo(50, y + 15).lineTo(520, y + 15).stroke();

  y += 25;

  invoice.items.forEach(item => {
    doc.text(item.description, 50, y);
    doc.text(item.quantity.toString(), 280, y, { width: 50, align: 'right' });
    doc.text(`$${item.rate.toFixed(2)}`, 350, y, { width: 70, align: 'right' });
    doc.text(`$${item.amount.toFixed(2)}`, 450, y, { width: 70, align: 'right' });
    y += 20;
  });

  doc.moveTo(50, y).lineTo(520, y).stroke();
  y += 15;

  doc.text('Subtotal:', 350, y, { width: 70, align: 'right' });
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 450, y, { width: 70, align: 'right' });
  y += 20;
  
  if (invoice.taxAmount > 0) {
    doc.text('Tax:', 350, y, { width: 70, align: 'right' });
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, 450, y, { width: 70, align: 'right' });
    y += 20;
  }

  doc.fontSize(12).text('Total:', 350, y, { width: 70, align: 'right' });
  doc.fontSize(12).text(`$${invoice.totalAmount.toFixed(2)}`, 450, y, { width: 70, align: 'right' });

  doc.end();
};
