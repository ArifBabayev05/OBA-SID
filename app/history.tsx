import { Palette, Shadows } from '@/constants/theme';
import { AISummary, getLatestAISummary } from '@/services/aiAdvisor';
import { DatasetEntry, getDatasetEntries } from '@/services/datasetService';
import { buildInsights, InsightsResult } from '@/services/insightsService';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Banknote, CreditCard, ExternalLink, FileText, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const IGNORED_ITEMS = [
  'cash', 'cashless', 'bonus', 'prepayment', 'credit', 'nağd', 'nağdsız',
  'kart', 'mastercard', 'visa', 'change', 'qalıq', 'fiscal', 'fisqal', 'receipt', 'qəbz'
];

export default function HistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<DatasetEntry[]>([]);
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const data = await getDatasetEntries();
    setEntries(data);
    setInsights(buildInsights(data));
    setAiSummary(await getLatestAISummary());
  };

  const filteredEntries = useMemo(() => {
    if (timeFilter === 'all') {
      return entries;
    }

    const now = new Date();
    return entries.filter(entry => {
      const date = new Date(entry.createdAt);
      if (Number.isNaN(date.getTime())) return false;

      if (timeFilter === 'week') {
        const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [entries, timeFilter]);

  const renderEntry = ({ item, index }: { item: DatasetEntry; index: number }) => {
    const filteredItems = item.items.filter(p =>
      !IGNORED_ITEMS.some(ignored => p.name.toLowerCase().includes(ignored))
    );

    const hasCashless = item.items.some(p => p.name.toLowerCase().includes('cashless') || p.name.toLowerCase().includes('nağdsız'));
    const isCashless = hasCashless;

    const handleOpenReceipt = () => {
      if (item.fiscalId) {
        const url = `https://monitoring.e-kassa.gov.az/pks-monitoring/2.0.0/documents/${item.fiscalId}`;
        Linking.openURL(url).catch(err => {
          console.error('Failed to open URL:', err);
          Alert.alert('Xəta', 'Elektron qəbz açıla bilmədi.');
        });
      } else {
        Alert.alert('Məlumat', 'Bu qəbz üçün elektron versiya mövcud deyil (Fiscal ID tapılmadı).');
      }
    };

    const isLast = index === filteredEntries.length - 1;
    const date = new Date(item.createdAt);

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineIndicator}>
          <View style={styles.timelineDot} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptHeaderLeft}>
              <View style={styles.storeIconBg}>
                <ShoppingBag size={16} color={Palette.primary} />
              </View>
              <View style={styles.storeInfoColumn}>
                <Text style={styles.storeName} numberOfLines={1}>{item.storeName || 'OBA Market'}</Text>
                <Text style={styles.receiptDate}>{date.toLocaleString('az-AZ')}</Text>
              </View>
            </View>
            <Text style={styles.totalText}>{item.totalAmount.toFixed(2)}₼</Text>
          </View>

          <View style={styles.itemsList}>
            {filteredItems.map((product, idx) => (
              <View key={`${item.id}-${idx}`} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.itemPrice}>{product.price?.toFixed(2) ?? '0.00'}₼</Text>
              </View>
            ))}
            {filteredItems.length === 0 && (
              <Text style={styles.noItemsText}>Məhsul siyahısı yoxdur</Text>
            )}
          </View>

          <View style={styles.receiptFooter}>
            <View style={styles.paymentInfo}>
              {isCashless ? (
                <>
                  <CreditCard size={14} color="#94a3b8" />
                  <Text style={styles.paymentText}>Nağdsız</Text>
                </>
              ) : (
                <>
                  <Banknote size={14} color="#94a3b8" />
                  <Text style={styles.paymentText}>Nağd</Text>
                </>
              )}
            </View>
            <TouchableOpacity style={styles.viewReceiptLink} onPress={handleOpenReceipt}>
              <Text style={styles.viewReceiptText}>Elektron qəbz</Text>
              <ExternalLink size={12} color="#60a5fa" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[Palette.primaryDark, Palette.primary]}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Alış-veriş Tarixçəsi</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={loadEntries}>
                <RefreshCw size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <View style={styles.filterChipsRow}>
        {['all', 'week', 'month'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              timeFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setTimeFilter(filter as 'all' | 'week' | 'month')}
          >
            <Text
              style={[
                styles.filterChipText,
                timeFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter === 'all' ? 'Hamısı' : filter === 'week' ? 'Son 7 gün' : 'Bu ay'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={18} color={Palette.primary} />
              <Text style={styles.sectionTitle}>Süni İntellekt Analizi</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Fərdiləşdirilmiş qənaət məsləhətləri
            </Text>
          </View>
          {!aiSummary ? (
            <Text style={styles.emptyText}>Məlumatları görmək üçün qəbz skan edin.</Text>
          ) : (
            <View style={styles.insightCard}>
              <Text style={styles.insightHeadline}>{aiSummary.headline}</Text>
              {aiSummary.recommendations.map((rec, idx) => (
                <Text key={`rec-${idx}`} style={styles.insightBody}>
                  • {rec.replace(/^[-•\s]+/, '')}
                </Text>
              ))}
            </View>
          )}
        </View>

        {insights && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <FileText size={18} color={Palette.primary} />
                  <Text style={styles.sectionTitle}>Ən çox alınan məhsullar</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Aylıq xərc: {insights.monthlySpend.toFixed(2)}₼</Text>
              </View>
              {insights.topProducts.map((product) => (
                <View key={product.name} style={styles.topProductRow}>
                  <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.topProductMeta}>x{product.count} · {product.lastPrice?.toFixed(2) ?? '—'}₼</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 10 }} />

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Hələ heç bir qəbz skan edilməyib.</Text>
            <Text style={styles.emptySubtext}>Datasetinizi qurmaq üçün QR kodu skan edin.</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Bu filtr üçün nəticə yoxdur.</Text>
            <Text style={styles.emptySubtext}>Vaxt intervalını dəyişin.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    overflow: 'hidden',
    paddingBottom: 20,
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Shadows.medium,
  },
  headerGradient: {
    paddingBottom: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.small,
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
    ...Shadows.medium,
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    ...Shadows.medium,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  insightHeadline: {
    color: Palette.primary,
    fontWeight: '800',
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  insightBody: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 4,
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    flex: 1,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...Shadows.small,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  timelineIndicator: {
    alignItems: 'center',
    paddingTop: 10,
    width: 20,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: Palette.primary,
    ...Shadows.small,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 6,
    borderRadius: 1,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeInfoColumn: {
    flex: 1,
  },
  storeIconBg: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 16,
  },
  receiptDate: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  totalText: {
    color: Palette.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  itemsList: {
    gap: 12,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    color: '#475569',
    flex: 1,
    marginRight: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  itemPrice: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  noItemsText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: -20,
    marginBottom: -20,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  viewReceiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewReceiptText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
  },
  topProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topProductName: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  topProductMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 240,
  },
});
