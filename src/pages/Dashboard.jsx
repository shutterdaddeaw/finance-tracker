import React, { useEffect, useState, useMemo } from 'react';
import {
  getTransactions,
  getInvestments,
  getDebts,
  getAccounts,
  updateDebt,
  addTransaction
} from '../api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Filter,
  Calendar,
  Building2
} from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [data, setData] = useState({
    transactions: [],
    investments: [],
    debts: [],
    accounts: []
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    dateRange: 'thisMonth', // thisMonth, lastMonth, all, custom
    account: 'all',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    const [txs, invs, dbt, accs] = await Promise.all([
      getTransactions(),
      getInvestments(),
      getDebts(),
      getAccounts()
    ]);
    setData({
      transactions: txs,
      investments: invs,
      debts: dbt,
      accounts: accs
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    let txs = [...data.transactions];
    let debts = [...data.debts];
    let investments = [...data.investments];

    // 1. Account Filter
    if (filters.account !== 'all') {
      txs = txs.filter(t => t.account === filters.account);
      // For debts, use sourceAccount
      debts = debts.filter(d => d.sourceAccount === filters.account);
      // Investments might not have account link yet, ignoring for now or filtering if field exists
    }

    // 2. Date Filter (Applied mainly to Transactions)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    if (filters.dateRange === 'thisMonth') {
      txs = txs.filter(t => new Date(t.date) >= startOfMonth);
    } else if (filters.dateRange === 'lastMonth') {
      txs = txs.filter(t => {
        const d = new Date(t.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      txs = txs.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    return { transactions: txs, debts, investments };
  }, [data, filters]);

  // --- Calculations ---

  // 1. Cash Balance (Base + Income - Expense)
  // If 'all' accounts: Sum(Accounts.initial) + Sum(Income) - Sum(Expense)
  // If specific account: Account.initial + AccountIncome - AccountExpense
  const currentCash = useMemo(() => {
    if (filters.account !== 'all') {
      const acc = data.accounts.find(a => a.name === filters.account);
      if (!acc) return 0;
      const income = filteredData.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = filteredData.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);
      return Number(acc.initialBalance) + income - expense;
    } else {
      // Global
      const totalInitial = data.accounts.reduce((s, a) => s + Number(a.initialBalance), 0);
      // Note: We used filtered transactions based on date? 
      // Logic Gap: 'Current Cash' usually implies 'Right Now' regardless of Date Filter.
      // However, if user selects "Last Month", they might expect "Cash Flow" not "Balance".
      // Use Case: Dashboard Header usually shows "Current Stats".
      // Let's keep "Current Balance" largely ignoring Date Filter (always All Time for balance), but respecting Account Filter.

      // Re-calculating for Balance (ignoring date filter for balance correctness)
      const relevantTxs = filters.account === 'all'
        ? data.transactions
        : data.transactions.filter(t => t.account === filters.account);

      const income = relevantTxs.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = relevantTxs.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);

      return totalInitial + income - expense;
    }
  }, [data, filters.account]);

  // 2. Income vs Expense (Respects Date Filter)
  const incomeTotal = filteredData.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
  const expenseTotal = filteredData.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);

  // 3. Investments & Debts (Snapshot)
  const totalInvestments = filteredData.investments.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.currentMarketPrice || item.avgPrice)), 0);
  const totalDebt = filteredData.debts.reduce((sum, item) => sum + Number(item.remainingAmount), 0);

  const netWorth = currentCash + totalInvestments - totalDebt;

  // 4. Charts Data
  const expensesByCategory = useMemo(() => {
    const groups = {};
    filteredData.transactions.filter(t => t.type === 'Expense').forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData.transactions]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  // 5. Debt Alerts (Global check)
  const upcomingDebts = useMemo(() => {
    const today = new Date().getDate();
    return data.debts.filter(d => {
      if (Number(d.remainingAmount) <= 0) return false;
      const due = Number(d.dueDay);
      // Check if due within next 3 days or passed in current month
      const diff = due - today;
      return diff >= 0 && diff <= 3;
    });
  }, [data.debts]);

  // Handlers
  const handlePayDebt = async (debt) => {
    if (!confirm(`Pay installment for ${debt.title}?`)) return;
    try {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Expense',
        category: 'Debt Payment',
        amount: Number(debt.installmentPerMonth),
        note: `Payment for ${debt.title}`,
        account: debt.sourceAccount || 'Main'
      });

      const newRemaining = Math.max(0, Number(debt.remainingAmount) - Number(debt.installmentPerMonth));
      await updateDebt(debt.id, newRemaining);

      alert('Payment recorded!');
      loadData();
    } catch (e) { alert('Error processing payment'); }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">Financial Overview</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="pl-10 pr-4 py-2 bg-gray-800 border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {filters.dateRange === 'custom' && (
            <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-4">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 bg-gray-800 border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 bg-gray-800 border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
          )}

          {/* Account Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filters.account}
              onChange={(e) => setFilters({ ...filters, account: e.target.value })}
              className="pl-10 pr-8 py-2 bg-gray-800 border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="all">All Accounts</option>
              {data.accounts.map(acc => (
                <option key={acc.id} value={acc.name}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Net Worth" value={netWorth} icon={Wallet} color="text-emerald-400" sub="Total Assets - Debts" />
        <StatCard title="Income" value={incomeTotal} icon={ArrowUpRight} color="text-emerald-400" sub={filters.dateRange} />
        <StatCard title="Expenses" value={expenseTotal} icon={ArrowDownLeft} color="text-red-400" sub={filters.dateRange} />
        <StatCard title="Total Debt" value={totalDebt} icon={CreditCard} color="text-orange-400" sub="Remaining principal" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-8">

          {/* Expense Analysis */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-400" />
              Expense Analysis
            </h3>
            <div className="h-[300px] w-full">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '12px' }}
                      itemStyle={{ color: '#F3F4F6' }}
                      formatter={(value) => `${value.toLocaleString()} ฿`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <PieChart size={48} className="mb-2 opacity-50" />
                  <p>No expense data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity (Filtered) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            </div>
            <div className="space-y-3">
              {filteredData.transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "p-2 rounded-full",
                      tx.type === 'Income' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {tx.type === 'Income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tx.category}</p>
                      <p className="text-xs text-gray-500">{tx.date} • {tx.note || '-'}</p>
                    </div>
                  </div>
                  <span className={clsx("font-bold font-mono", tx.type === 'Income' ? "text-emerald-400" : "text-white")}>
                    {tx.type === 'Income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
              {filteredData.transactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No transactions found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Stats */}
        <div className="space-y-8">
          {/* Current Cash Details */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-gray-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-24 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
            <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Current Cash Balance</h3>
            <h2 className="text-3xl font-bold text-white mb-2 relative z-10">{currentCash.toLocaleString()} <span className="text-base text-gray-500 font-normal">THB</span></h2>
            <p className="text-xs text-emerald-400/80 flex items-center gap-1 relative z-10">
              <Wallet size={12} />
              Based on {filters.account === 'all' ? 'all accounts' : filters.account}
            </p>
          </div>

          {/* Debt Alerts */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-400" />
              Debt Alerts
            </h3>
            <div className="space-y-4">
              {upcomingDebts.length > 0 ? upcomingDebts.map(debt => (
                <div key={debt.id} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-orange-200">{debt.title}</h4>
                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">Due Day {debt.dueDay}</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-3">{Number(debt.installmentPerMonth).toLocaleString()} ฿</p>
                  <button
                    onClick={() => handlePayDebt(debt)}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                  >
                    Pay Now
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No upcoming debts within 3 days.</p>
                  <p className="text-xs mt-1 text-emerald-500 font-medium">You are in good shape! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for consistent stat cards
function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</h3>
        </div>
        <div className={clsx("p-3 rounded-xl bg-gray-800/50", color)}>
          <Icon size={24} />
        </div>
      </div>
      {sub && <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{sub}</p>}
    </div>
  );
}