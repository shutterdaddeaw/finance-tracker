import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    LayoutDashboard,
    Receipt,
    TrendingUp,
    CreditCard,
    LogOut,
    Wallet,
    Menu,
    X,
    Settings
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Transactions', path: '/transactions', icon: Receipt },
        { name: 'Investments', path: '/investments', icon: TrendingUp },
        { name: 'Debts', path: '/debts', icon: CreditCard },
        { name: 'Accounts', path: '/accounts', icon: Wallet },
        { name: 'Settings', path: '/settings', icon: Settings }
    ];

    return (
        <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">

            {/* Mobile Menu Button */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 h-20 border-b border-gray-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <Wallet className="h-6 w-6 text-emerald-400" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Finance
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                                )}
                            >
                                <item.icon size={20} className={clsx("transition-colors", ({ isActive }) => isActive ? "text-emerald-400" : "group-hover:text-emerald-300")} />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* User & Logout */}
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <img
                                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=10b981&color=fff`}
                                alt="User"
                                className="w-8 h-8 rounded-full border border-gray-700"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                    {currentUser?.displayName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {currentUser?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
