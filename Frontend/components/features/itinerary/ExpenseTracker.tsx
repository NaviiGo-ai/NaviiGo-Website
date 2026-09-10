'use client';

// ─── ExpenseTracker ───────────────────────────────────────────────────────────
// Per-trip expense log (Phase 5c): log what you actually spent while travelling
// and see it against your planned budget in real time.
//
// Storage: localStorage keyed by trip uuid (`navii_expenses_<uuid>`) — works
// offline (PWA) and for guest itineraries without requiring Firestore auth.
// Reads are held in React state so there is no hydration mismatch and two open
// tabs stay in sync via the `storage` event.
// Currency: ₹ INR via Intl.NumberFormat('en-IN').

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date of entry
}

interface StoredState {
  expenses: Expense[];
  budget: number;
}

const EMPTY: StoredState = { expenses: [], budget: 0 };

const CATEGORIES = [
  { id: 'transport', label: 'Transport', emoji: '🚆' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'stay', label: 'Stay', emoji: '🏨' },
  { id: 'activities', label: 'Activities', emoji: '🎫' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'other', label: 'Other', emoji: '✨' },
] as const;

const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface ExpenseTrackerProps {
  shareId?: string | null;
  budget?: number;
}

// ─── localStorage-backed expense store ────────────────────────────────────────
// The raw stored string lives in React state: `undefined` until the mount effect
// reads localStorage, so the server render and the first client paint both show
// EMPTY and hydration matches. Parsing it in a memo keyed by that string keeps
// the returned object referentially stable — effects and memo deps rely on that,
// and returning a fresh object per call is what used to blow the render loop up.
function useStoredExpenses(key: string, fallbackBudget: number) {
  const [raw, setRaw] = useState<string | null | undefined>(undefined);

  const write = useCallback(
    (next: StoredState) => {
      const serialized = JSON.stringify(next);
      try {
        window.localStorage.setItem(key, serialized);
      } catch {
        // non-fatal (private mode / quota exceeded)
      }
      setRaw(serialized);
    },
    [key]
  );

  useEffect(() => {
    const read = () => {
      try {
        setRaw(window.localStorage.getItem(key));
      } catch {
        setRaw(null);
      }
    };
    read();
    // Another tab writing the same key fires this; same-tab writes go through `write`.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) read();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const stored = useMemo<StoredState>(() => {
    if (raw === undefined) return EMPTY;
    // Nothing stored yet: fall back to the planned budget without persisting it,
    // so a guest who never logs anything leaves no entry behind. The first write
    // (adding an expense, editing the budget) persists it for real.
    if (raw === null) return fallbackBudget > 0 ? { expenses: [], budget: fallbackBudget } : EMPTY;
    try {
      const parsed = JSON.parse(raw);
      return {
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        budget: typeof parsed.budget === 'number' ? parsed.budget : 0,
      };
    } catch {
      return EMPTY;
    }
  }, [raw, fallbackBudget]);

  const setExpenses = useCallback(
    (list: Expense[]) => write({ expenses: list, budget: stored.budget }),
    [stored.budget, write]
  );
  const setBudget = useCallback(
    (b: number) => write({ expenses: stored.expenses, budget: b }),
    [stored.expenses, write]
  );

  return { expenses: stored.expenses, budget: stored.budget, setExpenses, setBudget };
}

  
export default function ExpenseTracker({ shareId, budget = 0 }: ExpenseTrackerProps) {
  const storageKey = `navii_expenses_${shareId || 'guest'}`;
  const { expenses, budget: editableBudget, setExpenses, setBudget } = useStoredExpenses(storageKey, Number(budget) || 0);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [note, setNote] = useState('');

  const total = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const remaining = editableBudget - total;
  const pct = editableBudget > 0 ? Math.min(100, (total / editableBudget) * 100) : 0;
  const overBudget = editableBudget > 0 && total > editableBudget;

  const addExpense = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const entry: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount: Math.round(value),
      category,
      note: note.trim(),
      date: new Date().toISOString(),
    };
    setExpenses([entry, ...expenses]);
    setAmount('');
    setNote('');
  }, [amount, category, note, expenses, setExpenses]);

  const removeExpense = useCallback((id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  }, [expenses, setExpenses]);

  const categoryMeta = useCallback((id: string) => {
    return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
  }, []);

  const groupByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + (Number(e.amount) || 0));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const barColor = overBudget
    ? 'bg-red-500'
    : pct > 75 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><span>🧾</span> Trip Expenses</h2>
        <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          <Wallet className="inline w-3 h-3 mr-1 -mt-0.5" />
          {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm space-y-4">
        {/* Budget + spent summary */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label htmlFor="expense-budget" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block">Trip Budget</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-400">₹</span>
              <input
                id="expense-budget"
                type="number"
                min={0}
                value={editableBudget || ''}
                onChange={(e) => setBudget(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 30000"
                aria-label="Trip budget in rupees"
                className="w-32 bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Spent</div>
            <div className={`text-xl font-black ${overBudget ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>{inr(total)}</div>
            <div className={`text-xs font-semibold mt-0.5 ${overBudget ? 'text-red-500' : remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {editableBudget > 0 ? `${inr(Math.abs(remaining))} ${remaining >= 0 ? 'left' : 'over budget'}` : 'Set a budget to track'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {editableBudget > 0 && (
          <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${pct.toFixed(0)} percent of budget spent`}
            />
          </div>
        )}

        {/* Add form */}
        <form onSubmit={addExpense} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₹</span>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              aria-label="Expense amount in rupees"
              className="w-28 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-emerald-500 placeholder:text-zinc-400 placeholder:font-medium"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Expense category"
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            aria-label="Expense note"
            className="flex-1 min-w-32 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-emerald-500 placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl px-4 py-2.5 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Breakdown by category */}
        {groupByCategory.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groupByCategory.map(([catId, sum]) => (
              <div key={catId} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                  {categoryMeta(catId).emoji} {categoryMeta(catId).label}
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white">{inr(sum)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Expense list */}
        {expenses.length > 0 && (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group">
                <span className="text-lg w-7 text-center shrink-0">{categoryMeta(e.category).emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {e.note || categoryMeta(e.category).label}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium">
                    {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {categoryMeta(e.category).label}
                  </div>
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white shrink-0">{inr(e.amount)}</div>
                <button
                  type="button"
                  onClick={() => removeExpense(e.id)}
                  aria-label={`Delete expense ${e.note || categoryMeta(e.category).label} of ${inr(e.amount)}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {expenses.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
            No expenses logged yet — add your first one above. 🧳
          </p>
        )}
      </div>
    </div>
  );
}
