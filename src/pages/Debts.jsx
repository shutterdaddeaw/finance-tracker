import React, { useEffect, useState } from 'react';
import { getDebts, addDebt, getAccounts, addTransaction, updateDebt } from '../api';
import { CreditCard, AlertTriangle, CheckCircle, Plus, X, Calendar } from 'lucide-react';
import clsx from 'clsx';

export default function Debts() {
    const [debts, setDebts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        debtType: 'Installment-0%', // Default
        totalAmount: '',
        remainingAmount: '',
        interestRate: '',
        totalInstallments: '',
        installmentsPaid: '0',
        installmentPerMonth: '',
        dueDay: '1',
        sourceAccount: ''
    });

    const loadData = async () => {
        setLoading(true);
        const [d, a] = await Promise.all([getDebts(), getAccounts()]);
        setDebts(d);
        setAccounts(a);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Auto-Calculate Logic
    useEffect(() => {
        if (!formData.totalAmount) return;
        const total = Number(formData.totalAmount);

        if (formData.debtType === 'Installment-0%') {
            if (formData.totalInstallments && Number(formData.totalInstallments) > 0) {
                const perMonth = total / Number(formData.totalInstallments);
                setFormData(prev => ({ ...prev, installmentPerMonth: perMonth.toFixed(2) }));
            }
        }
        else if (['Home-Loan', 'Personal-Loan'].includes(formData.debtType)) {
            // Simple logic: If user enters Rate & Years (implied by installments), we could calc.
            // But for now, let's just allow manual override or simple estimate if needed.
            // For Loans, user usually knows the defined monthly payment.
            // Let's just keep it manual for loans to avoid complex amortization confusion, 
            // UNLESS user asks for it. Ref: User said "Calculate Automatically OR Manual".
            // Let's implement simple flat rate interest estimation if Rate is provided?
            // Actually, for Loans, "Installment" is P+I.
            // Let's stick to: "If 0%, auto-calc. If Loan, let user input or simple estimate 2.7% / 12 * Principal?"
        }
    }, [formData.totalAmount, formData.totalInstallments, formData.debtType]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.title) return;
        try {
            const payload = {
                ...formData,
                remainingAmount: formData.remainingAmount || formData.totalAmount
            };
            await addDebt(payload);
            setFormData({
                title: '',
                debtType: 'Installment-0%',
                totalAmount: '',
                remainingAmount: '',
                interestRate: '',
                totalInstallments: '',
                installmentsPaid: '0',
                installmentPerMonth: '',
                dueDay: '1',
                sourceAccount: ''
            });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert('Failed to add debt'); }
    };

    const handlePayInstallment = async (debt) => {
        if (!confirm(`Pay installment for ${debt.title}?`)) return;
        try {
            await payDebt(
                debt.id,
                Number(debt.installmentPerMonth),
                Number(debt.remainingAmount),
                debt.sourceAccount
            );
            loadData();
            alert('Payment recorded!');
        } catch (e) { alert('Error processing payment'); }
    };

    const totalDebt = debts.reduce((sum, d) => sum + Number(d.remainingAmount), 0);
    const monthlyCommitment = debts.reduce((sum, d) => Number(d.remainingAmount) > 0 ? sum + Number(d.installmentPerMonth) : sum, 0);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading debts...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Debts Management</h1>
                    <p className="text-gray-400">Track and pay off your liabilities</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                    <Plus size={20} /> <span className="hidden md:inline">Add Debt</span>
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 bg-red-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
                    <p className="text-gray-400 text-sm mb-1">Total Remaining Debt</p>
                    <h2 className="text-4xl font-bold text-white mb-2">{totalDebt.toLocaleString()} <span className="text-lg font-normal text-gray-500">THB</span></h2>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full" style={{ width: '60%' }}></div>
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Monthly Commitment</p>
                    <h2 className="text-4xl font-bold text-white mb-2">{monthlyCommitment.toLocaleString()} <span className="text-lg font-normal text-gray-500">THB / Month</span></h2>
                    <p className="text-sm text-gray-500">Total amount to pay per month</p>
                </div>
            </div>

            {/* Debt List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {debts.map((debt) => {
                    const progress = ((Number(debt.totalAmount) - Number(debt.remainingAmount)) / Number(debt.totalAmount)) * 100;
                    const isPaid = Number(debt.remainingAmount) <= 0;

                    return (
                        <div key={debt.id} className={clsx("bg-gray-900 border rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-gray-700", isPaid ? "border-emerald-500/20" : "border-gray-800")}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-800 rounded-xl text-gray-300">
                                        {isPaid ? <CheckCircle size={24} className="text-emerald-400" /> : <CreditCard size={24} />}
                                    </div>
                                    <div className="text-right">
                                        <span className={clsx("text-xs font-bold px-2 py-1 rounded uppercase block mb-1", isPaid ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400")}>
                                            {isPaid ? 'Paid Off' : `Due Day ${debt.dueDay}`}
                                        </span>
                                        <span className="text-xs text-gray-500">{debt.debtType || 'Debt'}</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{debt.title}</h3>
                                <p className="text-gray-500 text-sm mb-4">Source: {debt.sourceAccount || 'Unassigned'}</p>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Remaining</span>
                                        <span className="text-white font-bold">{Number(debt.remainingAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={clsx("h-full rounded-full transition-all duration-1000", isPaid ? "bg-emerald-500" : "bg-orange-500")}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>

                                    {/* Advanced Details */}
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-950/30 p-2 rounded-lg">
                                        <div>Total: {Number(debt.totalAmount).toLocaleString()}</div>
                                        <div>Installment: {Number(debt.installmentPerMonth).toLocaleString()}</div>
                                        {debt.interestRate && <div>Rate: {debt.interestRate}%</div>}
                                        {debt.totalInstallments && <div>Term: {debt.totalInstallments} m.</div>}
                                    </div>
                                </div>
                            </div>

                            {!isPaid && (
                                <button
                                    onClick={() => handlePayInstallment(debt)}
                                    className="w-full py-3 bg-gray-800 hover:bg-emerald-600 hover:text-white text-gray-300 rounded-xl font-medium transition-all flex justify-center items-center gap-2 group"
                                >
                                    Pay Installment
                                </button>
                            )}
                        </div>
                    );
                })}
                {debts.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed col-span-full">
                        <AlertTriangle size={48} className="mx-auto mb-3 opacity-20" />
                        No debts found.
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Add Loan / Debt</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Debt Type</label>
                                <select
                                    value={formData.debtType}
                                    onChange={e => setFormData({ ...formData, debtType: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white p-2"
                                >
                                    <option value="Installment-0%">0% Installment (ผ่อน 0%)</option>
                                    <option value="Home-Loan">Home Loan (สินเชื่อบ้าน)</option>
                                    <option value="Personal-Loan">Personal Loan (สินเชื่อส่วนบุคคล)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. iPhone 15, Condo Mortgage"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Total Amount</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.totalAmount}
                                        onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Option only"
                                        value={formData.interestRate}
                                        onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        disabled={formData.debtType === 'Installment-0%'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Total Installments (Mo)</label>
                                    <input
                                        type="number"
                                        value={formData.totalInstallments}
                                        onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        placeholder="e.g. 10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Due Day (1-31)</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        value={formData.dueDay}
                                        onChange={e => setFormData({ ...formData, dueDay: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Monthly Payment</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.installmentPerMonth}
                                        onChange={e => setFormData({ ...formData, installmentPerMonth: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white font-bold text-emerald-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Source Account</label>
                                    <select
                                        value={formData.sourceAccount}
                                        onChange={e => setFormData({ ...formData, sourceAccount: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white p-2"
                                        required
                                    >
                                        <option value="" disabled>Select Account</option>
                                        {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                        {accounts.length === 0 && <option value="Main">Main</option>}
                                    </select>
                                </div>
                            </div>

                            {/* Info Box */}
                            {formData.debtType === 'Installment-0%' && formData.totalInstallments && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                                    <p>ℹ️ Auto-calculated: {Number(formData.totalAmount).toLocaleString()} / {formData.totalInstallments} months</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 mt-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-colors shadow-lg"
                            >
                                Save Debt
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
