import { Palette } from '@/constants/theme';
import { getUserProfile } from '@/services/storageService';
import { UserProfile } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Heart,
  History,
  Info,
  Percent,
  Phone,
  ScanLine,
  Smile,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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

const STORIES = [
  { id: '1', title: 'Endirim', image: 'https://strgimgr.umico.az/img/product/840/d3cde7ca-f6ce-41f8-b4a5-983a0fdadba9.jpeg' },
  { id: '2', title: 'Yeni', image: 'https://scontent.fgyd9-1.fna.fbcdn.net/v/t39.30808-6/482018534_940186548317026_94799934391601691_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=SEUs-PoiV4YQ7kNvwGV6fo-&_nc_oc=AdlNrJ_jLP27JPf3dRFtCq0ykm30Q5EbFBUXSB9IIKl4K0-A69WVFgfIQIO7trgOPdA&_nc_zt=23&_nc_ht=scontent.fgyd9-1.fna&_nc_gid=gdDdskoJfgw7wlqDKDtXhg&oh=00_AflS1FV3q8FbBGj6XBAYSDYZRgcX6clM-RXjOV889ylrvw&oe=6951E979' },
  { id: '3', title: 'Avtomobil', image: 'https://iqtisadiyyat.az/storage/posts/3995906f4836995.webp' },
  { id: '4', title: 'Hədiyyə', image: 'https://strgimgr.umico.az/img/product/840/0f4ade21-58e7-4b10-96ee-b4ddfd4d1aa2.jpeg' },
  { id: '5', title: 'Bayram', image: 'https://baku.ws/storage/photos/uploads/thumbs/large/lAFfkcxAo6Cusrc6ZILwszXWk11binSG6MMbYERA.webp' },
];

const QUICK_ACTIONS = [
  { id: 'history', label: 'Tarixçə', icon: History, route: '/history' },
  { id: 'savings', label: 'Qənaətim', icon: Percent, route: '/(tabs)/recommendations' },
  { id: 'howtouse', label: 'İstifadə qaydası', icon: Info, route: '/modal' },
  { id: 'favorites', label: 'Seçilmiş\nMəhsullar', icon: Heart, route: '/(tabs)/profile' },
];

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[Palette.primary, '#004d23']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBg}
          >
            <SafeAreaView style={styles.headerSafe}>
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatarWrapper}>
                    <Smile size={28} color="#fff" strokeWidth={1.5} />
                  </View>
                  <View>
                    <Text style={styles.greetingText}>Salam</Text>
                    <Text style={styles.nameText}>Qonşu</Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Phone size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Bell size={22} color="#fff" />
                    <View style={styles.notifDot} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stories */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.storiesScroll}
              >
                {STORIES.map((story) => (
                  <TouchableOpacity key={story.id} style={styles.storyContainer} activeOpacity={0.8}>
                    <LinearGradient
                      colors={[Palette.secondary, '#FFD700', Palette.primary]}
                      style={styles.storyGlow}
                    >
                      <View style={styles.storyCircle}>
                        <Image source={{ uri: story.image }} style={styles.storyImage} />
                      </View>
                    </LinearGradient>
                    <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* Floating Loyalty Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.loyaltyCard}>
            <View style={styles.cardMain}>
              <View>
                <View style={styles.cashbackRow}>
                  <Text style={styles.cashbackAmount}>16.3</Text>
                  <Text style={styles.cashbackSymbol}> ₼</Text>
                </View>
                <Text style={styles.cashbackSub}>Mövcud Cashback</Text>
              </View>
              <View style={styles.brandBadge}>
                <View style={styles.obaTag}>
                  <Text style={styles.obaTagText}>OBA</Text>
                </View>
                <Text style={styles.sloganText}>Qənaətin məkanı,{"\n"}OBAmızın ünvanı!</Text>
              </View>
            </View>
            
            <View style={styles.cardSeparator} />
            
            <View style={styles.barcodeSection}>
              <View style={styles.barcodeGraphics}>
                {[...Array(35)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.barcodeLine, 
                      { width: i % 4 === 0 ? 3 : 1.5, marginLeft: 2.5 }
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.barcodeNumbers}>1000 0000 0010 3737</Text>
            </View>
          </View>
        </View>

        {/* Primary Functional CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity 
            style={[styles.ctaPrimary, { backgroundColor: Palette.primary }]}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <ScanLine size={22} color="#fff" />
            <Text style={styles.ctaPrimaryText}>Qəbz skan et</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ctaPrimary, { backgroundColor: Palette.secondary }]}
            onPress={() => router.push({ pathname: '/(tabs)/scan', params: { mode: 'product' } })}
            activeOpacity={0.9}
          >
            <Zap size={22} color={Palette.primary} fill={Palette.primary} />
            <Text style={[styles.ctaPrimaryText, { color: Palette.primary }]}>Smart Lens</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Menu */}
        <View style={styles.quickMenu}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.menuItem}
              onPress={() => router.push(action.route as any)}
            >
              <View style={styles.menuIconBox}>
                <action.icon size={26} color={Palette.primary} />
              </View>
              <Text style={styles.menuLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map Preview Section */}
        <View style={styles.mapSection}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Ən yaxın OBA</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/branches')}>
              <Text style={styles.seeAllText}>Xəritədə göstər</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.mapPreviewCard}
            onPress={() => router.push('/(tabs)/branches')}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: 'https://oba.az/site/assets/files/3430/keyfiyyetin_yol_xeritesi.png' }}
              style={styles.mapBg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(36, 36, 36, 0.6)']}
              style={StyleSheet.absoluteFill}
            />
     
            <View style={styles.mapInfoOverlay}>
              <View>
                <Text style={styles.locName}>OBA-NERIMANOV 19</Text>
                <Text style={styles.locDist}>1.94 km məsafədə • 22:00-a qədər açıqdır</Text>
              </View>
              <View style={styles.goBtn}>
                <ChevronRight size={20} color={Palette.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    overflow: 'hidden',
  },
  headerBg: {
    paddingBottom: 50,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  greetingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  nameText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: -4,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.secondary,
    borderWidth: 2,
    borderColor: Palette.primary,
  },
  storiesScroll: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 16,
  },
  storyContainer: {
    alignItems: 'center',
    gap: 8,
  },
  storyGlow: {
    padding: 2.5,
    borderRadius: 36,
  },
  storyCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: Palette.primary,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 70,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: 24,
    marginTop: -40,
    zIndex: 10,
  },
  loyaltyCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cashbackRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cashbackAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: Palette.primary,
  },
  cashbackSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.primary,
  },
  cashbackSub: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginTop: -4,
  },
  brandBadge: {
    alignItems: 'flex-end',
  },
  obaTag: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  obaTagText: {
    color: Palette.secondary,
    fontWeight: '900',
    fontSize: 20,
    fontStyle: 'italic',
  },
  sloganText: {
    fontSize: 10,
    color: Palette.primary,
    textAlign: 'right',
    fontWeight: '700',
    lineHeight: 12,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginVertical: 20,
  },
  barcodeSection: {
    alignItems: 'center',
  },
  barcodeGraphics: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 1,
  },
  barcodeNumbers: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#444',
  },
  ctaRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 30,
    gap: 16,
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    borderRadius: 22,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  ctaPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  quickMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  menuItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 48) / 4,
  },
  menuIconBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#fcfcfc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    fontWeight: '700',
  },
  mapSection: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  seeAllText: {
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '700',
  },
  mapPreviewCard: {
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Palette.lightGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  mapBg: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mapMarker: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.primary,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  markerPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.primary,
    opacity: 0.3,
  },
  mapInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  locDist: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 2,
  },
  goBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
