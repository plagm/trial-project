import mongoose from 'mongoose';
import argon2 from 'argon2';

const updatePass = async () => {
  await mongoose.connect('mongodb+srv://prakshepsinghkhenwar_db_user:leomessi@cluster0.twvubfv.mongodb.net/invoiceloop');
  const User = mongoose.model('User', new mongoose.Schema({ email: String, passwordHash: String, isVerified: Boolean }, { strict: false }));
  const hash = await argon2.hash('DemoPassword123!');
  await User.updateOne({ email: 'prakshepsinghkhenwar@gmail.com' }, { $set: { passwordHash: hash, isVerified: true } });
  console.log('Password set for demo');
  process.exit(0);
};

updatePass();
