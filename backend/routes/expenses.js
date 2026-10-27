import express from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

const router = express.Router();
const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

router.get('/', async (_req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch expenses.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title?.trim() || amount === '' || !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 || !categories.includes(category) ||
        !date || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ message: 'Enter a title, a positive amount, a valid category, and a valid date.' });
    }
    const expense = await Expense.create({ title: title.trim(), amount: Number(amount), category, date });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not add expense.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid expense ID.' });
    }
    const { title, amount, category, date } = req.body;
    if (!title?.trim() || amount === '' || !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0 || !categories.includes(category) ||
        !date || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ message: 'Enter a title, a positive amount, a valid category, and a valid date.' });
    }
    const updated = await Expense.findByIdAndUpdate(
      id,
      { title: title.trim(), amount: Number(amount), category, date },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Expense not found.' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not update expense.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID.' });
    }
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete expense.' });
  }
});

export default router;
