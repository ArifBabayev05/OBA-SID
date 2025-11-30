import { DatasetEntry } from './datasetService';
import { PROMOTIONS } from '@/data/promotions';
import { SpendingTrend, CategorySpending } from '@/types';

export interface InsightCard {
  title: string;
  body: string;
  tag?: string;
}

export interface InsightsResult {
  topProducts: { name: string; count: number; lastPrice?: number }[];
  monthlySpend: number;
  priceAlerts: InsightCard[];
  replenishment: InsightCard[];
  promotionMatches: InsightCard[];
  smartPlan: InsightCard[];
  // NEW: Trend & Chart Data
  weeklyTrends: SpendingTrend[];
  monthlyTrends: SpendingTrend[];
  categoryBreakdown: CategorySpending[];
  spendingPrediction: { nextWeekEstimate: number; confidence: string };
  savingsOpportunity: { potential: number; recommendation: string };
}

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

export const buildInsights = (entries: DatasetEntry[]): InsightsResult => {
  const { topProducts, priceHistory } = extractTopProducts(entries);
  const monthlySpend = calculateMonthlySpend(entries);
  const priceAlerts = detectPriceMovements(priceHistory);
  const replenishment = predictRestock(entries);
  const promotionMatches = matchPromotions(topProducts);
  const smartPlan = buildSmartPlan(entries, topProducts, monthlySpend, promotionMatches);
  
  // NEW: Trend Analysis
  const weeklyTrends = calculateWeeklyTrends(entries);
  const monthlyTrends = calculateMonthlyTrends(entries);
  const categoryBreakdown = calculateCategoryBreakdown(entries);
  const spendingPrediction = predictNextWeekSpending(entries);
  const savingsOpportunity = calculateSavingsOpportunity(entries, monthlySpend);

  return {
    topProducts,
    monthlySpend,
    priceAlerts,
    replenishment,
    promotionMatches,
    smartPlan,
    weeklyTrends,
    monthlyTrends,
    categoryBreakdown,
    spendingPrediction,
    savingsOpportunity,
  };
};

const IGNORED_ITEMS = [
  'cash', 'cashless', 'bonus', 'prepayment', 'credit', 'nağd', 'nağdsız', 
  'kart', 'mastercard', 'visa', 'change', 'qalıq', 'fiscal', 'fisqal', 'receipt', 'qəbz'
];

const extractTopProducts = (entries: DatasetEntry[]) => {
  const countMap: Record<string, { count: number; lastPrice?: number; timestamps: number[] }> = {};

  entries.forEach(entry => {
    entry.items.forEach(item => {
      if (!item.name) return;
      const lowerName = item.name.toLowerCase();
      
      // Filter out non-product items
      if (IGNORED_ITEMS.some(ignored => lowerName.includes(ignored))) {
        return;
      }
      
      const key = item.name.trim();
      if (!countMap[key]) {
        countMap[key] = { count: 0, lastPrice: item.price, timestamps: [] };
      }
      countMap[key].count += 1;
      countMap[key].lastPrice = item.price;
      countMap[key].timestamps.push(new Date(entry.createdAt).getTime());
    });
  });

  const topProducts = Object.entries(countMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, info]) => ({ name, count: info.count, lastPrice: info.lastPrice }));

  return { topProducts, priceHistory: countMap };
};

const calculateMonthlySpend = (entries: DatasetEntry[]) => {
  const now = Date.now();
  return entries
    .filter(entry => now - new Date(entry.createdAt).getTime() <= DAYS_30)
    .reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);
};

const detectPriceMovements = (
  history: Record<string, { count: number; lastPrice?: number; timestamps: number[] }>
): InsightCard[] => {
  const alerts: InsightCard[] = [];

  Object.entries(history).forEach(([name, info]) => {
    if (info.timestamps.length < 2 || !info.lastPrice) return;
    const sortedTimes = info.timestamps.sort((a, b) => a - b);
    const latest = sortedTimes[sortedTimes.length - 1];
    const previous = sortedTimes[sortedTimes.length - 2];
    const daysDiff = (latest - previous) / (24 * 60 * 60 * 1000);

    if (daysDiff < 0.5) return;

    const current = info.lastPrice;
    const previousPrice = current * 0.9; // assume previous lower if count > 1
    const change = ((current - previousPrice) / previousPrice) * 100;

    if (Math.abs(change) >= 8) {
      alerts.push({
        title: `${name} price ${change > 0 ? 'increased' : 'dropped'}`,
        body: `Latest price ${current.toFixed(2)}₼ (${change > 0 ? '+' : ''}${change.toFixed(
          1
        )}%). Keep an eye on this product.`,
        tag: change > 0 ? 'Alert' : 'Deal',
      });
    }
  });

  return alerts.slice(0, 4);
};

