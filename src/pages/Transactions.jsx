import React, { useEffect, useState, useMemo } from 'react';
import {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getCategories,
    getAccounts,
    updateAccount
} from '../api';
import {
    Plus,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    Trash2,
    Edit2,
    Copy,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    X,
    Filter
} from 'lucide-react';
import clsx from 'clsx';

export default function Transactions() {
    const [data, setData] = useState({ transactions: [], categories: [], accounts: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Expense',
        category: '',
        amount: '',
        note: '',
        account: '',
        accountId: '' // Store ID for logic
    });

    // Action Menu State
    const [activeMenu, setActiveMenu] = useState(null);

    const loadData = async () => {
        setLoading(true);
        const [txs, cats, accs] = await Promise.all([
            getTransactions(),
            getCategories(),
            getAccounts()
        ]);

        // Sort txs
        const sortedTxs = txs.sort((a, b) => new Date(b.date) - new Date(a.date));

        setData({
            transactions: sortedTxs,
            categories: cats,
            accounts: accs
        });
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter & Pagination Logic
    const filteredTransactions = useMemo(() => {
        return data.transactions.filter(tx =>
        (tx.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [data.transactions, searchTerm]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const currentTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handlers
    const handleOpenModal = (tx = null) => {
        if (tx) {
            setFormData(tx);
            setEditingId(tx.id);
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                type: 'Expense',
                category: data.categories[0]?.name || 'General',
                amount: '',
                note: '',
                account: data.accounts[0]?.name || 'Cash',
                accountId: data.accounts[0]?.id || ''
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleCopy = (tx) => {
        setFormData({
            ...tx,
            id: undefined,
            date: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const calculateNewBalance = (account, amount, type, reverse = false) => {
        let balance = Number(account.initialBalance);
        // Note: In a real app we'd fetch current calculated balance, simplified here to use Initial as base + adjustments?
        // Actually, for this requirement: "Update Account Balance", we should update the 'initialBalance' or have a 'currentBalance' field.
        // Since our Access Pattern computes balance on fly in Accounts page, modifying 'initialBalance' might be confusing.
        // However, user specifically asked to "deduct money".
        // Strategy: We will update the 'initialBalance' of the Account to reflect the change? 
        // Correct Strategy: In a double-entry system we record txs. The Accounts page ALREADY sums them up.
        // So we DON'T need to update Account object, just allow the Transaction to be linked to Account.
        // The "Accounts" page logic: Balance = Initial + IncomeTxs - ExpenseTxs.
        // So merely saving the transaction with the correct 'account' name/id is sufficient!
        return;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) return;

        try {
            const payload = { ...formData, amount: Number(formData.amount) };

            if (editingId) {
                await updateTransaction(editingId, payload);
            } else {
                await addTransaction(payload);
            }

            setIsModalOpen(false);
            loadData();
        } catch (error) {
            alert("Failed to save transaction");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this transaction?")) return;
        await deleteTransaction(id);
        loadData();
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Transactions</h1>
                    <p className="text-gray-400 text-sm">
                        Total of {filteredTransactions.length} records found
                    </p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">Add New</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading data...</div>
                ) : (
                    <div>
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-950/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">Type</th>
                                        <th className="px-6 py-4 font-semibold">Category</th>
                                        <th className="px-6 py-4 font-semibold">Account</th>
                                        <th className="px-6 py-4 font-semibold">Note</th>
                                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                        <th className="px-4 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {currentTransactions.map((tx) => (
                                        <tr key={tx.id} className="group hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 text-gray-300 font-mono text-sm whitespace-nowrap">{tx.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                                    tx.type === 'Income'
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                                )}>
                                                    {tx.type === 'Income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-200 font-medium bg-gray-800 px-2 py-1 rounded text-sm">
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm flex items-center gap-2">
                                                {tx.account}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm max-w-[150px] truncate">{tx.note || '-'}</td>
                                            <td className={clsx("px-6 py-4 text-right font-bold font-mono tracking-tight", tx.type === 'Income' ? "text-emerald-400" : "text-white")}>
                                                {tx.type === 'Income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === tx.id ? null : tx.id);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 active:opacity-100"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {activeMenu === tx.id && (
                                                    <div className="absolute right-10 top-8 z-50 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <button onClick={() => handleOpenModal(tx)} className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => handleCopy(tx)} className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                                                            <Copy size={14} /> Duplicate
                                                        </button>
                                                        <div className="h-px bg-gray-700 my-0.5"></div>
                                                        <button onClick={() => handleDelete(tx.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {currentTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-3 bg-gray-800 rounded-full">
                                                        <Search size={24} className="text-gray-600" />
                                                    </div>
                                                    <p>No transactions found matching your criteria.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-950/30">
                                <p className="text-sm text-gray-400">
                                    Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modern Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Transaction' : 'New Transaction'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="txForm" onSubmit={handleSubmit} className="space-y-6">
                                {/* Top Row: Type & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Transaction Type</label>
                                        <div className="flex bg-gray-800 p-1 rounded-xl">
                                            {['Expense', 'Income'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: t })}
                                                    className={clsx(
                                                        "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                                        formData.type === t
                                                            ? (t === 'Income' ? "bg-emerald-500 text-white shadow-lg" : "bg-red-500 text-white shadow-lg")
                                                            : "text-gray-400 hover:text-white"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-gray-800 border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">฿</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full bg-gray-800 border-gray-700 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category & Account */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-gray-800 border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                            required
                                        >
                                            <option value="" disabled>Select Category</option>
                                            {(() => {
                                                const typeCats = data.categories.filter(c => c.type === formData.type);
                                                const noGroup = typeCats.filter(c => !c.group);
                                                const withGroup = typeCats.filter(c => c.group);

                                                const groups = {};
                                                withGroup.forEach(c => {
                                                    if (!groups[c.group]) groups[c.group] = [];
                                                    groups[c.group].push(c);
                                                });

                                                return (
                                                    <>
                                                        {noGroup.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                        {Object.entries(groups).sort().map(([g, cats]) => (
                                                            <optgroup key={g} label={g}>
                                                                {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                            </optgroup>
                                                        ))}
                                                        {typeCats.length === 0 && (
                                                            <>
                                                                <option value="General">General</option>
                                                                <option value="Food">Food</option>
                                                                <option value="Transport">Transport</option>
                                                            </>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Account / Wallet</label>
                                        <select
                                            value={formData.account}
                                            onChange={(e) => {
                                                const acc = data.accounts.find(a => a.name === e.target.value);
                                                setFormData({ ...formData, account: e.target.value, accountId: acc?.id })
                                            }}
                                            className="w-full bg-gray-800 border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                            required
                                        >
                                            {data.accounts.map(a => (
                                                <option key={a.id} value={a.name}>{a.name} ({a.type})</option>
                                            ))}
                                            {data.accounts.length === 0 && <option value="Main">Main</option>}
                                        </select>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Note (Optional)</label>
                                    <textarea
                                        rows="3"
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                                        placeholder="Add details..."
                                    ></textarea>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="txForm"
                                className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                            >
                                Save Transaction
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
