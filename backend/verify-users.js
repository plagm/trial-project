import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    const result = await User.updateMany(
      { isVerified: { $ne: true } }, 
      { $set: { isVerified: true } }
    );
    console.log(`Successfully verified ${result.modifiedCount} users!`);
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
