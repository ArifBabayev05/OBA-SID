import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles, BrainCircuit } from 'lucide-react-native';
import { router } from 'expo-router';
import { getDatasetEntries } from '@/services/datasetService';
import { buildInsights, InsightsResult } from '@/services/insightsService';
import { generateAISummary, getLatestAISummary, AISummary } from '@/services/aiAdvisor';
import { Palette } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

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
        <StatusBar barStyle="dark-content" />
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
    datasets: [{
      data: chartValues,
      color: (opacity = 1) => Palette.primary,
      strokeWidth: 3,
    }],
    legend: ['Xərclər'],
  };

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 103, 56, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: Palette.secondary,
    }
  };

  const pieChartData = insights.categoryBreakdown.map(cat => ({
    name: cat.category,
    population: Number(cat.amount.toFixed(2)),
    color: cat.color,
    legendFontColor: '#666',
    legendFontSize: 12,
  }));

  const getTrendIcon = () => {
    if (!aiSummary) return <Minus size={20} color="#999" />;
    if (aiSummary.spendingTrend === 'increasing') return <TrendingUp size={20} color="#EF4444" />;
    return <TrendingDown size={20} color={Palette.primary} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[Palette.primary, '#004d23']}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Analitika və Trendlər</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* AI Insight Header */}
        {aiSummary && (
          <View style={styles.aiCard}>
            <LinearGradient
              colors={['#f0fdf4', '#fff']}
              style={styles.aiGradient}
            >
              <View style={styles.aiHeader}>
                <BrainCircuit size={24} color={Palette.primary} />
                <Text style={styles.aiTitle}>AI Təhlili</Text>
              </View>
              <Text style={styles.aiHeadline}>{aiSummary.headline}</Text>
              <View style={styles.aiRecs}>
                {aiSummary.recommendations.map((rec, i) => (
                  <View key={i} style={styles.aiRecRow}>
                    <Sparkles size={14} color={Palette.secondary} fill={Palette.secondary} />
                    <Text style={styles.aiRecText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Spending Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Xərc Dinamikası</Text>
            <View style={styles.trendBadge}>
              {getTrendIcon()}
              <Text style={styles.trendText}>
                {aiSummary?.spendingTrend === 'increasing' ? 'Artır' : 'Azalır'}
              </Text>
            </View>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'week' && styles.tabActive]}
              onPress={() => setActiveTab('week')}
            >
              <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>Həftəlik</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'month' && styles.tabActive]}
              onPress={() => setActiveTab('month')}
            >
              <Text style={[styles.tabText, activeTab === 'month' && styles.tabTextActive]}>Aylıq</Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={lineChartData}
            width={CHART_WIDTH}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Categories Pie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kateqoriya Bölgüsü</Text>
          <View style={styles.pieContainer}>
            <PieChart
              data={pieChartData}
              width={CHART_WIDTH}
              height={200}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              chartConfig={chartConfig}
              absolute
            />
          </View>
        </View>

        {/* Prediction & Savings */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Gələn həftə proqnozu</Text>
            <Text style={styles.statValue}>~{insights.spendingPrediction.nextWeekEstimate}₼</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
            <Text style={[styles.statLabel, { color: Palette.primary }]}>Qənaət potensialı</Text>
            <Text style={[styles.statValue, { color: Palette.primary }]}>{insights.savingsOpportunity.potential}₼</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    overflow: 'hidden',
    paddingBottom: 20,
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 120,
  },
  aiCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  aiGradient: {
    padding: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  aiHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  aiRecs: {
    gap: 10,
  },
  aiRecRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aiRecText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: Palette.primary,
    fontWeight: '800',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieContainer: {
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
  },
});
