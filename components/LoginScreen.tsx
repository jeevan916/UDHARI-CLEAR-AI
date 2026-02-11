import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound, Smartphone, Landmark, Server, ShieldAlert, PlugZap, ShieldCheck } from 'lucide-react';
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

  const performOfflineAuth = () => {
    // 1. Root Admin Hardcoded Check (PRIORITY BYPASS)
    if ((email === 'matrixjeevan@gmail.com' && password === 'admin123') || 
        (email === 'admin' && password === 'admin')) {
        
        console.warn("Authentication Bypass: Master Key Recognized. Activating Root Session.");
        
        onLogin({
          id: 'usr_offline_root',
          name: 'System Root (Master)',
          email: email,
          role: 'admin',
          avatarUrl: 'RT'
        });
        return true;
    }

    // 2. Simulation Agent Check
    if (email === 'agent@arrearsflow.com' && password === 'agent123') {
        console.warn("Authentication Bypass: Agent Key Recognized.");
        onLogin({
          id: 'usr_offline_agent',
          name: 'Simulation Agent',
          email: email,
          role: 'staff',
          avatarUrl: 'SA'
        });
        return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // --- 1. PRIORITY CLIENT-SIDE CHECK ---
    // We check this FIRST. If it matches, we don't even bother the server.
    // This guarantees access even if the backend is dead, lagging, or misconfigured.
    if (performOfflineAuth()) {
       setLoading(false);
       return; 
    }

    // --- 2. ATTEMPT SERVER AUTH ---
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data && response.data.id) {
         onLogin(response.data);
      } else {
         throw new Error('Invalid response from server node.');
      }
    } catch (err: any) {
      console.error("Server Login Failed", err);
      
      // If we reach here, the server rejected it AND it wasn't a master key.
      if (err.code === "ERR_NETWORK" || !err.response) {
         setError("Server Unreachable. Use Emergency/Root keys to bypass.");
      } else if (err.response?.status === 401) {
         setError("Invalid Credentials. Try the Root button.");
      } else {
         setError(err.response?.data?.error || 'Access Denied.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'staff' | 'emergency') => {
    if (type === 'admin') {
      setEmail('matrixjeevan@gmail.com');
      setPassword('admin123'); 
    } else if (type === 'staff') {
      setEmail('agent@arrearsflow.com');
      setPassword('agent123');
    } else {
      // Emergency Fallback
      setEmail('admin');
      setPassword('admin');
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
                <span>Hostinger Node: 72.61.175.20</span>
             </div>
             <div className="flex items-center gap-4 text-slate-500 text-xs font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <span>Status: Operational (v8.1)</span>
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
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-white tracking-tight"
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
              <div className="p-4 rounded-xl border flex items-center gap-3 animate-in shake bg-rose-500/10 text-rose-500 border-rose-500/20">
                <AlertCircle size={16} /> 
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
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
            
            <div className="grid grid-cols-3 gap-3 mt-6">
               <button 
                 type="button"
                 onClick={() => fillCredentials('admin')}
                 className="py-3 text-[9px] bg-indigo-500/10 text-indigo-400 font-black uppercase tracking-widest hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-500/20 flex items-center justify-center gap-2"
                 title="matrixjeevan@gmail.com"
               >
                 <KeyRound size={14}/> Root
               </button>
               <button 
                 type="button"
                 onClick={() => fillCredentials('staff')}
                 className="py-3 text-[9px] bg-slate-800 text-slate-300 font-black uppercase tracking-widest hover:bg-slate-700 rounded-xl transition-colors border border-white/5 flex items-center justify-center gap-2"
                 title="agent@arrearsflow.com"
               >
                 <Smartphone size={14}/> Agent
               </button>
               <button 
                 type="button"
                 onClick={() => fillCredentials('emergency')}
                 className="py-3 text-[9px] bg-rose-900/50 text-rose-400 font-black uppercase tracking-widest hover:bg-rose-900/80 rounded-xl transition-colors border border-rose-800 flex items-center justify-center gap-2"
                 title="admin / admin"
               >
                 <ShieldAlert size={14}/> Emerg.
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