import axios from 'axios';

// ⚠️ URL Placeholder - User must replace this
const SHEETDB_URL = "https://sheetdb.io/api/v1/u6d6leubz3f6c";

const api = axios.create({
  baseURL: SHEETDB_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const endpoints = {
  TRANSACTIONS: '?sheet=Transactions',
  INVESTMENTS: '?sheet=Investments',
  ACCOUNTS: '?sheet=Accounts',
  DEBTS: '?sheet=Debts',
  CATEGORIES: '?sheet=Categories',
};

// Generic Fetch
export const fetchData = async (sheetName) => {
  try {
    const response = await api.get(`?sheet=${sheetName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    return [];
  }
};

// --- Transactions ---
export const getTransactions = () => fetchData('Transactions');

// Helper: Sync Account Balance
const syncAccountBalance = async (accountName) => {
  if (!accountName) return;

  try {
    // 1. Get Account ID 
    const accounts = await getAccounts();
    const account = accounts.find(a => a.name === accountName);
    if (!account) return;

    // 2. Get All Transactions for this account
    const allTxs = await getTransactions();
    const accountTxs = allTxs.filter(tx => tx.account === accountName);

    // 3. Calculate Balance
    const income = accountTxs.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = accountTxs.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const currentBalance = Number(account.initialBalance || 0) + income - expense;

    // 4. Update Account
    await updateAccount(account.id, { currentBalance });
    console.log(`Synced balance for ${accountName}: ${currentBalance}`);
  } catch (err) {
    console.error("Failed to sync balance:", err);
  }
};

export const addTransaction = async (transaction) => {
  const newTx = {
    id: crypto.randomUUID(),
    ...transaction
  };
  const res = await api.post(endpoints.TRANSACTIONS, { data: newTx });
  // Trigger Sync
  await syncAccountBalance(transaction.account);
  return res;
};

export const updateTransaction = async (id, updatedData) => {
  // We might need to sync BOTH old and new accounts if account changed, 
  // but for MVP we assume account doesn't change often or we just sync the new one.
  const res = await api.patch(`/id/${id}?sheet=Transactions`, {
    data: updatedData
  });
  if (updatedData.account) await syncAccountBalance(updatedData.account);
  return res;
};

export const deleteTransaction = async (id) => {
  // Ideally we need to know the account before deleting to sync it.
  // For now, we might skip sync or fetch tx first. 
  // Optimization: Fetch all accounts to sync everything? Too heavy.
  // Let's simplified: User manually refreshes or we assume the frontend refetches.
  // BETTER: Fetch the tx to get account, then delete.
  try {
    const txs = await getTransactions();
    const tx = txs.find(t => t.id === id);
    const res = await api.delete(`/id/${id}?sheet=Transactions`);
    if (tx) await syncAccountBalance(tx.account);
    return res;
  } catch (e) { console.error(e); }
};

// --- Categories (NEW) ---
export const getCategories = () => fetchData('Categories');

export const addCategory = async (category) => {
  const newCat = {
    id: crypto.randomUUID(),
    ...category
  };
  return await api.post(endpoints.CATEGORIES, { data: newCat });
};

export const deleteCategory = async (id) => {
  return await api.delete(`/id/${id}?sheet=Categories`);
};

// --- Investments ---
export const getInvestments = () => fetchData('Investments');

export const addInvestment = async (investment) => {
  const newInv = {
    id: crypto.randomUUID(),
    ...investment
  };
  return await api.post(endpoints.INVESTMENTS, { data: newInv });
};

// --- Accounts ---
export const getAccounts = () => fetchData('Accounts');

export const addAccount = async (account) => {
  const newAcc = {
    id: crypto.randomUUID(),
    ...account
  };
  return await api.post(endpoints.ACCOUNTS, { data: newAcc });
};

export const updateAccount = async (id, data) => {
  return await api.patch(`/id/${id}?sheet=Accounts`, { data });
};

export const deleteAccount = async (id) => {
  return await api.delete(`/id/${id}?sheet=Accounts`);
};

// --- Debts ---
export const getDebts = () => fetchData('Debts');

export const addDebt = async (debt) => {
  const newDebt = {
    id: crypto.randomUUID(),
    ...debt
  };
  return await api.post(endpoints.DEBTS, { data: newDebt });
};

export const updateDebt = async (id, data) => { // Modified to accept generic data object
  return await api.patch(`/id/${id}?sheet=Debts`, {
    data: data
  });
};

// Helper for "Pay Debt"
export const payDebt = async (debtId, paymentAmount, currentRemaining, accountName) => {
  const newRemaining = Math.max(0, currentRemaining - paymentAmount);
  // 1. Create Expense Transaction
  await addTransaction({
    date: new Date().toISOString().split('T')[0],
    type: 'Expense',
    category: 'Debt Payment',
    amount: paymentAmount,
    note: 'Debt Installment',
    account: accountName // Link to account
  });
  // 2. Update Debt
  return await updateDebt(debtId, { remainingAmount: newRemaining });
};

export default api;