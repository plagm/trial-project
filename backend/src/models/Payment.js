import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Invoice',
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    method: {
      type: String,
      required: true,
      enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'Other'],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
