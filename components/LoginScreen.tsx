import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound, Smartphone, Landmark, Server } from 'lucide-react';
import { User } from '../types';
import axios from 'axios';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Enterprise Auth Call
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data && response.data.id) {
         onLogin(response.data);
      } else {
         throw new Error('Invalid response from security node');
      }
    } catch (err: any) {
      console.error("Login Failed", err);
      setError(err.response?.data?.error || 'Access Denied. Identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setEmail('matrixjeevan@gmail.com');
      setPassword('admin123'); // Matches server fallback or DB seed
    } else {
      setEmail('agent@arrearsflow.com');
      setPassword('agent123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#010409]/90 to-slate-950/90"></div>
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
            <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
              <Landmark className="text-amber-500" size={32} />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Sanghavi <span className="text-amber-500 italic font-medium">Jewellers</span></h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed font-medium">
              Enterprise Recovery Platform <br/>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Secure Production Environment</span>
            </p>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 text-slate-500 text-xs font-black uppercase tracking-widest">
                <Server size={14} className="text-emerald-500"/>
                <span>Hostinger Node: 139.59.10.70</span>
             </div>
             <div className="flex items-center gap-4 text-slate-500 text-xs font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span>Status: Operational</span>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#010409]">
        <div className="w-full max-w-md bg-white/5 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Authority Entrance</h2>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Initialize Secure Session</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Corporate Identity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white uppercase tracking-tight"
                  placeholder="admin@arrearsflow.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Security Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/20 flex items-center gap-3 animate-in shake">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed uppercase text-[11px] tracking-[0.2em]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Establish Secure Link <ArrowRight size={18} /></>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
               <button 
                 type="button"
                 onClick={() => fillCredentials('admin')}
                 className="py-3 text-[9px] bg-indigo-500/10 text-indigo-400 font-black uppercase tracking-widest hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-500/20 flex items-center justify-center gap-2"
               >
                 <KeyRound size={14}/> Admin Root
               </button>
               <button 
                 type="button"
                 onClick={() => fillCredentials('staff')}
                 className="py-3 text-[9px] bg-slate-800 text-slate-300 font-black uppercase tracking-widest hover:bg-slate-700 rounded-xl transition-colors border border-white/5 flex items-center justify-center gap-2"
               >
                 <Smartphone size={14}/> Agent View
               </button>
            </div>
          </form>

          <div className="mt-10 text-center border-t border-white/5 pt-6">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">
              AES-256 Bit Encryption • Primary Core Sync
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};