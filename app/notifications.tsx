import { Palette, Shadows } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Gift,
  Megaphone,
  Percent,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NotificationType =
  | "promo"
  | "bonus"
  | "receipt"
  | "system"
  | "campaign"
  | "delivery";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  badge?: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "promo",
    title: "🎉 Həftəsonuna özel endirim!",
    message:
      "Bu həftəsonu bütün süd məhsullarında 25% endirim. Kampaniya 12 Fevral-a qədər keçərlidir.",
    time: "15 dəq əvvəl",
    isRead: false,
    badge: "Yeni",
  },
  {
    id: "2",
    type: "bonus",
    title: "Bonus hesabınıza köçürüldü",
    message: "Son alışınızdan 2.45₼ bonus qazandınız. Cari balans: 16.30₼",
    time: "1 saat əvvəl",
    isRead: false,
  },
  {
    id: "3",
    type: "campaign",
    title: "1 al 1 hədiyyə — Meyvə şirələri",
    message:
      "OBA brend meyvə şirələrində kampaniya başladı. Yalnız filiallarımızda.",
    time: "3 saat əvvəl",
    isRead: false,
    badge: "Kampaniya",
  },
  {
    id: "4",
    type: "receipt",
    title: "Qəbz uğurla emal edildi",
    message:
      "OBA Nərimanov 19 filialından 23.80₼ məbləğində qəbz əlavə olundu. 5 məhsul tapıldı.",
    time: "5 saat əvvəl",
    isRead: true,
  },
  {
    id: "5",
    type: "system",
    title: "Smart Lens yeniləndi",
    message:
      "Yeni versiya ilə daha dəqiq məhsul tanıma və qiymət müqayisəsi mümkündür.",
    time: "Dünən",
    isRead: true,
  },
  {
    id: "6",
    type: "promo",
    title: "OBA Club: Qızıl üzv olun",
    message:
      "Bu ay 200₼-dən çox alış-veriş edin və Qızıl üzv statusuna yüksəlin. Əlavə 5% bonus!",
    time: "Dünən",
    isRead: true,
    badge: "Üzvlük",
  },
  {
    id: "7",
    type: "delivery",
    title: "Çatdırılma xidməti artıq aktiv!",
    message:
      "İndi OBA məhsullarını evinizdən sifariş edə bilərsiniz. İlk sifarişdə çatdırılma pulsuzdur.",
    time: "2 gün əvvəl",
    isRead: true,
  },
  {
    id: "8",
    type: "bonus",
    title: "Ayın qənaət hesabatı",
    message:
      "Yanvar ayında 12.50₼ qənaət etdiniz. Qənaət tövsiyələri üçün Analitika bölməsinə baxın.",
    time: "3 gün əvvəl",
    isRead: true,
  },
  {
    id: "9",
    type: "campaign",
    title: "Yeni filial açılışı — Xırdalan",
    message:
      "OBA Xırdalan filialımız açılır! İlk 3 gün bütün məhsullarda 15% endirim.",
    time: "5 gün əvvəl",
    isRead: true,
    badge: "Yeni filial",
  },
  {
    id: "10",
    type: "receipt",
    title: "Dublikat qəbz aşkarlandı",
    message:
      "Skan etdiyiniz qəbz artıq bazada mövcuddur. Yeni qəbz əlavə olunmadı.",
    time: "1 həftə əvvəl",
    isRead: true,
  },
];

const ICON_MAP: Record<
  NotificationType,
  { icon: any; color: string; bg: string }
> = {
  promo: { icon: Tag, color: "#E85D04", bg: "#FFF3E0" },
  bonus: { icon: Star, color: Palette.primary, bg: "#F0FDF4" },
  receipt: { icon: Receipt, color: "#3B82F6", bg: "#EFF6FF" },
  system: { icon: Zap, color: "#8B5CF6", bg: "#F3E8FF" },
  campaign: { icon: Megaphone, color: "#EC4899", bg: "#FDF2F8" },
  delivery: { icon: Truck, color: "#06B6D4", bg: "#ECFEFF" },
};

