import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true
    },
    companyName: {
      type: String,
      default: ''
    },
    companyAddress: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    defaultCurrency: {
      type: String,
      default: 'USD'
    },
    defaultTaxRate: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
