import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, attachments }) => {
  // Use ethereal for development, or a real service if configured
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USER || 'leola.howe9@ethereal.email',
      pass: process.env.EMAIL_PASS || 'TpHH5771d1V2X9Q4w9',
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"InvoiceLoop" <noreply@invoiceloop.com>',
    to,
    subject,
    text,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
