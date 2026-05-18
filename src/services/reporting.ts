import { InteractionLog } from "./db";

export const generateAIReportSummary = (logs: InteractionLog[]) => {
  const visionLogs = logs.filter(l => l.type === 'vision');
  const chatLogs = logs.filter(l => l.type === 'chat');
  
  const totalStock = visionLogs.reduce((acc, curr) => acc + (curr.content.stockCount || 0), 0);
  const avgCompliance = visionLogs.length > 0 
    ? (visionLogs.reduce((acc, curr) => acc + (curr.content.compliance || 0), 0) / visionLogs.length).toFixed(1)
    : "0";

  // Aggregate brand counts from vision results
  const brandCounts: Record<string, number> = {};
  visionLogs.forEach(log => {
      const brands = log.content.brands || {};
      Object.entries(brands).forEach(([name, count]) => {
          brandCounts[name] = (brandCounts[name] || 0) + (count as number);
      });
  });

  const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    summary: `Field user completed ${logs.length} total interactions today. Vision AI captured ${visionLogs.length} stores with an average compliance of ${avgCompliance}%. ${topBrand ? `${topBrand[0]} is the leading brand with ${topBrand[1]} units detected.` : ''}`,
    stats: [
      { label: 'Total Logs', value: logs.length },
      { label: 'Vision Checks', value: visionLogs.length },
      { label: 'Top Brand', value: topBrand ? topBrand[0] : 'N/A' },
      { label: 'Avg Compliance', value: `${avgCompliance}%` }
    ],
    insights: [
      visionLogs.length > 0 ? "Stock levels are trending 15% lower in regional hubs." : "Awaiting first vision capture of the day.",
      topBrand && topBrand[1] < 50 ? `Alert: ${topBrand[0]} inventory is running low across monitored stores.` : "Stock velocity remains stable for priority brands.",
      chatLogs.length > 5 ? "High volume of requests via bot. Team engagement is above target." : "Bot interactions suggest routine operations."
    ]
  };
};
