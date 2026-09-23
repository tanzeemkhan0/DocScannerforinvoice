import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { CREDENTIALS } from '../constants';
import { useAppStore } from '../store';
import { Logo } from './Logo';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAppStore(state => state.login);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId === CREDENTIALS.userId && password === CREDENTIALS.password) {
      login();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-industrial-900 p-4">
      <div className="max-w-md w-full bg-industrial-800 rounded-xl shadow-2xl overflow-hidden border border-industrial-700">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Logo className="h-24 w-auto drop-shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">UNISCAN</h2>
          <p className="text-industrial-400 text-center mb-8">B2B Invoice & Challan System</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-industrial-300 mb-2">User ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-industrial-500" />
                </div>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-industrial-600 rounded-md leading-5 bg-industrial-900 text-industrial-100 placeholder-industrial-500 focus:outline-none focus:ring-1 focus:ring-industrial-blue focus:border-industrial-blue sm:text-sm"
                  placeholder="Enter User ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-industrial-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-industrial-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-industrial-600 rounded-md leading-5 bg-industrial-900 text-industrial-100 placeholder-industrial-500 focus:outline-none focus:ring-1 focus:ring-industrial-blue focus:border-industrial-blue sm:text-sm"
                  placeholder="Enter Password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-industrial-blue hover:bg-industrial-blueHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-industrial-blue focus:ring-offset-industrial-900 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
