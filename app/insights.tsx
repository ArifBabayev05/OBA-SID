import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { getDatasetEntries } from '@/services/datasetService';
import { buildInsights, InsightsResult } from '@/services/insightsService';
import { generateAISummary, getLatestAISummary, AISummary } from '@/services/aiAdvisor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

const COLORS = {
  background: '#050B16',
  surface: '#0B1529',
  surfaceElevated: '#101C34',
  border: 'rgba(148, 163, 184, 0.2)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  accentPrimary: '#4ADE80',
  accentSecondary: '#93C5FD',
  accentWarning: '#F97316',
};

export default function InsightsScreen() {
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const entries = await getDatasetEntries();
      const insightsData = buildInsights(entries);
      setInsights(insightsData);

      // Try to get cached AI summary, or generate new one
      let summary = await getLatestAISummary();
      if (!summary || entries.length > 0) {
        summary = await generateAISummary(entries);
      }
      setAiSummary(summary);
    } catch (error) {
      console.error('Failed to load insights', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insights) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Məlumatlar yüklənir...</Text>
        </View>
      </View>
    );
  }

  const chartData = activeTab === 'week' ? insights.weeklyTrends : insights.monthlyTrends;
  const chartLabels = chartData.map((item, index) =>
    activeTab === 'week' ? `H${index + 1}` : new Date(item.date).toLocaleDateString('az-AZ', { month: 'short' })
  );
  const chartValues = chartData.map(item => Number(item.amount.toFixed(2)));
  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        color: () => COLORS.accentPrimary,
        strokeWidth: 3,
      },
    ],
    legend: ['Xərclər'],
  };
  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.accentPrimary,
    },
    propsForBackgroundLines: {
      stroke: COLORS.border,
      strokeDasharray: '4',
    },
  };
  const pieChartData = insights.categoryBreakdown.map(cat => ({
    name: cat.category,
    population: Number(cat.amount.toFixed(2)),
    color: cat.color,
    legendFontColor: COLORS.textPrimary,
    legendFontSize: 12,
  }));

  const getTrendIcon = () => {
    if (!aiSummary) return <Minus size={20} color={COLORS.textSecondary} />;
    if (aiSummary.spendingTrend === 'increasing') {
      return <TrendingUp size={20} color={COLORS.accentWarning} />;
    } else if (aiSummary.spendingTrend === 'decreasing') {
      return <TrendingDown size={20} color={COLORS.accentPrimary} />;
    }
    return <Minus size={20} color={COLORS.textSecondary} />;
  };

  const getTrendColor = () => {
    if (!aiSummary) return COLORS.textSecondary;
    if (aiSummary.spendingTrend === 'increasing') return COLORS.accentWarning;
    if (aiSummary.spendingTrend === 'decreasing') return COLORS.accentPrimary;
    return COLORS.textSecondary;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Təhlil və Trendlər</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* AI Summary Card */}
        {aiSummary && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Sparkles size={20} color={COLORS.accentPrimary} />
              <Text style={styles.aiTitle}>AI Təhlili</Text>
            </View>
            <Text style={styles.aiHeadline}>{aiSummary.headline}</Text>
            <View style={styles.aiRecommendations}>
              {aiSummary.recommendations.map((rec, index) => (
                <View key={index} style={styles.aiRecommendationItem}>
                  <Text style={styles.aiBullet}>•</Text>
                  <Text style={styles.aiRecommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
            {aiSummary.weeklyPrediction && (
              <View style={styles.predictionBox}>
                <Text style={styles.predictionLabel}>Proqnoz:</Text>
                <Text style={styles.predictionText}>{aiSummary.weeklyPrediction}</Text>
              </View>
            )}
          </View>
        )}

        {/* Spending Trend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Xərc Trendi</Text>
            <View style={styles.trendBadge}>
              {getTrendIcon()}
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {aiSummary?.spendingTrend === 'increasing'
                  ? 'Artır'
                  : aiSummary?.spendingTrend === 'decreasing'
                  ? 'Azalır'
                  : 'Sabit'}
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'week' && styles.tabActive]}
              onPress={() => setActiveTab('week')}
            >
              <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
                Həftəlik
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'month' && styles.tabActive]}
              onPress={() => setActiveTab('month')}
            >
              <Text style={[styles.tabText, activeTab === 'month' && styles.tabTextActive]}>
                Aylıq
              </Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={lineChartData}
            width={CHART_WIDTH}
            height={220}
            chartConfig={chartConfig}
            bezier
            withShadow
            style={styles.lineChart}
            fromZero
            segments={5}
          />
        </View>

        {/* Category Breakdown */}
        {insights.categoryBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kateqoriya üzrə xərclər</Text>
            <View style={styles.categoryContainer}>
              <PieChart
                data={pieChartData}
                width={CHART_WIDTH}
                height={220}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                chartConfig={chartConfig}
                absolute
                hasLegend={false}
              />
              <View style={styles.categoryLegend}>
                {insights.categoryBreakdown.map((cat, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendText}>
                      {cat.category}: {cat.amount.toFixed(0)}₼ ({cat.percentage.toFixed(0)}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Savings Opportunity */}
        {insights.savingsOpportunity.potential > 0 && (
          <View style={styles.savingsCard}>
            <Text style={styles.savingsTitle}>💰 Qənaət Potensialı</Text>
            <Text style={styles.savingsAmount}>{insights.savingsOpportunity.potential}₼</Text>
            <Text style={styles.savingsText}>{insights.savingsOpportunity.recommendation}</Text>
          </View>
        )}

        {/* Prediction Card */}
        <View style={styles.predictionCard}>
          <Text style={styles.predictionCardTitle}>📊 Növbəti həftə proqnozu</Text>
          <Text style={styles.predictionCardAmount}>
            ~{insights.spendingPrediction.nextWeekEstimate}₼
          </Text>
          <Text style={styles.predictionCardConfidence}>
            Etibar səviyyəsi: {insights.spendingPrediction.confidence}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 20,
    paddingBottom: 100,
  },
  aiCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiHeadline: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  aiRecommendations: {
    gap: 8,
  },
  aiRecommendationItem: {
    flexDirection: 'row',
    gap: 8,
  },
  aiBullet: {
    color: COLORS.accentPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  aiRecommendationText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  predictionBox: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  predictionLabel: {
    color: COLORS.accentPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  predictionText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.background,
  },
  categoryContainer: {
    gap: 16,
    marginTop: 12,
  },
  categoryLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  savingsCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.accentPrimary,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accentPrimary,
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  predictionCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  predictionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  predictionCardAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  predictionCardConfidence: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  lineChart: {
    marginTop: 8,
    borderRadius: 16,
  },
});

