import React from 'react';
import { AppConfig, AVAILABLE_FEATURES, FeatureKey, AVAILABLE_BOT_ACTIONS } from '../types';
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
  Sparkles,
  BookOpen,
  Navigation,
  UserCircle,
  Radar,
  Map
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

  const toggleBotAction = (actionId: string) => {
    setConfig(prev => {
      const currentActions = prev.botQuickActions || [];
      const isCurrentlyEnabled = currentActions.includes(actionId);
      const newActions = isCurrentlyEnabled 
        ? currentActions.filter(id => id !== actionId)
        : [...currentActions, actionId];
      return { ...prev, botQuickActions: newActions };
    });
  };

  const reorderFeatures = (newOrder: FeatureKey[]) => {
    const disabled = config.featureOrder.filter(id => !config.features[id]);
    setConfig(prev => ({ ...prev, featureOrder: [...newOrder, ...disabled] }));
  };

  const enabledFeaturesOrder = config.featureOrder.filter(id => config.features[id]);

  const iconMap: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles className="w-4 h-4" />,
    Mic: <Mic className="w-4 h-4" />,
    Camera: <Camera className="w-4 h-4" />,
    ShoppingCart: <ShoppingCart className="w-4 h-4" />,
    Zap: <Zap className="w-4 h-4" />,
    BarChart: <BarChart className="w-4 h-4" />,
    MapPin: <MapPin className="w-4 h-4" />,
    BookOpen: <BookOpen className="w-4 h-4" />,
    Navigation: <Navigation className="w-4 h-4" />,
    UserCircle: <UserCircle className="w-4 h-4" />,
    Radar: <Radar className="w-4 h-4" />,
    Map: <Map className="w-4 h-4" />,
  };

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
                    {iconMap[feature.icon] || <Zap className="w-4 h-4" />}
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

        {/* Bot Quick Actions Grid */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Smart Bot Quick-Actions</h3>
              <p className="text-sm text-slate-500">Configure which predictive actions appear at the bottom of the Bot screen.</p>
            </div>
            <div className={cn(
              "px-3 py-1 text-[10px] font-black rounded-full border flex items-center gap-1 uppercase tracking-wider",
              config.features.predictiveBot ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", config.features.predictiveBot ? "bg-emerald-500" : "bg-slate-300")}></div>
              {config.features.predictiveBot ? "Module Active" : "Module Disabled"}
            </div>
          </div>

          {!config.features.predictiveBot ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Zap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enable 'Predictive Bot' module to configure actions</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVAILABLE_BOT_ACTIONS.map((action) => {
                const isEnabled = (config.botQuickActions || []).includes(action.id);
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleBotAction(action.id)}
                    className={cn(
                      "p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2",
                      isEnabled 
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                        : "bg-white border-slate-200 text-slate-400 opacity-60 grayscale"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isEnabled ? "bg-blue-500/20 text-blue-400" : "bg-slate-100 text-slate-400"
                    )}>
                      {iconMap[action.icon] || <Zap className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight leading-none h-6 flex items-center">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
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
