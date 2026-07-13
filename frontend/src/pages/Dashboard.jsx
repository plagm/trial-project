import { useState, useEffect } from 'react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CreditCard, DollarSign, Users, Activity, TrendingDown, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    outstanding: 0,
    paid: 0,
    activeClients: 0,
    totalInvoices: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [chartData, setChartData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [invoicesRes, clientsRes, expensesRes] = await Promise.all([
          api.get('/invoices'),
          api.get('/clients'),
          api.get('/expenses')
        ]);
        
        const invoices = invoicesRes.data;
        const clients = clientsRes.data;
        const expenses = expensesRes.data;

        let outstanding = 0;
        let paid = 0;
        const monthlyData = {};
        const statusCounts = { Paid: 0, Sent: 0, Draft: 0, Overdue: 0 };
        const clientRevenue = {};

        invoices.forEach(inv => {
          if (inv.status === 'Paid') {
            paid += inv.totalAmount;
          } else {
            outstanding += inv.totalAmount;
          }
          
          if (statusCounts[inv.status] !== undefined) {
            statusCounts[inv.status]++;
          }

          if (inv.client && inv.client.name) {
             const cName = inv.client.name;
             if (!clientRevenue[cName]) clientRevenue[cName] = 0;
             if (inv.status === 'Paid') {
                clientRevenue[cName] += inv.totalAmount;
             }
          }

          const month = new Date(inv.issueDate).toLocaleString('default', { month: 'short' });
          if (!monthlyData[month]) monthlyData[month] = { name: month, revenue: 0 };
          if (inv.status === 'Paid') monthlyData[month].revenue += inv.totalAmount;
        });
        
        const statusChartData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] })).filter(item => item.value > 0);
        const sortedClients = Object.keys(clientRevenue).map(key => ({ name: key, revenue: clientRevenue[key] })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = paid - totalExpenses;

        setStats({
          outstanding,
          paid,
          activeClients: clients.length,
          totalInvoices: invoices.length,
          totalExpenses,
          netProfit
        });
        
        setChartData(Object.values(monthlyData));
        setStatusData(statusChartData);
        setTopClients(sortedClients);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const generateAIReport = async () => {
    setGeneratingReport(true);
    setReportError('');
    try {
      const { data } = await api.get('/reports/ai-insights');
      setAiReport(data.report);
    } catch (error) {
      console.error('Error generating AI report:', error);
      setReportError(error.response?.data?.message || 'Failed to generate report. Make sure GEMINI_API_KEY is set on the backend.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Here is an overview of your freelance business.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Outstanding Revenue</p>
            <h2 className="text-2xl font-bold text-foreground">${stats.outstanding.toLocaleString()}</h2>
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
            <h2 className="text-2xl font-bold text-foreground">${stats.paid.toLocaleString()}</h2>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <h2 className="text-2xl font-bold text-foreground">${stats.totalExpenses.toLocaleString()}</h2>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
          <div className={`p-3 rounded-lg ${stats.netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
            <h2 className="text-2xl font-bold text-foreground">${stats.netProfit.toLocaleString()}</h2>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
            <h2 className="text-2xl font-bold text-foreground">{stats.activeClients}</h2>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-card border border-border rounded-xl shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
            <h2 className="text-2xl font-bold text-foreground">{stats.totalInvoices}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No revenue data available yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Status Breakdown</h3>
          <div className="h-80 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No status data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Top Clients by Paid Revenue</h3>
        </div>
        {topClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Client Name</th>
                  <th className="px-6 py-4 font-medium text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topClients.map((client, index) => (
                  <tr key={index} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{client.name}</td>
                    <td className="px-6 py-4 font-medium text-right text-green-600 dark:text-green-400">
                      ${client.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No client revenue data available.
          </div>
        )}
      </div>

      {/* AI Insights Section */}
      <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-indigo-500" size={24} />
            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">AI Financial Insights</h3>
          </div>
          <button 
            onClick={generateAIReport}
            disabled={generatingReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors disabled:opacity-70"
          >
            {generatingReport ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Analyzing Data...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
        
        <div className="p-8">
          {reportError && (
            <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md mb-4 border border-red-200 dark:border-red-800">
              {reportError}
            </div>
          )}

          {!aiReport && !generatingReport && !reportError ? (
            <div className="text-center py-8 text-muted-foreground">
              Click the "Generate Report" button to get AI-powered insights about your business.
            </div>
          ) : (
            <div className="prose prose-indigo max-w-none dark:prose-invert">
              <ReactMarkdown>{aiReport}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
