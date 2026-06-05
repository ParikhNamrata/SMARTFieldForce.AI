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
    routeOptimizer: boolean;
    userProfile: boolean;
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
  { id: 'predictiveBot', name: 'Smart Bot', description: 'AI-driven task suggestions & quick completion', icon: 'Sparkles', mandatory: true },
  { id: 'visionAutomation', name: 'Vision AI', description: 'Automatic SKU and stock extraction from photos', icon: 'Camera', mandatory: true },
  { id: 'voiceToText', name: 'Voice Command', description: 'Hands-free data entry and automation', icon: 'Mic' },
  { id: 'orderManagement', name: 'Book Order', description: 'Restock and replenishment management', icon: 'ShoppingCart' },
  { id: 'quizModule', name: 'Field Quiz', description: 'On-site training and knowledge checks', icon: 'Zap' },
  { id: 'salesInsights', name: 'Reports', description: 'Target vs achievement tracking', icon: 'BarChart', mandatory: true },
  { id: 'routeOptimizer', name: 'Route Planner', description: 'AI-powered trip and distance optimization', icon: 'Navigation' },
  { id: 'userProfile', name: 'Performance Hub', description: 'Performance & target tracking', icon: 'UserCircle' },
];

export const AVAILABLE_BOT_ACTIONS: BotQuickAction[] = [
  { id: 'audit', label: 'Store Check-in', icon: 'MapPin', prompt: 'Start the store check-in' },
  { id: 'loc_checkin', label: 'Location Check-in', icon: 'MapPin', prompt: 'Location Check-in' },
  { id: 'survey', label: 'Survey Question', icon: 'BookOpen', prompt: 'Survey Question' },
  { id: 'promotion', label: 'Promotion', icon: 'Sparkles', prompt: 'Promotion' },
  { id: 'ir_task', label: 'IR / Vision Audit', icon: 'Camera', prompt: 'IR Shelf Audit' },
  { id: 'checkout', label: 'Location Checkout', icon: 'Zap', prompt: 'Location Checkout' },
];
