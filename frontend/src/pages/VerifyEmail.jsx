import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-background">
      <div className="bg-white dark:bg-card p-8 rounded-lg shadow-md border border-border w-96 text-center space-y-4">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <h2 className="text-xl font-semibold">Verifying your email...</h2>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold text-green-600 mb-2">Verified!</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/login" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="text-red-500 w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/login" className="px-6 py-2 border border-border rounded-md font-medium hover:bg-muted transition-colors">
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
