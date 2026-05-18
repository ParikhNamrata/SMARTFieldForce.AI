export interface AppConfig {
  features: {
    predictiveBot: boolean;
    voiceToText: boolean;
    visionAutomation: boolean;
    orderManagement: boolean;
    quizModule: boolean;
    salesInsights: boolean;
    locationReporting: boolean;
  };
  featureOrder: FeatureKey[];
}

export type FeatureKey = keyof AppConfig['features'];

export interface Feature {
  id: FeatureKey;
  name: string;
  description: string;
  icon: string;
  mandatory?: boolean;
}

export const AVAILABLE_FEATURES: Feature[] = [
  { id: 'predictiveBot', name: 'Predictive Bot', description: 'AI-driven task suggestions & quick completion', icon: 'Sparkles' },
  { id: 'visionAutomation', name: 'Vision AI', description: 'Automatic SKU and stock extraction from photos', icon: 'Camera' },
  { id: 'voiceToText', name: 'Voice Command', description: 'Hands-free data entry and automation', icon: 'Mic' },
  { id: 'orderManagement', name: 'Order Pro', description: 'Restock and replenishment management', icon: 'ShoppingCart' },
  { id: 'quizModule', name: 'Field Quiz', description: 'On-site training and knowledge checks', icon: 'Zap' },
  { id: 'salesInsights', name: 'Sales Tracker', description: 'Target vs achievement tracking', icon: 'BarChart' },
  { id: 'locationReporting', name: 'Smart Check-in', description: 'Geofenced location verification', icon: 'MapPin' },
];
