
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Smartphone } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Admin Credentials
      if (email.toLowerCase() === 'matrixjeevan@gmail.com' && password === 'admin123') {
        onLogin({
          id: 'usr_admin_01',
          name: 'Jeevan Matrix',
          email: email,
          role: 'admin',
          avatarUrl: 'JM'
        });
      } 
      // Field Agent Credentials
      else if (email.toLowerCase() === 'agent@arrearsflow.com' && password === 'agent123') {
        onLogin({
          id: 'usr_agent_04',
          name: 'Rahul Field',
          email: email,
          role: 'staff',
          avatarUrl: 'RF'
        });
      } else {
        setError('Invalid credentials. Access denied.');
        setLoading(false);
      }
    }, 800);
  };

  const fillCredentials = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setEmail('matrixjeevan@gmail.com');
      setPassword('admin123');
    } else {
      setEmail('agent@arrearsflow.com');
      setPassword('agent123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-slate-900/90"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20">
              <ShieldCheck className="text-indigo-300" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">ArrearsFlow <span className="text-indigo-400">Enterprise</span></h1>
            <p className="text-indigo-200 text-lg max-w-md leading-relaxed">
              Advanced debt recovery CRM with AI-driven risk profiling and omnichannel communication ledgers.
            </p>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 text-indigo-300/60 text-sm font-medium">
                <span>Secure 256-bit Encryption</span>
                <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                <span>ISO 27001 Certified</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-2">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2 ml-1">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
               <button 
                 type="button"
                 onClick={() => fillCredentials('admin')}
                 className="py-2 text-[10px] bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 <KeyRound size={12}/> Admin Demo
               </button>
               <button 
                 type="button"
                 onClick={() => fillCredentials('staff')}
                 className="py-2 text-[10px] bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 <Smartphone size={12}/> Agent Demo
               </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Restricted Access. Unauthorized use is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
