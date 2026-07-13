import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50">
      <div className="bg-white dark:bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden">
        <input 
          autoFocus 
          type="text" 
          placeholder="Type a command or search..." 
          className="w-full p-4 text-lg border-b border-border outline-none bg-transparent"
        />
        <div className="p-2">
          <button 
            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-accent rounded-md"
            onClick={() => { navigate('/invoices/new'); setIsOpen(false); }}
          >
            Create new invoice
          </button>
          <button 
            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-accent rounded-md"
            onClick={() => { navigate('/clients'); setIsOpen(false); }}
          >
            View clients
          </button>
        </div>
      </div>
    </div>
  );
}
