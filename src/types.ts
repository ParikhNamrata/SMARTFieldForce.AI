export interface BotQuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export interface AppConfig {
  features: {
    predictiveBot: boolean;
    voiceToText: boolean;
    visionAutomation: boolean;
    orderManagement: boolean;
    quizModule: boolean;
    salesInsights: boolean;
    locationReporting: boolean;
    trainingHub: boolean;
    routeOptimizer: boolean;
    assetTracker: boolean;
    userProfile: boolean;
    inventoryRadar: boolean;
    territoryMap: boolean;
  };
  featureOrder: FeatureKey[];
  botQuickActions: string[]; // Store IDs of enabled actions
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
  { id: 'trainingHub', name: 'Training Hub', description: 'Interactive learning and resource center', icon: 'BookOpen' },
  { id: 'routeOptimizer', name: 'Route Planner', description: 'AI-powered trip and distance optimization', icon: 'Navigation' },
  { id: 'assetTracker', name: 'Asset Guard', description: 'Fridge & Cooler health verification', icon: 'HardDrive' },
  { id: 'userProfile', name: 'Performance Hub', description: 'Agent performance and target tracking', icon: 'UserCircle' },
  { id: 'inventoryRadar', name: 'Stock Radar', description: 'Nearby store stock levels and transfers', icon: 'Radar' },
  { id: 'territoryMap', name: 'Territory Map', description: 'Assigned outlets and coverage area', icon: 'Map' },
];

export const AVAILABLE_BOT_ACTIONS: BotQuickAction[] = [
  { id: 'audit', label: 'Audit Check-in', icon: 'MapPin', prompt: 'Start the store audit' },
  { id: 'stock', label: 'Stock Levels', icon: 'ShoppingCart', prompt: 'Show stock for Unilever Hub' },
  { id: 'campaign', label: 'Campaign Info', icon: 'Zap', prompt: 'Tell me about the Monsoon campaign' },
  { id: 'route', label: 'Next Stop', icon: 'Navigation', prompt: 'What is my next optimized stop?' },
  { id: 'payout', label: 'Payout Status', icon: 'BarChart', prompt: 'Show my pending incentives' },
  { id: 'learn', label: 'Product Manual', icon: 'BookOpen', prompt: 'Show manual for new Dove Soap' },
];
