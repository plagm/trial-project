import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Mail, Trash2, CheckCircle, Printer, FileEdit } from 'lucide-react';

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const [invoiceRes, settingsRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/settings')
        ]);
        setInvoice(invoiceRes.data);
        setSettings(settingsRes.data);
      } catch (error) {
        toast.error('Failed to load invoice details');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceData();
  }, [id, navigate]);

  const handleDownload = async () => {
    try {
      const toastId = toast.loading('Generating PDF...');
      const response = await api.get(`/invoices/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleEmailClick = () => {
    setEmailInput(invoice.client?.email || '');
    setIsEmailModalOpen(true);
  };

  const confirmSendEmail = async () => {
    if (!emailInput) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsEmailModalOpen(false);
    try {
      setIsSending(true);
      const toastId = toast.loading('Sending email...');
      await api.post(`/invoices/${id}/email`, { email: emailInput });
      setInvoice(prev => ({ ...prev, status: 'Sent' }));
      toast.success('Invoice emailed successfully!', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await api.put(`/invoices/${id}`, { status: 'Paid' });
      setInvoice(prev => ({ ...prev, status: 'Paid' }));
      toast.success('Invoice marked as Paid');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/invoices" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Invoices
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {invoice.status !== 'Paid' && (
            <button 
              onClick={handleMarkAsPaid}
              className="bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
            >
              <CheckCircle size={16} />
              <span>Mark as Paid</span>
            </button>
          )}
          <Link
            to={`/invoices/${id}/edit`}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
          >
            <FileEdit size={16} />
            <span>Edit</span>
          </Link>
          <button 
            onClick={handleEmailClick}
            disabled={isSending}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Mail size={16} />
            <span>{isSending ? 'Sending...' : 'Email'}</span>
          </button>
          <button 
            onClick={handleDownload}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Delete Invoice"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="flex justify-center mt-8 relative">
        <div className="w-full max-w-4xl bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-200 overflow-hidden relative" style={{ minHeight: '1122px' }}>
          
          {/* Top Edge Accent */}
          <div className="h-4 bg-indigo-600 w-full"></div>

          {/* Invoice Content */}
          <div className="p-12 md:p-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-16">
              <div>
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Company Logo" className="h-16 mb-4 object-contain" />
                ) : (
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{settings?.companyName || 'Your Company'}</h2>
                )}
                <div className="text-gray-500 text-sm whitespace-pre-wrap">
                  {settings?.companyAddress || 'Your Address\\nCity, State ZIP'}
                </div>
              </div>
              <div className="text-right mt-6 md:mt-0">
                <h1 className="text-4xl font-bold text-gray-200 uppercase tracking-widest mb-2">Invoice</h1>
                <p className="text-xl font-medium text-gray-800">#{invoice.invoiceNumber}</p>
                <div className="mt-4 flex flex-col items-end gap-1 text-sm">
                  <div className="flex justify-between w-48">
                    <span className="text-gray-500 font-medium">Issue Date:</span>
                    <span className="text-gray-900">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between w-48">
                    <span className="text-gray-500 font-medium">Due Date:</span>
                    <span className="text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between w-48 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Amount Due:</span>
                    <span className="text-xl font-bold text-indigo-600">${(invoice.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-12">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
              <div className="text-gray-900 font-medium text-lg">{invoice.client?.name || 'Unknown Client'}</div>
              <div className="text-gray-500 text-sm">{invoice.client?.email}</div>
              <div className="text-gray-500 text-sm whitespace-pre-wrap mt-1">
                {invoice.client?.address ? `${invoice.client.address.street || ''}\n${invoice.client.address.city || ''}, ${invoice.client.address.state || ''} ${invoice.client.address.zip || ''}\n${invoice.client.address.country || ''}`.trim() : ''}
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-12">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 font-semibold text-gray-700 w-1/2">Description</th>
                    <th className="py-3 font-semibold text-gray-700 text-center">Qty</th>
                    <th className="py-3 font-semibold text-gray-700 text-right">Rate</th>
                    <th className="py-3 font-semibold text-gray-700 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 text-gray-900">{item.description}</td>
                      <td className="py-4 text-gray-600 text-center">{item.quantity}</td>
                      <td className="py-4 text-gray-600 text-right">${(item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 text-gray-900 font-medium text-right">${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">${(invoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                    <span className="text-gray-900 font-medium">${(invoice.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between py-4 mt-2 bg-gray-50 rounded-lg px-4 border border-gray-100">
                  <span className="text-gray-900 font-bold text-lg">Total</span>
                  <span className="text-indigo-600 font-bold text-xl">${(invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer / Notes */}
            {invoice.notes && (
              <div className="mt-16 pt-8 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Status Stamp - Positioned Absolutely over the container */}
          {invoice.status === 'Paid' && (
            <div className="absolute top-48 right-16 transform rotate-12 opacity-20 pointer-events-none">
              <div className="border-8 border-green-600 text-green-600 text-7xl font-extrabold p-6 uppercase tracking-widest rounded-xl">
                PAID
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-white">
                <Mail size={20} />
                <h3 className="text-lg font-semibold">Send Invoice</h3>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Enter the recipient's email address below to send invoice <span className="font-semibold text-gray-900 dark:text-white">#{invoice.invoiceNumber}</span>.
              </p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
                    To Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm dark:bg-gray-900 dark:text-white transition-all bg-gray-50"
                      placeholder="client@example.com"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSendEmail}
                  disabled={isSending}
                  className="px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 flex items-center disabled:opacity-70"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Email'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