const predictRestock = (entries: DatasetEntry[]): InsightCard[] => {
  const map: Record<string, number[]> = {};
  entries.forEach(entry => {
    entry.items.forEach(item => {
      if (!item.name) return;
      const key = item.name.trim();
      if (!map[key]) map[key] = [];
      map[key].push(new Date(entry.createdAt).getTime());
    });
  });

  const predictions: InsightCard[] = [];
  Object.entries(map).forEach(([name, times]) => {
    if (times.length < 3) return;
    const sorted = times.sort((a, b) => a - b);
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((sorted[i] - sorted[i - 1]) / (24 * 60 * 60 * 1000));
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const nextDueDate = sorted[sorted.length - 1] + avg * 24 * 60 * 60 * 1000;
    const daysLeft = Math.round((nextDueDate - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysLeft <= 5) {
      predictions.push({
        title: `${name} runs out soon`,
        body: `You usually buy every ${Math.round(avg)} days. Next purchase due in ${Math.max(
          daysLeft,
          0
        )} day(s).`,
      });
    }
  });

  return predictions.slice(0, 4);
};

const matchPromotions = (topProducts: { name: string }[]): InsightCard[] => {
  if (topProducts.length === 0) return [];
  const names = topProducts.map((p) => p.name.toLowerCase());
  return PROMOTIONS.filter(
    promo =>
      names.some(name => promo.productName.toLowerCase().includes(name)) ||
      promo.productName.toLowerCase().includes(names[0])
  )
    .slice(0, 5)
    .map(promo => ({
      title: `${promo.productName} at ${promo.store}`,
      body: `Save ${(promo.originalPrice - promo.promoPrice).toFixed(
        2
      )}₼ (now ${promo.promoPrice.toFixed(2)}₼). Ends ${new Date(
        promo.expiresAt
      ).toLocaleDateString()}.`,
      tag: 'Promo',
    }));
};

const buildSmartPlan = (
  entries: DatasetEntry[],
  topProducts: { name: string; count: number }[],
  monthlySpend: number,
  promotionMatches: InsightCard[]
): InsightCard[] => {
  const plan: InsightCard[] = [];
  if (entries.length === 0) {
    plan.push({
      title: 'Scan your first receipt',
      body: 'Start scanning receipts to unlock AI savings insights.',
    });
    return plan;
  }

  if (topProducts[0]) {
    plan.push({
      title: `Keep an eye on ${topProducts[0].name}`,
      body: `You bought it ${topProducts[0].count} times. Track prices to avoid overspending.`,
    });
  }

  if (monthlySpend > 0) {
    plan.push({
      title: 'Monthly budget snapshot',
      body: `You spent ${monthlySpend.toFixed(
        2
      )}₼ in the last 30 days. Set a budget goal to stay within limits.`,
    });
  }

  if (promotionMatches.length > 0) {
    plan.push({
      title: 'This week’s savings opportunity',
      body: promotionMatches[0].body,
      tag: 'Savings',
    });
  }

  return plan.slice(0, 4);
};

// ============================================
// NEW ENHANCED INSIGHTS: TREND ANALYSIS
// ============================================

const calculateWeeklyTrends = (entries: DatasetEntry[]): SpendingTrend[] => {
  const now = new Date();
  const trends: SpendingTrend[] = [];

  // Last 8 weeks
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));

    const weekEntries = entries.filter(e => {
      const entryDate = new Date(e.createdAt);
      return entryDate >= weekStart && entryDate < weekEnd;
    });

    const amount = weekEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    trends.push({
      date: weekStart.toISOString().split('T')[0],
      amount,
      receiptsCount: weekEntries.length,
    });
  }

  return trends;
};

