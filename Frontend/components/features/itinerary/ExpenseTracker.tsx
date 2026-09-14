'use client';

// ─── ExpenseTracker ───────────────────────────────────────────────────────────
// Per-trip expense log (Phase 5c): log what you actually spent while travelling
// and see it against your planned budget in real time.
//
// Storage: Firestore backed keyed by itinerary uuid (`itineraries/<shareId>`).
// Currency: ₹ INR via Intl.NumberFormat('en-IN').

import { useCallback, useEffect, useMemo, useState, useReducer } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date of entry
}

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

// ─── Firestore-backed expense store ────────────────────────────────────────
// Expense state stored under users/{uid}/trips/{tripId}/expenseState
// Structure: { expenses: Expense[], budget: number }
// Realtime sync via onSnapshot keeps tabs in sync.
// Uses userId from auth context; falls back to guest mode with shareId as tripId
// when no user is signed in (for backward compatibility with existing shares).

function useFirestoreExpenses(shareId: string | null | undefined, fallbackBudget: number, uid: string | null) {
  // Reducer for expense state
  type State = {
    expenses: Expense[];
    budget: number;
    loading: boolean;
  };
  type Action =
    | { type: 'SET_EXPENSES'; payload: Expense[] }
    | { type: 'SET_BUDGET'; payload: number }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_GUEST_STATE'; payload: { expenses: Expense[]; budget: number; loading: boolean } };

  function expenseReducer(state: State, action: Action): State {
    switch (action.type) {
      case 'SET_EXPENSES':
        return { ...state, expenses: action.payload };
      case 'SET_BUDGET':
        return { ...state, budget: action.payload };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_GUEST_STATE':
        return {
          expenses: action.payload.expenses,
          budget: action.payload.budget,
          loading: action.payload.loading,
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(expenseReducer, {
    expenses: [],
    budget: fallbackBudget || 0,
    loading: true,
  });

  // Determine the trip ID to use for Firestore storage
  const tripId = uid ? shareId ?? 'default' : (shareId || 'guest');
  const expenseRef = uid
    ? doc(db, 'users', uid, 'trips', tripId)
    : null;

  // Load initial state from Firestore (if user) or initialize empty
  useEffect(() => {
    if (!uid || !expenseRef) {
      // Guest mode or no auth: set to empty state
      dispatch({ type: 'SET_GUEST_STATE', payload: { expenses: [], budget: fallbackBudget || 0, loading: false } });
      return;
    }

    const unsubscribe = onSnapshot(expenseRef, (docSnap) => {
      if (!docSnap.exists()) {
        // No existing document: initialize with fallback budget
        dispatch({ type: 'SET_EXPENSES', payload: [] });
        dispatch({ type: 'SET_BUDGET', payload: fallbackBudget || 0 });
        // Create the document with initial state
        setDoc(expenseRef, { expenseState: { expenses: [], budget: fallbackBudget || 0 } });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        const data = docSnap.data();
        const expenseState = data.expenseState || { expenses: [], budget: 0 };
        dispatch({ type: 'SET_EXPENSES', payload: expenseState.expenses || [] });
        dispatch({ type: 'SET_BUDGET', payload: expenseState.budget || 0 });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, (error) => {
      console.warn('[ExpenseTracker] Firestore error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return () => unsubscribe();
  }, [uid, expenseRef, fallbackBudget]);

  // Write expenses to Firestore
  const writeExpenses = useCallback(async (newExpenses: Expense[], newBudget: number) => {
    if (!uid || !expenseRef) return;
    try {
      await updateDoc(expenseRef, {
        expenseState: {
          expenses: newExpenses,
          budget: newBudget
        }
      });
    } catch (error) {
      console.warn('[ExpenseTracker] Failed to write to Firestore:', error);
    }
  }, [uid, expenseRef]);

  return {
    expenses: state.expenses,
    budget: state.budget,
    setExpenses: (newExpenses: Expense[]) => {
      dispatch({ type: 'SET_EXPENSES', payload: newExpenses });
      writeExpenses(newExpenses, state.budget);
    },
    setBudget: (newBudget: number) => {
      dispatch({ type: 'SET_BUDGET', payload: newBudget });
      writeExpenses(state.expenses, newBudget);
    },
    loading: state.loading
  };
}

  
export default function ExpenseTracker({ shareId, budget = 0 }: ExpenseTrackerProps) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { expenses, budget: editableBudget, setExpenses, setBudget, loading } = useFirestoreExpenses(shareId, Number(budget) || 0, uid);

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
    ? 'bg-temple-red-500'
    : pct > 75 ? 'bg-marigold-400' : 'bg-jungle-green-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-3 border-b border-[#EADFD4] pb-2">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
          <span>TRIP EXPENSES</span>
        </h3>
        <div className="font-mono text-[10px] text-naviigo-brown/60 uppercase">
          {expenses.length} {expenses.length === 1 ? 'RECORD' : 'RECORDS'} LOGGED
        </div>
      </div>

      <div className="bg-paper-light rounded-2xl border border-[#EADFD4] p-5 sm:p-6 shadow-sm space-y-5">
        {/* Budget + spent summary stats */}
        <div className="grid grid-cols-3 gap-3 pb-4 border-b border-[#EADFD4]">
          <div>
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-naviigo-brown/50 block mb-1">
              BUDGET
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-mono text-naviigo-brown/60">₹</span>
              <input
                id="expense-budget"
                type="number"
                min={0}
                value={editableBudget || ''}
                onChange={(e) => setBudget(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                aria-label="Trip budget in rupees"
                className="w-24 bg-transparent border-b border-dashed border-naviigo-brown/30 font-mono text-sm sm:text-base font-bold text-naviigo-brown outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-naviigo-brown/50 block mb-1">
              SPENT
            </span>
            <div className={`font-mono text-sm sm:text-base font-bold ${overBudget ? 'text-temple-red-500' : 'text-naviigo-brown'}`}>
              {inr(total)}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-naviigo-brown/50 block mb-1">
              {remaining >= 0 ? 'LEFT' : 'DEFICIT'}
            </span>
            <div className={`font-mono text-sm sm:text-base font-bold ${remaining >= 0 ? 'text-naviigo-teal' : 'text-temple-red-500'}`}>
              {inr(Math.abs(remaining))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {editableBudget > 0 && (
          <div className="w-full h-2 bg-paper-warm rounded-full overflow-hidden border border-[#EADFD4]">
            <div
              className={`h-full ${overBudget ? 'bg-temple-red-500' : 'bg-brand-primary'} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* Add form */}
        <form onSubmit={addExpense} className="flex flex-wrap items-center gap-2 pt-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-naviigo-brown/40">₹</span>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              aria-label="Expense amount in rupees"
              className="w-24 sm:w-28 bg-paper-warm border border-[#EADFD4] rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-naviigo-brown outline-none focus:border-brand-primary placeholder:text-naviigo-brown/40"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Expense category"
            className="bg-paper-warm border border-[#EADFD4] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-naviigo-brown outline-none focus:border-brand-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            aria-label="Expense note"
            className="flex-1 min-w-28 bg-paper-warm border border-[#EADFD4] rounded-xl px-3 py-2 text-xs font-sans text-naviigo-brown outline-none focus:border-brand-primary placeholder:text-naviigo-brown/40"
          />
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-40 text-white text-xs font-mono uppercase font-bold tracking-wider rounded-xl px-4 py-2 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>

        {/* Expense list */}
        {expenses.length > 0 ? (
          <ul className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1 divide-y divide-[#EADFD4]/60">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 group">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-naviigo-brown truncate">
                    {e.note || categoryMeta(e.category).label}
                  </div>
                  <div className="font-mono text-[10px] text-naviigo-brown/50">
                    {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {categoryMeta(e.category).label}
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-naviigo-brown shrink-0">{inr(e.amount)}</div>
                <button
                  type="button"
                  onClick={() => removeExpense(e.id)}
                  aria-label="Delete expense"
                  className="w-6 h-6 rounded flex items-center justify-center text-naviigo-brown/40 hover:text-temple-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center border-t border-[#EADFD4]/60">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-naviigo-brown/70 mb-1">
              NO EXPENSES YET
            </div>
            <p className="font-sans text-xs text-naviigo-brown/50">
              Add the first expense when you&apos;re ready. Entries are archived with your journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
