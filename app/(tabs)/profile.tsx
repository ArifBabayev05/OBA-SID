import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, TextInput } from 'react-native';
import { ChevronRight, Clock, Settings, AlertCircle, LogOut, User, Trophy, TrendingUp } from 'lucide-react-native';
import { getUserProfile, saveUserProfile, clearAllReceipts } from '@/services/storageService';
import { UserProfile, Achievement } from '@/types';
import { CustomModal } from '@/components/CustomModal';
import { router } from 'expo-router';
import { checkAndUnlockAchievements, getAchievementStats } from '@/services/achievementsService';
import { getDatasetEntries } from '@/services/datasetService';

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User Name', email: 'user@example.com', vatBalance: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, locked: 0, percentage: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    buttons: any[];
    onClose?: () => void;
  }>({ title: '', message: '', type: 'info', buttons: [] });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const profile = await getUserProfile();
    setUserProfile(profile);
    setEditName(profile.name);
    setEditEmail(profile.email);
    // Load achievements
    const entries = await getDatasetEntries();
    const { updated } = await checkAndUnlockAchievements(entries);
    setAchievements(updated);
    const stats = await getAchievementStats();
    setAchievementStats(stats);
  };

  const showModal = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    buttons?: any[],
    onClose?: () => void
  ) => {
    setModalConfig({ title, message, type, buttons: buttons || [{ text: 'OK', onPress: () => {} }], onClose });
    setModalVisible(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editName.trim() === '' || editEmail.trim() === '') {
      showModal('Error', 'Name and email cannot be empty', 'error');
      return;
    }
    const updated = { ...userProfile, name: editName.trim(), email: editEmail.trim() };
    await saveUserProfile(updated);
    setUserProfile(updated);
    setIsEditing(false);
    showModal('Success', 'Profile updated successfully!', 'success');
  };
  

  const handleCancel = () => {
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setIsEditing(false);
  };

  const handleLogout = () => {
    showModal(
      'Logout',
      'Are you sure you want to logout?',
      'warning',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Logout', onPress: () => showModal('Logged out', 'You have been logged out successfully', 'success'), style: 'destructive' },
      ]
    );
  };

  const handleClearData = async () => {
    await clearAllReceipts();
    await loadData();
    showModal('Cleared', 'Dataset və AI nəticələri sıfırlandı.', 'success');
  };

  const showResetConfirm = () => {
    showModal(
      'Clear all data',
      'Bütün skan olunmuş qəbzləri və AI məsləhətləri silinəcək. Davam etmək istəyirsiniz?',
      'warning',
      [
        { text: 'Geri qayıt', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            handleClearData();
          },
        },
      ]
    );
  };

  const dashboardCards = [
    {
      id: 'history',
      title: 'Purchase history',
      subtitle: 'Skan etdiyin bütün qəbzləri izləyin',
      icon: Clock,
      onPress: () => router.push('/history'),
    },
    {
      id: 'insights',
      title: 'Insights & trends',
      subtitle: 'AI təhlili və xərc trendləri',
      icon: TrendingUp,
      onPress: () => router.push('/insights' as any),
    },
    {
      id: 'profile',
      title: isEditing ? 'Editing...' : 'Profil məlumatları',
      subtitle: 'Ad, email və preferensiyalar',
      icon: Settings,
      onPress: () => {
        if (!isEditing) {
          handleEdit();
        }
      },
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={28} color="#d1d5db" />
          </View>
          <View style={styles.userInfo}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Name"
                  placeholderTextColor="#6b7280"
                />
                <TextInput
                  style={styles.editInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Email"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.userName}>{userProfile.name}</Text>
                <Text style={styles.userPhone}>{userProfile.email}</Text>
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {!isEditing && (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dashboardSection}>
          <Text style={styles.dashboardLabel}>Loyalty dashboard</Text>
          <View style={styles.dashboardGrid}>
            {dashboardCards.map(card => {
              const Icon = card.icon;
              return (
                <TouchableOpacity key={card.id} style={styles.dashboardCard} onPress={card.onPress}>
                  <View style={styles.dashboardIconWrap}>
                    <Icon size={20} color="#0f172a" />
                  </View>
                  <Text style={styles.dashboardCardTitle}>{card.title}</Text>
                  <Text style={styles.dashboardCardSubtitle}>{card.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.clearCard} onPress={showResetConfirm}>
          <View style={styles.clearIconWrap}>
            <AlertCircle size={22} color="#f87171" />
          </View>
          <View style={styles.clearTextBlock}>
            <Text style={styles.clearTitle}>Clear receipts & dataset</Text>
            <Text style={styles.clearSubtitle}>Bütün qəbzləri və AI nəticələrini sıfırla</Text>
          </View>
          <ChevronRight size={20} color="#f87171" />
        </TouchableOpacity>

        {/* NEW: Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.achievementHeaderLeft}>
              <Trophy size={20} color="#facc15" />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementBadgeText}>
                {achievementStats.unlocked}/{achievementStats.total}
              </Text>
            </View>
          </View>

          <View style={styles.achievementProgressCard}>
            <Text style={styles.achievementProgressLabel}>Completion Progress</Text>
            <View style={styles.achievementProgressBar}>
              <View
                style={[
                  styles.achievementProgressFill,
                  { width: `${achievementStats.percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.achievementProgressText}>
              {achievementStats.percentage}% complete
            </Text>
          </View>

          <View style={styles.achievementsGrid}>
            {achievements.slice(0, 6).map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked && styles.achievementCardUnlocked,
                ]}
              >
                <Text style={[styles.achievementIcon, !achievement.unlocked && styles.achievementIconLocked]}>
                  {achievement.icon}
                </Text>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                  numberOfLines={1}
                >
                  {achievement.title}
                </Text>
                {achievement.unlocked ? (
                  <Text style={styles.achievementUnlockedText}>Unlocked!</Text>
                ) : (
                  <Text style={styles.achievementProgress}>
                    {achievement.progress || 0}/{achievement.requirement}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {achievements.length > 6 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => showModal('All Achievements', `You have ${achievementStats.unlocked} out of ${achievementStats.total} achievements unlocked!`, 'info')}
            >
              <Text style={styles.viewAllButtonText}>View All ({achievements.length})</Text>
              <ChevronRight size={16} color="#93c5fd" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#9ca3af" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

      </ScrollView>

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalVisible(false);
          modalConfig?.onClose?.();
        }}
        buttons={modalConfig.buttons}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 64,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  userCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    height: 56,
    width: 56,
    backgroundColor: '#4b5563',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userPhone: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#84cc16',
    borderRadius: 8,
    alignSelf: 'flex-start',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#1a2e05',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editIcon: {
    color: 'white',
    fontSize: 18,
  },
  editInput: {
    backgroundColor: '#121212',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 14,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#84cc16',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#1a2e05',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
  },
  dashboardSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dashboardLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dashboardCard: {
    flexBasis: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 8,
  },
  dashboardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardCardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  dashboardCardSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  clearCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: 'rgba(248,113,113,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(248,113,113,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearTextBlock: {
    flex: 1,
  },
  clearTitle: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 15,
  },
  clearSubtitle: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    color: 'white',
    marginLeft: 12,
    fontWeight: 'bold',
    fontSize: 15,
  },
  // NEW: Achievement styles
  achievementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementBadge: {
    backgroundColor: '#facc15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementBadgeText: {
    color: '#1a2e05',
    fontWeight: '700',
    fontSize: 13,
  },
  achievementProgressCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
    gap: 8,
  },
  achievementProgressLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#facc15',
    borderRadius: 999,
  },
  achievementProgressText: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  achievementCard: {
    flexBasis: '30%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  achievementCardUnlocked: {
    borderColor: '#facc15',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementIconLocked: {
    opacity: 0.3,
  },
  achievementTitle: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#6b7280',
  },
  achievementUnlockedText: {
    color: '#facc15',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  achievementProgress: {
    color: '#9ca3af',
    fontSize: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 6,
  },
  viewAllButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '600',
  },
});
