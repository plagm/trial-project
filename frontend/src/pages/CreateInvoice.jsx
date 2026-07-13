import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    client: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, rate: 0 }],
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get('/clients');
        setClients(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, client: data[0]._id }));
        }
      } catch (error) {
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
    });
  };

  const removeLineItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client) {
      toast.error('Please select a client');
      return;
    }

    setIsSubmitting(true);
    const subtotal = calculateTotal();
    
    // Format items with amount for backend validation
    const formattedItems = formData.items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
      amount: (Number(item.quantity) || 0) * (Number(item.rate) || 0)
    }));

    const invoiceData = {
      ...formData,
      items: formattedItems,
      subtotal: subtotal,
      totalAmount: subtotal,
      status: 'Draft'
    };

    try {
      await api.post('/invoices', invoiceData);
      toast.success('Invoice created successfully');
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
      setIsSubmitting(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground mt-1">Draft a new invoice to bill your clients.</p>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Client</label>
              <select 
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                required
                className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2.5"
              >
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Invoice Number</label>
              <input 
                type="text" 
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                required
                className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2.5" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Issue Date</label>
              <input 
                type="date" 
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                required
                className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2.5" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Due Date</label>
              <input 
                type="date" 
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                required
                className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2.5" 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Line Items</h3>
              <button 
                type="button" 
                onClick={addLineItem}
                className="text-sm text-primary flex items-center hover:underline"
              >
                <Plus size={16} className="mr-1" /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase px-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <input 
                      type="text" 
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      required
                      className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 text-center" 
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) => handleLineItemChange(index, 'rate', e.target.value)}
                      required
                      className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 text-center" 
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end space-x-4">
                    <span className="font-medium">
                      ${((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toLocaleString()}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => removeLineItem(index)}
                      className={`text-muted-foreground hover:text-destructive ${formData.items.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end border-t border-border pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-muted-foreground hover:text-foreground mr-4 text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
