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
  Lock
} from 'lucide-react';
import { AppConfig, AVAILABLE_FEATURES, FeatureKey, Feature, AVAILABLE_BOT_ACTIONS } from '../types';
import { cn } from '../lib/utils';
import { answerFieldQuery } from '../services/gemini';
import { dbService, InteractionLog } from '../services/db';
import { generateAIReportSummary } from '../services/reporting';

interface MobileSimulatorProps {
  config: AppConfig;
}

type Screen = 'home' | 'bot' | 'vision' | 'reports' | 'training' | 'planner' | 'performance' | 'stock' | 'territory';
type VisionStep = 
  | 'capture-board' 
  | 'fetching-skus' 
  | 'sku-question' 
  | 'capture-skus' 
  | 'capture-dove'
  | 'fetching-dove'
  | 'continuous-audit'
  | 'result';

export default function MobileSimulator({ config }: MobileSimulatorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Safeguard: Move to home if current screen is disabled
  useEffect(() => {
    const featureMap: Record<Screen, FeatureKey | null> = {
      home: null,
      bot: 'predictiveBot',
      vision: 'visionAutomation',
      reports: 'salesInsights',
      training: 'trainingHub',
      planner: 'routeOptimizer',
      performance: 'userProfile',
      stock: 'inventoryRadar',
      territory: 'territoryMap'
    };

    const requiredFeature = featureMap[activeScreen];
    if (requiredFeature && config.features[requiredFeature] === false) {
      console.log(`Simulator: Feature ${requiredFeature} is disabled, redirecting to home`);
      setActiveScreen('home');
    }
  }, [config.features, activeScreen]);

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      setIsVoiceRecording(true);
      // Simulate voice capture
      setTimeout(() => {
        const voiceMsg = "Dove sku count is 24 and Lux is 5";
        handleSendMessage(voiceMsg);
        setIsVoiceActive(false);
        setIsVoiceRecording(false);
      }, 3000);
    }
  };
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [checkInStep, setCheckInStep] = useState<'idle' | 'store_checked_in' | 'location_checked_in' | 'checked_out'>('idle');
  const [completedStep2ActionIds, setCompletedStep2ActionIds] = useState<string[]>([]);
  const [visionStep, setVisionStep] = useState<VisionStep>('capture-board');
  const [skuCountInput, setSkuCountInput] = useState('');
  const [doveSkuCount, setDoveSkuCount] = useState<number | null>(null);
  const [continuousCount, setContinuousCount] = useState(0);
  const [auditData, setAuditData] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isVisionProcessing, setIsVisionProcessing] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);
  const [logs, setLogs] = useState<InteractionLog[]>([]);

  // Field Specific Imagery
  const FIELD_IMAGES = {
    shopboard: "https://images.unsplash.com/photo-1542310503-705ca612e96d?auto=format&fit=crop&q=80&w=600", // Store front/board
    allSkus: "https://images.unsplash.com/photo-1540340334550-80151c76171b?auto=format&fit=crop&q=80&w=600", // Grocery shelf
    doveShelf: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600", // Beauty/Dove-like shelf
    planogram: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=600" // Organized retail
  };

  // Sample Vision Data
  const sampleVisionData = {
    storeName: "Smollan Unilever Elite Hub #442",
    location: "Bandra West, Mumbai",
    stockCount: 284,
    skus: 156,
    compliance: 94,
    outOfStock: ["Dove Deep Moisture 400ml", "Lux Scarlet 100g", "Lifebuoy Lemon"],
    timestamp: new Date().toISOString()
  };

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
    const lowMsg = userMsg.toLowerCase().trim();

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
      aiResponse = "✅ Attendance Marked! Store Check-in completed automatically for Unilever Elite Hub #442.\n\nNow, your status is ACTIVE. Please proceed with the next options (Step 2):\n📌 Location Check-in\n📋 Survey Question\n🎁 Promotion\n🔍 IR (Image Recognition) / Vision Audit\n\nOr click Location Checkout when you are done.";
    } else if (lowMsg.includes('location check-in') || lowMsg.includes('location checkin')) {
      setCheckInStep('location_checked_in');
      aiResponse = "📍 Location Check-in completed. GPS coordinates matches with Smollan Unilever Elite Hub #442 perfectly.";
    } else if (lowMsg.includes('survey question') || lowMsg.includes('survey')) {
      aiResponse = "📋 [Survey Question] Store Display Audit: Are Unilever products placed prominently at eye-level on the main aisle?\n\n🤖 Recommendation: Yes, they are in primary slot. (Recorded: YES)";
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
          aiResponse = "🚪 Location Checkout Complete! All survey and image recognition (IR) audit tasks have been synchronized. Thank you for finishing your visit at Unilever Elite Hub #442!";
        }
      }
    } else if (userMsg.toLowerCase().includes('reporting') || userMsg.toLowerCase().includes('check-in')) {
      setAttendanceMarked(true);
      setCheckInStep('store_checked_in');
      setCompletedStep2ActionIds([]);
      aiResponse = "Welcome back! I'm ready for the store audit/check-in. First, click the Store Check-in button to mark your attendance and begin.";
    } else {
      aiResponse = await answerFieldQuery(userMsg);
    }

    setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    
    // Check for audit-related patterns - Improved multi-brand detection
    const updates: any = {};
    const brands = ['dove', 'lux', 'lifebuoy', 'surf excel', 'pepsodent', 'ponds'];
    
    brands.forEach(brand => {
       const regex = new RegExp(`${brand}.*?(\\d+)`, 'i');
       const match = lowMsg.match(regex);
       if (match) {
          const key = `manual${brand.charAt(0).toUpperCase() + brand.slice(1).replace(' ', '')}`;
          updates[key] = parseInt(match[1]);
       }
    });
    
    if (Object.keys(updates).length > 0) {
       setAuditData((prev: any) => ({ ...prev, ...updates }));
       const labels = Object.keys(updates).map(k => `${k.replace('manual', '')}: ${updates[k]}`).join(', ');
       setChatMessages(prev => [...prev, { role: 'ai', text: `Got it! Logged manual audit for ${labels}. This data will be integrated into the deep report.` }]);
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

  const handleChipAction = (chip: { label: string, action: string }) => {
    handleSendMessage(chip.action);
  };

  const handleCaptureBoard = async () => {
    setVisionStep('fetching-skus');
    await new Promise(r => setTimeout(r, 2000));
    setSkuCountInput(sampleVisionData.skus.toString());
    setVisionStep('sku-question');
    
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      text: `Shopboard verified: ${sampleVisionData.storeName} at ${sampleVisionData.location}. I've detected ${sampleVisionData.skus} SKUs in this area. Please capture all SKUs on the shelf now.` 
    }]);
  };

  const handleCaptureDove = async () => {
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
      doveCount: auditData?.manualDove || 24,
      luxCount: auditData?.manualLux || 12,
      brands: {
        Dove: auditData?.manualDove || 24,
        Lux: auditData?.manualLux || 12,
        Lifebuoy: auditData?.manualLifebuoy || 8,
        Pepsodent: auditData?.manualPepsodent || 15
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

  const topFeatures = useMemo(() => {
    const screensWithUI = [
      'predictiveBot', 
      'visionAutomation', 
      'salesInsights', 
      'trainingHub', 
      'routeOptimizer'
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
                          inventoryRadar: 'stock',
                          territoryMap: 'territory'
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
                         <p className="text-[10px] font-bold text-slate-400">UNILEVER SECTOR A</p>
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
                  {enabledFeatures[0] && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                             <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                                {iconMap[enabledFeatures[0].icon] || <Sparkles className="w-4 h-4" />}
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Priority Action</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 tracking-tight">
                            {enabledFeatures[0].id === 'visionAutomation' ? `Audit Required: ${sampleVisionData.storeName}` : `Next Up: ${enabledFeatures[0].name}`}
                          </h3>
                          <p className="text-11px font-medium text-slate-500 leading-relaxed max-w-[200px]">
                            {enabledFeatures[0].description} - Optimized by AI for your current route.
                          </p>
                          
                          <button 
                            onClick={() => {
                              if (enabledFeatures[0].id === 'visionAutomation') setActiveScreen('vision');
                              else if (enabledFeatures[0].id === 'predictiveBot') setActiveScreen('bot');
                              else if (enabledFeatures[0].id === 'salesInsights') setActiveScreen('reports');
                              else if (enabledFeatures[0].id === 'trainingHub') setActiveScreen('training');
                              else if (enabledFeatures[0].id === 'routeOptimizer') setActiveScreen('planner');
                              else if (enabledFeatures[0].id === 'userProfile') setActiveScreen('performance');
                              else if (enabledFeatures[0].id === 'inventoryRadar') setActiveScreen('stock');
                              else if (enabledFeatures[0].id === 'territoryMap') setActiveScreen('territory');
                            }}
                            className="mt-6 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                          >
                             Launch Module
                          </button>
                       </div>
                       <div className="absolute -top-4 -right-4 opacity-[0.03] rotate-12">
                          {iconMap[enabledFeatures[0].icon] || <Layers className="w-40 h-40" />}
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
                      {enabledFeatures.map((feature, i) => (
                        <motion.button
                          key={feature.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            if (feature.id === 'visionAutomation') setActiveScreen('vision');
                            else if (feature.id === 'predictiveBot') setActiveScreen('bot');
                            else if (feature.id === 'salesInsights') setActiveScreen('reports');
                            else if (feature.id === 'trainingHub') setActiveScreen('training');
                            else if (feature.id === 'routeOptimizer') setActiveScreen('planner');
                            else if (feature.id === 'userProfile') setActiveScreen('performance');
                            else if (feature.id === 'inventoryRadar') setActiveScreen('stock');
                            else if (feature.id === 'territoryMap') setActiveScreen('territory');
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
                      <div className="py-10 flex flex-col items-center text-center space-y-4 opacity-40">
                         <div className="w-20 h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-blue-600" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Predictive Assistant</p>
                            <p className="text-[10px] text-slate-500 px-10">Select a suggested action or type your field request.</p>
                         </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-blue-600 text-white ml-auto rounded-tr-none" 
                          : "bg-white text-slate-700 border border-slate-100 mr-auto rounded-tl-none"
                      )}>
                        {msg.text}
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
                            onClick={toggleVoice}
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
                  className="h-full flex flex-col pt-4 px-4 space-y-4"
                >
                   {/* Step progress */}
                   <div className="flex gap-1">
                      {['capture-board', 'fetching-skus', 'sku-question', 'capture-skus', 'capture-dove', 'continuous-audit', 'result'].map((s, i) => (
                        <div key={s} className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          visionStep === s || (visionStep === 'fetching-dove' && s === 'capture-dove') || (['fetching-skus', 'sku-question', 'capture-skus', 'capture-dove', 'fetching-dove', 'continuous-audit', 'result'].includes(visionStep) && i < ['capture-board', 'fetching-skus', 'sku-question', 'capture-skus', 'capture-dove', 'continuous-audit', 'result'].indexOf(visionStep))
                            ? "bg-blue-600" 
                            : "bg-slate-200"
                        )} />
                      ))}
                   </div>

                   {visionStep === 'capture-board' && (
                     <div className="flex flex-col space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-2xl">
                           <img 
                              src={FIELD_IMAGES.shopboard} 
                              alt="Store Front" 
                              className="w-full h-full object-cover opacity-70"
                           />
                           <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 text-white">
                              <p className="text-xs font-black uppercase tracking-widest">Step 1: Location Check-in</p>
                              <p className="text-[10px] font-bold text-white/60">Capture shop board for store details</p>
                           </div>
                        </div>
                        <button 
                          onClick={handleCaptureBoard}
                          className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                           <Camera className="w-4 h-4" />
                           Take Shop Board Photo
                        </button>
                     </div>
                   )}

                   {visionStep === 'fetching-skus' && (
                     <div className="flex flex-col space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-2xl">
                           <img 
                              src={FIELD_IMAGES.shopboard} 
                              alt="Store Front" 
                              className="w-full h-full object-cover opacity-30"
                           />
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full flex items-center justify-center"
                              />
                              <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Store Recognition</p>
                                 <p className="text-[8px] font-bold opacity-50 uppercase">Identifying Smollan Hub...</p>
                              </div>
                           </div>
                        </div>
                        <div className="w-full py-4 bg-slate-800 text-white/50 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                           <Loader2 className="w-4 h-4 animate-spin" />
                           Analyzing Location...
                        </div>
                     </div>
                   )}

                   {visionStep === 'sku-question' && (
                     <div className="flex flex-col space-y-6 pt-10">
                        <div className="w-16 h-16 rounded-[2rem] bg-blue-50 flex items-center justify-center mx-auto mb-4">
                           <ClipboardList className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-center space-y-2">
                           <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">AI Bot Suggestion</h3>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">How many SKUs are available in shelf category A?</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                           <input 
                             type="number" 
                             value={skuCountInput}
                             onChange={(e) => setSkuCountInput(e.target.value)}
                             placeholder="Detected SKUs: 142"
                             className="w-full bg-slate-50 border-none outline-none p-4 rounded-2xl text-center text-xl font-black text-slate-800"
                           />
                        </div>
                        <button 
                          onClick={() => setVisionStep('capture-skus')}
                          disabled={!skuCountInput}
                          className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                        >
                           Next: All SKUs Photo
                        </button>
                     </div>
                   )}

                   {visionStep === 'capture-skus' && (
                     <div className="flex flex-col space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-2xl">
                           <img 
                              src={FIELD_IMAGES.allSkus} 
                              alt="Store Shelves" 
                              className="w-full h-full object-cover opacity-70"
                           />
                           <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 text-white">
                              <p className="text-xs font-black uppercase tracking-widest">Step 3: SKU Analysis</p>
                              <p className="text-[10px] font-bold text-white/60">Bot: Capture all units on display</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setVisionStep('capture-dove')}
                          className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                           <Camera className="w-4 h-4" />
                           Analyze All SKUs
                        </button>
                     </div>
                   )}

                   {visionStep === 'capture-dove' && (
                     <div className="flex flex-col space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-2xl">
                           <img 
                              src={FIELD_IMAGES.doveShelf} 
                              alt="Dove Shelf" 
                              className="w-full h-full object-cover opacity-70"
                           />
                           <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 text-white">
                              <p className="text-xs font-black uppercase tracking-widest">Step 4: Priority Display</p>
                              <p className="text-[10px] font-bold text-white/60">Bot: Analyze Dove Shelf specifically</p>
                           </div>
                        </div>
                        <button 
                          onClick={handleCaptureDove}
                          className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                           <Camera className="w-4 h-4" />
                           Check Dove Priority
                        </button>
                     </div>
                   )}

                   {visionStep === 'fetching-dove' && (
                     <div className="flex flex-col space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-2xl">
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full flex items-center justify-center"
                              />
                              <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Dove Analysis</p>
                                 <p className="text-[8px] font-bold opacity-50 uppercase">Detecting Dove SKUs...</p>
                              </div>
                           </div>
                        </div>
                        <div className="w-full py-4 bg-slate-800 text-white/50 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                           <Loader2 className="w-4 h-4 animate-spin" />
                           Processing Dove Shelf...
                        </div>
                     </div>
                   )}

                   {visionStep === 'continuous-audit' && (
                     <div className="flex flex-col space-y-4">
                        <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-2xl">
                           <img 
                             src={FIELD_IMAGES.planogram} 
                             alt="Planogram View" 
                             className="w-full h-full object-cover opacity-40"
                           />
                           <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-10 text-center">
                              <div className="w-16 h-16 rounded-[2rem] bg-white/20 flex items-center justify-center mb-4">
                                 <Scan className="w-8 h-8" />
                              </div>
                              <p className="text-xs font-black uppercase tracking-[0.2em]">Deep Vision Audit</p>
                              <p className="text-[10px] font-bold text-white/60">Scan entire shelf for Planogram Compliance & Future Prediction.</p>
                              <div className="flex gap-2 mt-6">
                                 {[1, 2, 3].map(i => (
                                   <div key={i} className={cn(
                                     "w-3 h-3 rounded-full border-2 border-white/30",
                                     continuousCount >= i ? "bg-emerald-500 border-emerald-500" : ""
                                   )} />
                                 ))}
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={handleContinuousPhoto}
                          className="w-full py-4 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                           <Camera className="w-4 h-4" />
                           Deep Scan ({continuousCount}/3)
                        </button>
                     </div>
                   )}

                   {visionStep === 'result' && visionResult && (
                     <div className="flex flex-col h-full overflow-y-auto no-scrollbar space-y-4 pb-10">
                        <div className="aspect-video bg-slate-900 rounded-[2rem] relative overflow-hidden border-4 border-white shadow-xl shrink-0">
                           <img 
                             src={FIELD_IMAGES.allSkus} 
                             alt="Analyzed"
                             className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 flex flex-col justify-end">
                              <div className="flex gap-2">
                                 <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight">Dove Detected: {visionResult.doveCount}</span>
                                 <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight">Total SKUs: {visionResult.skus}</span>
                              </div>
                           </div>
                        </div>
                        
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="space-y-4"
                        >
                           <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Analytics</h4>
                                 <span className="text-[8px] font-bold text-blue-600 uppercase">AI High Confidence</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">Input Count</p>
                                    <p className="text-lg font-black text-slate-800">{skuCountInput}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">AI Detected</p>
                                    <p className="text-lg font-black text-blue-600">{visionResult.skus}</p>
                                 </div>
                              </div>
                              <div className="pt-2">
                                 <p className="text-[7px] font-black text-slate-400 uppercase mb-2">Detailed Observations</p>
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100">
                                       <X className="w-3 h-3" />
                                       {visionResult.planogramStatus}
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                                       <p className="text-[8px] font-black text-slate-400 uppercase">Detection Summary</p>
                                       <div className="grid grid-cols-2 gap-2">
                                          {Object.entries(visionResult.brands || {}).map(([name, count]) => (
                                            <div key={name} className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                                               <span className="text-[8px] font-bold text-slate-500 uppercase">{name}</span>
                                               <span className="text-[10px] font-black text-slate-800">{count as any}</span>
                                            </div>
                                          ))}
                                       </div>
                                       <div className="pt-2">
                                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Missing SKUs</p>
                                          <div className="flex flex-wrap gap-1">
                                             {visionResult.missingSkus.map((s: string) => (
                                               <span key={s} className="bg-white px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 border border-slate-100">{s}</span>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-xl">
                              <div className="flex items-center gap-2 mb-2">
                                 <Sparkles className="w-3 h-3 text-blue-400" />
                                 <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">AI Future Prediction</span>
                              </div>
                              <p className="text-[10px] font-bold leading-relaxed">{visionResult.prediction}</p>
                           </div>

                           <button 
                             onClick={() => {
                               setVisionStep('capture-board');
                               setSkuCountInput('');
                               setVisionResult(null);
                               setContinuousCount(0);
                             }}
                             className="w-full py-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                           >
                              Reset & New Audit
                           </button>
                        </motion.div>
                     </div>
                   )}

                   {isVisionProcessing && visionStep === 'continuous-audit' && (
                     <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-xl flex flex-col items-center justify-center text-white space-y-6 z-[60]">
                        <div className="relative">
                           <motion.div 
                             animate={{ rotate: 360 }}
                             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                             className="w-24 h-24 border-4 border-white/20 border-t-white rounded-full flex items-center justify-center"
                           />
                           <Scan className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center">
                           <p className="font-black text-sm uppercase tracking-[0.2em] mb-1">Deep Learning Scan</p>
                           <p className="text-[10px] font-bold opacity-60 uppercase">Aggregating multiple views...</p>
                        </div>
                        <motion.div 
                           initial={{ top: 0 }}
                           animate={{ top: "100%" }}
                           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           className="absolute inset-x-0 h-0.5 bg-white/50 shadow-[0_0_15px_white] z-10"
                        />
                     </div>
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

              {activeScreen === 'training' && (
                <motion.div
                  key="training"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 space-y-6"
                >
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Training Hub</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master your field goals</p>
                   </div>

                   <div className="space-y-4">
                      {[
                        { title: 'New Product Launch', duration: '5 min', points: '+50 XP', category: 'Innovation' },
                        { title: 'Safety Protocol 2024', duration: '12 min', points: '+100 XP', category: 'Compliance' },
                        { title: 'Advanced Selling Tips', duration: '8 min', points: '+80 XP', category: 'Sales' }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group active:scale-95 transition-all">
                           <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <BookOpen className="w-6 h-6" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{item.category}</p>
                              <p className="text-sm font-bold text-slate-800 leading-tight">{item.title}</p>
                              <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[9px] font-bold text-slate-400">{item.duration}</span>
                                 <span className="text-[9px] font-black text-emerald-500">{item.points}</span>
                              </div>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                           </div>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}

              {activeScreen === 'planner' && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 space-y-6 h-full flex flex-col"
                >
                   <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                            <Navigation className="w-5 h-5" />
                         </div>
                         <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic">Optimized Route</span>
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-800 tracking-tight">Today's Journey</h3>
                         <p className="text-xs font-bold text-slate-500 mt-1">4.2km saved today using AI Planner</p>
                      </div>
                   </div>

                   <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                      {[
                        { time: '09:00 AM', location: 'Smollan HQ', status: 'completed' },
                        { time: '10:30 AM', location: 'Unilever Hub', status: 'current' },
                        { time: '01:00 PM', location: 'Spar Supermarket', status: 'pending' },
                        { time: '03:15 PM', location: 'Checkers Metro', status: 'pending' }
                      ].map((stop, idx) => (
                        <div key={idx} className="flex gap-4">
                           <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-3 h-3 rounded-full border-2",
                                stop.status === 'completed' ? "bg-blue-600 border-blue-600" :
                                stop.status === 'current' ? "bg-white border-blue-600 animate-pulse" : "bg-white border-slate-200"
                              )} />
                              {idx < 3 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                           </div>
                           <div className="pb-6">
                              <p className="text-[10px] font-black text-slate-400 mb-1">{stop.time}</p>
                              <p className={cn(
                                "text-sm font-bold tracking-tight",
                                stop.status === 'current' ? "text-blue-600" : "text-slate-700"
                              )}>{stop.location}</p>
                           </div>
                        </div>
                      ))}
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

                   <div className="space-y-4">
                      {[
                        { item: 'Unilever Detergent 2kg', stock: 'Critical', distance: '0.4km', color: 'red' },
                        { item: 'Hellmanns Mayo 400g', stock: 'Low', distance: '1.2km', color: 'orange' },
                        { item: 'Knorr Soup Pack', stock: 'Optimal', distance: '2.5km', color: 'emerald' }
                      ].map((prod, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                           <div className={cn("w-2 h-12 rounded-full", `bg-${prod.color}-500/20`)} />
                           <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800 leading-tight">{prod.item}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className={cn("text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-full", `bg-${prod.color}-500`)}>{prod.stock}</span>
                                 <span className="text-[8px] font-bold text-slate-400">{prod.distance} away</span>
                              </div>
                           </div>
                           <button className="p-2 rounded-xl bg-slate-50 text-slate-400">
                              <Search className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
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
                 inventoryRadar: 'stock',
                 territoryMap: 'territory'
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

        {/* Home Indicator */}
        <div className="h-8 bg-slate-900 flex items-center justify-center shrink-0">
           <div className="w-24 h-1 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