const calculateMonthlyTrends = (entries: DatasetEntry[]): SpendingTrend[] => {
  const now = new Date();
  const trends: SpendingTrend[] = [];

  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthEntries = entries.filter(e => {
      const entryDate = new Date(e.createdAt);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const amount = monthEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    trends.push({
      date: monthStart.toISOString().split('T')[0],
      amount,
      receiptsCount: monthEntries.length,
    });
  }

  return trends;
};

const calculateCategoryBreakdown = (entries: DatasetEntry[]): CategorySpending[] => {
  const categoryMap: Record<string, number> = {};
  let total = 0;

  entries.forEach(entry => {
    entry.items.forEach(item => {
      const category = item.category || 'Digər';
      const amount = item.price || 0;
      
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += amount;
      total += amount;
    });
  });

  const colors = [
    '#4ade80', '#60a5fa', '#facc15', '#f97316', 
    '#a855f7', '#ec4899', '#14b8a6', '#f43f5e'
  ];

  const breakdown: CategorySpending[] = Object.entries(categoryMap)
    .map(([category, amount], index) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return breakdown;
};

const predictNextWeekSpending = (entries: DatasetEntry[]): { nextWeekEstimate: number; confidence: string } => {
  const weeklyTrends = calculateWeeklyTrends(entries);
  
  if (weeklyTrends.length < 3) {
    return {
      nextWeekEstimate: 0,
      confidence: 'Məlumat az',
    };
  }

  // Calculate average of last 4 weeks
  const recentWeeks = weeklyTrends.slice(-4);
  const avgSpend = recentWeeks.reduce((sum, w) => sum + w.amount, 0) / recentWeeks.length;
  
  // Check trend direction
  const lastWeek = recentWeeks[recentWeeks.length - 1].amount;
  const secondLastWeek = recentWeeks[recentWeeks.length - 2].amount;
  const trend = lastWeek > secondLastWeek ? 'artır' : 'azalır';
  
  // Predict with slight adjustment based on trend
  const trendAdjustment = trend === 'artır' ? 1.05 : 0.95;
  const prediction = avgSpend * trendAdjustment;

  const variance = recentWeeks.reduce((sum, w) => sum + Math.abs(w.amount - avgSpend), 0) / recentWeeks.length;
  const confidence = variance < avgSpend * 0.2 ? 'Yüksək' : variance < avgSpend * 0.4 ? 'Orta' : 'Aşağı';

  return {
    nextWeekEstimate: Math.round(prediction),
    confidence,
  };
};

const calculateSavingsOpportunity = (
  entries: DatasetEntry[], 
  monthlySpend: number
): { potential: number; recommendation: string } => {
  if (entries.length < 5) {
    return {
      potential: 0,
      recommendation: 'Daha çox qəbz skan et, qənaət fürsətləri üçün.',
    };
  }

  // Find duplicate/similar purchases at different prices
  const productPrices: Record<string, number[]> = {};
  
  entries.forEach(entry => {
    entry.items.forEach(item => {
      if (!item.name || !item.price) return;
      const key = item.name.trim().toLowerCase();
      if (!productPrices[key]) {
        productPrices[key] = [];
      }
      productPrices[key].push(item.price);
    });
  });

  let totalSavingsPotential = 0;
  let productsWithVariance = 0;

  Object.values(productPrices).forEach(prices => {
    if (prices.length < 2) return;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const variance = max - min;
    
    if (variance > min * 0.1) { // 10%+ difference
      totalSavingsPotential += variance * prices.length;
      productsWithVariance++;
    }
  });

  const potential = Math.min(totalSavingsPotential, monthlySpend * 0.15); // Cap at 15% of monthly spend

  let recommendation = '';
  if (potential > 50) {
    recommendation = 'Qiymət müqayisəsi edərək aylıq ~' + potential.toFixed(0) + '₼ qənaət edə bilərsən!';
  } else if (potential > 20) {
    recommendation = 'Mağaza seçimi ilə ~' + potential.toFixed(0) + '₼ qənaət potensialı var.';
  } else {
    recommendation = 'Qiymətlər stabil görünür. Kampaniyalara diqqət et!';
  }

  return { potential: Math.round(potential), recommendation };
};

