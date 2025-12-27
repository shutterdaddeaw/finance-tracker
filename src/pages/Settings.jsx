import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, CreditCard, Tag } from 'lucide-react';
import { getCategories, addCategory, deleteCategory, getAccounts, addAccount, deleteAccount } from '../api';
import clsx from 'clsx';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('categories');
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Forms
    const [newCategory, setNewCategory] = useState({ name: '', type: 'Expense', color: '#EF4444', group: '' });
    const [newAccount, setNewAccount] = useState({ name: '', bankName: '', accountNumber: '', type: 'Bank', initialBalance: 0 });

    const loadData = async () => {
        setLoading(true);
        const [cats, accs] = await Promise.all([getCategories(), getAccounts()]);
        setCategories(cats);
        setAccounts(accs);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Handlers: Categories ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name) return;
        try {
            await addCategory(newCategory);
            setNewCategory({ name: '', type: 'Expense', color: '#EF4444', group: '' });
            loadData();
        } catch (err) { alert('Failed to add category'); }
    };
    // ... (skip unchanged) ...

    // --- Handlers: Accounts ---
    const handleAddAccount = async (e) => {
        e.preventDefault();
        if (!newAccount.name) return;
        try {
            await addAccount(newAccount);
            setNewAccount({ name: '', bankName: '', accountNumber: '', type: 'Bank', initialBalance: 0 });
            loadData();
        } catch (err) { alert('Failed to add account'); }
    };

    const handleDeleteAccount = async (id) => {
        if (!confirm('Delete this account?')) return;
        try {
            await deleteAccount(id);
            loadData();
        } catch (err) { alert('Failed to delete account'); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="text-emerald-400" size={32} />
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400">Manage your preferences and data</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-800 pb-1">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={clsx("pb-3 px-2 font-medium transition-colors border-b-2", activeTab === 'categories' ? "text-emerald-400 border-emerald-400" : "text-gray-400 border-transparent hover:text-gray-200")}
                >
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={clsx("pb-3 px-2 font-medium transition-colors border-b-2", activeTab === 'accounts' ? "text-emerald-400 border-emerald-400" : "text-gray-400 border-transparent hover:text-gray-200")}
                >
                    Accounts & Banks
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Form */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-emerald-400" />
                        {activeTab === 'categories' ? 'Add Category' : 'Add Account'}
                    </h2>

                    {activeTab === 'categories' ? (
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. จ่าย-ค่าผ่อนบ้าน"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Group (Optional)</label>
                                <input
                                    type="text"
                                    value={newCategory.group}
                                    onChange={e => setNewCategory({ ...newCategory, group: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. ที่อยู่อาศัย"
                                    list="groupSuggestions"
                                />
                                <datalist id="groupSuggestions">
                                    <option value="เงินไหลเข้า" />
                                    <option value="ที่อยู่อาศัย" />
                                    <option value="อาหารและของใช้" />
                                    <option value="การเดินทาง" />
                                    <option value="การลงทุน" />
                                </datalist>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                                    <select
                                        value={newCategory.type}
                                        onChange={e => setNewCategory({ ...newCategory, type: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    >
                                        <option value="Expense">Expense</option>
                                        <option value="Income">Income</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Color</label>
                                    <input
                                        type="color"
                                        value={newCategory.color}
                                        onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                                        className="w-full h-10 bg-gray-800 border-gray-700 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Save Category
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleAddAccount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Account Nickname</label>
                                <input
                                    type="text"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. Main Wallet"
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
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Save Account
                            </button>
                        </form>
                    )}
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    {activeTab === 'categories' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-gray-400 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Color</th>
                                        <th className="px-6 py-3">Details</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {categories.map(cat => (
                                        <tr key={cat.id} className="hover:bg-gray-800/30">
                                            <td className="px-6 py-4">
                                                <div className="w-8 h-8 rounded-full border border-gray-700 shadow-sm" style={{ backgroundColor: cat.color }}></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white">{cat.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={clsx("text-xs px-2 py-0.5 rounded border", cat.type === 'Income' ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400")}>
                                                        {cat.type}
                                                    </span>
                                                    {cat.group && <span className="text-xs px-2 py-0.5 rounded border border-gray-600 text-gray-400 flex items-center gap-1"><Tag size={10} /> {cat.group}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No categories found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-800/50 text-gray-400 text-sm uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Account Details</th>
                                        <th className="px-6 py-3 text-right">Initial Balance</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {accounts.map(acc => (
                                        <tr key={acc.id} className="hover:bg-gray-800/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                                                        <CreditCard size={18} />
                                                    </div>
                                                    <span className="text-gray-300">{acc.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-white">{acc.name}</p>
                                                {acc.bankName && <p className="text-sm text-gray-400">{acc.bankName} • {acc.accountNumber}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-white">
                                                {Number(acc.initialBalance).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {accounts.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No accounts found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
