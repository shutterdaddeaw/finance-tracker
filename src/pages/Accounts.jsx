import React, { useEffect, useState } from 'react';
import { getAccounts, getTransactions, addAccount } from '../api';
import { Wallet, Building2, CreditCard, Plus, X, Save } from 'lucide-react';
import clsx from 'clsx';

export default function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', bankName: '', accountNumber: '', type: 'Bank', initialBalance: 0 });

    const loadData = async () => {
        setLoading(true);
        const [accs, txs] = await Promise.all([
            getAccounts(),
            getTransactions()
        ]);
        setAccounts(accs);
        setTransactions(txs);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const calculateBalance = (accountName, initialBalance) => {
        const accountTxs = transactions.filter(t => t.account === accountName);
        const income = accountTxs.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const expense = accountTxs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        return Number(initialBalance) + income - expense;
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAccount.name) return;
        try {
            await addAccount(newAccount);
            setNewAccount({ name: '', bankName: '', accountNumber: '', type: 'Bank', initialBalance: 0 });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert('Failed to add account'); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading accounts...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Accounts</h1>
                    <p className="text-gray-400">Your financial buckets</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                    <Plus size={20} /> <span className="hidden md:inline">Add Account</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc, idx) => {
                    const currentBalance = calculateBalance(acc.name, acc.initialBalance);
                    const Icon = acc.type === 'Bank' ? Building2 : (acc.type === 'Credit' ? CreditCard : Wallet);

                    return (
                        <div key={acc.id || idx} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100"></div>

                            <div className="relative z-10 flex justify-between items-start mb-8">
                                <div className="p-3 bg-gray-800 rounded-xl text-emerald-400 border border-gray-700">
                                    <Icon size={24} />
                                </div>
                                <span className="text-xs uppercase tracking-wider text-gray-500 font-medium bg-gray-950 px-2 py-1 rounded border border-gray-800">
                                    {acc.type}
                                </span>
                            </div>

                            <div className="relative z-10">
                                <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                                <h3 className="text-2xl font-bold text-white mb-2">{currentBalance.toLocaleString()} THB</h3>

                                {acc.bankName && (
                                    <div className="pt-4 border-t border-gray-800/50 mt-4">
                                        <p className="text-gray-300 font-medium">{acc.bankName}</p>
                                        <p className="text-xs text-gray-500 tracking-wider font-mono">{acc.accountNumber}</p>
                                    </div>
                                )}
                                {!acc.bankName && <p className="text-xs text-gray-500 mt-2">Initial: {Number(acc.initialBalance).toLocaleString()}</p>}
                            </div>
                        </div>
                    );
                })}
                {accounts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                        <Building2 size={48} className="mx-auto mb-3 opacity-20" />
                        No accounts found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Add Account</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Account Nickname</label>
                                <input
                                    type="text"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. Main Wallet"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={newAccount.bankName}
                                        onChange={e => setNewAccount({ ...newAccount, bankName: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        placeholder="e.g. KBANK"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Account No.</label>
                                    <input
                                        type="text"
                                        value={newAccount.accountNumber}
                                        onChange={e => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        placeholder="xxx-x-xxxxx-x"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                                    <select
                                        value={newAccount.type}
                                        onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    >
                                        <option value="Bank">Bank Account</option>
                                        <option value="Wallet">Cash Wallet</option>
                                        <option value="Credit">Credit Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Initial Balance</label>
                                    <input
                                        type="number"
                                        value={newAccount.initialBalance}
                                        onChange={e => setNewAccount({ ...newAccount, initialBalance: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-lg"
                            >
                                Save Account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
