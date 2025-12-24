import { Palette } from '@/constants/theme';
import { FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS } from '@/data/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Plus, Sparkles } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function AIRecommendationsScreen() {
  const renderAIProduct = (product: typeof RECOMMENDED_PRODUCTS[0], index: number) => (
    <View key={product.id} style={styles.aiProductCard}>
      <View style={styles.aiCardInner}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.aiBadge}>
            <Sparkles size={10} color="#FFD700" />
            <Text style={styles.aiBadgeText}>{98 - index * 3}% Uyğunluq</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton}>
            <Heart size={16} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.categoryName}>{product.category.toLowerCase()}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceColumn}>
              <Text style={styles.currentPrice}>{product.price.toFixed(2)} ₼</Text>
              {product.isDiscount && (
                <View style={styles.oldPriceContainer}>
                  <Text style={styles.oldPrice}>
                    {(product.price * 1.25).toFixed(2)} ₼
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.plusButton}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.primary} />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Premium AI Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[Palette.primary, '#055a3c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTextSection}>
                <View style={styles.aiChip}>
                  <Sparkles size={12} color={Palette.secondary} />
                  <Text style={styles.aiChipText}>OBA SMART AI</Text>
                </View>
                <Text style={styles.headerTitle}>Sizin Üçün</Text>
                <Text style={styles.headerSubtitle}>Gündəlik fərdi seçim</Text>
              </View>

              <View style={styles.aiVisualContainer}>
                <View style={styles.aiIconCircle}>
                  <Sparkles size={40} color={Palette.secondary} strokeWidth={1.5} />
                </View>
                <LinearGradient
                  colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0)']}
                  style={styles.aiGlow}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats - Fixed positioning */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>15%</Text>
              <Text style={styles.statLabel}>Qənaət</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>#1</Text>
              <Text style={styles.statLabel}>Seçim</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>Təzə</Text>
              <Text style={styles.statLabel}>Məhsul</Text>
            </View>
          </View>
        </View>

        {/* Content with proper spacing */}
        <View style={styles.scrollContent}>
          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Ağıllı Seçim</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton}>
              <Text style={styles.refreshText}>Yenilə</Text>
            </TouchableOpacity>
          </View>

          {/* AI Product Grid */}
          <View style={styles.aiGrid}>
            {RECOMMENDED_PRODUCTS.slice(0, 4).map((p, i) => renderAIProduct(p, i))}
          </View>

          {/* AI Insight Banner */}
          <View style={styles.insightBanner}>
            <LinearGradient
              colors={['#f0fdf4', '#f9fbf3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightGradient}
            >
              <View style={styles.insightIconWrapper}>
                <Sparkles size={24} color={Palette.primary} />
              </View>
              <View style={styles.insightTextContent}>
                <Text style={styles.insightTitle}>AI Təhlili</Text>
                <Text style={styles.insightDesc}>
                  Siz adətən Çərşənbə günləri "Süd" alırsınız. Sizin üçün endirim əlavə etdik.
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Trending Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Trenddə olanlar</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {FEATURED_PRODUCTS.map((product) => (
              <View key={product.id} style={styles.trendingCard}>
                <View style={styles.trendingImageContainer}>
                  <Image source={{ uri: product.image }} style={styles.trendingImage} />
                </View>
                <View style={styles.trendingInfo}>
                  <Text style={styles.trendingName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.trendingPrice}>{product.price.toFixed(2)} ₼</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
 
  headerGradient: {
    paddingBottom: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
  },
  headerTextSection: {
    flex: 1,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  aiChipText: {
    color: Palette.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },
  aiVisualContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  aiGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    zIndex: 1,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: -30,
    zIndex: 100,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  refreshButton: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  refreshText: {
    color: Palette.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  aiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 30,
  },
  aiProductCard: {
    width: CARD_WIDTH,
  },
  aiCardInner: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#fcfcfc',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 103, 56, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 32,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  productInfo: {
    marginTop: 14,
    paddingHorizontal: 4,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceColumn: {
    flexDirection: 'column',
    gap: 2,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.primary,
  },
  oldPriceContainer: {
    marginTop: -2,
  },
  oldPrice: {
    fontSize: 12,
    color: '#ccc',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  insightBanner: {
    marginHorizontal: 24,
    marginBottom: 35,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  insightGradient: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    gap: 18,
  },
  insightIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  insightTextContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Palette.primary,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontWeight: '500',
  },
  trendingScroll: {
    paddingHorizontal: 24,
    gap: 18,
    paddingBottom: 20,
  },
  trendingCard: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  trendingImageContainer: {
    height: 130,
    backgroundColor: '#fcfcfc',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trendingImage: {
    width: '75%',
    height: '75%',
    resizeMode: 'contain',
  },
  trendingInfo: {
    paddingHorizontal: 4,
  },
  trendingName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.primary,
    marginTop: 6,
  },
});