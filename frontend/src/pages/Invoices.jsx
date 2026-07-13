import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Download, Trash2, Plus, FileText, Mail, FileDown, Eye, FileEdit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailModal, setEmailModal] = useState({ isOpen: false, invoiceId: null, invoiceNumber: '', email: '' });
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices');
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Draft' ? 'Sent' : currentStatus === 'Sent' ? 'Paid' : 'Draft';
    try {
      await api.put(`/invoices/${id}`, { status: newStatus });
      setInvoices(invoices.map(inv => inv._id === id ? { ...inv, status: newStatus } : inv));
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv._id !== id));
      toast.success('Invoice deleted');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleDownload = async (id, number) => {
    try {
      const response = await api.get(`/invoices/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/invoices/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoices_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleEmailClick = (id, number, defaultEmail) => {
    setEmailModal({ isOpen: true, invoiceId: id, invoiceNumber: number, email: defaultEmail || '' });
  };

  const confirmSendEmail = async () => {
    if (!emailModal.email) {
      toast.error('Please enter an email address');
      return;
    }

    const { invoiceId, invoiceNumber, email } = emailModal;
    setEmailModal({ ...emailModal, isOpen: false });

    try {
      setIsSending(true);
      const toastId = toast.loading('Sending email...');
      await api.post(`/invoices/${invoiceId}/email`, { email });
      
      setInvoices(invoices.map(inv => inv._id === invoiceId ? { ...inv, status: 'Sent' } : inv));
      
      toast.success(`Invoice ${invoiceNumber} sent successfully!`, { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your invoices and track payments.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportCSV}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors border border-border"
          >
            <FileDown size={16} />
            <span>Export CSV</span>
          </button>
          <Link 
            to="/invoices/new" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={48} className="text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No invoices yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">Create your first invoice to get started.</p>
            <Link to="/invoices/new" className="text-primary font-medium hover:underline">
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Invoice Number</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Issue Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link to={`/invoices/${invoice._id}`} className="text-primary hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{invoice.client?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">${invoice.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleStatusChange(invoice._id, invoice.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          invoice.status === 'Paid' 
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                            : invoice.status === 'Sent'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                        }`}
                      >
                        {invoice.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/invoices/${invoice._id}`)}
                          className="p-2 text-muted-foreground hover:text-indigo-500 transition-colors"
                          title="View Invoice"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/invoices/${invoice._id}/edit`)}
                          className="p-2 text-muted-foreground hover:text-yellow-500 transition-colors"
                          title="Edit Invoice"
                        >
                          <FileEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleEmailClick(invoice._id, invoice.invoiceNumber, invoice.client?.email)}
                          className="p-2 text-muted-foreground hover:text-blue-500 transition-colors"
                          title="Send Email"
                        >
                          <Mail size={18} />
                        </button>
                        <button 
                          onClick={() => handleDownload(invoice._id, invoice.invoiceNumber)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(invoice._id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Confirmation Modal */}
      {emailModal.isOpen && (
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
                Enter the recipient's email address below to send invoice <span className="font-semibold text-gray-900 dark:text-white">#{emailModal.invoiceNumber}</span>.
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
                      value={emailModal.email}
                      onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
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
                  onClick={() => setEmailModal({ ...emailModal, isOpen: false })}
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
