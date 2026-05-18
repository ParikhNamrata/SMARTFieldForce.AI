import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  MessageSquare,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { dbService } from '../services/db';
import { generateAIReportSummary } from '../services/reporting';

export default function Reports() {
  const logs = dbService.getLogs();
  const report = useMemo(() => generateAIReportSummary(logs), [logs]);

  const VIZ_DATA = [
    { name: 'Mon', value: 45 },
    { name: 'Tue', value: 52 },
    { name: 'Wed', value: 48 },
    { name: 'Thu', value: 61 },
    { name: 'Fri', value: 72 },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* AI Intelligence Summary */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-20 opacity-10">
            <Sparkles className="w-64 h-64" />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-white" />
               </div>
               <span className="text-sm font-black uppercase tracking-[0.3em] text-blue-400">AI Field Integrity Report</span>
            </div>
            <h3 className="text-3xl font-black italic tracking-tight leading-tight mb-8 max-w-2xl">
               "{report.summary}"
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {report.stats.map((stat, i) => (
                 <div key={i} className="bg-white/5 p-4 rounded-3xl backdrop-blur-xl border border-white/10">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Field Interaction Trends */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Bot Engagement
                </h4>
                <p className="text-xs text-slate-500">Field users interactions with Smart Bot per week</p>
              </div>
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={VIZ_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Intelligence Insights */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
              <Layers className="w-5 h-5 text-blue-600" />
              Strategic Insights
           </h4>
           <div className="space-y-6">
              {report.insights.map((insight, i) => (
                <div key={i} className="flex gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                   <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                   </div>
                   <p className="text-xs font-bold text-slate-600 leading-relaxed">{insight}</p>
                </div>
              ))}
              
              <div className="pt-4">
                 <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Next Recommended Action</p>
                    <p className="text-sm font-bold">Push "Monsoon Bundle" campaign to 12 stores in Zone B based on high vision-stock levels.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
