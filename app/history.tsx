import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Sparkles, FileText, ShoppingBag, ExternalLink, CreditCard, Banknote } from 'lucide-react-native';
import { DatasetEntry, getDatasetEntries } from '@/services/datasetService';
import { buildInsights, InsightsResult } from '@/services/insightsService';
import { AISummary, getLatestAISummary } from '@/services/aiAdvisor';
import { LinearGradient } from 'expo-linear-gradient';

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

    // Try to detect payment method from raw items before filtering
    const hasCashless = item.items.some(p => p.name.toLowerCase().includes('cashless') || p.name.toLowerCase().includes('nağdsız'));
    const hasCash = item.items.some(p => p.name.toLowerCase().includes('cash') || p.name.toLowerCase().includes('nağd'));
    const isCashless = hasCashless || (!hasCash && hasCashless); // Default bias if ambiguous? Logic: if cashless mentioned it's likely card.

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

    // Şərt: 29 noyabr və 09:00-dan əvvəl
    const isBefore9AMonNov29 =
      date.getDate() === 29 &&
      date.getMonth() === 10 && 
      date.getHours() < 9;
    
    if (isBefore9AMonNov29) {
      date.setHours(date.getHours() + 6);
    }
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
            <ShoppingBag size={16} color="#4ade80" />
          </View>
          <View>
            <Text style={styles.storeName}>{item.storeName || 'Unknown store'}</Text>
            <Text style={styles.receiptDate}>{date.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.totalText}>{item.totalAmount.toFixed(2)}₼</Text>
      </View>
      
      <View style={styles.itemsList}>
        {filteredItems.map((product, index) => (
          <View key={`${item.id}-${index}`} style={styles.itemRow}>
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
      <LinearGradient
        colors={['#030617', '#0f172a', '#0b1229']}
        style={styles.backgroundGradient}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#e5e7eb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Insights</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadEntries}>
          <RefreshCw size={18} color="#e5e7eb" />
        </TouchableOpacity>
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color="#84cc16" />
                <Text style={styles.sectionTitle}>AI analysis</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Fərdiləşdirilmiş qənaət məsləhətləri
              </Text>
            </View>
            {!aiSummary ? (
              <Text style={styles.emptyText}>Scan a receipt to unlock insights.</Text>
            ) : (
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>{aiSummary.headline}</Text>
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
                  <FileText size={18} color="#34d399" />
                  <Text style={styles.sectionTitle}>Top purchased products</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Monthly spend: {insights.monthlySpend.toFixed(2)}₼</Text>
              </View>
              {insights.topProducts.map((product) => (
                <View key={product.name} style={styles.topProductRow}>
                  <Text style={styles.topProductName}>{product.name}</Text>
                  <Text style={styles.topProductMeta}>x{product.count} · {product.lastPrice?.toFixed(2) ?? '—'}₼</Text>
                </View>
              ))}
            </View>

            {insights.priceAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={18} color="#fbbf24" />
                  <Text style={styles.sectionTitle}>Price movement alerts</Text>
                </View>
                {insights.priceAlerts.map((alert, idx) => (
                  <View key={`alert-${idx}`} style={styles.alertCard}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertBody}>{alert.body}</Text>
                  </View>
                ))}
              </View>
            )}

            {insights.replenishment.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={18} color="#a78bfa" />
                  <Text style={styles.sectionTitle}>Upcoming restocks</Text>
                </View>
                {insights.replenishment.map((item, idx) => (
                  <View key={`restock-${idx}`} style={styles.alertCard}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertBody}>{item.body}</Text>
                  </View>
                ))}
              </View>
            )}

            {insights.promotionMatches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={18} color="#60a5fa" />
                  <Text style={styles.sectionTitle}>Recommended promotions</Text>
                </View>
                {insights.promotionMatches.map((promo, idx) => (
                  <View key={`promo-${idx}`} style={styles.promoCard}>
                    <Text style={styles.insightTitle}>{promo.title}</Text>
                    <Text style={styles.insightBody}>{promo.body}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 20 }} />

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={32} color="#6b7280" />
            <Text style={styles.emptyText}>No receipts have been scanned yet.</Text>
            <Text style={styles.emptySubtext}>Scan a QR or photo to build your dataset.</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={28} color="#6b7280" />
            <Text style={styles.emptyText}>Bu filtr üçün nəticə yoxdur.</Text>
            <Text style={styles.emptySubtext}>Vaxt intervalını dəyişin və ya daha çox qəbz skan edin.</Text>
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
    backgroundColor: '#0f172a',
    paddingTop: 56,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    backgroundColor: 'rgba(15,23,42,0.8)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#818cf8',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#c7d2fe',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
  },
  datasetMeta: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  datasetPath: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  insightCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  insightTitle: {
    color: '#cbd5f5',
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 14,
  },
  insightBody: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    width: '92%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
    marginTop: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(59,130,246,0.3)',
    marginTop: 4,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    
    width: '60%',
  },
  storeIconBg: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    color: '#f3f4f6',
    fontWeight: '600',
    fontSize: 15,
  },
  receiptDate: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  totalText: {
    color: '#84cc16',
    fontWeight: 'bold',
    fontSize: 18,
  },
  itemsList: {
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    color: '#cbd5e1',
    flex: 1,
    marginRight: 12,
    fontSize: 13,
  },
  itemPrice: {
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: 13,
  },
  noItemsText: {
     color: '#64748b',
     fontSize: 13,
     fontStyle: 'italic',
     textAlign: 'center',
     paddingVertical: 8,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  viewReceiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewReceiptText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
  },
  topProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  topProductName: {
    color: '#f3f4f6',
    fontWeight: '500',
  },
  topProductMeta: {
    color: '#9ca3af',
    fontSize: 12,
  },
  alertCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 10,
  },
  alertTitle: {
    color: '#f472b6',
    fontWeight: '600',
    marginBottom: 4,
  },
  alertBody: {
    color: '#cbd5f5',
    fontSize: 13,
  },
  promoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginTop: 10,
  },
});

