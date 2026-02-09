import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Smartphone, Landmark } from 'lucide-react';
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
      if (email.toLowerCase() === 'matrixjeevan@gmail.com' && password === 'admin123') {
        onLogin({
          id: 'usr_admin_01',
          name: 'Jeevan Matrix',
          email: email,
          role: 'admin',
          avatarUrl: 'JM'
        });
      } 
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 to-slate-950/90"></div>
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <Landmark className="text-amber-400" size={32} />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Sanghavi <span className="text-amber-500 italic font-medium">Jewellers</span></h1>
            <p className="text-indigo-200 text-lg max-w-md leading-relaxed font-medium">
              Enterprise Recovery Node v2.2.1 <br/>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Powered by ArrearsFlow AI</span>
            </p>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 text-indigo-300/60 text-xs font-black uppercase tracking-widest">
                <span>Secure Node: 72.61.175.20</span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>SSL Encrypted</span>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Authority Access</h2>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Sign in to initialize session</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Corporate ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 uppercase tracking-tight"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed uppercase text-[11px] tracking-[0.2em]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Establish Handshake <ArrowRight size={18} /></>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
               <button 
                 type="button"
                 onClick={() => fillCredentials('admin')}
                 className="py-3 text-[9px] bg-indigo-50 text-indigo-700 font-black uppercase tracking-widest hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                 <KeyRound size={14}/> Admin
               </button>
               <button 
                 type="button"
                 onClick={() => fillCredentials('staff')}
                 className="py-3 text-[9px] bg-slate-100 text-slate-700 font-black uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2"
               >
                 <Smartphone size={14}/> Staff
               </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Authorized Use Only • server1645-asia
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};