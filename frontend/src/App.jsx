import { useCallback, useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:5000/api/expenses';
const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];
const today = () => new Date().toLocaleDateString('en-CA');

const blankForm = () => ({ title: '', amount: '', category: 'Food', date: today() });

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load expenses.');
      setExpenses(data);
    } catch (err) {
      setError(err.message || 'Could not connect to the backend. Check that it is running and MongoDB is connected.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  function changeField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(blankForm());
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const amount = Number(form.amount);
    if (!form.title.trim()) return setError('Please enter an expense title.');
    if (!Number.isFinite(amount) || amount <= 0) return setError('Amount must be greater than zero.');
    if (!form.date || Number.isNaN(Date.parse(form.date))) return setError('Please select a valid date.');

    setSaving(true);
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, title: form.title.trim(), amount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save expense.');
      setMessage(editingId ? 'Expense updated successfully.' : 'Expense added successfully.');
      resetForm();
      await loadExpenses();
    } catch (err) {
      setError(err.message || 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(expense) {
    setEditingId(expense._id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10)
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteExpense(expense) {
    if (!window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) return;
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API}/${expense._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete expense.');
      if (editingId === expense._id) resetForm();
      setMessage('Expense deleted successfully.');
      await loadExpenses();
    } catch (err) {
      setError(err.message || 'Could not delete expense.');
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Expense Tracker home">
          <span className="brand-mark">₹</span>
          <span>pocket<span className="brand-light">wise</span></span>
        </a>
        <span className="topbar-label">PERSONAL FINANCE</span>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">YOUR MONEY, IN FOCUS</p>
          <h1>Expense tracker<span>.</span></h1>
          <p className="subtitle">A clearer view of where your money goes.</p>
        </div>
        <div className="today-chip"><span className="online-dot" /> Your spending overview</div>
      </section>

      <section className="summary-card" aria-label="Total amount spent">
        <div className="summary-copy">
          <span className="summary-label">TOTAL AMOUNT SPENT</span>
          <h2>{formatMoney(total)}</h2>
          <p>Across {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</p>
        </div>
        <div className="summary-icon" aria-hidden="true">↗</div>
        <div className="summary-decoration decoration-one" />
        <div className="summary-decoration decoration-two" />
      </section>

      {(message || error) && (
        <div className={`notice ${error ? 'notice-error' : 'notice-success'}`} role="status">
          <span>{error ? '!' : '✓'}</span>{error || message}
          <button type="button" className="notice-close" onClick={() => { setMessage(''); setError(''); }} aria-label="Dismiss message">×</button>
        </div>
      )}

      <section className="content-grid">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId ? 'MAKE A CHANGE' : 'KEEP TRACK'}</p>
              <h2>{editingId ? 'Edit expense' : 'Add an expense'}</h2>
            </div>
            <span className="panel-symbol">{editingId ? '✎' : '+'}</span>
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="title">Expense title</label>
            <input id="title" name="title" value={form.title} onChange={changeField} placeholder="e.g. Lunch with friends" maxLength="100" required />
            <div className="two-fields">
              <div>
                <label htmlFor="amount">Amount (₹)</label>
                <div className="amount-input"><span>₹</span><input id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={changeField} placeholder="0.00" required /></div>
              </div>
              <div>
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={changeField}>
                  {categories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
            </div>
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={changeField} required />
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'} <span>→</span>
            </button>
            {editingId && <button className="cancel-button" type="button" onClick={resetForm}>Cancel editing</button>}
          </form>
          <p className="form-footnote"><span>●</span> Your expenses are saved to the database.</p>
        </section>

        <section className="panel list-panel">
          <div className="panel-heading list-heading">
            <div>
              <p className="eyebrow">YOUR RECORDS</p>
              <h2>Recent expenses</h2>
            </div>
            <span className="count-pill">{expenses.length} total</span>
          </div>

          {loading ? (
            <div className="empty-state"><span className="empty-icon">◌</span><h3>Loading expenses…</h3><p>Fetching your saved records.</p></div>
          ) : expenses.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">＋</span><h3>No expenses yet</h3><p>Add your first expense using the form to see it here.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>EXPENSE</th><th>DATE</th><th>AMOUNT</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense._id}>
                      <td>
                        <div className="expense-name">{expense.title}</div>
                        <span className={`category-tag category-${expense.category.toLowerCase()}`}>{expense.category}</span>
                      </td>
                      <td className="date-cell">{formatDate(expense.date)}</td>
                      <td className="amount-cell">{formatMoney(expense.amount)}</td>
                      <td><div className="actions">
                        <button type="button" className="icon-button edit-button" onClick={() => beginEdit(expense)} aria-label={`Edit ${expense.title}`} title="Edit">✎</button>
                        <button type="button" className="icon-button delete-button" onClick={() => deleteExpense(expense)} aria-label={`Delete ${expense.title}`} title="Delete">×</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="list-footer"><span className="online-dot" /> Changes sync with your database</div>
        </section>
      </section>
      <footer>Spend thoughtfully. <span>One day at a time.</span></footer>
    </main>
  );
}
