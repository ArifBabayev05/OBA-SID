import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Receipt as ReceiptIcon,
  ScanLine,
  ShoppingBag,
  Sparkles,
  Tag,
  Wallet,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import { router, Href } from 'expo-router';
import { CustomModal } from '@/components/CustomModal';
import { UserProfile, Product } from '@/types';
import { getUserProfile } from '@/services/storageService';
import { getDatasetEntries, DatasetEntry } from '@/services/datasetService';
import { CATEGORIES, FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS } from '@/data/mockData';
import { checkAndUnlockAchievements } from '@/services/achievementsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
} as const;

const VAT_RATE = 0.18;

type ReceiptStats = {
  monthlySpend: number;
  totalSpend: number;
  cashback: number;
  receiptsCount: number;
};

const EMPTY_STATS: ReceiptStats = {
  monthlySpend: 0,
  totalSpend: 0,
  cashback: 0,
  receiptsCount: 0,
};

const parseReceiptDate = (value?: string) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeAmount = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[^\d,.-]/g, '')
      .replace(/,/g, '.')
      .replace(/(\..*)\./g, '$1'); // keep first dot
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

const collectReceiptStats = (entries: DatasetEntry[]): ReceiptStats => {
  if (!entries.length) {
    return { ...EMPTY_STATS };
  }

  const now = new Date();
  let monthlySpend = 0;
  let totalSpend = 0;
  let cashback = 0;

  entries.forEach(entry => {
    const amount = normalizeAmount(entry.totalAmount);
    totalSpend += amount;

    const receiptDate = parseReceiptDate(entry.createdAt);
    if (
      receiptDate &&
      receiptDate.getMonth() === now.getMonth() &&
      receiptDate.getFullYear() === now.getFullYear()
    ) {
      monthlySpend += amount;
    }

    // Calculate VAT from total (18%)
    const vatAmount = amount * VAT_RATE;
    cashback += vatAmount;
  });

  return {
    monthlySpend,
    totalSpend,
    cashback,
    receiptsCount: entries.length,
  };
};

const formatCurrency = (value: number) => {
  const digits = value === 0 || Math.abs(value) >= 100 ? 0 : 1;
  return `${value.toLocaleString('az-AZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ₼`;
};

type ModalType = 'success' | 'error' | 'info' | 'warning';

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: typeof ScanLine;
  gradient: [string, string];
  route?: Href;
  modalMessage?: string;
};

const PRIMARY_CTA = [
  {
    id: 'scan',
    title: 'Qəbz skan et',
    subtitle: 'ƏDV balansını artır',
    icon: ReceiptIcon,
    gradient: ['#2563eb', '#7c3aed'],
    route: '/(tabs)/scan' as Href,
  },
  {
    id: 'smartLens',
    title: 'Smart Lens',
    subtitle: 'Məhsulu tanı və müqayisə et',
    icon: Zap,
    gradient: ['#f97316', '#ec4899'],
    route: '/(tabs)/scan?mode=product' as Href,
  },
];

const FLOW_STEPS = [
  {
    id: 'flow-1',
    title: 'Smart Lens',
    description: 'Məhsulun şəklini çək, ən ucuz mağazanı tap.',
  },
  {
    id: 'flow-2',
    title: 'Qəbz skan et',
    description: 'ƏDV cashback əlavə olunsun və tarixçən saxlansın.',
  },
  {
    id: 'flow-3',
    title: 'AI tövsiyələri',
    description: 'AI büdcəni analiz edib sənin üçün plan hazırlasın.',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'scan',
    label: 'Qəbzi skan et',
    hint: 'ƏDV-ni geri al',
    icon: ScanLine,
    gradient: ['#4ade80', '#22c55e'],
    route: '/(tabs)/scan',
  },
  {
    id: 'offers',
    label: 'Təkliflər',
    hint: 'Fərdi kampaniyalar',
    icon: Sparkles,
    gradient: ['#facc15', '#f97316'],
    modalMessage: 'Sənin üçün uyğunlaşdırılmış kampaniyalar tezliklə aktiv olacaq.',
  },
  {
    id: 'wallet',
    label: 'Kartlarım',
    hint: 'Loyalty kartını göstər',
    icon: Wallet,
    gradient: ['#93c5fd', '#3b82f6'],
    route: '/(tabs)/profile',
  },
  {
    id: 'branches',
    label: 'Filiallar',
    hint: 'Yaxın marketlər',
    icon: MapPin,
    gradient: ['#fda4af', '#fb7185'],
    route: '/(tabs)/branches',
  },
];

