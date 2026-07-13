import Expense from '../models/Expense.js';
import { Parser } from 'json2csv';

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      user: req.user._id,
    });
    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (expense) {
      res.json({ message: 'Expense removed' });
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportExpensesCSV = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    
    const formattedExpenses = expenses.map(expense => ({
      Date: expense.date ? expense.date.toISOString().split('T')[0] : '',
      Category: expense.category,
      Description: expense.description,
      Amount: expense.amount,
    }));

    if (formattedExpenses.length === 0) {
      return res.status(404).json({ message: 'No expenses found to export' });
    }

    const fields = Object.keys(formattedExpenses[0]);
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(formattedExpenses);

    res.header('Content-Type', 'text/csv');
    res.attachment('expenses_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting expenses CSV:', error);
    res.status(500).json({ message: 'Failed to export expenses CSV' });
  }
};
