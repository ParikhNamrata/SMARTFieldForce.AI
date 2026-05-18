import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  LogOut, 
  Phone, 
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Mic,
  Camera,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  MapPin,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import { AppConfig, AVAILABLE_FEATURES, FeatureKey } from '../types';
import Configurator from '../components/Configurator';
import Reports from '../components/Reports';
import MobileSimulator from './MobileSimulator';
import { cn } from '../lib/utils';

interface PortalProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onDeploy: (config: AppConfig) => void;
  onLogout: () => void;
}

export default function PortalDashboard({ config: deployedConfig, setConfig, onDeploy, onLogout }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'insights'>('config');
  const [draftConfig, setDraftConfig] = useState<AppConfig>(deployedConfig);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastPublished, setLastPublished] = useState<string | null>(null);

  // Sync draft if deployed config changes externally (e.g. from another tab's deployment)
  useEffect(() => {
    setDraftConfig(deployedConfig);
  }, [deployedConfig]);

  // Real-time broadcast for live preview in other tabs/windows
  useEffect(() => {
    const channel = new BroadcastChannel('smart_app_sync_channel');
    // We only broadcast if we've initialized properly
    if (draftConfig && draftConfig.features) {
      channel.postMessage({ type: 'SYNC_CONFIG', config: draftConfig });
    }
    return () => channel.close();
  }, [draftConfig]);

  const handleDeployWithFeedback = (config: AppConfig) => {
    onDeploy(config);
    setShowSuccessToast(true);
    setLastPublished(new Date().toLocaleTimeString());
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 32, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 backdrop-blur-md"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest leading-none mb-1">Deployment Successful</p>
              <p className="text-[10px] opacity-80 font-bold leading-none">Simulator and live apps updated in real-time.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xl">
            <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center">S</div>
            <span>SMARTFieldForce.AI</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('config')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
              activeTab === 'config' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Settings className="w-5 h-5" />
            App Configurator
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
              activeTab === 'insights' ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            SMART Insights
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="mb-4 p-3 bg-slate-800 rounded-lg flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">SA</div>
             <div className="overflow-hidden">
               <p className="text-xs font-semibold text-white truncate">Smart Admin</p>
               <p className="text-[10px] text-slate-400 truncate">smartadmin@smollan.com</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'config' ? 'Mobile App Configurator' : 'SMART Insights & Analytics'}
          </h2>
          <div className="flex items-center gap-4">
            <a 
              href="/preview" 
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Live Simulator
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-8 flex gap-8">
           <AnimatePresence mode="wait">
             {activeTab === 'config' ? (
               <motion.div
                 key="config"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="flex-1 overflow-y-auto pr-4 custom-scrollbar"
               >
                 <Configurator 
                   config={draftConfig} 
                   setConfig={setDraftConfig} 
                   onDeploy={handleDeployWithFeedback} 
                 />
               </motion.div>
             ) : (
               <motion.div
                 key="insights"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="flex-1 overflow-y-auto"
               >
                 <Reports />
               </motion.div>
             )}
           </AnimatePresence>

           {/* Live Preview Side Panel */}
           <div className="w-[400px] shrink-0 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-4 hidden xl:flex flex-col items-center justify-center relative">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Live Preview
              </div>
              <div className="scale-[0.80] origin-top mt-16">
                <MobileSimulator config={draftConfig} />
              </div>
              <div className="mt-4 text-center px-10">
                <p className="text-[10px] text-slate-400 italic">
                  Preview updates in real-time.
                </p>
                {lastPublished && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider"
                  >
                    Last Published: {lastPublished}
                  </motion.p>
                )}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
