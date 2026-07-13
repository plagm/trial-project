import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Client from './src/models/Client.js';
import Invoice from './src/models/Invoice.js';
import Expense from './src/models/Expense.js';

dotenv.config();

const SEED_COUNT = 10;

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the user (or get the first one)
    let user = await User.findOne({ email: 'prakshepsinghkhenwar@gmail.com' });
    if (!user) {
      user = await User.findOne({});
      if (!user) {
        console.error('No user found to associate data with.');
        process.exit(1);
      }
    }
    
    console.log(`Seeding data for user: ${user.email}`);

    // Create 10 Clients
    const clientsData = Array.from({ length: SEED_COUNT }).map((_, i) => ({
      user: user._id,
      name: `Acme Corp ${i + 1}`,
      email: `contact${i + 1}@acmecorp.com`,
      address: {
        street: `${100 + i} Main St`,
        city: 'Metropolis',
        state: 'NY',
        zip: `1000${i}`,
        country: 'USA'
      }
    }));
    const createdClients = await Client.insertMany(clientsData);
    console.log('Created 10 clients');

    // Create 10 Invoices
    const statuses = ['Draft', 'Sent', 'Paid', 'Overdue'];
    const invoicesData = createdClients.map((client, i) => {
      const items = [
        { description: 'Web Development Services', quantity: 40, rate: 100, amount: 4000 },
        { description: 'Hosting (1 Year)', quantity: 1, rate: 150, amount: 150 }
      ];
      
      const subtotal = 4150;
      const taxRate = 10;
      const taxAmount = 415;
      const totalAmount = 4565;

      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - i * 5); // Spread over past 50 days

      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days terms

      return {
        user: user._id,
        client: client._id,
        invoiceNumber: `INV-${1000 + i}`,
        status: statuses[i % statuses.length],
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        amountPaid: (i % 4 === 2) ? totalAmount : 0, // If Paid, amountPaid = totalAmount
        notes: 'Thank you for your business!'
      };
    });
    
    await Invoice.insertMany(invoicesData);
    console.log('Created 10 invoices');

    // Create 10 Expenses
    const expenseCategories = ['Software', 'Office', 'Travel', 'Marketing', 'Other'];
    const expensesData = Array.from({ length: SEED_COUNT }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 3); // Spread over past 30 days

      return {
        user: user._id,
        date,
        category: expenseCategories[i % expenseCategories.length],
        amount: Math.floor(Math.random() * 500) + 50,
        description: `Expense item ${i + 1}`
      };
    });
    
    await Expense.insertMany(expensesData);
    console.log('Created 10 expenses');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
