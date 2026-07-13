import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Trash2, Mail, Phone, Users as UsersIcon } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newClient.name,
        email: newClient.email,
        address: { street: newClient.address }
      };
      const { data } = await api.post('/clients', payload);
      setClients([...clients, data]);
      setNewClient({ name: '', email: '', address: '' });
      setIsAdding(false);
      toast.success('Client added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add client');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter(c => c._id !== id));
      toast.success('Client deleted');
    } catch (error) {
      toast.error('Failed to delete client');
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
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your customer base.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {isAdding ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-6 mb-6 animate-in slide-in-from-top-2">
          <h2 className="text-lg font-semibold mb-4">New Client Details</h2>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                <input 
                  type="text" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  required
                  className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input 
                  type="email" 
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  required
                  className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
              <input 
                type="text" 
                value={newClient.address}
                onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                required
                className="w-full rounded-md border-border bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Save Client
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UsersIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No clients found</h3>
            <p className="text-muted-foreground mt-1 mb-4">Add your first client to start billing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{client.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-muted-foreground">
                        <Mail size={14} className="mr-2" />
                        {client.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{client.address?.street || client.address || ''}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(client._id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
