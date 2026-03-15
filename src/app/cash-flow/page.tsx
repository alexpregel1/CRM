"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Wallet, TrendingUp, TrendingDown, Landmark, Receipt, CreditCard, FileUp, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = "00000000-0000-0000-0000-000000000001"; // Hardcoded for this demo 

export default function CashFlowPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Transactions State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState("ALL");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [periodIncome, setPeriodIncome] = useState(0);
    const [periodExpenses, setPeriodExpenses] = useState(0);

    // Modal States
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // CSV Import States
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [importAccountId, setImportAccountId] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);

    // Account Form State
    const [accName, setAccName] = useState("");
    const [accType, setAccType] = useState("CHECKING");
    const [accBalance, setAccBalance] = useState("");

    // Transaction Form State
    const [txAccountId, setTxAccountId] = useState("");
    const [txType, setTxType] = useState("EXPENSE");
    const [txAmount, setTxAmount] = useState("");
    const [txCategory, setTxCategory] = useState("General");
    const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchAccounts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("financial_accounts")
            .select("*")
            .eq("user_id", USER_ID)
            .order("created_at", { ascending: true });

        if (data) {
            setAccounts(data);
            if (data.length > 0 && !txAccountId) {
                setTxAccountId(data[0].id);
            }
        }
        setLoading(false);
    };

    const fetchTransactions = async () => {
        let query = supabase
            .from("cash_flow_transactions")
            .select("*")
            .eq("user_id", USER_ID)
            .order("date", { ascending: true });

        if (selectedYear !== "ALL") {
            const startDate = `${selectedYear}-01-01`;
            const endDate = `${selectedYear}-12-31`;
            query = query.gte("date", startDate).lte("date", endDate);
        }

        const { data } = await query;
        if (data) {
            let filtered = data;
            if (selectedMonth !== "ALL") {
                filtered = data.filter(tx => tx.date.split("-")[1] === selectedMonth);
            }
            setTransactions(filtered);

            // Calculate Period KPI
            let inc = 0, exp = 0;
            filtered.forEach(tx => {
                if (tx.type === "INCOME") inc += Number(tx.amount);
                if (tx.type === "EXPENSE") exp += Number(tx.amount);
            });
            setPeriodIncome(inc);
            setPeriodExpenses(exp);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [selectedYear, selectedMonth]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const { error } = await supabase.from("financial_accounts").insert({
            user_id: USER_ID,
            name: accName,
            type: accType,
            current_balance: parseFloat(accBalance) || 0
        });
        setSubmitting(false);
        if (!error) {
            setIsAccountModalOpen(false);
            setAccName("");
            setAccBalance("");
            fetchAccounts();
        } else {
            console.error(error);
            alert(`Error creating account: ${error?.message || JSON.stringify(error)}`);
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const amountNum = parseFloat(txAmount) || 0;

        // 1. Insert Transaction
        const { error: txError } = await supabase.from("cash_flow_transactions").insert({
            user_id: USER_ID,
            account_id: txAccountId,
            type: txType,
            amount: amountNum,
            category: txCategory,
            date: txDate
        });

        // 2. Update Account Balance
        if (!txError && txAccountId) {
            const acc = accounts.find(a => a.id === txAccountId);
            if (acc) {
                // If Income, add. If Expense, subtract.
                const modifier = txType === "INCOME" ? amountNum : -amountNum;
                const newBalance = Number(acc.current_balance) + modifier;
                await supabase.from("financial_accounts").update({ current_balance: newBalance }).eq("id", txAccountId);
            }
        }

        setSubmitting(false);
        if (!txError) {
            setIsTxModalOpen(false);
            setTxAmount("");
            setTxCategory("General");
            fetchAccounts(); // Refresh to get new total limits
            fetchTransactions(); // Refresh current period transactions
        } else {
            alert("Error creating transaction");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !importAccountId) return;

        setIsAnalyzing(true);
        // setIsCsvModalOpen(true);
        try {
            const text = await file.text();

            // Send to our /api/categorize-ai route
            const res = await fetch('/api/categorize-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvData: text })
            });

            if (!res.ok) throw new Error("Failed to analyze CSV");

            const data = await res.json();
            setAiResults(data.transactions || []);
        } catch (error) {
            console.error(error);
            alert("Error analyzing CSV. Check server logs.");
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; // Reset input
        }
    };

    const confirmAiImport = async () => {
        if (!aiResults.length || !importAccountId) return;
        setSubmitting(true);

        // 1. Prepare batch insert
        const toInsert = aiResults.map(tx => ({
            user_id: USER_ID,
            account_id: importAccountId,
            type: tx.type,
            amount: Number(tx.amount),
            category: tx.category,
            date: tx.date || new Date().toISOString().split('T')[0],
            notes: tx.originalDescription || ''
        }));

        const { error: txError } = await supabase.from("cash_flow_transactions").insert(toInsert);

        if (!txError) {
            // 2. Adjust balance
            const acc = accounts.find(a => a.id === importAccountId);
            if (acc) {
                const totalModifier = toInsert.reduce((sum, curr) => {
                    return sum + (curr.type === 'INCOME' ? curr.amount : -curr.amount);
                }, 0);
                const newBalance = Number(acc.current_balance) + totalModifier;
                await supabase.from("financial_accounts").update({ current_balance: newBalance }).eq("id", importAccountId);
            }

            setIsCsvModalOpen(false);
            setAiResults([]);
            fetchAccounts();
            fetchTransactions();
        } else {
            console.error(txError);
            alert("Error importing transactions");
        }
        setSubmitting(false);
    };

    const totalLiquid = accounts.reduce((acc, curr) => acc + Number(curr.current_balance), 0);

    const fmt = (n: number, d = 2) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

    const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // Pie Chart Data (Expenses by Category)
    const pieDataMap = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc: any, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
        }, {});
    const pieData = Object.entries(pieDataMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value);

    // Bar Chart Data
    let barData: any[] = [];
    if (selectedMonth !== "ALL") {
        const daysMap: any = {};
        transactions.forEach(t => {
            const day = t.date.split("-")[2];
            if (!daysMap[day]) daysMap[day] = { name: day, Income: 0, Expenses: 0 };
            if (t.type === 'INCOME') daysMap[day].Income += Number(t.amount);
            if (t.type === 'EXPENSE') daysMap[day].Expenses += Number(t.amount);
        });
        barData = Object.values(daysMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else {
        const monthsMap: any = {};
        transactions.forEach(t => {
            const m = t.date.split("-")[1];
            if (!monthsMap[m]) monthsMap[m] = { name: m, Income: 0, Expenses: 0 };
            if (t.type === 'INCOME') monthsMap[m].Income += Number(t.amount);
            if (t.type === 'EXPENSE') monthsMap[m].Expenses += Number(t.amount);
        });
        barData = Object.values(monthsMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    const savingsRate = periodIncome > 0 ? (((periodIncome - periodExpenses) / periodIncome) * 100).toFixed(1) : "0.0";

    return (
        <div className="min-h-screen p-6 pb-24">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cash Flow & Net Worth</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track your accounts, monthly expenses, and automated savings rate.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[120px] bg-secondary/30 border-white/10 rounded-full h-9">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10">
                            <SelectItem value="ALL">All Months</SelectItem>
                            <SelectItem value="01">January</SelectItem>
                            <SelectItem value="02">February</SelectItem>
                            <SelectItem value="03">March</SelectItem>
                            <SelectItem value="04">April</SelectItem>
                            <SelectItem value="05">May</SelectItem>
                            <SelectItem value="06">June</SelectItem>
                            <SelectItem value="07">July</SelectItem>
                            <SelectItem value="08">August</SelectItem>
                            <SelectItem value="09">September</SelectItem>
                            <SelectItem value="10">October</SelectItem>
                            <SelectItem value="11">November</SelectItem>
                            <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px] bg-secondary/30 border-white/10 rounded-full h-9">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10">
                            <SelectItem value="ALL">All Years</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                            <SelectItem value="2028">2028</SelectItem>
                        </SelectContent>
                    </Select>

                    <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="font-semibold rounded-full px-5"
                                style={{
                                    background: "linear-gradient(135deg, #2563EB 0%, #0f1f4a 100%)",
                                    boxShadow: "0 0 18px rgba(37,99,235,0.45), inset 0 1px 0 rgba(100,160,255,0.25)",
                                    border: "1px solid rgba(59,130,246,0.4)",
                                }}
                                onClick={() => {
                                    if (accounts.length > 0 && !importAccountId) {
                                        setImportAccountId(accounts[0].id);
                                    }
                                }}
                            >
                                <FileUp className="mr-2 h-4 w-4" /> Import CSV AI
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] bg-background/95 backdrop-blur-xl border-white/10 text-white max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>AI CSV Import</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Upload your bank statement. Our AI will automatically parse and categorize the transactions.
                                </DialogDescription>
                            </DialogHeader>
                            {!isAnalyzing && aiResults.length === 0 && (
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium text-white/70">Target Account</label>
                                        <Select value={importAccountId} onValueChange={setImportAccountId} disabled={accounts.length === 0}>
                                            <SelectTrigger className="bg-secondary/30 border-white/10"><SelectValue placeholder="Select account..." /></SelectTrigger>
                                            <SelectContent className="bg-background border-white/10">
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} (€{fmt(Number(acc.current_balance))})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium text-white/70">Upload CSV File</label>
                                        <Input
                                            type="file"
                                            accept=".csv, .txt"
                                            disabled={!importAccountId}
                                            onChange={handleFileUpload}
                                            className="bg-secondary/30 border-white/10 file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                    <p className="text-purple-400 font-medium animate-pulse">AI is reading your statement...</p>
                                </div>
                            )}

                            {aiResults.length > 0 && !isAnalyzing && (
                                <div className="space-y-4 py-4">
                                    <div className="rounded-md border border-white/10 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-secondary/50 border-b border-white/10">
                                                <tr>
                                                    <th className="text-left p-2 font-medium">Date</th>
                                                    <th className="text-left p-2 font-medium">Description</th>
                                                    <th className="text-left p-2 font-medium">Category</th>
                                                    <th className="text-right p-2 font-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aiResults.map((tx, i) => (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="p-2 text-muted-foreground">{tx.date}</td>
                                                        <td className="p-2 truncate max-w-[150px]" title={tx.originalDescription}>{tx.originalDescription}</td>
                                                        <td className="p-2">
                                                            <span className="bg-secondary/50 px-2 py-1 rounded text-xs">
                                                                {tx.category}
                                                            </span>
                                                        </td>
                                                        <td className={`p-2 text-right font-medium ${tx.type === 'INCOME' ? 'text-green-500' : 'text-white'}`}>
                                                            {tx.type === 'INCOME' ? '+' : '-'}€{fmt(Number(tx.amount))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setAiResults([])} className="border-white/10 bg-transparent text-white hover:bg-white/10">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmAiImport}
                                            disabled={submitting}
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            {submitting ? "Importing..." : `Confirm & Import ${aiResults.length} rows`}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="font-semibold rounded-full px-5"
                                style={{
                                    background: "linear-gradient(135deg, #2563EB 0%, #0f1f4a 100%)",
                                    boxShadow: "0 0 18px rgba(37,99,235,0.45), inset 0 1px 0 rgba(100,160,255,0.25)",
                                    border: "1px solid rgba(59,130,246,0.4)",
                                }}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Log Cash Flow</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Record an income or expense to adjust your balances.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTransaction} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-white/70">Type</label>
                                    <Select value={txType} onValueChange={setTxType}>
                                        <SelectTrigger className="bg-secondary/30 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-background border-white/10">
                                            <SelectItem value="INCOME">Income / Deposit</SelectItem>
                                            <SelectItem value="EXPENSE">Expense / Purchase</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-white/70">Account</label>
                                    <Select value={txAccountId} onValueChange={setTxAccountId} disabled={accounts.length === 0}>
                                        <SelectTrigger className="bg-secondary/30 border-white/10"><SelectValue placeholder="Select account..." /></SelectTrigger>
                                        <SelectContent className="bg-background border-white/10">
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.name} (€{fmt(Number(acc.current_balance))})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium text-white/70">Amount (€)</label>
                                        <Input type="number" step="0.01" required value={txAmount} onChange={e => setTxAmount(e.target.value)} className="bg-secondary/30 border-white/10" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium text-white/70">Category</label>
                                        <Input required value={txCategory} onChange={e => setTxCategory(e.target.value)} className="bg-secondary/30 border-white/10" placeholder="e.g. Salary, Rent" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-white/70">Date</label>
                                    <Input type="date" required value={txDate} onChange={e => setTxDate(e.target.value)} className="bg-secondary/30 border-white/10" />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button disabled={submitting || accounts.length === 0} type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                        {submitting ? "Saving..." : "Save Transaction"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="font-semibold rounded-full px-5"
                                style={{
                                    background: "linear-gradient(135deg, #2563EB 0%, #0f1f4a 100%)",
                                    boxShadow: "0 0 18px rgba(37,99,235,0.45), inset 0 1px 0 rgba(100,160,255,0.25)",
                                    border: "1px solid rgba(59,130,246,0.4)",
                                }}
                            >
                                <Wallet className="mr-2 h-4 w-4" /> Add Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Link Financial Account</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Add a new checking, savings, or investment account to track its balance.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateAccount} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-white/70">Account Name</label>
                                    <Input required value={accName} onChange={e => setAccName(e.target.value)} className="bg-secondary/30 border-white/10" placeholder="e.g. BBVA Checking" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-white/70">Account Type</label>
                                    <Select value={accType} onValueChange={setAccType}>
                                        <SelectTrigger className="bg-secondary/30 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-background border-white/10">
                                            <SelectItem value="CHECKING">Checking / Debit</SelectItem>
                                            <SelectItem value="SAVINGS">Savings Account</SelectItem>
                                            <SelectItem value="CRYPTO">Crypto Wallet</SelectItem>
                                            <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-white/70">Current Balance (€)</label>
                                    <Input required type="number" step="0.01" value={accBalance} onChange={e => setAccBalance(e.target.value)} className="bg-secondary/30 border-white/10" />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button disabled={submitting} type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                        {submitting ? "Opening..." : "Create Account"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* Top KPI Cards: Net Worth & Monthly Cash Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-blue-400" /> Total Liquid Capital
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-32"></div>
                        ) : (
                            <>
                                <div className="text-3xl font-bold">€{fmt(totalLiquid)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Across {accounts.length} linked accounts
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" /> Period Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">€{fmt(periodIncome)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedMonth === "ALL" ? `Total ${selectedYear}` : `${selectedMonth}/${selectedYear}`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-400" /> Period Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">€{fmt(periodExpenses)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedMonth === "ALL" ? `Total ${selectedYear}` : `${selectedMonth}/${selectedYear}`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5 shadow-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-purple-400" /> Savings Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{savingsRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Target: &gt;40%
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Linked Accounts Column */}
                <div className="space-y-6">
                    <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                        <CardHeader className="border-b border-white/5 bg-secondary/30 pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Connected Accounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {loading ? (
                                    <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading accounts...</div>
                                ) : accounts.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        No financial accounts added yet.
                                    </div>
                                ) : (
                                    accounts.map((acc) => (
                                        <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary/80 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                    {acc.type === 'CHECKING' ? <Landmark className="w-5 h-5" /> :
                                                        acc.type === 'SAVINGS' ? <Wallet className="w-5 h-5" /> :
                                                            acc.type === 'CRYPTO' ? <span className="font-bold">₿</span> :
                                                                <CreditCard className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{acc.name}</div>
                                                    <div className="text-xs text-muted-foreground uppercase tracking-widest">{acc.type}</div>
                                                </div>
                                            </div>
                                            <div className="font-mono text-sm tracking-tight font-bold">
                                                €{fmt(Number(acc.current_balance))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Cash Flow Chart area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                        <CardHeader className="border-b border-white/5 bg-secondary/30 pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" /> Income vs Expenses ({selectedYear})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[350px]">
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(val: number) => [`€${val.toFixed(2)}`, "Amount"]}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No transaction data for this period</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                        <CardHeader className="border-b border-white/5 bg-secondary/30 pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-purple-400" /> Expense Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[300px]">
                            {pieData.length > 0 ? (
                                <div className="flex h-full items-center">
                                    <ResponsiveContainer width="60%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px' }}
                                                formatter={(value: number) => [`€${value.toFixed(2)}`, "Expense"]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-[40%] pl-6 flex flex-col justify-center gap-3">
                                        {pieData.map((entry: any, index: number) => (
                                            <div key={entry.name} className="flex items-center gap-2 text-sm">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span className="text-muted-foreground truncate">{entry.name}</span>
                                                <span className="ml-auto font-medium text-white">€{fmt(entry.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No expenses logged yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}
