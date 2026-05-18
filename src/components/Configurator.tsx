import React from 'react';
import { AppConfig, AVAILABLE_FEATURES, FeatureKey } from '../types';
import { motion, Reorder } from 'motion/react';
import { 
  CheckCircle2, 
  GripVertical,
  Zap,
  Lock,
  Mic,
  Camera,
  ShoppingCart,
  BarChart,
  MapPin,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfiguratorProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onDeploy: (config: AppConfig) => void;
}

export default function Configurator({ config, setConfig, onDeploy }: ConfiguratorProps) {
  const toggleFeature = (feature: (typeof AVAILABLE_FEATURES)[0]) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature.id]: !prev.features[feature.id]
      }
    }));
  };

  const reorderFeatures = (newOrder: FeatureKey[]) => {
    const disabled = config.featureOrder.filter(id => !config.features[id]);
    setConfig(prev => ({ ...prev, featureOrder: [...newOrder, ...disabled] }));
  };

  const enabledFeaturesOrder = config.featureOrder.filter(id => config.features[id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Feature Modules</h3>
              <p className="text-sm text-slate-500">Pick and configure the modules for your field team. Changes reflect instantly in live preview.</p>
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-100 flex items-center gap-1 uppercase tracking-wider">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Live Sync Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_FEATURES.map((feature) => (
              <motion.button
                key={feature.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleFeature(feature)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                  config.features[feature.id] 
                    ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10" 
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0 transition-all",
                  config.features[feature.id] ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500"
                )}>
                  <div className="w-5 h-5 flex items-center justify-center font-bold">
                    {feature.id === 'predictiveBot' && <Sparkles className="w-4 h-4" />}
                    {feature.id === 'voiceToText' && <Mic className="w-4 h-4" />}
                    {feature.id === 'visionAutomation' && <Camera className="w-4 h-4" />}
                    {feature.id === 'orderManagement' && <ShoppingCart className="w-4 h-4" />}
                    {feature.id === 'quizModule' && <Zap className="w-4 h-4" />}
                    {feature.id === 'salesInsights' && <BarChart className="w-4 h-4" />}
                    {feature.id === 'locationReporting' && <MapPin className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{feature.name}</span>
                    {config.features[feature.id] && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* App Structure Preview (Drag and Drop Reordering) */}
      <div className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl text-white">
          <h3 className="text-md font-bold mb-4 flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-500" />
            Home Grid Order
          </h3>
          <p className="text-[10px] text-slate-400 mb-6 font-medium">Drag to reorder elements on the mobile home screen.</p>
          
          <Reorder.Group 
            axis="y" 
            values={enabledFeaturesOrder} 
            onReorder={reorderFeatures}
            className="space-y-2"
          >
             {enabledFeaturesOrder.map((featureId) => {
               const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
               if (!feature) return null;
               
               return (
                 <Reorder.Item 
                    key={featureId} 
                    value={featureId}
                    className="touch-none"
                 >
                    <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors cursor-grab active:cursor-grabbing group">
                      <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                      <span className="text-xs font-bold tracking-tight">{feature.name}</span>
                    </div>
                 </Reorder.Item>
               );
             })}
          </Reorder.Group>
          
          {enabledFeaturesOrder.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-700 rounded-2xl text-slate-500 text-[10px] uppercase font-black">
              No features active.
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/20 text-white">
           <h4 className="font-black text-lg mb-1 uppercase tracking-widest opacity-80">Publish Changes</h4>
           <p className="text-blue-100/80 text-[10px] mb-6 leading-relaxed font-semibold">Your modifications will be pushed live to all field agent apps globally.</p>
           <button 
             onClick={() => onDeploy(config)}
             className="w-full py-4 bg-white text-blue-600 font-black rounded-xl text-xs uppercase tracking-[0.1em] hover:bg-blue-50 transition-all active:scale-[0.98] shadow-lg"
           >
              Deploy to Store
           </button>
        </div>
      </div>
    </div>
  );
}
