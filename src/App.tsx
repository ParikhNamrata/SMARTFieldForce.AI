/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppConfig, FeatureKey, AVAILABLE_FEATURES, AVAILABLE_BOT_ACTIONS } from './types';
import Login from './views/Login';
import PortalDashboard from './views/PortalDashboard';
import MobileSimulator from './views/MobileSimulator';

const INITIAL_FEATURES = AVAILABLE_FEATURES.reduce((acc, feature) => ({
  ...acc,
  [feature.id]: true
}), {} as AppConfig['features']);

const INITIAL_CONFIG: AppConfig = {
  features: INITIAL_FEATURES,
  featureOrder: AVAILABLE_FEATURES.map(f => f.id),
  botQuickActions: AVAILABLE_BOT_ACTIONS.map(a => a.id),
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('smartadmin_logged_in') === 'true';
    } catch (e) {
      console.warn('localStorage is restricted in this environment, defaulting to unauthenticated', e);
      return false;
    }
  });
  const [config, setConfig] = useState<AppConfig>(() => {
    let savedConfig: string | null = null;
    try {
      savedConfig = localStorage.getItem('smart_app_config');
    } catch (e) {
      console.warn('localStorage is restricted in this environment, using INITIAL_CONFIG', e);
    }
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        
        // 1. Build features object carefully
        // Default everything to true first (from INITIAL_CONFIG)
        const features = { ...INITIAL_CONFIG.features };
        
        // Overwrite with saved values if they exist
        if (parsed.features) {
          Object.keys(parsed.features).forEach(key => {
            const featureKey = key as FeatureKey;
            if (featureKey in features) {
              features[featureKey] = parsed.features[featureKey] === true;
            }
          });
        }

        // Force mandatory features to be true
        AVAILABLE_FEATURES.forEach(f => {
          if (f.mandatory) {
            features[f.id] = true;
          }
        });
        
        console.log('App: FinalMergedFeatures', features);
        
        // 2. Build feature order carefully
        const validKeys = AVAILABLE_FEATURES.map(f => f.id);
        const savedOrder = (parsed.featureOrder || []) as FeatureKey[];
        const filteredOrder = savedOrder.filter(key => validKeys.includes(key));
        
        // Add missing keys
        const missingKeys = validKeys.filter(key => !filteredOrder.includes(key));
        const finalOrder = [...filteredOrder, ...missingKeys];

        // 3. Build bot quick actions
        const savedBotActions = (parsed.botQuickActions || []) as string[];
        const validBotActions = AVAILABLE_BOT_ACTIONS.map(a => a.id);
        const finalBotActions = savedBotActions.filter(id => validBotActions.includes(id));
        const botQuickActions = parsed.hasOwnProperty('botQuickActions') ? finalBotActions : INITIAL_CONFIG.botQuickActions;

        return {
          features,
          featureOrder: finalOrder,
          botQuickActions,
        };
      } catch (e) {
        console.error('Failed to parse saved config', e);
        return INITIAL_CONFIG;
      }
    }
    return INITIAL_CONFIG;
  });

  // Sync via BroadcastChannel (modern, reliable for same-tab iframes)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('smart_app_sync_channel');
      
      const handleSync = (event: MessageEvent) => {
        if (event.data.type === 'SYNC_CONFIG' && event.data.config) {
          const newConfig = event.data.config;
          
          // Basic validation
          if (newConfig.features && newConfig.featureOrder) {
            setConfig(prev => {
              // Prevent infinite broadcast loops by comparing strings
              if (JSON.stringify(prev) !== JSON.stringify(newConfig)) {
                console.log('App: Syncing config from broadcast', newConfig);
                return { ...newConfig };
              }
              return prev;
            });
          }
        }
      };

      channel.onmessage = handleSync;
    } catch (e) {
      console.warn('BroadcastChannel is restricted or unsupported in this environment:', e);
    }

    // Standard storage listener for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_app_config' && e.newValue) {
        try {
          const newConfig = JSON.parse(e.newValue);
          setConfig(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newConfig)) {
              console.log('App: Syncing config via storage', newConfig);
              return newConfig;
            }
            return prev;
          });
        } catch (err) {
          console.error('Failed to parse storage config', err);
        }
      }
      if (e.key === 'smartadmin_logged_in') {
        setIsAuthenticated(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) {
        try {
          channel.close();
        } catch (e) {
          console.error('Failed to close BroadcastChannel:', e);
        }
      }
    };
  }, []);

  const handleLogin = (status: boolean) => {
    setIsAuthenticated(status);
    try {
      if (status) {
        localStorage.setItem('smartadmin_logged_in', 'true');
      } else {
        localStorage.removeItem('smartadmin_logged_in');
      }
    } catch (e) {
      console.warn('localStorage write/delete restricted during login/logout:', e);
    }
  };

  const handleDeploy = (newConfig: AppConfig) => {
    try {
      console.log('App: Starting deployment...', newConfig);
      
      // 1. Persist to storage
      try {
        localStorage.setItem('smart_app_config', JSON.stringify(newConfig));
      } catch (storageErr) {
        console.warn('localStorage is restricted or full during deploy:', storageErr);
      }
      
      // 2. Broadcast to other instances
      try {
        const channel = new BroadcastChannel('smart_app_sync_channel');
        channel.postMessage({ type: 'SYNC_CONFIG', config: newConfig });
        
        // Give a tiny moment for broadcast to go out before closing (though usually sync)
        setTimeout(() => {
          try {
            channel.close();
          } catch (e) {}
        }, 100);
      } catch (broadcastErr) {
        console.warn('BroadcastChannel is restricted or failed during deploy:', broadcastErr);
      }

      // 3. Update local state to trigger re-renders in current tab
      setConfig({ ...newConfig });
      
      // Feedback is handled by components via callbacks (e.g. PortalDashboard)
      console.log('App: Deployment successful');
    } catch (error) {
      console.error('Deployment failed:', error);
      // Removed alert() to prevent standard sandbox SecurityErrors
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/portal" /> : <Login onLogin={() => handleLogin(true)} />} 
          />
          <Route 
            path="/portal/*" 
            element={
              isAuthenticated ? (
                <PortalDashboard 
                  config={config} 
                  setConfig={setConfig} 
                  onDeploy={handleDeploy}
                  onLogout={() => handleLogin(false)} 
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/preview" 
            element={<MobileSimulator config={config} />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/portal" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

