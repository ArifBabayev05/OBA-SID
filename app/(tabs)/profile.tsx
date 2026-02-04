import { Palette, Shadows } from '@/constants/theme';
import { getDatasetEntries } from '@/services/datasetService';
import { buildInsights, InsightsResult } from '@/services/insightsService';
import { getUserProfile } from '@/services/storageService';
import { UserProfile } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Headphones,
  Heart,
  History,
  Info,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  XCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [insights, setInsights] = useState<InsightsResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const profile = await getUserProfile();
    const data = await getDatasetEntries();
    setUserProfile(profile);
    setEntries(data);
    setInsights(buildInsights(data));
  };

  const renderMenuItem = (icon: any, label: string, color: string = Palette.primary, isDestructive: boolean = false, route?: string) => {
    const Icon = icon;
    return (
      <TouchableOpacity
        style={[styles.menuItem, isDestructive && styles.destructiveItem]}
        activeOpacity={0.7}
        onPress={() => route && router.push(route as any)}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconContainer, { backgroundColor: isDestructive ? '#FEF2F2' : '#F9FBF9' }]}>
            <Icon size={20} color={isDestructive ? '#EF4444' : color} />
          </View>
          <Text style={[styles.menuItemLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
        </View>
        <ChevronRight size={18} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[Palette.primary, '#004d23']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Daha çox</Text>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Settings size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[Palette.secondary, '#FFD700']}
                  style={styles.avatarRing}
                >
                  <View style={styles.avatarInner}>
                    <Image
                      source={{ uri: 'https://ui-avatars.com/api/?name=Arif+Babayev&background=445566&color=fff&size=200' }}
                      style={styles.avatarImg}
                    />
                  </View>
                </LinearGradient>
                <TouchableOpacity style={styles.editBadge}>
                  <Pencil size={12} color={Palette.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>A4TB</Text>
                <View style={styles.loyaltyBadge}>
                  <ShieldCheck size={14} color={Palette.secondary} />
                  <Text style={styles.loyaltyText}>Qızıl Üzv</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dashboards Section (Replaces first 2 links) */}
        <View style={styles.dashboardGrid}>
          {/* Spending Summary Widget */}
          <TouchableOpacity
            style={styles.dashboardCard}
            onPress={() => router.push('/insights')}
            activeOpacity={0.8}
          >
            <View style={[styles.dashIconBox, { backgroundColor: '#F0FDF4' }]}>
              <TrendingUp size={20} color={Palette.primary} />
            </View>
            <View>
              <Text style={styles.dashLabel}>Aylıq Xərc</Text>
              <Text style={styles.dashValue}>{insights?.monthlySpend?.toFixed(2) ?? '0.00'}₼</Text>
              <Text style={styles.dashLink}>Analizə bax</Text>
            </View>
          </TouchableOpacity>

          {/* Quick History Widget */}
          <TouchableOpacity
            style={styles.dashboardCard}
            onPress={() => router.push('/history')}
            activeOpacity={0.8}
          >
            <View style={[styles.dashIconBox, { backgroundColor: '#EFF6FF' }]}>
              <History size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.dashLabel}>Son Alış</Text>
              <Text style={styles.dashValue}>
                {entries[0] ? new Date(entries[0].createdAt).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' }) : 'Yoxdur'}
              </Text>
              <Text style={[styles.dashLink, { color: '#3B82F6' }]}>Tarixçə</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesab Məlumatları</Text>
          <View style={styles.menuGroup}>
            {/* History and Analytics are now dashboards above */}
            {renderMenuItem(Lock, 'Şifrəni Dəyişdir')}
            {renderMenuItem(Bell, 'Bildirişlər', Palette.primary, false, '/notifications')}
            {renderMenuItem(Heart, 'Seçilmiş Məhsullar')}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dəstək və Hüquqi</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(Info, 'Haqqımızda')}
            {renderMenuItem(Search, 'Vakansiyalar')}
            {renderMenuItem(MapPin, 'Xəritədə tap', Palette.primary, false, '/(tabs)/branches')}
            {renderMenuItem(Headphones, 'Dəstək Mərkəzi')}
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.menuGroup}>
            {renderMenuItem(LogOut, 'Çıxış', '#666')}
            {renderMenuItem(XCircle, 'Hesabı Sil', '#EF4444', true)}
          </View>
        </View>

        <Text style={styles.versionText}>Versiya 2.4.0 (OBA Nəşri)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeArea: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#fff',
    padding: 2,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Palette.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loyaltyText: {
    color: Palette.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuGroup: {
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  destructiveItem: {
    backgroundColor: '#fff',
  },
  destructiveLabel: {
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 40,
  },
  dashboardGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  dashboardCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    ...Shadows.small,
  },
  dashIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  dashValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  dashLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
});