type FilterType = "all" | "unread" | "promo" | "bonus";

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "promo") return n.type === "promo" || n.type === "campaign";
    if (filter === "bonus") return n.type === "bonus";
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Hamısı" },
    { key: "unread", label: "Oxunmamış" },
    { key: "promo", label: "Kampaniya" },
    { key: "bonus", label: "Bonus" },
  ];

  const renderNotification = (item: Notification) => {
    const { icon: Icon, color, bg } = ICON_MAP[item.type];

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
        activeOpacity={0.7}
        onPress={() => {
          markAsRead(item.id);
          setSelectedNotif(item);
        }}
      >
        {!item.isRead && <View style={styles.unreadDot} />}

        <View style={[styles.notifIconBox, { backgroundColor: bg }]}>
          <Icon size={20} color={color} />
        </View>

        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text
              style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.badge && (
              <View style={[styles.badgePill, { backgroundColor: bg }]}>
                <Text style={[styles.badgeText, { color }]}>{item.badge}</Text>
              </View>
            )}
          </View>

          <Text style={styles.notifMessage} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[Palette.primaryDark, Palette.primary]}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Bildirişlər</Text>
                {unreadCount > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={markAllRead}
              >
                <CheckCheck size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
            {f.key === "unread" && unreadCount > 0 && (
              <View
                style={[
                  styles.filterCount,
                  filter === f.key && styles.filterCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    filter === f.key && styles.filterCountTextActive,
                  ]}
                >
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notification List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <BellOff size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>Bildiriş yoxdur</Text>
            <Text style={styles.emptySubtext}>
              {filter === "unread"
                ? "Bütün bildirişlər oxunub!"
                : "Bu kateqoriyada bildiriş tapılmadı."}
            </Text>
          </View>
        ) : (
          <>
            {/* Unread section */}
            {filter === "all" && unreadCount > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>YENİ</Text>
                {filteredNotifications
                  .filter((n) => !n.isRead)
                  .map(renderNotification)}
              </View>
            )}

            {/* Read section or all items for other filters */}
            {filter === "all" ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>ƏVVƏLKI</Text>
                {filteredNotifications
                  .filter((n) => n.isRead)
                  .map(renderNotification)}
              </View>
            ) : (
              <View style={styles.sectionBlock}>
                {filteredNotifications.map(renderNotification)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Notification Detail Modal */}
      <Modal
        visible={!!selectedNotif}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNotif(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedNotif(null)}
        >
          <Pressable
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedNotif &&
              (() => {
                const { icon: Icon, color, bg } = ICON_MAP[selectedNotif.type];
                const typeLabels: Record<NotificationType, string> = {
                  promo: "Kampaniya",
                  bonus: "Bonus",
                  receipt: "Qəbz",
                  system: "Sistem",
                  campaign: "Kampaniya",
                  delivery: "Çatdırılma",
                };
                return (
                  <>
                    <View style={styles.modalHandle} />
                    <View
                      style={[styles.modalIconCircle, { backgroundColor: bg }]}
                    >
                      <Icon size={28} color={color} />
                    </View>
                    <View
                      style={[styles.modalTypeBadge, { backgroundColor: bg }]}
                    >
                      <Text style={[styles.modalTypeText, { color }]}>
                        {typeLabels[selectedNotif.type]}
                      </Text>
                    </View>
                    <Text style={styles.modalTitle}>{selectedNotif.title}</Text>
                    <Text style={styles.modalMessage}>
                      {selectedNotif.message}
                    </Text>
                    <Text style={styles.modalTime}>{selectedNotif.time}</Text>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedNotif(null)}
                    >
                      <Text style={styles.modalCloseBtnText}>Bağla</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerContainer: {
    overflow: "hidden",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerBadge: {
    backgroundColor: Palette.error,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 6,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    ...Shadows.small,
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterChipText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  filterCount: {
    backgroundColor: Palette.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  filterCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  filterCountTextActive: {
    color: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 10,
    paddingLeft: 4,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    position: "relative",
    ...Shadows.small,
  },
  notifCardUnread: {
    backgroundColor: "#FAFFF5",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
  },
  notifIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  notifTitleBold: {
    fontWeight: "800",
    color: "#0F172A",
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  notifMessage: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    fontWeight: "500",
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 18,
  },
  emptySubtext: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 260,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    ...Shadows.large,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    marginBottom: 24,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  modalTime: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 24,
  },
  modalCloseBtn: {
    width: "100%",
    backgroundColor: Palette.primary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
