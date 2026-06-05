import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Mic, 
  Camera, 
  ShoppingCart, 
  Send,
  Loader2,
  X,
  Layers,
  Zap,
  Sparkles,
  RefreshCcw,
  LayoutDashboard,
  Brain,
  FileText,
  Scan,
  BarChart,
  Home,
  LayoutGrid,
  MapPin,
  ClipboardList,
  MoreVertical,
  Activity,
  User,
  Settings as SettingsIcon,
  Search,
  BookOpen,
  Navigation,
  UserCircle,
  Radar,
  Map,
  ChevronRight,
  Check,
  Lock,
  Plus,
  Minus,
  Trash2,
  Edit2,
  AlertCircle,
  PiggyBank,
  Percent,
  Calendar,
  Gift,
  TrendingUp
} from 'lucide-react';
import { AppConfig, AVAILABLE_FEATURES, FeatureKey, Feature, AVAILABLE_BOT_ACTIONS } from '../types';
import { cn } from '../lib/utils';
import { answerFieldQuery, analyzeStorefrontImage, parseAIVoiceCommand } from '../services/gemini';
import { enhanceImage } from '../lib/imageProcessor';
import { dbService, InteractionLog } from '../services/db';
import { generateAIReportSummary } from '../services/reporting';

// Load AI capabilities sample datasets from JSON configurations
import aiSmartBot from '../data/aiSmartBot.json';
import aiVisionShelf from '../data/aiVisionShelf.json';
import aiVoiceCommand from '../data/aiVoiceCommand.json';
import aiFieldQuiz from '../data/aiFieldQuiz.json';
import aiOrderSchemes from '../data/aiOrderSchemes.json';
import aiRouteOptimized from '../data/aiRouteOptimized.json';

interface MobileSimulatorProps {
  config: AppConfig;
}

type Screen = 'home' | 'bot' | 'vision' | 'reports' | 'training' | 'planner' | 'performance' | 'stock' | 'territory' | 'order' | 'quiz';
type VisionStep = 
  | 'capture-board' 
  | 'fetching-skus' 
  | 'sku-question' 
  | 'capture-skus' 
  | 'capture-dove'
  | 'fetching-dove'
  | 'continuous-audit'
  | 'result';

const UNILEVER_SHOPBOARD_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%"><rect x="0" y="0" width="600" height="450" fill="%23f0f9ff" /><rect x="0" y="180" width="600" height="270" fill="%23f1f5f9" /><rect x="80" y="240" width="160" height="210" fill="%23cbd5e1" opacity="0.4" rx="8" /><rect x="360" y="240" width="160" height="210" fill="%23cbd5e1" opacity="0.4" rx="8" /><rect x="250" y="240" width="100" height="210" fill="%2394a3b8" opacity="0.15" rx="4" /><line x1="300" y1="240" x2="300" y2="450" stroke="%23cbd5e1" stroke-width="2" /><path d="M0 210 H600 M0 260 H600 M0 310 H600 M0 360 H600" stroke="%23e2e8f0" stroke-width="1.5" /><g transform="translate(50, 40)"><rect x="4" y="6" width="500" height="152" rx="16" fill="%230f172a" opacity="0.15" /><rect x="0" y="0" width="500" height="150" rx="16" fill="%230c2340" stroke="%230284c7" stroke-width="4" /><path d="M400 -20 C450 30 420 100 520 170" fill="none" stroke="%231e3a8a" stroke-width="24" opacity="0.5" stroke-linecap="round" /><path d="M420 -25 C470 25 440 90 540 160" fill="none" stroke="%233b82f6" stroke-width="12" opacity="0.25" stroke-linecap="round" /><g transform="translate(35, 25)"><path d="M10 15 C10 5, 20 2, 30 2 C40 2, 50 5, 50 15 C50 30, 30 40, 30 48" fill="none" stroke="%2338bdf8" stroke-width="6" stroke-linecap="round" /><path d="M16 18 C16 10, 23 8, 30 8 C37 8, 44 10, 44 18 C44 28, 30 36, 30 42" fill="none" stroke="%23ffffff" stroke-width="4.5" stroke-linecap="round" /><circle cx="30" cy="18" r="3.5" fill="%23fbbf24" /><circle cx="20" cy="28" r="3" fill="%23f87171" /><circle cx="40" cy="28" r="2.5" fill="%2334d399" /></g><text x="110" y="52" font-family="'Inter', sans-serif" font-weight="900" font-size="22" fill="%23ffffff" letter-spacing="1">SMOLLAN ELITE HUB</text><text x="110" y="75" font-family="'Inter', sans-serif" font-weight="800" font-size="10" fill="%2338bdf8" letter-spacing="4">SMOLLAN PREFERRED OUTLET</text><rect x="110" y="93" width="135" height="24" rx="6" fill="%231e3a8a" stroke="%230284c7" stroke-width="1.5" /><text x="122" y="109" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="9.5" fill="%23bae6fd">STOREID: %23442-B</text><rect x="255" y="93" width="135" height="24" rx="6" fill="%23064e3b" stroke="%23059669" stroke-width="1.5" /><text x="267" y="109" font-family="'Inter', sans-serif" font-weight="900" font-size="8.5" fill="%23a7f3d0">GPS LOC: MATCHED</text><circle cx="445" cy="105" r="14" fill="%2310b981" /><path d="M439 105 L443 109 L451 101" fill="none" stroke="%23ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></g></svg>`;

const UNILEVER_SKUS_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%"><rect x="0" y="0" width="600" height="450" fill="%230f172a" /><rect x="0" y="140" width="600" height="15" fill="%23475569" stroke="%23334155" stroke-width="2" /><rect x="0" y="280" width="600" height="15" fill="%23475569" stroke="%23334155" stroke-width="2" /><rect x="0" y="420" width="600" height="15" fill="%23475569" stroke="%23334155" stroke-width="2" /><rect x="0" y="155" width="600" height="4" fill="%2338bdf8" opacity="0.4" /><rect x="0" y="295" width="600" height="4" fill="%2338bdf8" opacity="0.4" /><g transform="translate(30, 25)"><rect x="0" y="0" width="70" height="100" rx="8" fill="%23ffffff" stroke="%23e2e8f0" stroke-width="2" /><rect x="10" y="15" width="50" height="20" rx="4" fill="%230f2c59" /><path d="M20 70 Q35 50 50 70" fill="none" stroke="%2338bdf8" stroke-width="4" stroke-linecap="round" /><text x="35" y="28" font-family="'Inter', sans-serif" font-weight="950" font-size="8" fill="%23ffffff" text-anchor="middle">DOVE</text><text x="35" y="85" font-family="'Inter', sans-serif" font-weight="700" font-size="6" fill="%2364748b" text-anchor="middle">SOAP 100g</text></g><g transform="translate(115, 25)"><rect x="0" y="0" width="70" height="100" rx="8" fill="%23ffffff" stroke="%23e2e8f0" stroke-width="2" /><rect x="10" y="15" width="50" height="20" rx="4" fill="%230f2c59" /><path d="M20 70 Q35 50 50 70" fill="none" stroke="%2338bdf8" stroke-width="4" stroke-linecap="round" /><text x="35" y="28" font-family="'Inter', sans-serif" font-weight="950" font-size="8" fill="%23ffffff" text-anchor="middle">DOVE</text><text x="35" y="85" font-family="'Inter', sans-serif" font-weight="700" font-size="6" fill="%2364748b" text-anchor="middle">SOAP 100g</text></g><g transform="translate(200, 15)"><rect x="0" y="0" width="65" height="110" rx="12" fill="%23ffffff" stroke="%23bae6fd" stroke-width="2" /><path d="M15 15 C15 5 50 5 50 15 L45 35 L20 35 Z" fill="%23e2e8f0" /><rect x="10" y="45" width="45" height="40" rx="4" fill="%2338bdf8" opacity="0.15" /><text x="32" y="60" font-family="'Inter', sans-serif" font-weight="900" font-size="7" fill="%230f2c59" text-anchor="middle">DOVE</text><text x="32" y="70" font-family="'Inter', sans-serif" font-weight="700" font-size="5" fill="%230284c7" text-anchor="middle">SHAMPOO</text></g><g transform="translate(280, 15)"><rect x="0" y="0" width="65" height="110" rx="12" fill="%23ffffff" stroke="%23bae6fd" stroke-width="2" /><path d="M15 15 C15 5 50 5 50 15 L45 35 L20 35 Z" fill="%23e2e8f0" /><rect x="10" y="45" width="45" height="40" rx="4" fill="%2338bdf8" opacity="0.15" /><text x="32" y="60" font-family="'Inter', sans-serif" font-weight="900" font-size="7" fill="%230f2c59" text-anchor="middle">DOVE</text><text x="32" y="70" font-family="'Inter', sans-serif" font-weight="700" font-size="5" fill="%230284c7" text-anchor="middle">SHAMPOO</text></g><g transform="translate(365, 25)"><rect x="0" y="0" width="70" height="100" rx="18" fill="none" stroke="%23f43f5e" stroke-dasharray="4 4" stroke-width="2" /><circle cx="35" cy="50" r="14" fill="%23ffe4e6" /><text x="35" y="53" font-family="'Inter', sans-serif" font-weight="900" font-size="10" fill="%23e11d48" text-anchor="middle">OOS</text></g><g transform="translate(30, 165)"><rect x="0" y="0" width="75" height="95" rx="8" fill="%23fef08a" stroke="%23eab308" stroke-width="2" /><rect x="8" y="15" width="59" height="25" rx="4" fill="%23ca8a04" /><text x="37.5" y="31" font-family="'Inter', sans-serif" font-weight="950" font-size="9" fill="%23ffffff" text-anchor="middle">LUX</text><text x="37.5" y="65" font-family="'Inter', sans-serif" font-weight="700" font-size="6.5" fill="%23854d0e" text-anchor="middle">SCARLET</text><circle cx="37.5" cy="80" r="4" fill="%23ffffff" opacity="0.6" /></g><g transform="translate(120, 165)"><rect x="0" y="0" width="75" height="95" rx="8" fill="%23fef08a" stroke="%23eab308" stroke-width="2" /><rect x="8" y="15" width="59" height="25" rx="4" fill="%23ca8a04" /><text x="37.5" y="31" font-family="'Inter', sans-serif" font-weight="950" font-size="9" fill="%23ffffff" text-anchor="middle">LUX</text><text x="37.5" y="65" font-family="'Inter', sans-serif" font-weight="700" font-size="6.5" fill="%23854d0e" text-anchor="middle">SCARLET</text><circle cx="37.5" cy="80" r="4" fill="%23ffffff" opacity="0.6" /></g><g transform="translate(210, 165)"><rect x="0" y="0" width="75" height="95" rx="8" fill="%23fee2e2" stroke="%23ef4444" stroke-width="2" /><rect x="8" y="15" width="59" height="25" rx="4" fill="%23dc2626" /><text x="37.5" y="31" font-family="'Inter', sans-serif" font-weight="900" font-size="7" fill="%23ffffff" text-anchor="middle">LIFEBUOY</text><text x="37.5" y="65" font-weight="700" font-size="6.5" fill="%23991b1b" text-anchor="middle">HYGIENE</text><path d="M32.5 80 H42.5 M37.5 75 V85" stroke="%23dc2626" stroke-width="3" stroke-linecap="round" /></g><g transform="translate(300, 165)"><rect x="0" y="0" width="75" height="95" rx="8" fill="%23fee2e2" stroke="%23ef4444" stroke-width="2" /><rect x="8" y="15" width="59" height="25" rx="4" fill="%23dc2626" /><text x="37.5" y="31" font-family="'Inter', sans-serif" font-weight="900" font-size="7" fill="%23ffffff" text-anchor="middle">LIFEBUOY</text><text x="37.5" y="65" font-weight="700" font-size="6.5" fill="%23991b1b" text-anchor="middle">HYGIENE</text><path d="M32.5 80 H42.5 M37.5 75 V85" stroke="%23dc2626" stroke-width="3" stroke-linecap="round" /></g><g transform="translate(30, 305)"><rect x="0" y="0" width="70" height="100" rx="8" fill="%23f0fdf4" stroke="%2322c55e" stroke-width="2" /><rect x="10" y="15" width="50" height="20" rx="4" fill="%2315803d" /><text x="35" y="28" font-family="'Inter', sans-serif" font-weight="900" font-size="7.5" fill="%23ffffff" text-anchor="middle">LIFEBUOY</text><text x="35" y="70" font-family="'Inter', sans-serif" font-weight="700" font-size="6" fill="%23166534" text-anchor="middle">LEMON FRESH</text></g><g transform="translate(115, 305)"><rect x="0" y="0" width="70" height="100" rx="8" fill="%23f0fdf4" stroke="%2322c55e" stroke-width="2" /><rect x="10" y="15" width="50" height="20" rx="4" fill="%2315803d" /><text x="35" y="28" font-family="'Inter', sans-serif" font-weight="900" font-size="7.5" fill="%23ffffff" text-anchor="middle">LIFEBUOY</text><text x="35" y="70" font-family="'Inter', sans-serif" font-weight="700" font-size="6" fill="%23166534" text-anchor="middle">LEMON FRESH</text></g><g transform="translate(200, 305)"><rect x="0" y="0" width="70" height="100" rx="8" fill="none" stroke="%23f43f5e" stroke-dasharray="4 4" stroke-width="2" /><circle cx="35" cy="50" r="14" fill="%23ffe4e6" /><text x="35" y="53" font-family="'Inter', sans-serif" font-weight="900" font-size="10" fill="%23e11d48" text-anchor="middle">OOS</text></g><g opacity="0.85"><rect x="25" y="25" width="80" height="110" fill="none" stroke="%2310b981" stroke-width="1.5" /><text x="28" y="22" font-family="'JetBrains Mono', monospace" font-size="6" fill="%2310b981" font-weight="950">DOVE_SOAP: 99%</text><rect x="110" y="25" width="80" height="110" fill="none" stroke="%2310b981" stroke-width="1.5" /><text x="113" y="22" font-family="'JetBrains Mono', monospace" font-size="6" fill="%2310b981" font-weight="950">DOVE_SOAP: 98%</text><rect x="195" y="15" width="75" height="120" fill="none" stroke="%233b82f6" stroke-width="1.5" /><text x="198" y="11" font-family="'JetBrains Mono', monospace" font-size="6" fill="%233b82f6" font-weight="950">DOVE_SHMP: 97%</text><rect x="25" y="160" width="85" height="105" fill="none" stroke="%2310b981" stroke-width="1.5" /><text x="28" y="156" font-family="'JetBrains Mono', monospace" font-size="6" fill="%2310b981" font-weight="950">LUX_GOLD: 96%</text><rect x="115" y="160" width="85" height="105" fill="none" stroke="%2310b981" stroke-width="1.5" /><text x="118" y="156" font-family="'JetBrains Mono', monospace" font-size="6" fill="%2310b981" font-weight="950">LUX_GOLD: 95%</text><rect x="205" y="160" width="85" height="105" fill="none" stroke="%23ec4899" stroke-width="1.5" /><text x="208" y="156" font-family="'JetBrains Mono', monospace" font-size="6" fill="%23ec4899" font-weight="950">LFB_RED: 99%</text><rect x="295" y="160" width="85" height="105" fill="none" stroke="%23ec4899" stroke-width="1.5" /><text x="298" y="156" font-family="'JetBrains Mono', monospace" font-size="6" fill="%23ec4899" font-weight="950">LFB_RED: 97%</text></g></svg>`;

const STATION_COORDINATES: Record<string, { lat: number, lng: number }> = {
  "stop-1": { lat: 19.0544, lng: 72.8402 },
  "stop-2": { lat: 19.0600, lng: 72.8250 },
  "stop-3": { lat: 19.0580, lng: 72.8300 },
  "stop-4": { lat: 19.0800, lng: 72.8350 },
  "stop-5": { lat: 19.0650, lng: 72.8200 },
  "stop-6": { lat: 19.0680, lng: 72.8340 },
  "stop-7": { lat: 19.0750, lng: 72.8360 },
  "stop-8": { lat: 19.0850, lng: 72.8400 },
  "stop-9": { lat: 19.0550, lng: 72.8280 },
  "stop-10": { lat: 19.0570, lng: 72.8350 },
  "stop-11": { lat: 19.0620, lng: 72.8380 },
  "stop-12": { lat: 19.0610, lng: 72.8260 },
  "stop-13": { lat: 19.0680, lng: 72.8630 },
  "stop-14": { lat: 19.0740, lng: 72.8680 },
  "stop-15": { lat: 19.0700, lng: 72.8750 },
};

