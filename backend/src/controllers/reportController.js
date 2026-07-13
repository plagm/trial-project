import { GoogleGenAI } from '@google/genai';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';

const generateFallbackReport = (data) => {
  const { totalInvoiced, totalPaid, totalOverdue, totalExpenses, expenseCategories, clientRevenue } = data;
  
  const netIncome = totalPaid - totalExpenses;
  const isProfitable = netIncome >= 0;
  
  // Find top client
  let topClient = 'None';
  let maxRevenue = 0;
  for (const [client, rev] of Object.entries(clientRevenue)) {
    if (rev > maxRevenue) {
      maxRevenue = rev;
      topClient = client;
    }
  }

  // Find top expense
  let topExpenseCat = 'None';
  let maxExpense = 0;
  for (const [cat, amt] of Object.entries(expenseCategories)) {
    if (amt > maxExpense) {
      maxExpense = amt;
      topExpenseCat = cat;
    }
  }

  return `
# Financial Insights Report (Automated Fallback)

*Note: The AI generation service is temporarily unavailable or hit a rate limit. This is an automated programmatic report.*

## 1. Financial Health Overview
- **Total Invoiced:** $${totalInvoiced.toFixed(2)}
- **Total Paid:** $${totalPaid.toFixed(2)}
- **Total Expenses:** $${totalExpenses.toFixed(2)}
- **Net Income (Paid - Expenses):** $${netIncome.toFixed(2)}

Your business is currently **${isProfitable ? 'Profitable ✅' : 'Operating at a Loss ⚠️'}**.

## 2. Key Insights
- **Top Client:** Your most valuable client is **${topClient}** with $${maxRevenue.toFixed(2)} in revenue.
- **Top Expense:** Your largest expense category is **${topExpenseCat}** ($${maxExpense.toFixed(2)}).
- **Overdue Risk:** You currently have **$${totalOverdue.toFixed(2)}** tied up in overdue invoices.

## 3. Actionable Recommendations
${totalOverdue > 0 ? '- **Follow Up:** You have outstanding overdue invoices. Send reminders to these clients to improve your cash flow immediately.' : '- **Cash Flow:** Your receivables are in good shape with no overdue invoices!'}
${!isProfitable ? '- **Reduce Burn:** Since you are operating at a loss, consider auditing your top expense category (' + topExpenseCat + ') for potential cuts.' : '- **Reinvest:** With a positive net income, consider setting aside a portion for taxes and reinvesting the rest.'}
`;
};

export const generateFinancialReport = async (req, res) => {
  try {
    // Fetch user data
    const userId = req.user._id;
    const invoices = await Invoice.find({ user: userId }).populate('client');
    const expenses = await Expense.find({ user: userId });

    // Summarize data for the prompt to reduce tokens
    const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const expenseCategories = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    const clientRevenue = invoices.reduce((acc, curr) => {
      const clientName = curr.client ? curr.client.name : 'Unknown';
      acc[clientName] = (acc[clientName] || 0) + curr.totalAmount;
      return acc;
    }, {});

    const dataSummary = {
      totalInvoiced,
      totalPaid,
      totalOverdue,
      totalExpenses,
      expenseCategories,
      clientRevenue,
    };

    const aiApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
    
    // If no API key, return fallback immediately
    if (!aiApiKey) {
      console.log('No Gemini API key found, using fallback report.');
      return res.json({ report: generateFallbackReport(dataSummary) });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: aiApiKey });
      const prompt = `
You are a financial advisor for a freelancer/small business owner.
Based on the following financial summary data of their business, provide a concise, insightful report.
Format the response using Markdown. Use bolding, lists, and headers where appropriate. Do not use generic greetings, just provide the report.

Financial Data:
${JSON.stringify(dataSummary, null, 2)}

Please include:
1. An overview of their financial health (Revenue vs Expenses).
2. Insights into their top clients or expense categories.
3. Actionable recommendations (e.g., following up on overdue invoices, cutting specific expenses).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      res.json({ report: response.text });
    } catch (aiError) {
      console.error('AI Generation failed, using fallback:', aiError.message);
      // Fallback on AI error (like 429 Rate Limit or 404 Model Not Found)
      res.json({ report: generateFallbackReport(dataSummary) });
    }

  } catch (error) {
    console.error('Error generating AI report:', error);
    res.status(500).json({ message: 'Failed to generate financial report: ' + (error.message || error) });
  }
};
