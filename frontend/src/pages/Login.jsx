import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      const success = await register({ name, email, password });
      if (success) {
        setIsRegistering(false);
        setPassword('');
      }
    } else {
      const success = await login(email, password);
      if (success) navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-background">
      <div className="bg-white dark:bg-card p-8 rounded-lg shadow-md border border-border w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary">InvoiceLoop</h1>
        
        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const success = await googleLogin(credentialResponse.credential);
              if (success) navigate('/');
            }}
            onError={() => {
              console.log('Login Failed');
            }}
            useOneTap
          />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-card px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-border dark:bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-border dark:bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-border dark:bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </button>
          
          {!isRegistering && (
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          )}
        </form>
        <div className="mt-4 text-center">
          <button 
            type="button" 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-primary hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