const WEEKLY_PROMOS = [
  {
    id: 'veg',
    title: 'Təzə tərəvəz',
    subtitle: 'Səhər gətirilmiş məhsul',
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80',
    accent: '#4ade80',
  },
  {
    id: 'bakery',
    title: 'Soba isti çörək',
    subtitle: '2 al 1 hədiyyə',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    accent: '#fbbf24',
  },
  {
    id: 'dairy',
    title: 'Süd məhsulları',
    subtitle: 'Soyudulmuş seçim',
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80',
    accent: '#60a5fa',
  },
];

const SPOTLIGHT_STORES = [
  { id: '1', name: 'Xətai Market Mərkəzi', distance: '650 m', hours: '08:00 - 23:00', status: 'Açıq' },
  { id: '2', name: 'Port Mall Market', distance: '1.1 km', hours: '09:00 - 22:00', status: 'Açıq' },
  { id: '3', name: '28 May Ailə Marketi', distance: '1.6 km', hours: '07:30 - 23:30', status: 'Açıq' },
];

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<DatasetEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: ModalType }>({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, datasetEntries] = await Promise.all([getUserProfile(), getDatasetEntries()]);
        setUserProfile(profile);
        setEntries(datasetEntries);
        
        // Sync achievements
        await checkAndUnlockAchievements(datasetEntries);
        
      } catch (error) {
        console.warn('Failed to load profile or entries', error);
      }
    };

    load();
  }, []);

  const nextTierTarget = 2000;
  const stats = useMemo(() => collectReceiptStats(entries), [entries]);
  const { monthlySpend, totalSpend, cashback, receiptsCount } = stats;
  const cashbackBalance = cashback;
  const tierProgress = useMemo(
    () => Math.min(1, cashbackBalance / nextTierTarget),
    [cashbackBalance, nextTierTarget],
  );
  const remainingToNextTier = Math.max(nextTierTarget - cashbackBalance, 0);

  const highlights = useMemo(
    () => [
      { id: 'spend', label: 'Bu ay xərclədin', value: formatCurrency(monthlySpend) },
      { id: 'cashback', label: 'Geri aldığın ƏDV', value: formatCurrency(cashbackBalance) },
      { id: 'total', label: 'Ümumi xərclədin', value: formatCurrency(totalSpend) },
      { id: 'receipts', label: 'Skanlar', value: `${receiptsCount} qəbz` },
    ],
    [monthlySpend, cashbackBalance, totalSpend, receiptsCount],
  );

  const showModal = (title: string, message: string, type: ModalType = 'info') => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleQuickActionPress = (action: QuickAction) => {
    if (action.route) {
      router.push(action.route);
      return;
    }

    showModal(action.label, action.modalMessage ?? 'Bu bölmə tezliklə aktiv olacaq.', 'info');
  };

  const handlePromoPress = (promo: (typeof WEEKLY_PROMOS)[number]) => {
    showModal('Kampaniya', `${promo.title} • ${promo.subtitle}`, 'info');
  };

  const handlePrimaryCtaPress = (route: Href) => {
    router.push(route);
  };

  const renderProductCard = (product: Product, variant: 'primary' | 'secondary' = 'primary') => (
    <TouchableOpacity
      key={`${variant}-${product.id}`}
      style={[styles.productCard, variant === 'secondary' && styles.productCardSecondary]}
      onPress={() => router.push('/(tabs)/products')}
      activeOpacity={0.9}
    >
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.productMeta}>
        <Text style={styles.productStore}>{product.store}</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
      </View>
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>
          {product.price.toFixed(2)}
          <Text style={styles.currency}> ₼</Text>
        </Text>
        {product.isDiscount && (
          <View style={styles.discountBadge}>
            <Tag size={14} color="#fb923c" />
            <Text style={styles.discountText}>-15%</Text>
        </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[COLORS.surface, COLORS.background]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.eyebrow}>Loyalty paneli</Text>
                <Text style={styles.heroTitle}>
                  Salam, {userProfile?.name || 'dəyərli müştəri'} 👋
                </Text>
                <Text style={styles.heroSubtitle}>Skan etdiyin qəbzlərdən toplanan keşbek və xərcləri izləyin.</Text>
              </View>
            
            </View>
            <View style={styles.primaryCtaRow}>
              {PRIMARY_CTA.map(cta => {
                const Icon = cta.icon;
                return (
                  <TouchableOpacity
                    key={cta.id}
                    style={styles.primaryCtaCard}
                    activeOpacity={0.9}
                    onPress={() => handlePrimaryCtaPress(cta.route)}
                  >
                    <LinearGradient colors={cta.gradient as [string, string]} style={styles.primaryCtaGradient}>
                      <View style={styles.primaryCtaIcon}>
                        <Icon size={20} color="#fff" />
                      </View>
                      <Text style={styles.primaryCtaTitle}>{cta.title}</Text>
                      <Text style={styles.primaryCtaSubtitle}>{cta.subtitle}</Text>
                      <View style={styles.primaryCtaFooter}>
                        <Text style={styles.primaryCtaLink}>Başla</Text>
                        <ArrowRight size={14} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.heroStatsRow}>
              {highlights.map(item => (
                <View key={item.id} style={styles.heroStat}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Silver Plus üçün qalıq</Text>
                <Text style={styles.progressValue}>
                  {Math.max(Math.ceil(remainingToNextTier), 0)} bal
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
        </View>
              <Text style={styles.progressHint}>2000 bala çatanda bütün marketlərdə +5% keşbek.</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
              <View>
                <Text style={styles.loyaltyLabel}>Aktiv ƏDV balansı</Text>
                <Text style={styles.loyaltyValue}>{formatCurrency(cashbackBalance)}</Text>
              </View>
              <View style={styles.loyaltyPill}>
                <Sparkles size={16} color="#4ade80" />
                <Text style={styles.loyaltyPillText}>Cashback</Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardNumber}>2000 9876 4412 0099</Text>
              <ReceiptIcon size={18} color="#94a3b8" />
            </View>
            <View style={styles.barcodeContainer}>
              <View style={styles.barcode}>
                {[...Array(36)].map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: Math.random() > 0.5 ? 3 : 5,
                      height: '100%',
                      backgroundColor: '#0f172a',
                    }}
                  />
                ))}
              </View>
              <Text style={styles.barcodeHint}>Kassada bu kodu göstər</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sürətli əməliyyatlar</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.sectionLink}>Hamısını gör</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickCard}
                    activeOpacity={0.92}
                    onPress={() => handleQuickActionPress(action)}
                  >
                    <LinearGradient colors={action.gradient} style={styles.quickIcon}>
                      <Icon size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.quickLabel}>{action.label}</Text>
                    <Text style={styles.quickHint}>{action.hint}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Həftəlik kampaniyalar</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={styles.sectionLink}>Təkliflər</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promoRow}
            >
              {WEEKLY_PROMOS.map(promo => (
                <TouchableOpacity
                  key={promo.id}
                  style={styles.promoCard}
                  activeOpacity={0.9}
                  onPress={() => handlePromoPress(promo)}
                >
                  <Image source={{ uri: promo.image }} style={styles.promoImage} />
                  <LinearGradient
                    colors={['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.85)']}
                    style={styles.promoGradient}
                  />
                  <View style={styles.promoTextBlock}>
                    <View style={[styles.promoAccentDot, { backgroundColor: promo.accent }]} />
                    <Text style={styles.promoTitle}>{promo.title}</Text>
                    <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                  </View>
            </TouchableOpacity>
              ))}
            </ScrollView>
          </View>


          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Təzə fürsətlər</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={styles.sectionLink}>Daha çox</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productRow}
            >
              {FEATURED_PRODUCTS.map(product => renderProductCard(product, 'primary'))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sənə tövsiyələr</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={styles.sectionLink}>Bütün məhsullar</Text>
          </TouchableOpacity>
            </View>
            <View style={styles.recommendations}>
              {RECOMMENDED_PRODUCTS.slice(0, 4).map(product => renderProductCard(product, 'secondary'))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yaxın filiallar</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/branches')}>
                <Text style={styles.sectionLink}>Xəritədə aç</Text>
            </TouchableOpacity>
            </View>
            {SPOTLIGHT_STORES.map(store => (
              <View key={store.id} style={styles.storeCard}>
                <View style={styles.storeLeft}>
                  <ShoppingBag size={18} color="#22c55e" />
                </View>
                <View style={styles.storeMeta}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeDetails}>
                    {store.distance} • {store.hours}
                  </Text>
                </View>
                <View style={styles.storeStatus}>
                  <View style={styles.statusDot} />
                  <Text style={styles.storeStatusText}>{store.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fabWrapper}
        activeOpacity={0.92}
        onPress={() => router.push('/(tabs)/scan')}
      >
        <LinearGradient colors={['#22d3ee', '#0ea5e9']} style={styles.fab}>
          <ScanLine size={20} color="#fff" />
          <Text style={styles.fabText}>Skan et</Text>
        </LinearGradient>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.62;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 140,
  },
  heroSection: {
    position: 'relative',
    paddingTop: 64,
    paddingBottom: 28,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    paddingHorizontal: 24,
    gap: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  eyebrow: {
    color: COLORS.accentSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  iconButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentWarning,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryCtaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryCtaCard: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  primaryCtaGradient: {
    padding: 16,
    borderRadius: 22,
    gap: 8,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  primaryCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryCtaSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  primaryCtaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryCtaLink: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  heroStat: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(16,28,52,0.65)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressBlock: {
    backgroundColor: 'rgba(16,28,52,0.8)',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  progressValue: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.accentPrimary,
  },
  progressHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 28,
  },
  loyaltyCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: COLORS.surface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  loyaltyValue: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  loyaltyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  loyaltyPillText: {
    color: COLORS.accentPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    color: COLORS.textPrimary,
    fontSize: 18,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
  barcodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  barcode: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 8,
  },
  barcodeHint: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionLink: {
    color: COLORS.accentSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  flowContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  flowCard: {
    flexBasis: '31%',
    backgroundColor: 'rgba(11, 21, 41, 0.8)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    gap: 8,
    minWidth: 120,
  },
  flowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  flowTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  flowDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  quickCard: {
    flexBasis: (SCREEN_WIDTH - 24 * 2 - 12) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickIcon: {
    height: 40,
    width: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontWeight: '600',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  quickHint: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  promoRow: {
    gap: 16,
    paddingVertical: 4,
  },
  promoCard: {
    width: SCREEN_WIDTH * 0.72,
    height: 170,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  promoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  promoTextBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    gap: 6,
  },
  promoAccentDot: {
    height: 6,
    width: 40,
    borderRadius: 999,
  },
  promoTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 20,
  },
  promoSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  categoryPill: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  productRow: {
    gap: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 24,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productCardSecondary: {
    width: '100%',
    marginRight: 0,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: 18,
    backgroundColor: '#1f2937',
  },
  productMeta: {
    gap: 4,
  },
  productStore: {
    color: COLORS.accentSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  currency: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: {
    color: COLORS.accentWarning,
    fontWeight: '600',
    fontSize: 12,
  },
  recommendations: {
    gap: 16,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storeLeft: {
    height: 42,
    width: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeMeta: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  storeDetails: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  storeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  storeStatusText: {
    color: COLORS.accentPrimary,
    fontWeight: '600',
  },
  // NEW: Insights & Achievement Cards
  quickInsightsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  insightGradient: {
    padding: 16,
    gap: 4,
  },
  insightTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  insightValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  insightSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  savingsBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.accentPrimary,
  },
  savingsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  savingsBannerText: {
    flex: 1,
    gap: 2,
  },
  savingsBannerTitle: {
    color: COLORS.accentPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  savingsBannerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  savingsBannerAmount: {
    color: COLORS.accentPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 999,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  helpButton: {
    position: 'absolute',
    right: 24,
    bottom: 42,
    alignItems: 'flex-end',
    gap: 8,
  },
  helpBubble: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  helpIcon: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
