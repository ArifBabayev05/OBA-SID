import { Palette, Shadows } from '@/constants/theme';
import { getUserProfile } from '@/services/storageService';
import { UserProfile } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  Heart,
  History,
  Maximize2,
  Percent,
  Phone,
  ScanLine,
  Smile,
  X,
  Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  { id: 'favorites', label: 'Seçilmiş\nMəhsullar', icon: Heart, route: '/(tabs)/profile' },
];

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
    };
    load();
  }, []);

  const handleStoryPress = (index: number) => {
    setSelectedStory(STORIES[index]);
    setStoryModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Premium Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[Palette.primaryDark, Palette.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBg}
          >
            <SafeAreaView style={styles.headerSafe}>
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                      <Smile size={28} color="#fff" strokeWidth={1.5} />
                    </View>
                    <View style={styles.onlineBadge} />
                  </View>
                  <View>
                    <Text style={styles.greetingText}>Xoş gəlmisiniz,</Text>
                    <Text style={styles.nameText}>Qonşu</Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Phone size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.push('/notifications')}
                  >
                    <Bell size={22} color="#fff" />
                    <View style={styles.notifDot} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Enhanced Stories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScroll}
              >
                {STORIES.map((story, index) => (
                  <TouchableOpacity
                    key={story.id}
                    style={styles.storyContainer}
                    activeOpacity={0.8}
                    onPress={() => handleStoryPress(index)}
                  >
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

        {/* Premium Loyalty Card */}
        <View style={styles.cardSection}>
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.loyaltyCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>OBA Bonus</Text>
                  <View style={styles.balanceRow}>
                    <Text style={styles.currencySymbol}>₼</Text>
                    <Text style={styles.balanceAmount}>16.30</Text>
                  </View>
                </View>
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png' }}
                  style={styles.qrCode}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.barcodeClickArea}
                onPress={() => setBarcodeModalVisible(true)}
              >
                <View style={styles.visualBarcode}>
                  {[...Array(40)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.vBarLine,
                        {
                          width: Math.random() > 0.5 ? 2 : 4,
                          backgroundColor: '#1a1a1a',
                          height: '100%'
                        }
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>

              {/* Decorative Elements */}
              <View style={styles.cardDecoCircle} />
            </LinearGradient>
          </View>
        </View>

        {/* Main Actions Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.scanCard]}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Palette.primary, Palette.primaryDark]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.actionContent}>
              <View style={styles.actionIconCircle}>
                <ScanLine size={24} color={Palette.primary} />
              </View>
              <Text style={styles.actionTitleLight}>Qəbz skan</Text>
              <Text style={styles.actionSubtitleLight}>Bonus qazan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.lensCard]}
            onPress={() => router.push({ pathname: '/(tabs)/scan', params: { mode: 'product' } })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Palette.secondary, '#FBbf24']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.actionContent}>
              <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                <Zap size={24} color="#854d0e" fill="#854d0e" />
              </View>
              <Text style={styles.actionTitleDark}>Smart Lens</Text>
              <Text style={styles.actionSubtitleDark}>Qiymət oxu</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionHeader}>Xidmətlər</Text>
          <View style={styles.servicesGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.serviceItem}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.serviceIconBox}>
                  <action.icon size={24} color={Palette.primary} />
                </View>
                <Text style={styles.serviceLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearest Store Widget */}
        <View style={styles.widgetSection}>
          <View style={styles.widgetHeader}>
            <Text style={styles.sectionHeader}>Ən yaxın filial</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/branches')}>
              <Text style={styles.linkText}>Hamısı</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.storeCard}
            onPress={() => router.push('/(tabs)/branches')}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: 'https://oba.az/site/assets/files/3430/keyfiyyetin_yol_xeritesi.png' }}
              style={styles.storeMapImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.storeOverlay}
            />
            <View style={styles.storeContent}>
              <View style={styles.storeBadge}>
                <Text style={styles.storeBadgeText}>Açıqdır</Text>
              </View>
              <View>
                <Text style={styles.storeName}>OBA - Nərimanov 19</Text>
                <Text style={styles.storeAddress}>Aşıq Molla Cümə küç. 19 | 1.9 km</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Story Viewer Modal */}
      <Modal
        visible={storyModalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setStoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <View style={styles.modalUser}>
                <Image
                  source={{ uri: selectedStory?.image }}
                  style={[styles.storyImage, styles.storyAvatarSmall]}
                />
                <View>
                  <Text style={styles.modalUserName}>{selectedStory?.title}</Text>
                  <Text style={styles.modalTime}>2 saat əvvəl</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setStoryModalVisible(false)} style={styles.closeButton}>
                <X size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
              onMomentumScrollEnd={(ev) => {
                const index = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                if (STORIES[index]) setSelectedStory(STORIES[index]);
              }}
              contentOffset={{ x: (STORIES.findIndex(s => s.id === selectedStory?.id) || 0) * SCREEN_WIDTH, y: 0 }}
            >
              {STORIES.map((story) => (
                <View key={story.id} style={{ width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri: story.image }}
                    style={styles.fullStoryImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.seenButton}>
                <Text style={styles.seenText}>Ətraflı</Text>
                <Maximize2 size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Barcode Modal */}
      <Modal
        visible={barcodeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBarcodeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBarcodeModalVisible(false)}>
          <Pressable style={styles.barcodeModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.barcodeHeader}>
              <Text style={styles.barcodeTitle}>OBA Bonus Kartı</Text>
            </View>
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=OBABONUS' }}
                style={styles.modalQrCode}
                resizeMode="contain"
              />
              <Text style={styles.qrText}>Skan etmək üçün kassirə göstərin</Text>
            </View>
            <Text style={styles.cardNumber}>1000 0000 0010 3737</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background for contrast
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: Palette.primary,
    ...Shadows.medium,
  },
  headerBg: {
    paddingBottom: 40,
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Palette.secondary,
    borderWidth: 2,
    borderColor: Palette.primary,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  nameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.error,
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },
  storiesScroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 20,
  },
  storyContainer: {
    alignItems: 'center',
    gap: 8,
    width: 72,
  },
  storyGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSection: {
    marginTop: -30,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  cardContainer: {
    ...Shadows.large,
  },
  loyaltyCard: {
    borderRadius: 24,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.primary,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: Palette.primary,
    letterSpacing: -1,
  },
  qrCode: {
    width: 90,
    height: 90,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumberContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  cardNumber: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontWeight: '600',
    color: '#333',
    letterSpacing: 1,
  },
  cardActionButton: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    ...Shadows.small,
  },
  cardActionText: {
    color: Palette.secondary,
    fontWeight: '900',
    fontSize: 16,
    fontStyle: 'italic',
  },
  barcodeClickArea: {
    height: 50,
    justifyContent: 'flex-end',
    width: '100%',
  },
  visualBarcode: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
    width: '100%',
    paddingHorizontal: 10,
  },
  vBarLine: {
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  modalUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storyAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fff',
  },
  modalUserName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
  },
  fullStoryImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  modalFooter: {
    padding: 24,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  seenButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    backdropFilter: 'blur(10px)',
  },
  seenText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardDecoCircle: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Palette.lightGreen,
    opacity: 0.5,
    zIndex: -1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  barcodeModalContent: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    ...Shadows.large,
  },
  barcodeHeader: {
    marginBottom: 24,
  },
  barcodeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.primary,
  },
  qrContainer: {
    alignItems: 'center',
    gap: 16,
  },
  modalQrCode: {
    width: 250,
    height: 250,
  },
  qrText: {
    color: '#666',
    fontWeight: '600',
    marginTop: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginTop: 24,
  },
  actionCard: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.medium,
  },
  scanCard: {
    backgroundColor: Palette.primary,
  },
  lensCard: {
    backgroundColor: Palette.secondary,
  },
  actionContent: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitleLight: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  actionSubtitleLight: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  actionTitleDark: {
    color: '#713f12', // Darker yellow/brown
    fontSize: 16,
    fontWeight: '800',
  },
  actionSubtitleDark: {
    color: '#854d0e',
    fontSize: 12,
    fontWeight: '600',
  },
  servicesSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    ...Shadows.small,
  },
  serviceItem: {
    alignItems: 'center',
    gap: 8,
    width: '22%',
  },
  serviceIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Palette.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  widgetSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  storeCard: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
    ...Shadows.medium,
  },
  storeMapImage: {
    width: '100%',
    height: '100%',
  },
  storeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  storeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  storeBadge: {
    position: 'absolute',
    top: -100, // Relative to content bottom, so this moves it up to top right of card
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    ...Shadows.small,
  },
  storeBadgeText: {
    color: Palette.success,
    fontSize: 12,
    fontWeight: '800',
  },
  storeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  storeAddress: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
});
