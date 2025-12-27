import React, { useEffect, useState } from 'react';
import { getInvestments, addInvestment } from '../api';
import { TrendingUp, Plus, DollarSign, PieChart as PieChartIcon, X, Save } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

export default function Investments() {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        assetName: '',
        quantity: '',
        avgPrice: '',
        currentMarketPrice: ''
    });

    const loadData = async () => {
        setLoading(true);
        const data = await getInvestments();
        setInvestments(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const totalValue = investments.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.currentMarketPrice || item.avgPrice)), 0);
    const totalCost = investments.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.avgPrice)), 0);
    const totalPnL = totalValue - totalCost;
    const pnlPercent = totalCost === 0 ? 0 : (totalPnL / totalCost) * 100;

    const chartData = investments.map(inv => ({
        name: inv.assetName,
        value: Number(inv.quantity) * Number(inv.currentMarketPrice || inv.avgPrice)
    }));

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.assetName) return;
        try {
            await addInvestment(formData);
            setFormData({ assetName: '', quantity: '', avgPrice: '', currentMarketPrice: '' });
            setIsModalOpen(false);
            loadData();
        } catch (err) { alert('Failed to add investment'); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading portfolio...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Investments</h1>
                    <p className="text-gray-400">Portfolio Performance</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                    <Plus size={20} /> <span className="hidden md:inline">Add Asset</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
                    <h2 className="text-3xl font-bold text-white">{totalValue.toLocaleString()} <span className="text-base font-normal text-gray-500">THB</span></h2>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Total Profit / Loss</p>
                    <div className="flex items-end gap-2">
                        <h2 className={clsx("text-3xl font-bold", totalPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {totalPnL > 0 ? '+' : ''}{totalPnL.toLocaleString()}
                        </h2>
                        <span className={clsx("mb-1 text-sm font-medium px-2 py-0.5 rounded", totalPnL >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                            {pnlPercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <PieChartIcon size={16} /> Asset Allocation
                    </div>
                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} itemStyle={{ color: '#fff' }} formatter={(val) => val.toLocaleString()} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Assets List */}
            <div className="grid grid-cols-1 gap-4">
                {investments.map((inv) => {
                    const val = Number(inv.quantity) * Number(inv.currentMarketPrice || inv.avgPrice);
                    const cost = Number(inv.quantity) * Number(inv.avgPrice);
                    const pnl = val - cost;
                    const pnlP = cost === 0 ? 0 : (pnl / cost) * 100;

                    return (
                        <div key={inv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-800 rounded-lg text-emerald-400">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{inv.assetName}</h3>
                                    <p className="text-sm text-gray-500">{Number(inv.quantity).toLocaleString()} units @ Avg {Number(inv.avgPrice).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <p className="text-gray-400 text-xs uppercase">Market Price</p>
                                    <p className="font-mono text-white font-medium">{Number(inv.currentMarketPrice || inv.avgPrice).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-xs uppercase">Value</p>
                                    <p className="font-bold text-white text-lg">{val.toLocaleString()}</p>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <p className="text-gray-400 text-xs uppercase">PnL</p>
                                    <p className={clsx("font-bold font-mono", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                        {pnl > 0 ? '+' : ''}{pnl.toLocaleString()}
                                    </p>
                                    <p className={clsx("text-xs", pnl >= 0 ? "text-emerald-500" : "text-red-500")}>
                                        {pnlP.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {investments.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                        <DollarSign size={48} className="mx-auto mb-3 opacity-20" />
                        No investments found. Add your assets to track performance.
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Add Investment</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Asset Name</label>
                                <input
                                    type="text"
                                    value={formData.assetName}
                                    onChange={e => setFormData({ ...formData, assetName: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. AAPL, BTC, Gold"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Avg. Price</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.avgPrice}
                                        onChange={e => setFormData({ ...formData, avgPrice: e.target.value })}
                                        className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Current Market Price (Optional)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.currentMarketPrice}
                                    onChange={e => setFormData({ ...formData, currentMarketPrice: e.target.value })}
                                    className="w-full bg-gray-800 border-gray-700 rounded-lg text-white"
                                    placeholder="Leave blank to use Google Finance in Sheet"
                                />
                                <p className="text-xs text-gray-500 mt-1">If blank, you can set =GOOGLEFINANCE() in the Sheet.</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-lg"
                            >
                                Save Investment
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