export default function MobileSimulator({ config }: MobileSimulatorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // --- Stateful AI Route Optimizer & Dynamic Planning (with Spatial Coordinates Core) ---
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string; isReal: boolean }>(() => {
    try {
      const saved = localStorage.getItem('smart_user_location');
      return saved ? JSON.parse(saved) : { lat: 19.0544, lng: 72.8402, label: "Smollan South HQ (Bandra Hub)", isReal: false };
    } catch {
      return { lat: 19.0544, lng: 72.8402, label: "Smollan South HQ (Bandra Hub)", isReal: false };
    }
  });

  const [routeStops, setRouteStops] = useState<Array<{
    id: string;
    storeName: string;
    address: string;
    distanceFromHubKm: number;
    estimatedDurationMinutes: number;
    status: 'COMPLETED' | 'CURRENT' | 'PENDING';
    time: string;
    optimizedIndex: number;
    lat: number;
    lng: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('smart_route_stops');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mapped = parsed.map((item: any) => ({
          ...item,
          lat: item.lat ?? STATION_COORDINATES[item.id]?.lat ?? (19.0544 + (Math.random() - 0.5) * 0.05),
          lng: item.lng ?? STATION_COORDINATES[item.id]?.lng ?? (72.8402 + (Math.random() - 0.5) * 0.05)
        }));
        if (!mapped.some((stop: any) => stop.storeName.toLowerCase().includes("mini mercado extra"))) {
          mapped.push({
            id: "stop-16",
            storeName: "Mini Mercado Extra",
            address: "Avenida Paulista 1200, Sao Paulo",
            distanceFromHubKm: 36.2,
            estimatedDurationMinutes: 45,
            status: "PENDING",
            time: "07:15 PM",
            optimizedIndex: 16,
            lat: -23.5616,
            lng: -46.6560
          });
        }
        return mapped;
      }
      return aiRouteOptimized.sequenceOfStops.map((stop: any) => ({
        ...stop,
        lat: STATION_COORDINATES[stop.id]?.lat ?? 19.0544,
        lng: STATION_COORDINATES[stop.id]?.lng ?? 72.8402,
      }));
    } catch {
      return aiRouteOptimized.sequenceOfStops.map((stop: any) => ({
        ...stop,
        lat: STATION_COORDINATES[stop.id]?.lat ?? 19.0544,
        lng: STATION_COORDINATES[stop.id]?.lng ?? 72.8402,
      })) as any;
    }
  });

  const [routeMetrics, setRouteMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_route_metrics');
      return saved ? JSON.parse(saved) : aiRouteOptimized.routingMetrics;
    } catch {
      return aiRouteOptimized.routingMetrics;
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    try {
      localStorage.setItem('smart_user_location', JSON.stringify(userLocation));
    } catch (e) {
      console.warn('Storage restricted:', e);
    }
  }, [userLocation]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_route_stops', JSON.stringify(routeStops));
    } catch (e) {
      console.warn('Storage restricted:', e);
    }
  }, [routeStops]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_route_metrics', JSON.stringify(routeMetrics));
    } catch (e) {
      console.warn('Storage restricted:', e);
    }
  }, [routeMetrics]);

  // Auxiliary Planning UI States
  const [isOptimizationRunning, setIsOptimizationRunning] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  // Add Stop Form Fields
  const [newStoreName, setNewStoreName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDistance, setNewDistance] = useState(5.0);
  const [newDuration, setNewDuration] = useState(30);
  const [newLat, setNewLat] = useState(19.0600);
  const [newLng, setNewLng] = useState(72.8300);

  // Edit Stop Form Fields
  const [editStoreName, setEditStoreName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDistance, setEditDistance] = useState(5.0);
  const [editDuration, setEditDuration] = useState(30);
  const [editLat, setEditLat] = useState(19.0600);
  const [editLng, setEditLng] = useState(72.8300);

  // --- Geolocation Distance Helpers (Haversine formula in KM) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  };

  // Dynamically re-sort and calculate schedules based on proximity to active current-location
  const updateRouteWithNewLocation = (lat: number, lng: number, currentStops: typeof routeStops) => {
    const completedStops = currentStops.filter(s => s.status === 'COMPLETED');
    const currentStopsList = currentStops.filter(s => s.status === 'CURRENT');
    const pendingStops = currentStops.filter(s => s.status === 'PENDING');

    // We start routing optimization from active coordinates
    let refLat = lat;
    let refLng = lng;

    if (currentStopsList.length > 0) {
      refLat = currentStopsList[currentStopsList.length - 1].lat;
      refLng = currentStopsList[currentStopsList.length - 1].lng;
    } else if (completedStops.length > 0) {
      refLat = completedStops[completedStops.length - 1].lat;
      refLng = completedStops[completedStops.length - 1].lng;
    }

    // Sort pending items to the nearest spatial neighbor based on coordinates
    const sortedPending = [...pendingStops].sort((a, b) => {
      const distA = calculateDistance(refLat, refLng, a.lat, a.lng);
      const distB = calculateDistance(refLat, refLng, b.lat, b.lng);
      return distA - distB;
    });

    const united = [...completedStops, ...currentStopsList, ...sortedPending];

    // Re-assign distanceFromHubKm relative to the user's current spatial coordinates and rebuild timing flow
    const localized = united.map((stop, idx) => {
      const distFromUser = calculateDistance(lat, lng, stop.lat, stop.lng);
      return {
        ...stop,
        optimizedIndex: idx + 1,
        distanceFromHubKm: distFromUser
      };
    });

    setRouteStops(recalculateSchedules(localized));

    setRouteMetrics(prev => ({
      ...prev,
      distanceSavedKm: parseFloat((localized.length * 1.35).toFixed(1)),
      computationTimeMs: Math.floor(Math.random() * 60) + 140
    }));
  };

  // --- Stateful Route Scheduling & Planner Handlers ---
  const formatMinutesToTime = (totalMinutes: number): string => {
    let hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.floor(totalMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const hoursStr = hours < 10 ? '0' + hours : hours;
    return `${hoursStr}:${minutesStr} ${ampm}`;
  };

  // Recalculates time schedules and optimized sequence indices
  const recalculateSchedules = (stopsList: typeof routeStops) => {
    let currentMin = 480; // Start at 08:00 AM (8 * 60)
    return stopsList.map((stop, idx) => {
      const stopWithTime = {
        ...stop,
        optimizedIndex: idx + 1,
        time: formatMinutesToTime(currentMin)
      };
      // Advance clock: duration of visit + drive time (simulated as distanceFromHubKm * 1.5 + 10 mins)
      const travelTime = Math.round((stop.distanceFromHubKm || 2) * 1.5) + 12;
      currentMin += (stop.estimatedDurationMinutes || 30) + travelTime;
      return stopWithTime;
    });
  };

  // Auto-fill custom store coordinate form to offset slightly from current location
  useEffect(() => {
    setNewLat(Number((userLocation.lat + (Math.random() - 0.5) * 0.02).toFixed(4)));
    setNewLng(Number((userLocation.lng + (Math.random() - 0.5) * 0.02).toFixed(4)));
  }, [userLocation]);

  // Keep distance updated dynamically in form if coordinates change
  useEffect(() => {
    const calc = calculateDistance(userLocation.lat, userLocation.lng, newLat, newLng);
    setNewDistance(calc);
  }, [newLat, newLng, userLocation]);

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const calcDist = calculateDistance(userLocation.lat, userLocation.lng, Number(newLat), Number(newLng));

    const newStopItem = {
      id: `stop-custom-${Date.now()}`,
      storeName: newStoreName,
      address: newAddress || "Unassigned Zone Lane",
      distanceFromHubKm: calcDist,
      estimatedDurationMinutes: Math.max(10, Number(newDuration)),
      status: 'PENDING' as const,
      time: '04:00 PM', // calculated below
      optimizedIndex: routeStops.length + 1,
      lat: Number(newLat),
      lng: Number(newLng)
    };

    setRouteStops(prev => {
      const updated = [...prev, newStopItem];
      return recalculateSchedules(updated);
    });

    // Reset fields
    setNewStoreName('');
    setNewAddress('');
    setIsAddingStop(false);
  };

  const handleDeleteStop = (id: string) => {
    setRouteStops(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return recalculateSchedules(filtered);
    });
  };

  const handleStartEdit = (stop: typeof routeStops[0]) => {
    setEditingStopId(stop.id);
    setEditStoreName(stop.storeName);
    setEditAddress(stop.address);
    setEditDistance(stop.distanceFromHubKm);
    setEditDuration(stop.estimatedDurationMinutes);
    setEditLat(stop.lat || 19.0544);
    setEditLng(stop.lng || 72.8402);
  };

  const handleSaveEdit = (id: string) => {
    setRouteStops(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          const calcDist = calculateDistance(userLocation.lat, userLocation.lng, Number(editLat), Number(editLng));
          return {
            ...s,
            storeName: editStoreName,
            address: editAddress,
            distanceFromHubKm: calcDist,
            estimatedDurationMinutes: Number(editDuration),
            lat: Number(editLat),
            lng: Number(editLng)
          };
        }
        return s;
      });
      return recalculateSchedules(updated);
    });
    setEditingStopId(null);
  };

  const handleUpdateStatus = (id: string, status: 'COMPLETED' | 'CURRENT' | 'PENDING') => {
    setRouteStops(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, status } : s);
      return recalculateSchedules(updated);
    });
  };

  // Triggers fleet-wide AI planning model to optimize stops sequence
  const handleRunAIExtendedOptimizer = () => {
    setIsOptimizationRunning(true);
    
    setTimeout(() => {
      setRouteStops(prev => {
        // Group into Completed, Current and Pending modules
        const completedStops = prev.filter(s => s.status === 'COMPLETED');
        const currentStops = prev.filter(s => s.status === 'CURRENT');
        const pendingStops = prev.filter(s => s.status === 'PENDING');

        // Optimize Pending list: Sort by distance of coordinates ascending (closest first)
        const optimizedPending = [...pendingStops].sort((a, b) => {
          const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
        });

        // Put them back together with accurate localized distances
        const united = [...completedStops, ...currentStops, ...optimizedPending];
        const updatedDistances = united.map(stop => ({
          ...stop,
          distanceFromHubKm: calculateDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng)
        }));

        return recalculateSchedules(updatedDistances);
      });

      setRouteMetrics(prev => ({
        ...prev,
        computationTimeMs: Math.floor(Math.random() * 120) + 180,
         // Dynamic distance saved calculation
        distanceSavedKm: parseFloat((routeStops.length * 1.45).toFixed(1)),
        trafficDensityPercent: parseFloat((25 + (routeStops.length % 5) * 6.5).toFixed(1))
      }));

      setIsOptimizationRunning(false);
    }, 750);
  };

  // Automatically refresh GPS coordinates and recalculate route sequence when entering the Route Planner screen!
  useEffect(() => {
    if (activeScreen === 'planner') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLoc = {
              lat: Number(latitude.toFixed(4)),
              lng: Number(longitude.toFixed(4)),
              label: `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              isReal: true
            };
            setUserLocation(newLoc);
            setRouteStops(prev => {
              const recalculated = prev.map(stop => ({
                ...stop,
                distanceFromHubKm: calculateDistance(newLoc.lat, newLoc.lng, stop.lat, stop.lng)
              }));
              const completed = recalculated.filter(s => s.status === 'COMPLETED');
              const current = recalculated.filter(s => s.status === 'CURRENT');
              const pending = recalculated.filter(s => s.status === 'PENDING').sort((a, b) => a.distanceFromHubKm - b.distanceFromHubKm);
              return recalculateSchedules([...completed, ...current, ...pending]);
            });
          },
          (err) => {
            console.log("Device Geolocation auto-refresh skipped. Keeping active node coordinates.", err);
          }
        );
      }
    }
  }, [activeScreen]);

  // --- AI Field Quiz States ---
  const [quizState, setQuizState] = useState<'idle' | 'generating' | 'active' | 'completed'>('idle');
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }>>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // --- Voice Assistant States ---
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);
  const [voiceSpeechText, setVoiceSpeechText] = useState('');
  const [voiceSpeechTranscript, setVoiceSpeechTranscript] = useState('');
  const [customVoiceInputText, setCustomVoiceInputText] = useState('');
  const [shelfSkuCounts, setShelfSkuCounts] = useState<{ [key: string]: number }>({
    'dove-soap': 12,
    'dove-shampoo': 8,
    'lux-soap': 24,
    'lifebuoy-wash': 15
  });
  const [voiceLog, setVoiceLog] = useState<Array<{ id: string; time: string; text: string; details: string; type: 'success' | 'info' | 'warn' }>>([
    { id: '1', time: '14:40', text: 'Hands-Free Engine Configured', details: 'Telemetry sync, audio parsing, and text-to-speech feedback operational.', type: 'info' }
  ]);

  // --- Gallery Photo Upload States ---
  const [customUploadedImageUrl, setCustomUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);

  // Safeguard: Move to home if current screen is disabled
  useEffect(() => {
    const featureMap: Record<Screen, FeatureKey | null> = {
      home: null,
      bot: 'predictiveBot',
      vision: 'visionAutomation',
      reports: 'salesInsights',
      training: null,
      planner: 'routeOptimizer',
      performance: 'userProfile',
      stock: null,
      territory: null,
      order: 'orderManagement',
      quiz: 'quizModule'
    };

    const requiredFeature = featureMap[activeScreen];
    if (requiredFeature && config.features[requiredFeature] === false) {
      console.log(`Simulator: Feature ${requiredFeature} is disabled, redirecting to home`);
      setActiveScreen('home');
    }
  }, [config.features, activeScreen]);

  // Command Parser & Executor for Voice command input
  const executeCommand = (commandText: string) => {
    const text = commandText.toLowerCase();
    
    // Create matching user chat message
    setChatMessages(prev => [...prev, { role: 'user', text: `🗣️ Voice Command: "${commandText}"` }]);
    
    if (text.includes('attendance') || text.includes('check') || text.includes('login') || text.includes('present')) {
      setActiveScreen('home');
      ensureAttendanceMarked("Voice commands check-in");
      setChatMessages(prev => [...prev, { role: 'ai', text: "✅ Check-in complete! I've marked your attendance automatically using voice authorization." }]);
    } 
    else if (text.includes('order') || text.includes('replenish') || text.includes('dove') || text.includes('restock') || text.includes('book')) {
      setOrderProducts(prev => prev.map(p => {
        if (p.id === 'dove-soap') {
          return { ...p, qty: 15 };
        }
        return p;
      }));
      setActiveScreen('order');
      setChatMessages(prev => [...prev, { role: 'ai', text: "🛒 Done! I've added 15 Dove Cream Beauty Bars to your Order Form and switched to the Book Order screen." }]);
    }
    else if (text.includes('vision') || text.includes('shelf') || text.includes('scan') || text.includes('audit')) {
      setActiveScreen('vision');
      openCamera('vision-loc', 'allSkus');
      setChatMessages(prev => [...prev, { role: 'ai', text: "📸 Understood. Opening the Shelf SKU Audit camera context for automated stock tracking..." }]);
    }
    else if (text.includes('quiz') || text.includes('test') || text.includes('question') || text.includes('terminology')) {
      setActiveScreen('quiz');
      setQuizState('idle');
      setChatMessages(prev => [...prev, { role: 'ai', text: "🧠 Opening your personalized AI Knowledge Field Quiz. Practice your sales & audit math!" }]);
    }
    else if (text.includes('traffic') || text.includes('route') || text.includes('plan') || text.includes('optimizer')) {
      setActiveScreen('planner');
      setChatMessages(prev => [...prev, { role: 'ai', text: "📍 Switching to your AI Route Planner screen with optimized route sequencing." }]);
    }
    else if (text.includes('report') || text.includes('sales') || text.includes('target')) {
      setActiveScreen('reports');
      setChatMessages(prev => [...prev, { role: 'ai', text: "📈 Displaying target vs achievement dashboards and active field force compliance analysis." }]);
    }
    else if (text.includes('performance') || text.includes('coaching') || text.includes('rank')) {
      setActiveScreen('performance');
      setChatMessages(prev => [...prev, { role: 'ai', text: "🏆 Switched to Performance Hub. Checking agent achievements and AI coaching feedback." }]);
    }
    else if (text.includes('training') || text.includes('study') || text.includes('hub')) {
      setActiveScreen('training');
      setChatMessages(prev => [...prev, { role: 'ai', text: "📚 Switched to your Training Hub. Browse available compliance, innovations, and safety courses." }]);
    }
    else {
      // General Gemini query
      setIsAiLoading(true);
      answerFieldQuery(commandText).then(response => {
        setChatMessages(prev => [...prev, { role: 'ai', text: `🗣️ Voice Assistant: ${response}` }]);
        setIsAiLoading(false);
      }).catch(e => {
        setIsAiLoading(false);
        setChatMessages(prev => [...prev, { role: 'ai', text: `🗣️ Voice Assistant: I noticed you spoke: "${commandText}"` }]);
      });
    }
  };

  const speakText = (txt: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(txt.substring(0, 160));
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        synth.speak(utterance);
      } catch (err) {
        console.warn("speechSynthesis error:", err);
      }
    }
  };

  const parseVoiceCommand = async (rawText: string, speakEnabled: boolean = true) => {
    const text = rawText.toLowerCase();
    
    // AI Parser Integration
    const aiResult = await parseAIVoiceCommand(rawText);
    let feedback = aiResult?.feedback || "";
    let updatedSomething = false;

    let newShelfCounts = { ...shelfSkuCounts };
    let newOrderProducts = [...orderProducts];

    if (aiResult?.action === 'check-in') {
      ensureAttendanceMarked("Voice check-in complete");
      updatedSomething = true;
    } else if (aiResult?.action === 'mark_out_of_stock' && aiResult.product) {
      if (newShelfCounts[aiResult.product] !== undefined) {
          newShelfCounts[aiResult.product] = 0;
          updatedSomething = true;
      }
    } else if (aiResult?.action === 'count_inventory' && aiResult.product && aiResult.quantity !== null) {
      if (newShelfCounts[aiResult.product] !== undefined) {
          newShelfCounts[aiResult.product] = Number(aiResult.quantity);
          updatedSomething = true;
      }
    }

    if (!updatedSomething) {
      // Fallback to local regex matching
      if (text.includes("check-in") || text.includes("check in") || text.includes("attendance") || text.includes("login")) {
        ensureAttendanceMarked("Voice check-in complete");
        feedback += "Checked in to Bandra Retail outlet. ";
        updatedSomething = true;
      }

    // Dove Soap count
    if (text.includes("dove") && (text.includes("soap") || text.includes("beauty") || text.includes("bar") || text.includes("cream"))) {
      const match = text.match(/(?:soap|beauty|bar|cream)\D*(\d+)/);
      if (match) {
        const val = parseInt(match[1]);
        newShelfCounts['dove-soap'] = val;
        feedback += `Counted ${val} Dove Soap. `;
        updatedSomething = true;
      } else if (text.includes("out of stock") || text.includes("oos") || text.includes("zero")) {
        newShelfCounts['dove-soap'] = 0;
        feedback += "Dove Soap out of stock. ";
        updatedSomething = true;
      }
    }

    // Dove Shampoo count
    if (text.includes("dove") && text.includes("shampoo")) {
      const match = text.match(/shampoo\D*(\d+)/);
      if (match) {
        const val = parseInt(match[1]);
        newShelfCounts['dove-shampoo'] = val;
        feedback += `Counted ${val} Dove Shampoo. `;
        updatedSomething = true;
      } else if (text.includes("out of stock") || text.includes("oos") || text.includes("zero")) {
        newShelfCounts['dove-shampoo'] = 0;
        feedback += "Dove Shampoo out of stock. ";
        updatedSomething = true;
      }
    } else if (text.includes("shampoo")) {
      const match = text.match(/shampoo\D*(\d+)/);
      if (match) {
        const val = parseInt(match[1]);
        newShelfCounts['dove-shampoo'] = val;
        feedback += `Counted ${val} Shampoo. `;
        updatedSomething = true;
      } else if (text.includes("out of stock") || text.includes("oos") || text.includes("zero")) {
        newShelfCounts['dove-shampoo'] = 0;
        feedback += "Shampoo out of stock. ";
        updatedSomething = true;
      }
    }

    // Lux Soap count
    if (text.includes("lux")) {
      const match = text.match(/lux\D*(\d+)/);
      if (match) {
        const val = parseInt(match[1]);
        newShelfCounts['lux-soap'] = val;
        feedback += `Counted ${val} Lux. `;
        updatedSomething = true;
      } else if (text.includes("out of stock") || text.includes("oos") || text.includes("zero")) {
        newShelfCounts['lux-soap'] = 0;
        feedback += "Lux out of stock. ";
        updatedSomething = true;
      }
    }

    // Lifebuoy Handwash
    if (text.includes("lifebuoy") || text.includes("handwash") || text.includes("wash")) {
      const match = text.match(/(?:lifebuoy|handwash|wash)\D*(\d+)/);
      if (match) {
        const val = parseInt(match[1]);
        newShelfCounts['lifebuoy-wash'] = val;
        feedback += `Counted ${val} Lifebuoy. `;
        updatedSomething = true;
      } else if (text.includes("out of stock") || text.includes("oos") || text.includes("zero")) {
        newShelfCounts['lifebuoy-wash'] = 0;
        feedback += "Lifebuoy out of stock. ";
        updatedSomething = true;
      }
    }

    // Multi-item matching on numbers if not matched by product words
    if (!updatedSomething) {
      if (text.includes("order") || text.includes("book") || text.includes("replenish")) {
        const numMatch = text.match(/\d+/);
        if (numMatch) {
          const qty = parseInt(numMatch[0]);
          if (text.includes("dove")) {
            newOrderProducts = newOrderProducts.map(p => p.id === 'dove-soap' ? { ...p, qty } : p);
            feedback += `Added ${qty} cases of Dove Soap. `;
            updatedSomething = true;
          } else if (text.includes("shampoo")) {
            newOrderProducts = newOrderProducts.map(p => p.id === 'dove-shampoo' ? { ...p, qty } : p);
            feedback += `Added ${qty} cases of Dove Shampoo. `;
            updatedSomething = true;
          } else if (text.includes("lux")) {
            newOrderProducts = newOrderProducts.map(p => p.id === 'lux-soap' ? { ...p, qty } : p);
            feedback += `Added ${qty} cases of Lux Soap. `;
            updatedSomething = true;
          } else {
            newOrderProducts = newOrderProducts.map(p => p.id === 'dove-soap' ? { ...p, qty } : p);
            feedback += `Added ${qty} cases to Order. `;
            updatedSomething = true;
          }
        }
      }
    }
    }

    // Reset counts command
    if (text.includes("clear") || text.includes("reset") || text.includes("empty")) {
      newShelfCounts = {
        'dove-soap': 0,
        'dove-shampoo': 0,
        'lux-soap': 0,
        'lifebuoy-wash': 0
      };
      feedback += "Reset all values to 0. ";
      updatedSomething = true;
    }

    if (updatedSomething) {
      setShelfSkuCounts(newShelfCounts);
      setOrderProducts(newOrderProducts);
      if (speakEnabled) speakText(feedback);
      return {
        success: true,
        summary: feedback
      };
    } else {
      if (speakEnabled) speakText("Voice registered, but could not identify specific SKU counts. Try saying Dove 22 or Lux 10!");
      return {
        success: false,
        summary: "Could not identify product names or counts. Ensure you mention 'Dove, Lux, Lifebuoy, or Shampoo' followed by a number."
      };
    }
  };

  const toggleVoice = (forChat = false) => {
    // If already active, stop/abort and reset
    if (isVoiceActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn("Error aborting recognition:", e);
        }
      }
      setIsVoiceActive(false);
      setIsVoiceRecording(false);
      return;
    }

    if (!forChat) {
      setIsVoiceSheetOpen(true);
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        recognitionRef.current = rec;
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        
        setIsVoiceActive(true);
        setIsVoiceRecording(true);
        if (forChat) {
          setInputMessage('Listening...');
        } else {
          setVoiceSpeechText('Listening now... Speak shelf counts like "Count Dove Soap 24" or "Reset all values"!');
        }
        
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsVoiceActive(false);
          setIsVoiceRecording(false);
          
          if (forChat) {
            setInputMessage(transcript);
            // Auto-submit text to general voice command parser / Gemini bot
            setChatMessages(prev => [...prev, { role: 'user', text: `🗣️ Voice Command: "${transcript}"` }]);
            setIsAiLoading(true);
            answerFieldQuery(transcript).then(response => {
              setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
              setIsAiLoading(false);
            }).catch(e => {
              setIsAiLoading(false);
              setChatMessages(prev => [...prev, { role: 'ai', text: `I noticed you spoke: "${transcript}"` }]);
            });
          } else {
            setVoiceSpeechTranscript(transcript);
            setVoiceSpeechText(`Heard: "${transcript}"`);
            setIsVoiceActive(false);
            
            // Parse and run!
            setTimeout(async () => {
              const parsed = await parseVoiceCommand(transcript);
              setVoiceLog(prev => [
                {
                  id: Date.now().toString(),
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  text: `Voice: "${transcript}"`,
                  details: parsed.summary,
                  type: parsed.success ? 'success' : 'warn' as any
                },
                ...prev
              ]);
            }, 1200);
          }
        };
        
        rec.onerror = (e: any) => {
          console.error("Speech Recognition Error", e);
          setIsVoiceActive(false);
          setIsVoiceRecording(false);
          if (forChat) {
            setInputMessage('');
            setChatMessages(prev => [...prev, { role: 'ai', text: "⚠️ Microphone didn't register or is sandboxed inside the iframe. Please type your query!" }]);
          } else {
            setVoiceSpeechText("Microphone input didn't register. Please type your command or click a simulated shortcut card below!");
          }
        };
        
        rec.onend = () => {
          setIsVoiceActive(false);
          setIsVoiceRecording(false);
        };
        
        rec.start();
      } catch (err) {
        console.warn("Could not start Speech Recognition:", err);
        setIsVoiceActive(false);
        setIsVoiceRecording(false);
        if (forChat) {
          setInputMessage('');
        } else {
          setVoiceSpeechText("Microphone permission denied or running inside sandboxed environment. Please use simulated tools below!");
        }
      }
    } else {
      setIsVoiceActive(false);
      setIsVoiceRecording(false);
      if (forChat) {
        setChatMessages(prev => [...prev, { role: 'ai', text: "⚠️ Web Speech Recognition is not supported in this browser. Please type directly." }]);
      } else {
        setVoiceSpeechText("Your browser sandbox blocks microphone hardware. Click any simulated voice command below to execute actions!");
      }
    }
  };

  const handleCustomVoiceSubmit = () => {
    if (!customVoiceInputText.trim()) return;
    const command = customVoiceInputText.trim();
    setCustomVoiceInputText('');
    setVoiceSpeechText(`Simulating: "${command}"`);
    setIsVoiceActive(true);
    
    setTimeout(async () => {
      setIsVoiceActive(false);
      const parsed = await parseVoiceCommand(command);
      setVoiceSpeechText(`Recognized: "${command}"`);
      
      setVoiceLog(prev => [
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Voice: "${command}"`,
          details: parsed.summary,
          type: parsed.success ? 'success' : 'warn' as any
        },
        ...prev
      ]);
    }, 1000);
  };

  const generateCustomQuestions = (pastLogs: any[]) => {
    const questionsList = [];
    
    const totalOrders = pastLogs.filter(l => l.type === 'order');
    const totalVisits = pastLogs.filter(l => l.type === 'vision');
    
    if (totalOrders.length > 0) {
      questionsList.push(...aiFieldQuiz.adaptiveScenarios.orderBased);
    }
    
    if (totalVisits.length > 0) {
      questionsList.push(...aiFieldQuiz.adaptiveScenarios.visionBased);
    }

    // Append fallback / general terminology terms from JSON
    questionsList.push(...aiFieldQuiz.faqScenarios);

    // Filter duplicates
    const uniqueQuestions: typeof questionsList = [];
    const seenTitles = new Set<string>();
    for (const q of questionsList) {
      if (!seenTitles.has(q.question)) {
        seenTitles.add(q.question);
        uniqueQuestions.push(q);
      }
    }

    return uniqueQuestions.slice(0, 3);
  };

  const handleTriggerQuizGeneration = () => {
    setQuizState('generating');
    setTimeout(() => {
      const pastLogs = dbService.getLogs();
      const generated = generateCustomQuestions(pastLogs);
      setQuizQuestions(generated);
      setQuizState('active');
    }, 2000);
  };

  const handleNextQuizQuestion = () => {
    setQuizSelectedOption(null);
    if (quizCurrentIndex < quizQuestions.length - 1) {
      setQuizCurrentIndex(prev => prev + 1);
    } else {
      // Complete! Save interaction to log and transition to complete state
      dbService.saveInteraction({
        userId: 'field-user-1',
        type: 'quiz',
        content: {
          score: quizScore,
          total: quizQuestions.length,
          questionsCount: quizQuestions.length
        },
        summary: `Quiz Training Completed (${quizScore}/${quizQuestions.length})`
      });
      setLogs(dbService.getLogs());
      setQuizState('completed');
    }
  };

  const verifyAndCheckInStore = async (analysis: { storeName: string; location: string }, dataUrl: string) => {
    const rawDetected = analysis.storeName || "";
    const cleanDetected = rawDetected.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchedIdx = routeStops.findIndex(stop => {
      const cleanStopName = stop.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanStopName.includes(cleanDetected) || cleanDetected.includes(cleanStopName)) {
        return true;
      }
      const sWords = stop.storeName.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
      const dWords = rawDetected.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
      return dWords.some(dw => sWords.some(sw => sw.includes(dw) || dw.includes(sw)));
    });

    if (matchedIdx === -1) {
      setCameraState('idle');
      setChatMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: `❌ Verification Failed! The shop board photo shows "**${rawDetected}**" (${analysis.location || "unknown location"}), which does NOT match any store in today's daily route plan.\n\nPlease upload or take a correct shop board photo for one of your planned stores: ${routeStops.map(s => s.storeName).join(', ')}`
        }
      ]);
      return false;
    }

    const targetStop = routeStops[matchedIdx];
    setRouteStops(prev => {
      const updated = prev.map((s, idx) => {
        if (idx === matchedIdx) {
          return { ...s, status: 'CURRENT' as const };
        }
        if (s.status === 'CURRENT') {
          return { ...s, status: 'PENDING' as const };
        }
        return s;
      });
      return recalculateSchedules(updated);
    });

    setSampleVisionData(prev => ({
      ...prev,
      storeName: targetStop.storeName,
      location: targetStop.address || prev.location
    }));
    
    setVisionShopboardUrl(dataUrl);
    setCheckInStep('location_checked_in');
    setCompletedStep2ActionIds(prev => prev.includes('loc_checkin') ? prev : [...prev, 'loc_checkin']);

    setChatMessages(prev => [
      ...prev,
      {
        role: 'ai',
        text: `✅ Route Verified! Checked-in successfully for **${targetStop.storeName}** based on route planning. General data has been updated. Now, let's capture/upload the shelf SKU photo.`
      }
    ]);
    return true;
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCustomUploadedImageUrl(dataUrl);
      
      setCameraState('snapping');
      await new Promise(r => setTimeout(r, 600));
      setCameraState('verifying');
      await new Promise(r => setTimeout(r, 2200));

      if (cameraPurpose === 'bot-loc') {
        if (cameraStep === 'shopboard') {
          const pendingStop = routeStops.find(s => s.status === 'PENDING') || routeStops[0];
          const enhancedDataUrl = await enhanceImage(dataUrl);
          const analysis = await analyzeStorefrontImage(enhancedDataUrl, pendingStop?.storeName || file.name);
          const success = await verifyAndCheckInStore(analysis, dataUrl);
          if (success) {
            setCameraStep('allSkus');
          }
          setCameraState('idle');
          return;
        }

        setIsBotCameraOpen(false);
        setCheckInStep('location_checked_in');
        setCompletedStep2ActionIds(prev => prev.includes('loc_checkin') ? prev : [...prev, 'loc_checkin']);
        
        setChatMessages(prev => [
          ...prev,
          {
            role: 'user',
            text: '📍 Completed Geolocation check-in & SKU shelf audit via Gallery Upload!'
          },
          {
            role: 'ai',
            text: `✅ Gallery photo of storefront received and verified under geolocation match! GPS: locked. Storefront confirmed: ${sampleVisionData.storeName}`,
            imageUrl: dataUrl
          },
          {
            role: 'ai',
            text: `📊 Image Recognition SKU Audit: Counted exactly ${sampleVisionData.skus} SKUs on display shelf from gallery upload! Verification 100% complete.`,
            imageUrl: dataUrl
          }
        ]);

        dbService.saveInteraction({
          userId: 'field-user-1',
          type: 'chat',
          content: { 
            message: 'Location Check-in via Gallery Upload', 
            response: `📍 Check-in verified via custom uploaded photo at ${sampleVisionData.storeName}. Counted ${sampleVisionData.skus} display SKUs.` 
          },
          summary: 'Check-in: Custom Photo Verified'
        });
        setLogs(dbService.getLogs());

      } else if (cameraPurpose === 'vision-loc') {
        if (cameraStep === 'shopboard') {
          const pendingStop = routeStops.find(s => s.status === 'PENDING') || routeStops[0];
          const enhancedDataUrl = await enhanceImage(dataUrl);
          const analysis = await analyzeStorefrontImage(enhancedDataUrl, pendingStop?.storeName || file.name);
          const success = await verifyAndCheckInStore(analysis, dataUrl);
          if (success) {
            setIsVisionCameraActive(false);
          }
          setCameraState('idle');
          return;
        }

        setIsVisionCameraActive(false);
        ensureAttendanceMarked("Uploaded storefront board");
        
        if (cameraStep === 'allSkus') {
          setVisionSkuImageUrl(dataUrl);
          setDetectedSkuCount(sampleVisionData.skus);
          setShelfSkuCounts({
            'dove-soap': 45,
            'dove-shampoo': 30,
            'lux-soap': 45,
            'lifebuoy-wash': 36
          });
          
          setChatMessages(prev => [
            ...prev, 
            { 
              role: 'ai', 
              text: `📊 Image Recognition SKU Audit: Counted exactly ${sampleVisionData.skus} SKUs on display shelf from custom uploaded image! Compliance 100% complete.` 
            }
          ]);
        }
      }
      
      setCameraPurpose(null);
      setCameraState('idle');
      setCameraStep('shopboard');
    };
    reader.readAsDataURL(file);
  };

  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceAutoMarkedAlert, setAttendanceAutoMarkedAlert] = useState(false);
  const [checkInStep, setCheckInStep] = useState<'idle' | 'store_checked_in' | 'location_checked_in' | 'checked_out'>('idle');
  const [completedStep2ActionIds, setCompletedStep2ActionIds] = useState<string[]>([]);

  // Automatically sync attendance based on business logic:
  // - If field user is working on 13th store then attendance must be marked.
  // - Only in case of no stores done then attendance is not marked will be shown.
  useEffect(() => {
    const completedCount = routeStops.filter(s => s.status === 'COMPLETED').length;
    const isWorkingOn13 = routeStops.some(s => (s.id === 'stop-13' || s.optimizedIndex === 13) && s.status === 'CURRENT');
    
    if (isWorkingOn13) {
      setAttendanceMarked(true);
    } else if (completedCount === 0) {
      setAttendanceMarked(false);
    } else {
      setAttendanceMarked(true);
    }
  }, [routeStops]);

  const ensureAttendanceMarked = (source: string) => {
    if (!attendanceMarked) {
      setAttendanceMarked(true);
      setCheckInStep('store_checked_in');
      setCompletedStep2ActionIds([]);
      setAttendanceAutoMarkedAlert(true);
      setTimeout(() => {
        setAttendanceAutoMarkedAlert(false);
      }, 5000);

      dbService.saveInteraction({
        userId: 'field-user-1',
        type: 'chat',
        content: { message: "[System Check-in]", response: `✅ Attendance Marked automatically via Vision AI photo of ${source}!` },
        summary: `Attendance: Auto-marked via Vision AI`
      });
      setLogs(dbService.getLogs());

      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `⚡ [Vision AI Auto-Check-in] Attendance marked automatically! Photo of ${source} verified. Your visit status is now ACTIVE.`,
        imageUrl: visionShopboardUrl || generateDynamicCapturePlaceholder('Storefront Check-In', 'Auto-Check-In Active')
      }]);
    }
  };
  const [visionStep, setVisionStep] = useState<VisionStep>('capture-board');
  const [skuCountInput, setSkuCountInput] = useState('');
  const [doveSkuCount, setDoveSkuCount] = useState<number | null>(null);
  const [continuousCount, setContinuousCount] = useState(0);
  const [auditData, setAuditData] = useState<any>(null);
  const [visionShopboardUrl, setVisionShopboardUrl] = useState<string | null>(null);
  const [visionSkuImageUrl, setVisionSkuImageUrl] = useState<string | null>(null);
  const [detectedSkuCount, setDetectedSkuCount] = useState<number | null>(null);
  const [isCountingSku, setIsCountingSku] = useState(false);
  const [isVerifyingShopboard, setIsVerifyingShopboard] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string, imageUrl?: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isVisionProcessing, setIsVisionProcessing] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [visionResult, setVisionResult] = useState<any>(null);
  const [logs, setLogs] = useState<InteractionLog[]>([]);

  // --- Order Pro States ---
  const [orderProducts, setOrderProducts] = useState<Array<{
    id: string;
    name: string;
    price: number;
    lastMonthOos: boolean;
    stockStatus: 'In Stock' | 'Critical OOS' | 'Low';
    lastOrderQty: number;
    qty: number;
    suggestedQty: number;
    selectedSchemeId: string | null;
    schemes: Array<{
      id: string;
      name: string;
      benefitPercent: number;
      description: string;
    }>;
  }>>(aiOrderSchemes.products as any);

  useEffect(() => {
    setOrderProducts(prev => prev.map(prod => {
      const count = shelfSkuCounts[prod.id];
      if (count !== undefined) {
        let stockStatus: 'In Stock' | 'Critical OOS' | 'Low' = 'In Stock';
        let suggestedQty = 0;
        
        if (count === 0) {
          stockStatus = 'Critical OOS';
          suggestedQty = Math.max(20, prod.lastOrderQty || 20);
        } else if (count < 15) {
          stockStatus = 'Low';
          suggestedQty = Math.max(0, 30 - count);
        } else {
          stockStatus = 'In Stock';
          suggestedQty = 0;
        }

        return { ...prod, stockStatus, suggestedQty };
      }
      return prod;
    }));
  }, [shelfSkuCounts]);

  const [isOrderBookingConfirmOpen, setIsOrderBookingConfirmOpen] = useState(false);
  const [bookedReceipt, setBookedReceipt] = useState<{
    orderId: string;
    totalAmount: number;
    totalUnits: number;
    totalBenefitPercent: number;
    timestamp: string;
    summary: string;
  } | null>(null);

  // Auto-fill suggested OOS quantities on click or init
  const handleApplySuggestions = () => {
    setOrderProducts(prev => prev.map(prod => {
      if (prod.suggestedQty > 0) {
        // Auto select best scheme if multiple exist
        let bestSchemeId = prod.selectedSchemeId;
        if (prod.schemes.length > 0) {
          bestSchemeId = [...prod.schemes].sort((a, b) => b.benefitPercent - a.benefitPercent)[0].id;
        }
        return {
          ...prod,
          qty: prod.suggestedQty,
          selectedSchemeId: bestSchemeId
        };
      }
      return prod;
    }));
  };

  // Interactive Camera verification flow states
  const [isBotCameraOpen, setIsBotCameraOpen] = useState(false);
  const [isVisionCameraActive, setIsVisionCameraActive] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState<'bot-loc' | 'vision-loc' | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'snapping' | 'verifying'>('idle');
  const [cameraWatermarkOpacity, setCameraWatermarkOpacity] = useState<number>(0.3);
  const [cameraStep, setCameraStep] = useState<'shopboard' | 'allSkus'>('shopboard');
  const [simulatedShopBoard, setSimulatedShopBoard] = useState<string>('');

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  const generateDynamicCapturePlaceholder = (title: string, subtitle: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
      <circle cx="300" cy="225" r="120" stroke="#3b82f6" stroke-width="1" fill="none" stroke-dasharray="5,5" opacity="0.3"/>
      <circle cx="300" cy="225" r="60" stroke="#3b82f6" stroke-width="2" fill="none" opacity="0.4"/>
      <path d="M 280 225 L 320 225 M 300 205 L 300 245" stroke="#3b82f6" stroke-width="2" opacity="0.6"/>
      <text x="300" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#3b82f6" text-anchor="middle" letter-spacing="2">${title.toUpperCase()}</text>
      <text x="300" y="405" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">${subtitle.toUpperCase()}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacingMode }
        });
        activeStream = stream;
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn(`Could not start camera with preference ${cameraFacingMode}:`, err);
        try {
          // Direct fallback to whatever raw video is available
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          activeStream = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (innerErr) {
          console.warn("webcam fallback start failed completely:", innerErr);
        }
      }
    };

    if (isBotCameraOpen || isVisionCameraActive) {
      startCamera();
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isBotCameraOpen, isVisionCameraActive, cameraFacingMode]);

  const openCamera = (purpose: 'bot-loc' | 'vision-loc', step: 'shopboard' | 'allSkus' = 'shopboard') => {
    setCameraPurpose(purpose);
    setCameraStep(step);
    setCameraState('idle');
    if (step === 'shopboard') {
      const activeStop = routeStops.find(s => s.status === 'CURRENT') || routeStops.find(s => s.status === 'PENDING') || routeStops[0];
      setSimulatedShopBoard(activeStop ? activeStop.storeName : "Mini Mercado Extra");
    }
    if (purpose === 'bot-loc') {
      setIsBotCameraOpen(true);
    } else {
      setIsVisionCameraActive(true);
    }
  };

  // Field Specific Imagery
  const FIELD_IMAGES = {
    shopboard: UNILEVER_SHOPBOARD_SVG, // Store front/board
    allSkus: "/src/assets/images/unilever_sku_shelf_1779994527047.png", // Grocery shelf
    doveShelf: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600", // Beauty/Dove-like shelf
    planogram: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=600" // Organized retail
  };

  // Sample Vision Data
  const [sampleVisionData, setSampleVisionData] = useState({
    storeName: "Smollan Elite Hub #442",
    location: "Bandra West, Mumbai",
    stockCount: 284,
    skus: 156,
    compliance: 94,
    outOfStock: ["Dove Deep Moisture 400ml", "Lux Scarlet 100g", "Lifebuoy Lemon"],
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    setLogs(dbService.getLogs());
  }, [activeScreen]);

  const stats = useMemo(() => generateAIReportSummary(logs), [logs]);

  const handleSendMessage = async (msgOverride?: string) => {
    const userMsg = msgOverride || inputMessage;
    if (!userMsg.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    if (!msgOverride) setInputMessage('');
    setIsAiLoading(true);

    // Initial bot sequence if it's the start
    let aiResponse = "";
    let aiImageUrl: string | undefined = undefined;
    const lowMsg = userMsg.toLowerCase().trim();

    // Check if user is referencing the Mini Mercado Extra store
    if (lowMsg.includes('mini mercado') || lowMsg.includes('mercado') || lowMsg.includes('extra')) {
      setSampleVisionData(prev => ({
        ...prev,
        storeName: "Mini Mercado Extra",
        location: "Sao Paulo, Brazil"
      }));
    }

    // Check if the message matches any of the Step 2 action prompts to mark it completed
    const matchedStep2Id = (() => {
      if (lowMsg.includes('location check-in') || lowMsg.includes('location checkin')) return 'loc_checkin';
      if (lowMsg.includes('survey question') || lowMsg.includes('survey')) return 'survey';
      if (lowMsg.includes('promotion check') || lowMsg.includes('promotion')) return 'promotion';
      if (lowMsg.includes('ir shelf audit') || lowMsg.includes('ir task') || lowMsg.includes('vision audit') || lowMsg.includes('ir / vision') || lowMsg.includes('image recognition')) return 'ir_task';
      return null;
    })();

    let currentCompleted = completedStep2ActionIds;
    if (matchedStep2Id) {
      if (!completedStep2ActionIds.includes(matchedStep2Id)) {
        currentCompleted = [...completedStep2ActionIds, matchedStep2Id];
        setCompletedStep2ActionIds(currentCompleted);
      }
    }
    
    if (lowMsg.includes('store check-in') || lowMsg.includes('store checkin') || lowMsg.includes('start the store check')) {
      setAttendanceMarked(true);
      setCheckInStep('store_checked_in');
      setCompletedStep2ActionIds([]);
      aiResponse = `✅ Attendance Marked! Store Check-in completed automatically for ${sampleVisionData.storeName || "Smollan Elite Hub #442"}.\n\nNow, your status is ACTIVE. Please proceed with the next options (Step 2):\n📌 Location Check-in\n📋 Survey Question\n🎁 Promotion\n🔍 IR (Image Recognition) / Vision Audit\n\nOr click Location Checkout when you are done.`;
    } else if (lowMsg.includes('location check-in') || lowMsg.includes('location checkin')) {
      if (!isBotCameraOpen && checkInStep !== 'location_checked_in' && cameraPurpose !== 'bot-loc') {
        openCamera('bot-loc');
        setIsAiLoading(false);
        return;
      }
      setCheckInStep('location_checked_in');
      aiResponse = `📍 Location Check-in completed. GPS coordinates matches with ${sampleVisionData.storeName || "Smollan Elite Hub #442"} perfectly. Verified store board photo below:`;
      aiImageUrl = visionShopboardUrl || generateDynamicCapturePlaceholder('Storefront Check-In', sampleVisionData.location || 'Bandra West, Mumbai');
    } else if (lowMsg.includes('survey question') || lowMsg.includes('survey')) {
      aiResponse = "📋 [Survey Question] Store Display Audit: Are products placed prominently at eye-level on the main aisle?\n\n🤖 Recommendation: Yes, they are in primary slot. (Recorded: YES)";
    } else if (lowMsg.includes('promotion check') || lowMsg.includes('promotion')) {
      aiResponse = "🎁 [Promotion Status] Monsoon Buy-1-Get-1 offer display verified. The banner is active and correctly positioned at checkout counter.";
    } else if (lowMsg.includes('ir shelf audit') || lowMsg.includes('ir task') || lowMsg.includes('vision audit') || lowMsg.includes('ir / vision') || lowMsg.includes('image recognition')) {
      aiResponse = "🔍 Opening Vision AI / IR module to audit shelf photos...";
      setTimeout(() => {
        setActiveScreen('vision');
        setVisionStep('capture-board');
        setVisionResult(null);
        setSkuCountInput('');
        setContinuousCount(0);
        setDoveSkuCount(null);
      }, 1000);
    } else if (lowMsg.includes('location checkout') || lowMsg.includes('checkout')) {
      if (checkInStep === 'idle') {
        aiResponse = "⚠️ Checkout is not available yet. Please complete Step 1: Store Check-in first to begin your visit.";
      } else if (checkInStep === 'checked_out') {
        aiResponse = "🚪 You have already completed your location checkout for this visit! If you would like to start a new visit, select the Store Check-in button.";
      } else {
        const activeStep2Ids = (config.botQuickActions || []).filter(id => id !== 'audit' && id !== 'checkout');
        const uncompleted = activeStep2Ids.filter(id => !currentCompleted.includes(id));

        if (uncompleted.length > 0) {
          const remainingStr = uncompleted.map(id => {
            const act = AVAILABLE_BOT_ACTIONS.find(a => a.id === id);
            return `• ${act ? act.label : id}`;
          }).join('\n');
          aiResponse = `⚠️ Checkout Locked!\n\nPlease complete all Step 2 activities first before checking out.\n\nRemaining pending activities:\n${remainingStr}`;
        } else {
          setCheckInStep('checked_out');
          aiResponse = `🚪 Location Checkout Complete! All survey and image recognition (IR) audit tasks have been synchronized. Thank you for finishing your visit at ${sampleVisionData.storeName || "Smollan Elite Hub #442"}!`;
        }
      }
    } else if (userMsg.toLowerCase().includes('reporting') || userMsg.toLowerCase().includes('check-in')) {
      setAttendanceMarked(true);
      setCheckInStep('store_checked_in');
      setCompletedStep2ActionIds([]);
      aiResponse = "Welcome back! I'm ready for the store audit/check-in. First, click the Store Check-in button to mark your attendance and begin.";
    } else {
      // Check if message matches any of our dynamic JSON FAQ catalog keywords/questions
      const matchedFaq = aiSmartBot.faqCatalog.find(f => 
        lowMsg.includes(f.question.toLowerCase().trim()) || 
        f.keywords.some(kw => lowMsg.includes(kw.toLowerCase().trim()))
      );
      if (matchedFaq) {
        aiResponse = matchedFaq.answer;
      } else {
        aiResponse = await answerFieldQuery(userMsg);
      }
    }

    setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse, imageUrl: aiImageUrl }]);
    
    // Check for audit-related patterns using the shared AI voice command parser
    const parsed = await parseVoiceCommand(userMsg, false);
    if (parsed.success) {
       setChatMessages(prev => [...prev, { role: 'ai', text: `Got it! ${parsed.summary} This data will be integrated across the app and deep reports.` }]);
    }

    await dbService.saveInteraction({
      userId: 'field-user-1',
      type: 'chat',
      content: { message: userMsg, response: aiResponse },
      summary: `Chat: ${userMsg.slice(0, 30)}...`
    });

    setIsAiLoading(false);
    setLogs(dbService.getLogs());
  };

  const handleChipAction = (chip: { label: string, action: string, id?: string }) => {
    if (chip.id === 'loc_checkin') {
      openCamera('bot-loc');
      return;
    }
    handleSendMessage(chip.action);
  };

  const handleShutterClick = async () => {
    setCameraState('snapping');
    await new Promise(r => setTimeout(r, 250));
    setCameraState('verifying');

    // Attempt to capture frame from live stream
    let capturedUrl = '';
    if (videoRef.current && cameraStream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          capturedUrl = canvas.toDataURL('image/jpeg');
        }
      } catch (err) {
        console.error("Failed to capture image track:", err);
      }
    }

    if (!capturedUrl) {
      capturedUrl = generateDynamicCapturePlaceholder(
        cameraStep === 'shopboard' ? (simulatedShopBoard || 'Storefront Check-In') : 'Shelf SKU Audit',
        cameraStep === 'shopboard' ? 'Bandra West, Mumbai' : '156 SKUs Connected'
      );
    }

    await new Promise(r => setTimeout(r, 2200));

    if (cameraPurpose === 'bot-loc') {
      if (cameraStep === 'shopboard') {
        const enhancedCapturedUrl = await enhanceImage(capturedUrl);
        const analysis = await analyzeStorefrontImage(enhancedCapturedUrl, simulatedShopBoard);
        const success = await verifyAndCheckInStore(analysis, capturedUrl);
        if (success) {
          setCameraStep('allSkus');
          setCameraState('idle');
        }
        return;
      }

      setIsBotCameraOpen(false);
      setCheckInStep('location_checked_in');
      setCompletedStep2ActionIds(prev => prev.includes('loc_checkin') ? prev : [...prev, 'loc_checkin']);
      
      setVisionSkuImageUrl(capturedUrl);

      setChatMessages(prev => [
        ...prev,
        {
          role: 'user',
          text: '📍 Completed Location Check-in & Shelf SKU audit!'
        },
        {
          role: 'ai',
          text: `📍 Location Check-in completed. GPS coordinates matches with ${sampleVisionData.storeName} perfectly. Verified store board photo below:`,
          imageUrl: visionShopboardUrl || capturedUrl
        },
        {
          role: 'ai',
          text: `📊 Image Recognition SKU Audit: Counted exactly ${sampleVisionData.skus} SKUs on display shelf! Verification 100% complete.`,
          imageUrl: capturedUrl
        }
      ]);

      dbService.saveInteraction({
        userId: 'field-user-1',
        type: 'chat',
        content: { 
          message: 'Location Check-in via Camera & SKU Count', 
          response: `📍 Location Check-in completed. GPS coordinates matches. Checked storefront for ${sampleVisionData.storeName} and counted ${sampleVisionData.skus} display SKUs.` 
        },
        summary: 'Check-in: Storefront & SKU Verified'
      });
      setLogs(dbService.getLogs());

    } else if (cameraPurpose === 'vision-loc') {
      if (cameraStep === 'shopboard') {
        const enhancedCapturedUrl = await enhanceImage(capturedUrl);
        const analysis = await analyzeStorefrontImage(enhancedCapturedUrl, simulatedShopBoard);
        const success = await verifyAndCheckInStore(analysis, capturedUrl);
        if (success) {
          setIsVisionCameraActive(false);
        }
        return;
      }

      setIsVisionCameraActive(false);
      ensureAttendanceMarked("Shop board SKU");
      
      if (cameraStep === 'allSkus') {
        setVisionSkuImageUrl(capturedUrl);
        setDetectedSkuCount(sampleVisionData.skus);
        setShelfSkuCounts({
          'dove-soap': 45,
          'dove-shampoo': 30,
          'lux-soap': 45,
          'lifebuoy-wash': 36
        });
        
        setChatMessages(prev => [
          ...prev, 
          { 
            role: 'ai', 
            text: `📊 Image Recognition SKU Audit: Counted exactly ${sampleVisionData.skus} SKUs on display shelf! Verification 100% complete.` 
          }
        ]);
        
        dbService.saveInteraction({
          userId: 'field-user-1',
          type: 'chat',
          content: { 
            message: 'Camera SKU Count', 
            response: `Counted exactly ${sampleVisionData.skus} SKUs on display shelf during IR audit.` 
          },
          summary: 'SKU Count Output'
        });
        setLogs(dbService.getLogs());
      }
    }

    setCameraPurpose(null);
    setCameraState('idle');
    setCameraStep('shopboard');
  };

  const handleCaptureBoard = async () => {
    ensureAttendanceMarked("Shop board SKU");
    setVisionStep('fetching-skus');
    await new Promise(r => setTimeout(r, 2000));
    setSkuCountInput(sampleVisionData.skus.toString());
    setVisionStep('sku-question');
    
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      text: `Shopboard verified: ${sampleVisionData.storeName} at ${sampleVisionData.location}. I've detected ${sampleVisionData.skus} SKUs in this area. Please capture all SKUs on the shelf now.` 
    }]);
  };

  const handleAnalyzeAllSkus = () => {
    ensureAttendanceMarked("Actual Store Shelf SKUs");
    setVisionStep('capture-dove');
  };

  const handleCaptureDove = async () => {
    ensureAttendanceMarked("Dove Shelf SKU");
    setVisionStep('fetching-dove');
    await new Promise(r => setTimeout(r, 2000));
    setDoveSkuCount(24);
    setVisionStep('continuous-audit');
    
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      text: `Dove shelf analyzed. I've detected 24 Dove SKUs. What's the count for Lux or other specific brands? You can tell me or use voice.` 
    }]);
  };

  const handleContinuousPhoto = async () => {
    ensureAttendanceMarked("Deep Scan Shelf SKU");
    setContinuousCount(prev => prev + 1);
    if (continuousCount >= 2) {
       handleProcessVision();
    }
  };

  const handleProcessVision = async () => {
    setIsVisionProcessing(true);
    
    // Simulate deep AI analysis
    await new Promise(r => setTimeout(r, 3000));
    
    // Merge AI data with manual chat audit data
    const finalReport = {
      ...sampleVisionData,
      doveCount: shelfSkuCounts['dove-soap'] || 0,
      luxCount: shelfSkuCounts['lux-soap'] || 0,
      brands: {
        Dove: shelfSkuCounts['dove-soap'] || 0,
        Lux: shelfSkuCounts['lux-soap'] || 0,
        Lifebuoy: shelfSkuCounts['lifebuoy-wash'] || 0,
        Pepsodent: shelfSkuCounts['pepsodent'] || 0
      },
      missingSkus: ["Dove Deep Moisture 400ml", "Lux Scarlet 100g", "Lifebuoy Lemon"],
      planogramStatus: "Non-Compliant - Shelf Labels Missing",
      prediction: "High velocity detected for Dove. Predict stockout in 48h. Suggested Order: +4 cases.",
      timestamp: new Date().toISOString()
    };
    
    setVisionResult(finalReport);
    setIsVisionProcessing(false);
    setVisionStep('result');
    setCompletedStep2ActionIds(prev => prev.includes('ir_task') ? prev : [...prev, 'ir_task']);

    await dbService.saveInteraction({
      userId: 'field-user-1',
      type: 'vision',
      content: finalReport,
      summary: `Deep Audit: ${finalReport.storeName}`
    });
    setLogs(dbService.getLogs());

    // Bot conclusion
    setChatMessages(prev => [...prev, { role: 'ai', text: `Deep analysis complete. ${finalReport.storeName} has ${finalReport.planogramStatus}. I've projected a shortage in Dove units. I recommend placing an immediate replenishment order.` }]);
  };

  const iconMap: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles />,
    Camera: <Camera />,
    Mic: <Mic />,
    ShoppingCart: <ShoppingCart />,
    Zap: <Zap />,
    BarChart: <BarChart />,
    MapPin: <MapPin />,
    Home: <Home />,
    Scan: <Scan />,
    FileText: <FileText />,
    LayoutGrid: <LayoutGrid />,
    ClipboardList: <ClipboardList />,
    BookOpen: <BookOpen />,
    Navigation: <Navigation />,
    UserCircle: <UserCircle />,
    Radar: <Radar />,
    Map: <Map />
  };

  const predictiveChips = useMemo(() => {
    const enabledIds = config.botQuickActions || [];

    if (checkInStep === 'idle') {
      // Force Store Check-in at the front if enabled
      if (enabledIds.includes('audit')) {
        return [{
          label: 'Store Check-in',
          icon: <MapPin className="w-3 h-3" />,
          action: 'Start the store check-in',
          id: 'audit',
          isCompleted: false,
          isDisabled: false
        }];
      }
      return [];
    }

    if (checkInStep === 'checked_out') {
      if (enabledIds.includes('audit')) {
        return [{
          label: 'Store Check-in',
          icon: <MapPin className="w-3 h-3" />,
          action: 'Start the store check-in',
          id: 'audit',
          isCompleted: false,
          isDisabled: false
        }];
      }
      return [];
    }

    // Checked in state (either 'store_checked_in' or 'location_checked_in')
    // We want to list enabled step 2 actions.
    const activeStep2Ids = enabledIds.filter(id => id !== 'audit' && id !== 'checkout');
    
    // Sort Step 2 items by original order in AVAILABLE_BOT_ACTIONS
    const step2Chips = AVAILABLE_BOT_ACTIONS
      .filter(action => activeStep2Ids.includes(action.id))
      .map(action => {
        const isCompleted = completedStep2ActionIds.includes(action.id);
        return {
          label: action.label,
          icon: iconMap[action.icon] ? React.cloneElement(iconMap[action.icon] as React.ReactElement, { className: "w-3 h-3" }) : <Zap className="w-3 h-3" />,
          action: action.prompt,
          id: action.id,
          isCompleted,
          isDisabled: false
        };
      });

    // Check if step 3 is enabled
    const allStep2Completed = step2Chips.every(chip => chip.isCompleted);
    const checkoutEnabled = step2Chips.length === 0 || allStep2Completed;

    // Add checkout chip to the end if enabled in config
    if (enabledIds.includes('checkout')) {
      step2Chips.push({
        label: 'Location Checkout',
        icon: <X className="w-3 h-3" />,
        action: 'Location Checkout',
        id: 'checkout',
        isCompleted: false,
        isDisabled: !checkoutEnabled
      });
    }

    return step2Chips;
  }, [checkInStep, config.botQuickActions, completedStep2ActionIds, iconMap]);

  const enabledFeatures = useMemo(() => {
    if (!config || !config.features || !config.featureOrder) return [];
    
    return config.featureOrder
      .map(id => AVAILABLE_FEATURES.find(f => f.id === id))
      .filter((f): f is Feature => {
        if (!f) return false;
        return config.features[f.id] === true;
      });
  }, [config.features, config.featureOrder]);

  const dashboardFeatures = useMemo(() => {
    return enabledFeatures;
  }, [enabledFeatures]);

  const topFeatures = useMemo(() => {
    const screensWithUI = [
      'predictiveBot', 
      'visionAutomation', 
      'salesInsights', 
      'trainingHub', 
      'routeOptimizer',
      'orderManagement',
      'quizModule'
    ];
    return enabledFeatures.filter(f => screensWithUI.includes(f.id)).slice(0, 3);
  }, [enabledFeatures]);

  return (
    <div className="flex items-center justify-center bg-slate-950 p-4 shrink-0 overflow-hidden">
      <div className="w-[360px] h-[724px] bg-slate-900 rounded-[3rem] border-[10px] border-slate-800 shadow-[0_0_80px_rgba(59,130,246,0.3)] relative overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-10 shrink-0 bg-slate-900 flex items-center justify-between px-8 text-[11px] text-white">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2.5 bg-white/20 rounded-sm"></div>
            <div className="w-3 h-3 bg-white/20 rounded-full"></div>
            <div className="w-5 h-2 bg-white/50 rounded-sm"></div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50 flex flex-col">
          {/* Attendance Auto-Marked Alert Toast */}
          <AnimatePresence>
            {attendanceAutoMarkedAlert && (
              <motion.div 
                 initial={{ opacity: 0, y: -50, scale: 0.95 }}
                 animate={{ opacity: 1, y: 12, scale: 1 }}
                 exit={{ opacity: 0, y: -20, scale: 0.95 }}
                 className="absolute top-0 inset-x-3 bg-emerald-600 text-white p-3 rounded-2xl z-[1000] shadow-xl flex items-center gap-2.5 border border-emerald-500"
              >
                 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none">Auto Checked In 📍</p>
                    <p className="text-[8px] font-bold text-emerald-100 mt-0.5 leading-tight">Attendance marked automatically via SKU Recognition!</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 justify-between shrink-0">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
                >
                   <LayoutGrid className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Brain className="w-4 h-4 text-white" />
                   </div>
                   <span className="font-black text-slate-800 tracking-tight text-[11px] uppercase">SMARTFieldForce.AI</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Online</span>
             </div>
          </header>

          {/* Sidebar Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]"
                />
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="absolute top-0 left-0 bottom-0 w-[280px] bg-white z-[101] shadow-2xl p-6 flex flex-col"
                >
                   <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                            <Brain className="w-6 h-6" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">SMARTFieldForce.AI</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.4.0-AI</p>
                         </div>
                      </div>
                      <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                         <X className="w-5 h-5 text-slate-400" />
                      </button>
                   </div>

                   <nav className="space-y-2">
                      <button 
                        onClick={() => {
                          setActiveScreen('home');
                          setIsMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest",
                          activeScreen === 'home' 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                            : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                         <Home className="w-5 h-5" />
                         Home Dashboard
                      </button>

                      {enabledFeatures.map((feature) => {
                        // Map our few specific screens back to IDs
                        const screenMap: Record<string, Screen> = {
                           predictiveBot: 'bot',
                           visionAutomation: 'vision',
                           salesInsights: 'reports',
                           trainingHub: 'training',
                           routeOptimizer: 'planner',
                           userProfile: 'performance',
                           territoryMap: 'territory',
                           orderManagement: 'order',
                           quizModule: 'quiz'
                         };
                        const targetScreen = screenMap[feature.id];
                        
                        return (
                          <button 
                            key={feature.id}
                            onClick={() => {
                              if (targetScreen) setActiveScreen(targetScreen);
                              setIsMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest",
                              (targetScreen && activeScreen === targetScreen) 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                : "text-slate-500 hover:bg-slate-50"
                            )}
                          >
                             <div className="w-5 h-5 flex items-center justify-center">
                               {iconMap[feature.icon] || <Layers className="w-5 h-5" />}
                             </div>
                             {feature.name}
                          </button>
                        );
                      })}
                   </nav>

                   <div className="mt-auto pt-6 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-2xl p-4">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Session</span>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                         </div>
                         <p className="text-xs font-black text-slate-800">Field User #5021</p>
                         <p className="text-[10px] font-bold text-slate-400">SOUTHERN SECTOR A</p>
                      </div>
                   </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto relative no-scrollbar">
            <AnimatePresence mode="wait">
              {activeScreen === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-8"
                >
                  {dashboardFeatures[0] && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                             <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                                {iconMap[dashboardFeatures[0].icon] || <Sparkles className="w-4 h-4" />}
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Priority Action</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 tracking-tight">
                            {dashboardFeatures[0].id === 'visionAutomation' ? `Audit Required: ${sampleVisionData.storeName}` : `Next Up: ${dashboardFeatures[0].name}`}
                          </h3>
                          <p className="text-11px font-medium text-slate-500 leading-relaxed max-w-[200px]">
                            {dashboardFeatures[0].description} - Optimized by AI for your current route.
                          </p>
                          
                          <button 
                            onClick={() => {
                              if (dashboardFeatures[0].id === 'visionAutomation') setActiveScreen('vision');
                              else if (dashboardFeatures[0].id === 'predictiveBot') setActiveScreen('bot');
                              else if (dashboardFeatures[0].id === 'voiceToText') toggleVoice(false);
                              else if (dashboardFeatures[0].id === 'salesInsights') setActiveScreen('reports');
                              else if (dashboardFeatures[0].id === 'trainingHub') setActiveScreen('training');
                              else if (dashboardFeatures[0].id === 'routeOptimizer') setActiveScreen('planner');
                              else if (dashboardFeatures[0].id === 'userProfile') setActiveScreen('performance');
                              else if (dashboardFeatures[0].id === 'territoryMap') setActiveScreen('territory');
                              else if (dashboardFeatures[0].id === 'orderManagement') setActiveScreen('order');
                              else if (dashboardFeatures[0].id === 'quizModule') setActiveScreen('quiz');
                            }}
                            className="mt-6 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                          >
                             Launch Module
                          </button>
                       </div>
                       <div className="absolute -top-4 -right-4 opacity-[0.03] rotate-12">
                          {iconMap[dashboardFeatures[0].icon] || <Layers className="w-40 h-40" />}
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Hubs</p>
                        <p className="text-xl font-black text-slate-800 tracking-tighter">12 <span className="text-[10px] text-emerald-500">/ 15</span></p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                        <p className="text-xl font-black text-slate-800 tracking-tighter">98.4%</p>
                     </div>
                  </div>

                  {/* Attendance Verification Card */}
                  <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                           "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                           attendanceMarked ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                        )}>
                           <Activity className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Attendance Log</p>
                           <p className={cn("text-xs font-black uppercase mt-1 leading-none text-slate-800")}>
                              {attendanceMarked ? "Present / Active" : "Not Marked Yet"}
                           </p>
                        </div>
                     </div>
                     <span className={cn(
                        "px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-full border transition-all",
                        attendanceMarked 
                          ? "bg-emerald-50/50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50/50 text-rose-700 border-rose-200"
                     )}>
                        {attendanceMarked ? "Auto-verified" : "Tap Store Check-in"}
                     </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Access</h4>
                       <div className="h-0.5 flex-1 mx-4 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {dashboardFeatures.map((feature, i) => (
                        <motion.button
                          key={feature.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            if (feature.id === 'visionAutomation') setActiveScreen('vision');
                            else if (feature.id === 'predictiveBot') setActiveScreen('bot');
                            else if (feature.id === 'voiceToText') toggleVoice(false);
                            else if (feature.id === 'salesInsights') setActiveScreen('reports');
                            else if (feature.id === 'trainingHub') setActiveScreen('training');
                            else if (feature.id === 'routeOptimizer') setActiveScreen('planner');
                            else if (feature.id === 'userProfile') setActiveScreen('performance');
                            
                            else if (feature.id === 'territoryMap') setActiveScreen('territory');
                            else if (feature.id === 'orderManagement') setActiveScreen('order');
                            else if (feature.id === 'quizModule') setActiveScreen('quiz');
                          }}
                          className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3 active:scale-95 transition-all group"
                        >
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {React.cloneElement(iconMap[feature.icon] as React.ReactElement, { className: "w-6 h-6" })}
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[10px] font-black text-slate-800 tracking-tight uppercase leading-none">{feature.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase leading-none line-clamp-1">{feature.description}</p>
                           </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeScreen === 'bot' && (
                <motion.div
                  key="bot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  {/* REAL-TIME VISIT STATUS PROGRESS INDICATOR */}
                  {checkInStep !== 'idle' && (
                    <div className="bg-white border-b border-slate-100 p-3 shrink-0 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visit Status Tracker</span>
                        </div>
                        <span className={cn(
                          "text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider leading-none",
                          checkInStep === 'checked_out' 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}>
                          {checkInStep === 'checked_out' ? "Completed ✅" : "Active Visit 📍"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[8px] font-black uppercase tracking-tight text-center">
                        {/* Step 1 */}
                        <div className="bg-slate-50 border border-slate-100/50 p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 text-slate-800">
                          <span className="text-[7px] text-slate-400 font-bold border-b border-dashed border-slate-200 pb-0.5 mb-0.5 w-full">Step 1</span>
                          <span className="flex items-center gap-0.5 text-emerald-600 font-black">
                            Check-in <Check className="w-2.5 h-2.5 p-0" />
                          </span>
                        </div>

                        {/* Step 2 (Tasks List) */}
                        <div className="bg-slate-50 border border-slate-100/50 p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5">
                          <span className="text-[7px] text-slate-400 font-bold border-b border-dashed border-slate-200 pb-0.5 mb-0.5 w-full">Step 2 (Tasks)</span>
                          {(() => {
                            const activeStep2Ids = (config.botQuickActions || []).filter(id => id !== 'audit' && id !== 'checkout');
                            const totalCount = activeStep2Ids.length;
                            if (totalCount === 0) {
                              return <span className="text-slate-400 font-bold italic">No Tasks</span>;
                            }
                            const completedCount = activeStep2Ids.filter(id => completedStep2ActionIds.includes(id)).length;
                            const isAllDone = completedCount === totalCount;
                            return (
                              <span className={cn("font-black flex items-center gap-0.5", isAllDone ? "text-emerald-600" : "text-blue-600")}>
                                {completedCount}/{totalCount} Done {isAllDone && <Check className="w-2.5 h-2.5" />}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-50 border border-slate-100/50 p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5">
                          <span className="text-[7px] text-slate-400 font-bold border-b border-dashed border-slate-200 pb-0.5 mb-0.5 w-full">Step 3</span>
                          {(() => {
                            const activeStep2Ids = (config.botQuickActions || []).filter(id => id !== 'audit' && id !== 'checkout');
                            const completedCount = activeStep2Ids.filter(id => completedStep2ActionIds.includes(id)).length;
                            const isCheckoutReady = activeStep2Ids.length === 0 || completedCount === activeStep2Ids.length;
                            
                            if (checkInStep === 'checked_out') {
                              return <span className="text-emerald-600 font-black flex items-center gap-0.5">Checked Out <Check className="w-2.5 h-2.5" /></span>;
                            }
                            return (
                              <span className={cn("font-black flex items-center gap-0.5", isCheckoutReady ? "text-slate-700 animate-pulse" : "text-slate-350")}>
                                {isCheckoutReady ? "Ready 🔓" : "Locked 🔒"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="py-4 space-y-4 flex flex-col items-center">
                        <div className="py-6 flex flex-col items-center text-center space-y-2 opacity-50">
                           <div className="w-14 h-14 rounded-[1.5rem] bg-blue-50 flex items-center justify-center">
                              <Sparkles className="w-7 h-7 text-blue-600 animate-pulse" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Predictive Assistant</p>
                              <p className="text-[10px] text-slate-500 px-6">Select a suggested action, try a config topic, or type below.</p>
                           </div>
                        </div>

                        {/* Custom dynamically populated FAQs from our JSON configuration */}
                        <div className="w-full bg-slate-50/50 rounded-2xl p-3 border border-slate-100/80 space-y-2 max-w-sm">
                          <p className="text-[8px] font-black tracking-widest uppercase text-slate-400">Ask the Bot (Configuration FAQs):</p>
                          <div className="flex flex-col gap-1.5">
                            {aiSmartBot.faqCatalog.map((faq, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  handleSendMessage(faq.question);
                                }}
                                className="w-full text-left text-[9px] font-extrabold text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 transition-all py-2 px-2.5 rounded-xl border border-slate-100 shadow-sm shrink-0"
                              >
                                💬 {faq.question}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm space-y-2",
                        msg.role === 'user' 
                          ? "bg-blue-600 text-white ml-auto rounded-tr-none" 
                          : "bg-white text-slate-700 border border-slate-100 mr-auto rounded-tl-none"
                      )}>
                        <div>{msg.text}</div>
                        {msg.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group">
                            <img 
                              src={msg.imageUrl} 
                              alt="Verified Check-in Photo" 
                              className="w-full h-28 object-cover object-center"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1.5 flex items-center justify-between text-[8px] text-white">
                              <span className="font-extrabold uppercase tracking-widest flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-blue-400" /> Bandra, Mumbai
                              </span>
                              <span className="bg-emerald-500 px-1.5 py-0.5 rounded text-[7px] font-black uppercase">Verified 100%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="bg-white border border-slate-100 text-slate-400 mr-auto rounded-2xl p-3 text-[10px] flex items-center gap-2 animate-pulse">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                         Processing Field Logic...
                      </div>
                    )}
                  </div>

                  {/* Quick Action Chips */}
                  <div className="p-4 bg-white border-t border-slate-100/50 shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Next Possible Actions</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                       {predictiveChips.map((chip) => {
                         const isCompleted = (chip as any).isCompleted;
                         const isDisabled = (chip as any).isDisabled;
                         return (
                           <button 
                             key={chip.label}
                             onClick={() => {
                               if (isDisabled) {
                                  handleSendMessage(chip.action); 
                                  return;
                               }
                               handleChipAction(chip);
                             }}
                             className={cn(
                               "flex items-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap transition-all border",
                               isCompleted 
                                 ? "bg-emerald-50 border-emerald-100 text-emerald-700 opacity-75" 
                                 : isDisabled 
                                   ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                   : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700 active:scale-95"
                             )}
                           >
                              {isCompleted ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : isDisabled ? (
                                <Lock className="w-3 h-3 text-slate-400" />
                              ) : (
                                <span className="text-blue-600">{chip.icon}</span>
                              )}
                              <span className={cn(
                                "text-[10px] font-black",
                                isCompleted ? "text-emerald-800 line-through decoration-emerald-400" : isDisabled ? "text-slate-400" : "text-slate-700"
                              )}>
                                {chip.label}
                              </span>
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                     <div className={cn(
                       "flex-1 bg-slate-50 rounded-2xl px-4 py-2 flex items-center border transition-all",
                       isVoiceActive ? "border-rose-300 bg-rose-50 ring-2 ring-rose-100" : "border-slate-100"
                     )}>
                        <textarea 
                          rows={1}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder={isVoiceRecording ? "Recording..." : isVoiceActive ? "Listening..." : "Type or use voice..."}
                          className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-800"
                        />
                        {config.features.voiceToText === true && (
                          <button 
                            onClick={() => toggleVoice(true)}
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all ml-2",
                              isVoiceActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                            )}
                          >
                             <Mic className="w-4 h-4" />
                          </button>
                        )}
                     </div>
                     <button 
                       onClick={() => handleSendMessage()}
                       disabled={isAiLoading || !inputMessage.trim()}
                       className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
                     >
                       <Send className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              )}

              {activeScreen === 'vision' && (
                <motion.div
                  key="vision"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col pt-3 px-4 pb-20 overflow-y-auto no-scrollbar space-y-5"
                >
                  <div className="text-center space-y-1">
                    <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center justify-center gap-1.5 leading-none">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                      Vision AI Retail Audit
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Real-time IR Recognition & SKU Verification
                    </p>
                  </div>

                  {/* Dynamic Vision AI telemetry powered by JSON */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-between text-[8px] font-mono leading-none text-slate-500">
                    <span>🎯 SIFT Threshold: <span className="text-blue-600 font-bold">{aiVisionShelf.configurations.siftThresholdPercent}%</span></span>
                    <span>💡 Min Light: <span className="text-amber-600 font-bold">{aiVisionShelf.configurations.minLightingLux} LUX</span></span>
                    <span>📐 Dev Tolerance: <span className="text-violet-600 font-bold">±{aiVisionShelf.configurations.maxAngleDegrees}°</span></span>
                  </div>

                  {/* STEP 1: Storefront Check-in Viewfinder & Shop Board Photo */}
                  <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">1</span>
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Storefront Check-in</h3>
                      </div>
                      {visionShopboardUrl ? (
                        <span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/15">
                          <Check className="w-2.5 h-2.5" /> GEOFENCE MATCHED
                        </span>
                      ) : (
                        <span className="bg-blue-50/50 text-blue-500 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border border-blue-100">
                          PENDING CAPTURE
                        </span>
                      )}
                    </div>

                    {/* Viewfinder Cam Feed */}
                    <div className="aspect-[16/10] bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800 group shadow-inner">
                      {visionShopboardUrl ? (
                        <img 
                          src={visionShopboardUrl} 
                          alt="Shop Board Live Feed" 
                          className="w-full h-full object-cover transition-all"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                             <Camera className="w-4 h-4 animate-pulse text-blue-500" />
                          </div>
                          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Camera Viewfinder Ready</p>
                          <p className="text-[6px] font-bold text-slate-500 uppercase max-w-[150px]">Tap "Take Photo" to activate full live camera screen</p>
                        </div>
                      )}
                      
                      {/* Scan / Align Grid Overlay */}
                      {!visionShopboardUrl && (
                        <>
                          <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                          <div className="absolute inset-2 border border-white/10 rounded-xl pointer-events-none flex items-center justify-center">
                            <div className="w-6 h-0.5 bg-blue-500/50" />
                            <div className="h-6 w-0.5 bg-blue-500/50 absolute" />
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-blue-500/60" />
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-blue-500/60" />
                            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-blue-500/60" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-blue-500/60" />
                          </div>
                          {/* Active sweeping laser */}
                          <motion.div 
                            animate={{ y: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/80 to-transparent shadow-[0_0_8px_#3b82f6] opacity-70"
                          />
                        </>
                      )}
                      
                      <div className="absolute bottom-3 left-3 bg-slate-900/90 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/10 text-white leading-none">
                        {visionShopboardUrl ? "Captured Storefront" : "Camera Viewfinder"}
                      </div>
                    </div>

                    {/* Shop Board Capture Button */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openCamera('vision-loc', 'shopboard')}
                        className={cn(
                          "flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-white cursor-pointer",
                          visionShopboardUrl ? "bg-slate-800" : "bg-blue-600"
                        )}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {visionShopboardUrl ? "Re-take" : "Take Photo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraPurpose('vision-loc');
                          setCameraStep('shopboard');
                          fileInputRef.current?.click();
                        }}
                        className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        Upload
                      </button>
                    </div>

                    {visionShopboardUrl && (
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1 text-slate-600 font-mono text-[8px]">
                        <p className="flex items-center gap-1.5"><span className="text-emerald-500">✔</span> Store Name: <b>{sampleVisionData.storeName}</b></p>
                        <p className="flex items-center gap-1.5"><span className="text-emerald-500">✔</span> Coordinates Match: <b>100% Verified (Bandra West)</b></p>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: SKU Audit and SKU photo */}
                  <div className={cn(
                    "bg-white rounded-[2rem] p-4 border shadow-sm space-y-3 transition-opacity duration-300",
                    visionShopboardUrl ? "opacity-100 border-slate-100" : "opacity-50 border-slate-100 pointer-events-none"
                  )}>
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">2</span>
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">SKU Display Image</h3>
                      </div>
                      {detectedSkuCount !== null ? (
                        <span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/15">
                          <Check className="w-2.5 h-2.5" /> AUDITED
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-400 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border border-slate-100">
                          {visionShopboardUrl ? "WAITING FOR SNAP" : "LOCKED"}
                        </span>
                      )}
                    </div>

                    {/* Viewfinder Sku Feed */}
                    <div className="aspect-[16/10] bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800 shadow-inner">
                      {visionSkuImageUrl ? (
                        <img 
                          src={visionSkuImageUrl} 
                          alt="SKUs Shelf" 
                          className="w-full h-full object-cover transition-all"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                             <Camera className="w-4 h-4 animate-pulse text-blue-500" />
                          </div>
                          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">SKU Sensor Ready</p>
                          <p className="text-[6px] font-bold text-slate-500 uppercase max-w-[150px]">Open camera view to perform real-time IR recognition</p>
                        </div>
                      )}
                      
                      {!visionSkuImageUrl && (
                        <>
                          <div className="absolute inset-0 bg-black/15" />
                          <div className="absolute inset-2 border border-white/10 rounded-xl pointer-events-none flex items-center justify-center">
                            <div className="w-6 h-0.5 bg-blue-500/40" />
                            <div className="h-6 w-0.5 bg-blue-500/40 absolute" />
                          </div>
                        </>
                      )}

                      <div className="absolute bottom-3 left-3 bg-slate-900/90 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/10 text-white leading-none">
                        Shelf Image
                      </div>
                    </div>

                    {/* Sku Image Capture Button */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openCamera('vision-loc', 'allSkus')}
                        className={cn(
                          "flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-white cursor-pointer",
                          detectedSkuCount !== null ? "bg-slate-800" : "bg-blue-600"
                        )}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {detectedSkuCount !== null ? "Re-take SKU Image" : "Take SKU Image"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraPurpose('vision-loc');
                          setCameraStep('allSkus');
                          fileInputRef.current?.click();
                        }}
                        className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        Upload
                      </button>
                    </div>

                    {/* DISPLAY SKU COUNT RESULTS WHEN TAKEN */}
                    {detectedSkuCount !== null && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl space-y-4"
                      >
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-wider text-blue-500">Live Item recognition output</p>
                          <div className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-full px-5 py-2 shadow-md">
                            <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
                            <span className="text-sm font-black tracking-tight">
                              {shelfSkuCounts['dove-soap'] + shelfSkuCounts['dove-shampoo'] + shelfSkuCounts['lux-soap'] + shelfSkuCounts['lifebuoy-wash']} Total SKUs
                            </span>
                          </div>
                          <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest pt-1">
                            Accuracy rating: <b>{sampleVisionData.compliance}%</b> (Optimal Display Density)
                          </p>
                        </div>

                        {/* Brand Distribution Graph / Badges */}
                        <div className="space-y-2 pt-1 border-t border-blue-100/40">
                          <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest">Brand Distributions</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-2 rounded-xl border border-blue-50/60 text-center">
                              <p className="text-[7px] font-black text-slate-400 uppercase">Dove</p>
                              <p className="text-xs font-black text-blue-600">{shelfSkuCounts['dove-soap'] + shelfSkuCounts['dove-shampoo']} SKUs</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-blue-50/60 text-center">
                              <p className="text-[7px] font-black text-slate-400 uppercase">Lux</p>
                              <p className="text-xs font-black text-blue-600">{shelfSkuCounts['lux-soap']} SKUs</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-blue-50/60 text-center">
                              <p className="text-[7px] font-black text-slate-400 uppercase">Lifebuoy</p>
                              <p className="text-xs font-black text-blue-600">{shelfSkuCounts['lifebuoy-wash']} SKUs</p>
                            </div>
                          </div>
                        </div>

                        {/* Inventory Warnings */}
                        <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                          <p className="text-[7.5px] font-black text-rose-600 uppercase tracking-wider mb-2">⚠️ OUT-OF-STOCK VERIFICATIONS</p>
                          <div className="flex flex-wrap gap-1">
                            {sampleVisionData.outOfStock.map(s => (
                              <span key={s} className="bg-white text-rose-700 px-2 py-0.5 rounded text-[7px] font-extrabold border border-rose-100/50 leading-tight">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Reset Audit and Continue Button */}
                  {(visionShopboardUrl || detectedSkuCount !== null) && (
                    <button 
                      onClick={() => {
                        setVisionShopboardUrl(null);
                        setVisionSkuImageUrl(null);
                        setDetectedSkuCount(null);
                      }}
                      className="w-full py-3.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] active:scale-95 transition-all text-center"
                    >
                      Reset Audit
                    </button>
                  )}
                </motion.div>
              )}

              {activeScreen === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 space-y-6"
                >
                   {/* AI Status Summary */}
                   <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-10">
                         <LayoutDashboard className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 flex flex-col h-full">
                         <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                               <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">AI Daily Report</span>
                         </div>
                         <h3 className="text-xl font-black italic tracking-tight leading-tight mb-4">"{stats.summary}"</h3>
                         
                         <div className="grid grid-cols-2 gap-4 mt-auto">
                            {stats.stats.map(stat => (
                              <div key={stat.label} className="bg-white/5 p-3 rounded-2xl backdrop-blur-md">
                                 <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1">{stat.label}</p>
                                 <p className="text-lg font-black text-white leading-none">{stat.value}</p>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Field Insights */}
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Critical Insights</h4>
                      {stats.insights.map((insight, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-4 shadow-sm">
                           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mt-1 shrink-0">
                              <Layers className="w-4 h-4 text-blue-600" />
                           </div>
                           <p className="text-xs font-semibold text-slate-700 leading-relaxed">{insight}</p>
                        </div>
                      ))}
                   </div>

                   {/* Log Timeline */}
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Engagement Timeline</h4>
                      <div className="space-y-3">
                        {logs.slice().reverse().slice(0, 5).map((log) => (
                          <div key={log.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                             <div className={cn(
                               "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                               log.type === 'vision' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                             )}>
                                {log.type === 'vision' ? <Camera className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                             </div>
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-800 leading-none mb-1">{log.summary}</p>
                                <p className="text-[8px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                          </div>
                        ))}
                      </div>
                   </div>
                </motion.div>
              )}



              {activeScreen === 'planner' && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 space-y-4 h-full flex flex-col"
                >
                   {/* Main Journey Header & Dynamic Fleet Stats */}
                   <div className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm space-y-3 shrink-0">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                              <Navigation className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase">AI Route Optimizer</span>
                         </div>
                         <span className="text-[8px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                           {routeMetrics.computationTimeMs ? `${routeMetrics.computationTimeMs}ms` : '312ms'}
                         </span>
                      </div>
                      
                      <div>
                         <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2 mb-2 font-sans text-slate-800">
                           <div className="flex justify-between items-start">
                             <div className="min-w-0">
                               <span className="text-[7.5px] font-black tracking-widest text-slate-400 uppercase block leading-none">Active GPS Reference Location</span>
                               <p className="text-xs font-black text-slate-700 truncate leading-tight mt-1">{userLocation.label}</p>
                               <span className="text-[8px] font-mono text-indigo-500 mt-0.5 block font-bold">📍 ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})</span>
                             </div>
                             <button
                               type="button"
                               onClick={() => {
                                 if (navigator.geolocation) {
                                   navigator.geolocation.getCurrentPosition(
                                     (position) => {
                                       const { latitude, longitude } = position.coords;
                                       const newLoc = {
                                         lat: Number(latitude.toFixed(4)),
                                         lng: Number(longitude.toFixed(4)),
                                         label: `Live GPS Location`,
                                         isReal: true
                                       };
                                       setUserLocation(newLoc);
                                       updateRouteWithNewLocation(newLoc.lat, newLoc.lng, routeStops);
                                     },
                                     (err) => {
                                       alert("Auto GPS blocked/unavailable in iframe. Test route refresh with the Simulated presets below!");
                                     }
                                   );
                                 }
                               }}
                               className="p-1.5 text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
                               title="Trigger Geolocation Refresh"
                             >
                               <RefreshCcw className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </div>
                         <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">Territory Routing</h3>
                         <p className="text-[10px] font-bold text-blue-600 mt-1">
                           ✨ {routeMetrics.distanceSavedKm}km saved today using fleet optimization
                         </p>
                      </div>

                      {/* Visited Progress Tracker */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-wider">
                          <span>Progress Tracker</span>
                          <span>{routeStops.filter(s => s.status === 'COMPLETED').length} / {routeStops.length} Visited</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <motion.div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full"
                            animate={{ width: `${routeStops.length ? (routeStops.filter(s => s.status === 'COMPLETED').length / routeStops.length) * 100 : 0}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                   </div>

                   {/* Master Optimizer and Adder Action bar */}
                   <div className="flex gap-2 shrink-0">
                      <button
                        onClick={handleRunAIExtendedOptimizer}
                        disabled={isOptimizationRunning}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 relative shadow-md"
                      >
                         {isOptimizationRunning ? (
                           <>
                             <RefreshCcw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                             <span>Calculating Sequence...</span>
                           </>
                         ) : (
                           <>
                             <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                             <span>Run AI Optimization</span>
                           </>
                         )}
                      </button>

                      <button
                        onClick={() => setIsAddingStop(!isAddingStop)}
                        className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors active:scale-95"
                        title="Add Custom Store Visit"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>

                   {/* "Add Custom Store" Drawer / Panel */}
                   <AnimatePresence>
                     {isAddingStop && (
                       <motion.form
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         onSubmit={handleAddStop}
                         className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 shadow-inner space-y-3 shrink-0 overflow-hidden"
                       >
                         <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Configure New Visit</span>
                           <button type="button" onClick={() => setIsAddingStop(false)} className="text-slate-400 hover:text-slate-600">
                             <X className="w-3.5 h-3.5" />
                           </button>
                         </div>

                         <div className="space-y-2">
                           <input
                             type="text"
                             placeholder="Store Name (e.g. Spar Metro Elite)"
                             value={newStoreName}
                             onChange={(e) => setNewStoreName(e.target.value)}
                             required
                             className="w-full text-xs p-2 bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                           />
                           <input
                             type="text"
                             placeholder="Street Address, Sector/Suburb"
                             value={newAddress}
                             onChange={(e) => setNewAddress(e.target.value)}
                             className="w-full text-[10px] p-2 bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium"
                           />
                           
                           <div className="grid grid-cols-2 gap-2">
                             <div>
                               <label className="text-[8px] font-bold text-slate-400 uppercase">Store Latitude & Longitude</label>
                               <div className="grid grid-cols-2 gap-1.5 mt-1">
                                 <input
                                   type="number"
                                   step="0.0001"
                                   value={newLat}
                                   onChange={(e) => setNewLat(Number(e.target.value))}
                                   className="w-full text-[11px] p-1.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 font-mono font-bold"
                                   placeholder="Lat"
                                 />
                                 <input
                                   type="number"
                                   step="0.0001"
                                   value={newLng}
                                   onChange={(e) => setNewLng(Number(e.target.value))}
                                   className="w-full text-[11px] p-1.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 font-mono font-bold"
                                   placeholder="Lng"
                                 />
                                </div>
                                <div className="mt-1 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100 flex justify-between items-center">
                                  <span className="text-[7.5px] font-black text-blue-500 uppercase leading-none">Simulated Distance from active location</span>
                                  <span className="text-[10px] font-black text-slate-700 font-mono shrink-0">
                                    {newDistance ? `${newDistance.toFixed(2)} KM` : 'Calculating...'}
                                  </span>
                                </div>
                             </div>
                             <div>
                               <label className="text-[8px] font-bold text-slate-400 uppercase">Est. Minutes Visit</label>
                               <input
                                 type="number"
                                 min="5"
                                 value={newDuration}
                                 onChange={(e) => setNewDuration(Number(e.target.value))}
                                 className="w-full text-xs p-1.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 font-mono"
                               />
                             </div>
                           </div>
                         </div>

                         <button
                           type="submit"
                           className="w-full py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-700"
                         >
                           Add Store to Route Plan
                         </button>
                       </motion.form>
                     )}
                   </AnimatePresence>

                   {/* Action buttons (Add, Generate) */}

                   {/* Stateful Sequence Timeline */}
                   <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                      {routeStops.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">No stores on active route</p>
                          <p className="text-[10px] text-slate-500 mt-1">Click '+' to design custom visits</p>
                        </div>
                      ) : (
                        routeStops.map((stop, idx) => {
                          const isEditing = editingStopId === stop.id;
                          return (
                            <div key={stop.id} className="flex gap-3 bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                               {/* Timeline status balls */}
                               <div className="flex flex-col items-center shrink-0 pt-1">
                                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all bg-white border-slate-200">
                                    <button 
                                      onClick={() => {
                                        const cycles: Record<typeof stop.status, typeof stop.status> = {
                                          'PENDING': 'CURRENT',
                                          'CURRENT': 'COMPLETED',
                                          'COMPLETED': 'PENDING'
                                        };
                                        handleUpdateStatus(stop.id, cycles[stop.status]);
                                      }}
                                      title="Toggle status cycle"
                                      className={cn(
                                        "w-2.5 h-2.5 rounded-full transition-all",
                                        stop.status === 'COMPLETED' ? "bg-blue-600" :
                                        stop.status === 'CURRENT' ? "bg-amber-500 scale-110 animate-pulse" :
                                        "bg-slate-200"
                                      )}
                                    />
                                  </div>
                                  {idx < routeStops.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1 min-h-[30px]" />}
                               </div>

                               <div className="flex-1 min-w-0">
                                 {isEditing ? (
                                   /* Inline Store Editor */
                                   <div className="space-y-2 p-1">
                                     <div className="flex justify-between items-center">
                                       <span className="text-[8px] font-black text-blue-600 uppercase">Edit Stop Store Info</span>
                                       <span className="text-[8px] font-mono text-slate-400">ID: {stop.id.slice(0, 8)}</span>
                                     </div>
                                     <input
                                       type="text"
                                       value={editStoreName}
                                       onChange={(e) => setEditStoreName(e.target.value)}
                                       className="w-full text-xs font-bold p-1 border rounded"
                                     />
                                     <input
                                       type="text"
                                       value={editAddress}
                                       onChange={(e) => setEditAddress(e.target.value)}
                                       className="w-full text-[9px] font-medium p-1 border rounded text-slate-500"
                                     />
                                     <div className="grid grid-cols-2 gap-2">
                                       <div>
                                         <label className="text-[7px] font-bold text-slate-400 uppercase">Latitude</label>
                                         <input
                                           type="number"
                                           step="0.0001"
                                           value={editLat}
                                           onChange={(e) => setEditLat(Number(e.target.value))}
                                           className="w-full text-[10px] p-1 font-mono border rounded font-bold"
                                         />
                                       </div>
                                       <div>
                                         <label className="text-[7px] font-bold text-slate-400 uppercase">Longitude</label>
                                         <input
                                           type="number"
                                           step="0.0001"
                                           value={editLng}
                                           onChange={(e) => setEditLng(Number(e.target.value))}
                                           className="w-full text-[10px] p-1 font-mono border rounded font-bold"
                                         />
                                       </div>
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 mt-1">
                                       <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded flex flex-col justify-center">
                                         <span className="text-[7px] font-bold text-indigo-500 block leading-none uppercase">Distance</span>
                                         <span className="text-xs font-black font-mono text-slate-800 mt-1">
                                            {calculateDistance(userLocation.lat, userLocation.lng, Number(editLat), Number(editLng))} KM
                                         </span>
                                       </div>
                                       <div>
                                         <label className="text-[7px] font-bold text-slate-400 uppercase">Est Min</label>
                                         <input
                                           type="number"
                                           value={editDuration}
                                           onChange={(e) => setEditDuration(Number(e.target.value))}
                                           className="w-full text-[10px] p-1 font-mono border rounded font-bold"
                                         />
                                       </div>
                                     </div>
                                     <div className="flex gap-1.5 pt-1">
                                       <button
                                         onClick={() => handleSaveEdit(stop.id)}
                                         className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[8px] font-black uppercase"
                                       >
                                         Apply Changes
                                       </button>
                                       <button
                                         onClick={() => setEditingStopId(null)}
                                         className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase"
                                       >
                                         Cancel
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                   /* Default Render Layout */
                                   <div>
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                         <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[9px] font-black text-slate-400">{stop.time}</span>
                                            <span className={cn(
                                              "text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none",
                                              stop.status === 'COMPLETED' ? "bg-blue-50 text-blue-600" :
                                              stop.status === 'CURRENT' ? "bg-amber-50 text-amber-600 animate-pulse" :
                                              "bg-slate-100 text-slate-400"
                                            )}>
                                              {stop.status}
                                            </span>
                                            {stop.distanceFromHubKm > 0 && (
                                              <span className="text-[8px] font-mono font-semibold text-indigo-500 bg-indigo-50/50 px-1 rounded">
                                                {stop.distanceFromHubKm} km
                                              </span>
                                            )}
                                         </div>

                                         {/* Dropdown Action tools inline */}
                                         <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => handleStartEdit(stop)}
                                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                              title="Edit store"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteStop(stop.id)}
                                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                              title="Remove visit"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                         </div>
                                      </div>

                                      <p className={cn(
                                        "text-xs font-black tracking-tight",
                                        stop.status === 'CURRENT' ? "text-blue-600" : "text-slate-700"
                                      )}>
                                        {stop.storeName}
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-0.5">{stop.address}</p>
                                      
                                      <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                                            Seq #{stop.optimizedIndex || idx + 1}
                                          </span>
                                          <span className="text-[8px] font-semibold text-slate-500 font-mono">
                                            ⏱️ {stop.estimatedDurationMinutes}m visit
                                          </span>
                                        </div>
                                        <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-50/20 px-1 rounded">
                                          📍 {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                        </span>
                                      </div>
                                   </div>
                                 )}
                               </div>
                            </div>
                          );
                        })
                      )}
                   </div>
                </motion.div>
              )}

              {activeScreen === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 space-y-6"
                >
                   <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                            <UserCircle className="w-6 h-6" />
                         </div>
                         <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Agent Performance</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Rank #42 Region South</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Target Progress</p>
                               <p className="text-3xl font-black italic tracking-tighter">84.2%</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-bold text-white/50 uppercase">Days Left</p>
                               <p className="text-sm font-black">12</p>
                            </div>
                         </div>
                         <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: "84.2%" }}
                               className="h-full bg-blue-500 rounded-full" 
                            />
                         </div>
                      </div>

                      {[
                        { label: 'Visits Today', val: '12/15', color: 'blue' },
                        { label: 'Orders Value', val: '$4,280', color: 'emerald' },
                        { label: 'Distance', val: '24.5km', color: 'orange' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                           <span className={cn("text-sm font-black italic", `text-${stat.color}-600`)}>{stat.val}</span>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}

              {activeScreen === 'stock' && (
                <motion.div
                  key="stock"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 space-y-6"
                >
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Stock Radar</h3>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse">
                         <Radar className="w-4 h-4" />
                      </div>
                   </div>

                   <div className="relative">
                     <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                       <Search className="h-4 w-4 text-slate-400" />
                     </div>
                     <input
                       type="text"
                       placeholder="Search products by SKU name..."
                       value={stockSearchQuery}
                       onChange={(e) => setStockSearchQuery(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                     />
                   </div>

                     <div className="space-y-4">
                      {orderProducts
                         .filter((prod) => 
                           (prod.name?.toLowerCase() || '').includes((stockSearchQuery || '').toLowerCase()) ||
                           (prod.stockStatus?.toLowerCase() || '').includes((stockSearchQuery || '').toLowerCase()) ||
                           (prod.id?.toLowerCase() || '').includes((stockSearchQuery || '').toLowerCase())
                         )
                         .map((prod, i) => {
                        const count = shelfSkuCounts[prod.id] !== undefined ? shelfSkuCounts[prod.id] : 0;
                        const bgLine = prod.stockStatus === 'Critical OOS' ? 'bg-red-500/20' : (prod.stockStatus === 'Low' ? 'bg-orange-500/20' : 'bg-emerald-500/20');
                        const bgBadge = prod.stockStatus === 'Critical OOS' ? 'bg-red-500' : (prod.stockStatus === 'Low' ? 'bg-orange-500' : 'bg-emerald-500');
                        
                        return (
                        <div key={prod.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                           <div className={cn("w-2 h-12 rounded-full", bgLine)} />
                           <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800 leading-tight">{prod.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className={cn("text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-full", bgBadge)}>
                                   {prod.stockStatus}
                                 </span>
                                 <span className="text-[8px] font-bold text-slate-400">{count} Units In-Store</span>
                              </div>
                           </div>
                           <button className="p-2 rounded-xl bg-slate-50 text-slate-400">
                              <Search className="w-4 h-4" />
                           </button>
                        </div>
                        )
                      })}
                   </div>
                </motion.div>
              )}

              {activeScreen === 'quiz' && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="p-5 space-y-5 flex flex-col h-full overflow-y-auto no-scrollbar pb-24 font-sans text-slate-800"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                          <span className="text-blue-600 font-extrabold uppercase animate-pulse">AI Field Quiz</span>
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adaptable Cognitive Check</p>
                     </div>
                     <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                        <Brain className="w-5 h-5 animate-pulse" />
                     </div>
                  </div>

                  {/* Dynamic UI based on state */}
                  {quizState === 'idle' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5 flex-1 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-black text-slate-800 tracking-tight">Adaptive Testing Engine</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                            Our AI scans your recent on-site operations to construct custom test cases based on your actual work history!
                          </p>
                        </div>

                        {/* Summary of User Profile History */}
                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Identified learning patterns</p>
                          <div className="space-y-1 text-[10px] text-slate-600 font-bold">
                            {logs.length > 0 ? (
                              <>
                                <p className="flex items-center gap-1.5"><span className="text-blue-500">✔</span> Active logs detected ({logs.length} operations)</p>
                                <p className="flex items-center gap-1.5"><span className="text-blue-500">✔</span> Focus Area: Order compliance & stock math</p>
                                <p className="flex items-center gap-1.5"><span className="text-emerald-500">✔</span> Pattern: Visual shelf accuracy</p>
                              </>
                            ) : (
                              <>
                                <p className="flex items-center gap-1.5 text-slate-400"><span className="text-slate-300">●</span> No past logs: Merchandising rookie profile activated</p>
                                <p className="flex items-center gap-1.5"><span className="text-blue-500">✔</span> Recommended: Core field force terminology quiz</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleTriggerQuizGeneration}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 mt-4"
                      >
                        <Brain className="w-4 h-4 text-blue-400" />
                        Generate Quiz Scenarios
                      </button>
                    </motion.div>
                  )}

                  {quizState === 'generating' && (
                    <motion.div 
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-[320px] flex flex-col items-center justify-center space-y-6 text-center"
                    >
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="w-14 h-14 rounded-full border-4 border-blue-500/10 border-t-blue-600 flex items-center justify-center"
                      >
                        <Brain className="w-6 h-6 text-blue-600" />
                      </motion.div>
                      
                      <div className="space-y-2 max-w-[220px]">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-800 animate-pulse">Personalizing questions...</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          Scanning local logs, stock levels, and SIFT display accuracy coefficients
                        </p>
                      </div>

                      <div className="w-full max-w-[180px] h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.8 }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                    </motion.div>
                  )}

                  {quizState === 'active' && quizQuestions.length > 0 && (
                    <motion.div 
                      className="space-y-4"
                    >
                      {/* Progress bar */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                        <span className="text-[10px] font-black text-blue-600 italic">Question {quizCurrentIndex + 1} of {quizQuestions.length}</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-3">
                          <div 
                            style={{ width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%` }}
                            className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                          />
                        </div>
                      </div>

                      {/* Question Frame */}
                      <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl border border-white/5 space-y-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 text-[7px] font-black bg-blue-50/20 text-blue-400 rounded-full uppercase">AI Segment match</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h4 className="text-xs font-bold leading-relaxed tracking-tight text-slate-100">
                          {quizQuestions[quizCurrentIndex].question}
                        </h4>
                      </div>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {quizQuestions[quizCurrentIndex].options.map((option, isIdx) => {
                          const isSelected = quizSelectedOption === isIdx;
                          const isCorrect = quizQuestions[quizCurrentIndex].correctAnswerIndex === isIdx;
                          const hasAnswered = quizSelectedOption !== null;
                          
                          let cardStyle = "bg-white border-slate-100 text-slate-700 hover:bg-slate-50";
                          if (hasAnswered) {
                            if (isCorrect) {
                              cardStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-100";
                            } else if (isSelected) {
                              cardStyle = "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-100";
                            } else {
                              cardStyle = "bg-slate-50 border-slate-100/50 text-slate-400 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={isIdx}
                              disabled={hasAnswered}
                              onClick={() => {
                                setQuizSelectedOption(isIdx);
                                if (isCorrect) {
                                  setQuizScore(prev => prev + 1);
                                }
                              }}
                              className={cn(
                                "w-full p-4 rounded-2xl border text-left text-[11px] font-bold leading-tight transition-all active:scale-98 flex items-center justify-between",
                                cardStyle
                              )}
                            >
                              <span>{option}</span>
                              {hasAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {hasAnswered && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* AI Explainer Box (Displays post selection) */}
                      {quizSelectedOption !== null && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-1.5 text-slate-800"
                        >
                          <div className="flex items-center gap-1.5 text-blue-800">
                            <Brain className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
                            <span className="text-[8px] font-black uppercase tracking-widest">AI Feedback</span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-600 leading-normal">
                            {quizQuestions[quizCurrentIndex].explanation}
                          </p>

                          <button
                            onClick={handleNextQuizQuestion}
                            className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black tracking-widest uppercase active:scale-95 transition-all text-center"
                          >
                            {quizCurrentIndex < quizQuestions.length - 1 ? "Next Question" : "Complete Quiz"}
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {quizState === 'completed' && (
                    <motion.div 
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 m-auto flex items-center justify-center border border-emerald-100 shadow-sm">
                        <Check className="w-8 h-8 font-black" />
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black text-slate-800 tracking-tight">Quiz Complete!</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom learning loop success</p>
                      </div>

                      {/* Score metrics */}
                      <div className="grid grid-cols-2 gap-3 py-1 text-left">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Accuracy score</p>
                          <p className="text-lg font-black text-slate-800">{quizScore} <span className="text-slate-400">/ {quizQuestions.length}</span></p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Awarded reward</p>
                          <p className="text-lg font-black text-emerald-500 italic font-mono">+150 XP</p>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 text-left space-y-1">
                        <p className="text-[8px] font-black text-blue-800 uppercase tracking-widest">Coaching Diagnosis</p>
                        <p className="text-[9.5px] font-semibold text-slate-600 leading-normal">
                          {quizScore === quizQuestions.length 
                            ? "Excellent performance! Your planogram compliance math and share-of-shelf principles are top notch. Check performance rank boosts!" 
                            : "Solid progress. We recommend keeping an eye on OOS stock thresholds and using the order optimizer suggest feature to eliminate inventory holes."}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setQuizState('idle');
                            setQuizCurrentIndex(0);
                            setQuizScore(0);
                            setQuizSelectedOption(null);
                          }}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all font-sans"
                        >
                          Retake
                        </button>
                        <button
                          onClick={() => {
                            setActiveScreen('home');
                          }}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-blue-500/10 font-sans"
                        >
                          Return Home
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeScreen === 'order' && (
                <motion.div
                  key="order"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 space-y-5 flex flex-col h-full overflow-y-auto no-scrollbar pb-24"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Book Order</h3>
                      <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mt-1">AI Automated Suggested Replenishment</p>
                    </div>
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-md shadow-blue-500/10">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </div>

                  {bookedReceipt ? (
                    /* Receipt / Confirmed Order Success View */
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2rem] p-6 border border-emerald-100 shadow-xl space-y-6 text-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Check className="w-32 h-32 text-emerald-600" />
                      </div>
                      
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-100">
                        <Check className="w-8 h-8 stroke-[3]" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-800 tracking-tight">Order Placed Successfully!</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Receipt reference: {bookedReceipt.orderId}</p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Total Quantities booked:</span>
                          <span className="text-slate-800">{bookedReceipt.totalUnits} Units</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Best Scheme Savings:</span>
                          <span className="text-emerald-600">Saved {bookedReceipt.totalBenefitPercent}%</span>
                        </div>
                        <div className="h-px bg-slate-200 border-dashed" />
                        <div className="flex justify-between items-center font-black">
                          <span className="text-xs text-slate-800">Total Order Value:</span>
                          <span className="text-sm text-blue-600">${bookedReceipt.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-left">
                        <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-tight leading-snug">
                          SENT TO SOUTH DISTRIBUTOR FOR EXPRESS DISPATCH
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setBookedReceipt(null);
                          setOrderProducts(prev => prev.map(p => ({ ...p, qty: 0 })));
                        }}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-md shadow-slate-950/10"
                      >
                        🛒 Start New Booking
                      </button>
                    </motion.div>
                  ) : (
                    /* Booking Form and Suggestions */
                    <>
                      {/* Top Insights Panel */}
                      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border border-emerald-500/15 rounded-[2rem] p-5 space-y-3.5 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Replenishment insights</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/15 flex flex-col justify-between">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Warnings</span>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className="text-base font-black text-red-600 leading-none">1</span>
                              <span className="text-[8px] font-black text-slate-500 uppercase">SKU Out-Of-Stock</span>
                            </div>
                            <span className="text-[7.5px] font-bold text-slate-400 mt-1">Dove Beauty Bar is OOS</span>
                          </div>
                          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/15 flex flex-col justify-between">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Suggested Order</span>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className="text-base font-black text-blue-600 leading-none">40</span>
                              <span className="text-[8px] font-black text-slate-500 uppercase">Total Units</span>
                            </div>
                            <span className="text-[7.5px] font-bold text-slate-400 mt-1">Ready for auto-fill below</span>
                          </div>
                        </div>
                        <p className="text-[8.5px] font-black text-slate-500 leading-normal flex items-start gap-1">
                          <span className="text-emerald-500">💡</span>
                          <span>Fill OOS items now to unlock up to <b>18% in Scheme Discounts</b> instantly. This store has <b>94% Compliance potential</b>.</span>
                        </p>
                      </div>

                      {/* Suggesion Box based on History (OOS Last Month) */}
                      <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
                          <Calendar className="w-24 h-24" />
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Past History Insight</span>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-sm font-black italic tracking-tight">"Last month order went Out of Stock..."</h4>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-[280px]">
                              Dove Soap and Dove Shampoo were <span className="text-red-400 font-black uppercase">OOS</span> last month. It is now time for the monthly replenishment. We suggest ordering replenishment units.
                            </p>
                          </div>

                          <div className="flex gap-2.5 pt-1">
                            <button
                              onClick={handleApplySuggestions}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 font-extrabold text-[9px] text-white uppercase tracking-widest py-2.5 px-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              💡 Apply Suggestions ({orderProducts.filter(p => p.suggestedQty > 0).length} SKUs)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Products Ordering List */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Catalog</h4>
                          <span className="text-[9px] font-bold text-slate-500">{orderProducts.length} SKUs</span>
                        </div>

                        {orderProducts.map((product) => {
                          // Find best scheme (highest benefit value)
                          const bestScheme = product.schemes.length > 0 
                            ? [...product.schemes].sort((a, b) => b.benefitPercent - a.benefitPercent)[0]
                            : null;
                          
                          return (
                            <div 
                              key={product.id} 
                              className={cn(
                                "bg-white p-4 rounded-3xl border transition-all shadow-sm flex flex-col gap-3",
                                product.qty > 0 ? "border-blue-200 ring-2 ring-blue-500/5 bg-blue-50/10" : "border-slate-100"
                              )}
                            >
                              {/* Product Meta Info Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={cn(
                                      "px-2 py-0.5 text-[8px] font-black uppercase rounded-full tracking-wide",
                                      product.stockStatus === 'Critical OOS' ? "bg-red-50 text-red-600 border border-red-100" :
                                      product.stockStatus === 'Low' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                      "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    )}>
                                      {product.stockStatus === 'Critical OOS' ? '🚫 Out-of-stock' : product.stockStatus}
                                    </span>
                                    
                                    {product.lastMonthOos && (
                                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                        📅 Re-order alert
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-xs font-black text-slate-800 tracking-tight leading-tight">{product.name}</h5>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1">Price per unit: <b className="text-slate-700">${product.price.toFixed(2)}</b> • Last month Qty: {product.lastOrderQty} units</p>
                                </div>

                                {/* Quantity Adjuster Widget */}
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl shrink-0 border border-slate-100">
                                  <button
                                    onClick={() => {
                                      setOrderProducts(prev => prev.map(p => {
                                        if (p.id === product.id) {
                                          return { ...p, qty: Math.max(0, p.qty - 1) };
                                        }
                                        return p;
                                      }));
                                    }}
                                    className="w-6 h-6 rounded-xl bg-white flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 active:scale-90 transition-all font-bold text-xs"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={product.qty <= 0 ? "" : product.qty}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                      const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
                                      setOrderProducts(prev => prev.map(p => {
                                        if (p.id === product.id) {
                                          return { ...p, qty: isNaN(num) ? 0 : Math.max(0, num) };
                                        }
                                        return p;
                                      }));
                                    }}
                                    className="text-[11px] font-extrabold text-slate-800 w-8 bg-white border border-slate-200 rounded-lg text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-0.5"
                                  />
                                  <button
                                    onClick={() => {
                                      setOrderProducts(prev => prev.map(p => {
                                        if (p.id === product.id) {
                                          return { ...p, qty: p.qty + 1 };
                                        }
                                        return p;
                                      }));
                                    }}
                                    className="w-6 h-6 rounded-xl bg-white flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 active:scale-90 transition-all font-bold text-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Schemes list container */}
                              {product.schemes.length > 0 && product.qty > 0 && (
                                <div className="space-y-1.5 mt-1 pt-2.5 border-t border-slate-100/80">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Available Schemes (Best Auto-Selected)</span>
                                    {bestScheme && (
                                      <span className="text-[8px] font-black text-emerald-600 flex items-center gap-0.5">
                                        ⭐ Best option: {bestScheme.benefitPercent}% value
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {product.schemes.map((sch) => {
                                      const isBestScheme = bestScheme?.id === sch.id;
                                      const isSelected = product.selectedSchemeId === sch.id;
                                      
                                      return (
                                        <button
                                          key={sch.id}
                                          onClick={() => {
                                            setOrderProducts(prev => prev.map(p => {
                                              if (p.id === product.id) {
                                                return { ...p, selectedSchemeId: sch.id };
                                              }
                                              return p;
                                            }));
                                          }}
                                          className={cn(
                                            "flex items-center justify-between p-2 rounded-xl text-left border text-[9px] transition-all",
                                            isSelected 
                                              ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                                              : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                                          )}
                                        >
                                          <div className="flex items-center gap-1.5">
                                             <div className={cn(
                                               "w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-bold shrink-0",
                                               isSelected 
                                                 ? "bg-blue-500 border-blue-500 text-white" 
                                                 : "border-slate-300"
                                             )}>
                                               {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                             </div>
                                             <div>
                                               <span className="font-extrabold">{sch.name}</span>
                                               <p className={cn("text-[7px] font-medium leading-none mt-0.5", isSelected ? "text-slate-300" : "text-slate-400")}>{sch.description}</p>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                             {isBestScheme && (
                                               <span className="bg-emerald-500 text-white font-black uppercase text-[6px] tracking-wider px-1.5 py-0.5 rounded-full">
                                                 Best Scheme
                                               </span>
                                             )}
                                             <span className={cn("font-black text-[9px]", isSelected ? "text-blue-400" : "text-slate-700")}>
                                               -{sch.benefitPercent}%
                                             </span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Checkout/Booking total section */}
                      {orderProducts.some(p => p.qty > 0) && (
                        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Summary</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded-full">
                              {orderProducts.reduce((acc, curr) => acc + curr.qty, 0)} Items Added
                            </span>
                          </div>

                          <div className="space-y-2 text-xs font-bold text-slate-500">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="text-slate-800">
                                ${orderProducts.reduce((acc, curr) => acc + (curr.price * curr.qty), 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Scheme Benefits (Weighted):</span>
                              <span className="text-emerald-600">
                                -${orderProducts.reduce((acc, curr) => {
                                  if (curr.qty === 0 || !curr.selectedSchemeId) return acc;
                                  const selected = curr.schemes.find(s => s.id === curr.selectedSchemeId);
                                  if (!selected) return acc;
                                  return acc + (curr.price * curr.qty * selected.benefitPercent / 100);
                                }, 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div className="flex justify-between items-center font-black text-slate-800 pt-1">
                              <span>Estimated Payable:</span>
                              <span className="text-base text-blue-600">
                                ${orderProducts.reduce((acc, curr) => {
                                  const sub = curr.price * curr.qty;
                                  if (curr.qty === 0 || !curr.selectedSchemeId) return acc + sub;
                                  const selected = curr.schemes.find(s => s.id === curr.selectedSchemeId);
                                  if (!selected) return acc + sub;
                                  return acc + (sub - (sub * selected.benefitPercent / 100));
                                }, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setIsOrderBookingConfirmOpen(true)}
                            className="w-full bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4 fill-white" /> Book Order
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* YES / NO Dialog confirm Overlay */}
                  <AnimatePresence>
                    {isOrderBookingConfirmOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsOrderBookingConfirmOpen(false)}
                          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[2000]"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 30 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 30 }}
                          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] bg-white rounded-[2.5rem] p-6 shadow-2xl z-[2001] border border-slate-100 flex flex-col space-y-5"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <ShoppingCart className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-800 leading-none">Confirm Booking?</h4>
                                <p className="text-[7px] font-extrabold text-blue-500 uppercase tracking-widest leading-none mt-1">{sampleVisionData.storeName}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsOrderBookingConfirmOpen(false)}
                              className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                              Do you want to book this replenishment order with the **Auto-Selected Best Schemes**? 
                            </p>
                            
                            <div className="bg-slate-50 p-3 rounded-2xl text-[9px] font-black uppercase text-slate-600 border border-slate-100 space-y-1.5">
                              <div className="flex justify-between">
                                <span>Total SKUs:</span>
                                <span className="text-slate-800">{orderProducts.filter(p => p.qty > 0).length} Lines</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Items:</span>
                                <span className="text-slate-800">{orderProducts.reduce((acc, curr) => acc + curr.qty, 0)} Units</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Estimate Payable:</span>
                                <span className="text-blue-600">${orderProducts.reduce((acc, curr) => {
                                  const sub = curr.price * curr.qty;
                                  if (curr.qty === 0 || !curr.selectedSchemeId) return acc + sub;
                                  const selected = curr.schemes.find(s => s.id === curr.selectedSchemeId);
                                  if (!selected) return acc + sub;
                                  return acc + (sub - (sub * selected.benefitPercent / 100));
                                }, 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Confirm buttons dialog ask user yes or no */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setIsOrderBookingConfirmOpen(false)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all text-center"
                            >
                              ❌ No, Cancel
                            </button>
                            <button
                              onClick={() => {
                                const finalAmount = orderProducts.reduce((acc, curr) => {
                                  const sub = curr.price * curr.qty;
                                  if (curr.qty === 0 || !curr.selectedSchemeId) return acc + sub;
                                  const selected = curr.schemes.find(s => s.id === curr.selectedSchemeId);
                                  if (!selected) return acc + sub;
                                  return acc + (sub - (sub * selected.benefitPercent / 100));
                                }, 0);
                                const totalUnits = orderProducts.reduce((acc, curr) => acc + curr.qty, 0);
                                const totalBenefitPercent = 15; // Average saves
                                const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

                                setBookedReceipt({
                                  orderId,
                                  totalAmount: finalAmount,
                                  totalUnits,
                                  totalBenefitPercent,
                                  timestamp: new Date().toISOString(),
                                  summary: `Order booked: ${totalUnits} units, value $${finalAmount.toFixed(2)}`
                                });

                                dbService.saveInteraction({
                                  userId: 'field-user-1',
                                  type: 'order',
                                  content: { orderId, finalAmount, totalUnits, originalSubtotal: orderProducts.reduce((acc, curr) => acc + (curr.price * curr.qty), 0) },
                                  summary: `Booked Order ${orderId}: ${totalUnits} units ($${finalAmount.toFixed(2)})`
                                });

                                // Refresh stats logs
                                setLogs(dbService.getLogs());
                                setIsOrderBookingConfirmOpen(false);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all text-center shadow-lg shadow-blue-500/15"
                            >
                              ✅ Yes, Order
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeScreen === 'territory' && (
                <motion.div
                  key="territory"
                  className="h-full flex flex-col"
                >
                   <div className="p-6 space-y-1 bg-white border-b border-slate-100">
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Territory Map</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector South-East A</p>
                   </div>
                   
                   <div className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      <div className="relative text-center space-y-4">
                         <div className="w-24 h-24 rounded-full bg-blue-100/50 flex items-center justify-center mx-auto border-2 border-blue-200 border-dashed animate-[spin_10s_linear_infinite]">
                            <MapPin className="w-8 h-8 text-blue-600" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Area Data...</p>
                      </div>
                      
                      <div className="absolute bottom-6 inset-x-6">
                         <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                  <Map className="w-4 h-4" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-800 leading-none mb-1">Outlet Coverage</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">92% of Sector A Mapped</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING HANDS-FREE VOICE ASSISTANT TRIGGER (REMOVED) */}
            
            {/* HANDS-FREE VOICE OVERLAY DRAWERS */}
            <AnimatePresence>
              {isVoiceSheetOpen && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                  className="absolute inset-x-0 bottom-0 bg-slate-950 text-white z-[200] rounded-t-[2rem] shadow-2xl border-t border-white/10 h-[82%] flex flex-col font-sans overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/60 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-blue-400 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black text-slate-100 tracking-wider uppercase leading-none">Voice Field Assistant</h3>
                        <p className="text-[7.5px] font-black tracking-widest text-emerald-400 uppercase mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Hands-Free Capture Active
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsVoiceSheetOpen(false)}
                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-slate-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sheet Body - scrollable */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar pb-16">
                    {/* Voice sound wave visualizer */}
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center text-center space-y-3.5">
                      {isVoiceActive ? (
                        <div className="flex items-end justify-center gap-1 h-10 py-0.5">
                          {[0.3, 0.7, 1.0, 0.5, 0.9, 0.4, 0.8, 0.3, 0.6, 0.9, 0.5, 0.7, 0.4].map((h, idx) => (
                            <motion.div
                              key={idx}
                              animate={{ height: [h * 10, h * 38, h * 10] }}
                              transition={{ repeat: Infinity, duration: 0.8 + (idx % 3) * 0.2, ease: "easeInOut" }}
                              className="w-1 bg-gradient-to-t from-blue-500 via-teal-400 to-emerald-400 rounded-full"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-end justify-center gap-1 h-10 py-0.5 opacity-30">
                          {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, idx) => (
                            <div key={idx} className="w-1 h-1.5 bg-slate-500 rounded-full" />
                          ))}
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider leading-none">
                          {isVoiceActive ? "Listening for SKU and Task Commands..." : "Voice Engine Standby"}
                        </p>
                        <p className="text-[9.5px] text-slate-400 font-semibold px-2 leading-relaxed">
                          {voiceSpeechText || 'Speak or use voice presets below to record counts!'}
                        </p>
                      </div>

                      {/* Microphone trigger button inside sheet */}
                      <div className="w-full">
                        <button
                          onClick={() => toggleVoice(false)}
                          className={cn(
                            "w-full py-3 rounded-2xl text-[9px] uppercase font-black tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer",
                            isVoiceActive ? "bg-rose-500/10 text-rose-300 border border-rose-500/25 animate-pulse" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                          )}
                        >
                          <Mic className="w-3.5 h-3.5" />
                          {isVoiceActive ? "Listening..." : "Tap to Speak"}
                        </button>
                      </div>
                    </div>

                    {/* Simulated Voice Command Typing Fallback */}
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Type Voice Command (Sandbox Iframe Fallback)</p>
                        <span className="text-[7px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Simulated dictation</span>
                      </div>
                      <div className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-white/5">
                        <input
                          type="text"
                          value={customVoiceInputText}
                          disabled={isVoiceActive}
                          onChange={(e) => setCustomVoiceInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isVoiceActive && customVoiceInputText.trim()) {
                              handleCustomVoiceSubmit();
                            }
                          }}
                          placeholder={isVoiceActive ? "Processing command..." : "e.g., 'Count Dove Soap 30 and Shampoo 12'"}
                          className="flex-1 bg-transparent border-none outline-none text-[10px] text-white px-2 placeholder-slate-600 font-bold disabled:opacity-50"
                        />
                        <button
                          onClick={handleCustomVoiceSubmit}
                          disabled={isVoiceActive || !customVoiceInputText.trim()}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Submit
                        </button>
                      </div>
                      <p className="text-[7.5px] text-slate-500 px-1 font-semibold leading-normal">
                        Since browser security blocks direct microphone hardware access inside sandboxed iframes, you can type any arbitrary voice counts or commands (e.g. <b>"Count Lux 45"</b>, <b>"Dove Soap 20"</b>, <b>"Dove Shampoo 15"</b>, <b>"Reset counts"</b>) above to trigger the exact same Voice parsing, database updates, and audio synthesis engine!
                      </p>
                    </div>

                    {/* SKU Stock Live Count Board */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Shelf SKU Counts</p>
                        <span className="text-[7.5px] font-black px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full uppercase tracking-wider animate-pulse border border-emerald-500/5">Database Live</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {orderProducts.map((p) => {
                          const shelfCount = shelfSkuCounts[p.id] || 0;
                          return (
                            <div key={p.id} className="bg-slate-900 border border-white/5 p-3 rounded-2xl flex flex-col justify-between h-20">
                              <div>
                                <p className="text-[9px] font-black text-slate-200 tracking-tight leading-none line-clamp-1">{p.name}</p>
                                <p className="text-[7.5px] text-slate-500 font-extrabold uppercase mt-1 leading-none">{p.id.split('-').join(' ')}</p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[7px] font-black text-slate-650 uppercase tracking-widest font-mono">Counted</span>
                                <div className="bg-slate-950 px-2 py-0.5 rounded-lg border border-white/5 flex items-center gap-1">
                                  <span className="text-xs font-black text-emerald-400 font-mono leading-none">{shelfCount}</span>
                                  <span className="text-[6px] text-slate-500 font-black tracking-widest uppercase leading-none font-mono">pcs</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Precompiled Simulators */}
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Field Voice Command Presets</p>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar pr-0.5">
                        {[
                          {
                            label: 'Audit Count: Dove and Shampoo',
                            transcript: 'Count Dove Soap 22 and Shampoo 14 for stock check',
                            desc: 'Captures and applies 22 Dove and 14 Shampoo counts'
                          },
                          {
                             label: 'Audit Count: Lux Soap status',
                             transcript: 'Lux Soap is counted at 35 units',
                             desc: 'Captures and sets Lux Soap physical count to 35'
                          },
                          {
                            label: 'Audit Count: Out of Stock',
                            transcript: 'Shelf notice: Lifebuoy Soap is out of stock',
                            desc: 'Sets Lifebuoy physical stock to 0 (OOS)'
                          },
                          {
                            label: 'Voice Store Check-in',
                            transcript: 'Confirm team attendance and check-in to store',
                            desc: 'Completes geo-location check-in using voice parameters'
                          },
                          {
                            label: 'Voice Order Booking',
                            transcript: 'Replenish and order 15 cases of Dove Soap',
                            desc: 'Books 15 case units in active merchandiser Order screen'
                          },
                          {
                            label: 'Reset Audit Shelf',
                            transcript: 'Clear all stock counts to zero',
                            desc: 'Restores initial clean zero slate'
                          }
                        ].map((sim, key) => (
                          <button
                            key={key}
                            onClick={() => {
                              setVoiceSpeechText(`Simulating: "${sim.transcript}"`);
                              setIsVoiceActive(true);
                              
                              setTimeout(async () => {
                                setIsVoiceActive(false);
                                const parsed = await parseVoiceCommand(sim.transcript);
                                
                                setVoiceSpeechText(`Recognized: "${sim.transcript}"`);
                                
                                setVoiceLog(prev => [
                                  {
                                    id: Date.now().toString(),
                                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    text: `Voice: "${sim.transcript}"`,
                                    details: parsed.summary,
                                    type: parsed.success ? 'success' : 'warn' as any
                                  },
                                  ...prev
                                ]);
                              }, 1000);
                            }}
                            className="w-full p-2.5 bg-white/5 hover:bg-white/10 active:bg-white/12 border border-white/5 rounded-2xl text-left transition-all active:scale-98 flex justify-between items-center group cursor-pointer"
                          >
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black text-slate-300 group-hover:text-blue-400 transition-colors">“{sim.transcript}”</p>
                              <p className="text-[7.5px] text-slate-500 font-bold">{sim.desc}</p>
                            </div>
                            <div className="w-4.5 h-4.5 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Plus className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voice Telemetry log */}
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Voice Telemetry Journal</p>
                      
                      <div className="bg-slate-900/90 border border-white/5 p-3.5 rounded-3xl space-y-2.5">
                        <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar">
                          {voiceLog.length === 0 ? (
                            <p className="text-[8.5px] text-slate-500 font-semibold italic text-center py-2">No voice interactions recorded yet</p>
                          ) : (
                            voiceLog.map((log) => (
                              <div key={log.id} className="text-[9px] font-semibold border-b border-white/5 pb-2 last:border-0 last:pb-0 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[7.5px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      log.type === 'success' ? "bg-emerald-400 animate-pulse" : log.type === 'warn' ? "bg-amber-400" : "bg-slate-400"
                                    )} />
                                    {log.type === 'success' ? 'SKU PARSED' : log.type === 'warn' ? 'UNRECOGNIZED' : 'TELEMETRY'}
                                  </span>
                                  <span className="text-[7.5px] text-slate-650 font-mono font-bold">{log.time}</span>
                                </div>
                                <p className="text-white font-black leading-tight">{log.text}</p>
                                <p className="text-[8.5px] text-slate-400 font-semibold leading-relaxed whitespace-pre-line">{log.details}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-50 shadow-inner">
             <button 
               onClick={() => setActiveScreen('home')}
               className={cn(
                 "flex flex-col items-center gap-2 transition-all group flex-1",
                 activeScreen === 'home' ? "text-blue-600" : "text-slate-400"
               )}
             >
               <div className={cn(
                 "w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-active:scale-90",
                 activeScreen === 'home' ? "bg-blue-50 shadow-inner" : "bg-transparent"
               )}>
                  <Home className={cn("w-5 h-5 transition-transform", activeScreen === 'home' && "scale-110")} />
               </div>
               <span className={cn(
                 "text-[9px] font-black uppercase tracking-tighter transition-all",
                 activeScreen === 'home' ? "opacity-100" : "opacity-60"
               )}>Home</span>
             </button>

             {topFeatures.map((feature) => {
               const screenMap: Record<string, Screen> = {
                  predictiveBot: 'bot',
                  visionAutomation: 'vision',
                  salesInsights: 'reports',
                  trainingHub: 'training',
                  routeOptimizer: 'planner',
                  userProfile: 'performance',
                  
                  territoryMap: 'territory',
                  orderManagement: 'order',
                  quizModule: 'quiz'
                };
               const targetScreen = screenMap[feature.id];
               if (!targetScreen) return null;

               return (
                 <button 
                   key={feature.id}
                   onClick={() => setActiveScreen(targetScreen)}
                   className={cn(
                     "flex flex-col items-center gap-2 transition-all group flex-1",
                     activeScreen === targetScreen ? "text-blue-600" : "text-slate-400"
                   )}
                 >
                   <div className={cn(
                     "w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-active:scale-90",
                     activeScreen === targetScreen ? "bg-blue-50 shadow-inner" : "bg-transparent"
                   )}>
                      {React.cloneElement(iconMap[feature.icon] as React.ReactElement, { 
                        className: "w-5 h-5 transition-transform" + (activeScreen === targetScreen ? " scale-110 text-blue-600" : " text-slate-400") 
                      })}
                   </div>
                   <span className={cn(
                     "text-[9px] font-black uppercase tracking-tighter transition-all",
                     activeScreen === targetScreen ? "opacity-100" : "opacity-60"
                   )}>{feature.name.split(' ')[0]}</span>
                 </button>
               );
             })}

             {enabledFeatures.length > 3 && (
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="flex flex-col items-center gap-2 transition-all group flex-1 text-slate-400"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-active:scale-90 bg-transparent">
                     <MoreVertical className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">Menu</span>
                </button>
             )}
          </nav>
        </div>

        {/* INTERACTIVE CAMERA OVERLAY */}
        <AnimatePresence>
          {(isBotCameraOpen || isVisionCameraActive) && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="absolute inset-0 bg-slate-950 z-[1000] flex flex-col overflow-hidden text-white font-sans"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                    <Camera className="w-3.5 h-3.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none">
                      {cameraStep === 'shopboard' ? 'Vision AI Alignment' : 'Precision SKU Audit'}
                    </p>
                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                      {cameraStep === 'shopboard' ? 'Location Check-in Lock' : 'Real-time Object Count'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <button
                    onClick={() => setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[8px] font-black uppercase text-blue-300 border border-blue-500/10 cursor-pointer"
                  >
                    <RefreshCcw className="w-2.5 h-2.5" />
                    <span>Cam: {cameraFacingMode === 'user' ? 'Front' : 'Back'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setIsBotCameraOpen(false);
                      setIsVisionCameraActive(false);
                      setCameraPurpose(null);
                      setCameraState('idle');
                      setCameraStep('shopboard');
                    }}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-slate-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewfinder Frame */}
              <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-slate-900 relative border-2 border-white/15 shadow-2xl">
                  
                  {/* Camera Live Stream & Fallback Visualizer */}
                  {cameraStream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 text-center z-0">
                      <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 animate-pulse">
                        <Camera className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">LIVE VIEW DISCONNECTED</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase max-w-[180px]">Accept browser camera permission or use simulated manual upload</p>
                    </div>
                  )}
                  
                  {/* High Accuracy Geometric Alignment Mask Watermark (Replaces static image template) */}
                  <div 
                    style={{ opacity: cameraWatermarkOpacity }}
                    className="absolute inset-6 border-2 border-dashed border-blue-500/35 rounded-3xl pointer-events-none flex items-center justify-center m-4"
                  >
                    <div className="w-full h-full relative">
                      {/* Sub alignment target corners */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500/50" />
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500/50" />
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500/50" />
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500/50" />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-400/90 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-500/10">
                          {cameraStep === 'shopboard' ? 'Align Storefront Signage' : 'Lock SKU Display Grid'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grid overlay & indicator brackets */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-b border-white/10" />
                    <div className="border-r border-white/10" />
                    <div className="border-r border-white/10" />
                    <div className="bg-transparent" />
                  </div>

                  {/* High precision crosshair centering guide */}
                  <div className="absolute inset-10 border border-white/10 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-blue-500/70" />
                    <div className="h-6 w-0.5 bg-blue-500/70 absolute" />
                    
                    {/* Glowing active green corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/80" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/80" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/80" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/80" />
                  </div>

                  {/* Horizontal laser sweeps for vision audit style feedback */}
                  {cameraState === 'idle' && (
                    <motion.div 
                      animate={{ y: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_#3b82f6] opacity-75 pointer-events-none"
                    />
                  )}

                  {/* Picture-in-picture GPS metadata panel floating in viewfinder (Replaces static image sample) */}
                  <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md px-2.5 py-2 rounded-xl border border-white/10 max-w-[110px] shadow-xl pointer-events-none space-y-1 z-10">
                     <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest leading-none">🛰️ GPS TRACKER</p>
                     <div className="space-y-0.5 text-left font-mono">
                       <p className="text-[6px] font-bold text-slate-300">LAT: 19.0760 N</p>
                       <p className="text-[6px] font-bold text-slate-300">LNG: 72.8777 E</p>
                       <p className="text-[5.5px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-0.5 mt-0.5 leading-none">
                         ● LOCK SUCCESS
                       </p>
                     </div>
                  </div>

                  {/* Simulated storefront board holding selection panel */}
                  {cameraStep === 'shopboard' && (
                    <div className="absolute bottom-3 left-3 right-24 bg-slate-950/90 border border-white/10 p-2 rounded-xl shadow-2xl z-25 space-y-1 backdrop-blur-md">
                      <p className="text-[6px] font-black tracking-widest text-slate-400 uppercase leading-none">📸 Simulated Shop Board in Feed</p>
                      <div className="flex flex-wrap gap-1 leading-none">
                        {routeStops.slice(0, 4).map((stop) => (
                          <button
                            type="button"
                            key={stop.id}
                            onClick={() => setSimulatedShopBoard(stop.storeName)}
                            className={cn(
                              "px-1 py-0.5 rounded text-[5px] font-black uppercase transition-all",
                              simulatedShopBoard === stop.storeName
                                ? "bg-blue-600 text-white"
                                : "bg-white/10 text-slate-300 hover:bg-white/20"
                            )}
                          >
                            {stop.storeName.replace(" Mercado Extra", "").replace(" (Bandra Hub)", "").replace(" #442", "").replace(" Metro Outlet", "").replace("Smollan ", "")}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSimulatedShopBoard("McDonald's Storefront")}
                          className={cn(
                            "px-1 py-0.5 rounded text-[5px] font-black uppercase transition-all",
                            simulatedShopBoard === "McDonald's Storefront"
                              ? "bg-rose-600 text-white"
                              : "bg-white/10 text-slate-300 hover:bg-white/20"
                          )}
                        >
                          McDonalds
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Floating transparency slider controller inside viewfinder */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg flex flex-col gap-1">
                    <p className="text-[6px] font-black text-slate-400 uppercase leading-none tracking-wider text-center">Overlay Match</p>
                    <div className="flex gap-1 items-center justify-center">
                      {[
                        { val: 0, label: 'OFF' },
                        { val: 0.3, label: '30%' },
                        { val: 0.6, label: '60%' }
                      ].map(opt => (
                        <button 
                          key={opt.label}
                          onClick={() => setCameraWatermarkOpacity(opt.val)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[6px] font-black uppercase transition-all",
                            cameraWatermarkOpacity === opt.val 
                              ? "bg-blue-600 text-white" 
                              : "bg-white/10 text-slate-300 hover:bg-white/20"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo snap-shot flash overlay */}
                  <AnimatePresence>
                    {cameraState === 'snapping' && (
                      <motion.div 
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white z-50 flex items-center justify-center"
                      />
                    )}
                  </AnimatePresence>

                  {/* Analyzing coordinates & Vision model log overlay */}
                  <AnimatePresence>
                    {cameraState === 'verifying' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-5 text-center space-y-4"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full"
                        />
                        <div className="space-y-1.5 w-full max-w-[210px]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            {cameraStep === 'shopboard' ? 'Verifying Storefront...' : 'Counting SKUs...'}
                          </p>
                          <div className="bg-slate-900 border border-white/5 p-2 rounded-xl text-left font-mono space-y-1 text-[7px] text-slate-400">
                            {cameraStep === 'shopboard' ? (
                              <>
                                <p className="flex items-center gap-1"><span className="text-blue-400">📡</span> API: Smollan geofence connection active</p>
                                <p className="flex items-center gap-1"><span className="text-blue-400">🛰️</span> GPS: Coordinates locked within 5 meters</p>
                                <p className="flex items-center gap-1"><span className="text-blue-400">👁️</span> SIFT: Running layout alignment score...</p>
                                <p className="font-extrabold text-emerald-400 flex items-center gap-1 mt-1 border-t border-white/5 pt-1">✅ MATCH DETECTED (98.4% Confidence)</p>
                              </>
                            ) : (
                              <>
                                <p className="flex items-center gap-1"><span className="text-blue-400">📊</span> IR: Initializing YOLO display mesh model</p>
                                <p className="flex items-center gap-1"><span className="text-blue-400">🔍</span> SCAN: Running local density sweep...</p>
                                <p className="flex items-center gap-1"><span className="text-blue-400">🏷️</span> BRAND: Segmenting product bounds</p>
                                <p className="font-extrabold text-emerald-400 flex items-center gap-1 mt-1 border-t border-white/5 pt-1">✅ COUNTED (156 SKUs Detected, 94% Compliant)</p>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Shutter Controls */}
              <div className="p-4 bg-slate-900 border-t border-white/10 shrink-0 flex items-center justify-between">
                <button
                  type="button"
                  disabled={cameraState !== 'idle'}
                  onClick={() => setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                  className="flex flex-col items-center justify-center w-16 text-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all py-1.5 px-1 rounded-xl border border-white/5 cursor-pointer disabled:opacity-40"
                  id="camera-flip-btn"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-emerald-400 animate-pulse mb-1" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider leading-none">Flip Cam</span>
                  <span className="text-[5.5px] font-extrabold text-slate-500 uppercase mt-0.5 leading-none">
                    {cameraFacingMode === 'user' ? 'Front' : 'Back'}
                  </span>
                </button>

                <div className="relative flex items-center justify-center">
                  <button 
                    disabled={cameraState !== 'idle'}
                    onClick={handleShutterClick}
                    className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-40 shadow-xl cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={cameraState !== 'idle'}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-16 text-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all py-1.5 px-1 rounded-xl border border-white/5 cursor-pointer disabled:opacity-40"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400 animate-pulse mb-1" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider leading-none">Upload</span>
                  <span className="text-[5.5px] font-extrabold text-slate-500 uppercase mt-0.5 leading-none">Gallery</span>
                </button>
              </div>

              {/* Bottom Guideline prompt */}
              <div className="bg-slate-950 text-slate-400 text-center py-2 px-6 border-t border-white/10 shrink-0">
                <p className="text-[7.5px] font-extrabold text-blue-300 uppercase tracking-widest leading-tight">
                  {cameraStep === 'shopboard' 
                    ? 'Line up store layout with alignment match overlays to verify outlet details in one tap'
                    : 'Fit display stock rack inside the viewfinder to auto-detect and count total SKUs'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden File Input for Gallery Upload */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleGalleryUpload}
          className="hidden"
          accept="image/*"
        />

        {/* Home Indicator */}
        <div className="h-8 bg-slate-900 flex items-center justify-center shrink-0">
           <div className="w-24 h-1 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
