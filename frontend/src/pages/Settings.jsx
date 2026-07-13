import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    logoUrl: '',
    defaultCurrency: 'USD',
    defaultTaxRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          setSettings({
            companyName: data.companyName || '',
            companyAddress: data.companyAddress || '',
            logoUrl: data.logoUrl || '',
            defaultCurrency: data.defaultCurrency || 'USD',
            defaultTaxRate: data.defaultTaxRate || 0
          });
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your company profile and default preferences.</p>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="w-full p-2 border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Acme Corp"
              />
            </div>
            
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium mb-1">Company Address</label>
              <textarea
                id="companyAddress"
                name="companyAddress"
                value={settings.companyAddress}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="123 Business St&#10;City, Country, ZIP"
              />
            </div>

            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="text"
                id="logoUrl"
                name="logoUrl"
                value={settings.logoUrl}
                onChange={handleChange}
                className="w-full p-2 border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="defaultCurrency" className="block text-sm font-medium mb-1">Default Currency</label>
                <select
                  id="defaultCurrency"
                  name="defaultCurrency"
                  value={settings.defaultCurrency}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="defaultTaxRate" className="block text-sm font-medium mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  id="defaultTaxRate"
                  name="defaultTaxRate"
                  value={settings.defaultTaxRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
