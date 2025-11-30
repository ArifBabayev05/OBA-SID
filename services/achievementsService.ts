import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement } from '@/types';
import { DatasetEntry } from './datasetService';

const ACHIEVEMENTS_KEY = 'achievements';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  // SCANNING ACHIEVEMENTS
  {
    id: 'first_scan',
    title: 'İlk addım',
    description: 'İlk qəbzini skan etdin',
    icon: '🎯',
    category: 'scanning',
    requirement: 1,
    color: '#4ade80',
  },
  {
    id: 'scan_5',
    title: 'Başlanğıc',
    description: '5 qəbz skan etdin',
    icon: '📦',
    category: 'scanning',
    requirement: 5,
    color: '#22c55e',
  },
  {
    id: 'scan_10',
    title: 'Aktiv istifadəçi',
    description: '10 qəbz skan etdin',
    icon: '🚀',
    category: 'scanning',
    requirement: 10,
    color: '#16a34a',
  },
  {
    id: 'scan_25',
    title: 'Qəbz ustası',
    description: '25 qəbz skan etdin',
    icon: '🏆',
    category: 'scanning',
    requirement: 25,
    color: '#15803d',
  },
  {
    id: 'scan_50',
    title: 'Əfsanəvi',
    description: '50 qəbz skan etdin',
    icon: '👑',
    category: 'scanning',
    requirement: 50,
    color: '#14532d',
  },

  // SAVINGS ACHIEVEMENTS
  {
    id: 'cashback_50',
    title: 'İlk keşbek',
    description: '50₼ keşbek topladın',
    icon: '💰',
    category: 'savings',
    requirement: 50,
    color: '#facc15',
  },
  {
    id: 'cashback_100',
    title: 'Qənaətcil',
    description: '100₼ keşbek topladın',
    icon: '💎',
    category: 'savings',
    requirement: 100,
    color: '#eab308',
  },
  {
    id: 'cashback_250',
    title: 'Qənaət ustası',
    description: '250₼ keşbek topladın',
    icon: '🏅',
    category: 'savings',
    requirement: 250,
    color: '#ca8a04',
  },
  {
    id: 'cashback_500',
    title: 'Qənaət çempionu',
    description: '500₼ keşbek topladın',
    icon: '🥇',
    category: 'savings',
    requirement: 500,
    color: '#a16207',
  },

  // SPENDING ACHIEVEMENTS
  {
    id: 'spend_500',
    title: 'Alışveriş həvəskarı',
    description: '500₼ xərcləndi (izlənildi)',
    icon: '🛒',
    category: 'spending',
    requirement: 500,
    color: '#93c5fd',
  },
  {
    id: 'spend_1000',
    title: 'Böyük xərcləyici',
    description: '1000₼ xərcləndi',
    icon: '🛍️',
    category: 'spending',
    requirement: 1000,
    color: '#60a5fa',
  },
  {
    id: 'spend_2500',
    title: 'VIP müştəri',
    description: '2500₼ xərcləndi',
    icon: '💳',
    category: 'spending',
    requirement: 2500,
    color: '#3b82f6',
  },

  // LOYALTY ACHIEVEMENTS
  {
    id: 'week_streak',
    title: 'Həftəlik ardıcıllıq',
    description: '7 gün ardıcıl qəbz skan etdin',
    icon: '🔥',
    category: 'loyalty',
    requirement: 7,
    color: '#f97316',
  },
  {
    id: 'month_streak',
    title: 'Aylıq ardıcıllıq',
    description: '30 gün içində 15+ qəbz skan etdin',
    icon: '⭐',
    category: 'loyalty',
    requirement: 15,
    color: '#ea580c',
  },
  {
    id: 'daily_active',
    title: 'Gündəlik istifadəçi',
    description: 'Bu ay hər gün app-ı açdın',
    icon: '📱',
    category: 'loyalty',
    requirement: 30,
    color: '#c2410c',
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'big_spender',
    title: 'Böyük alış',
    description: 'Tək qəbzdə 200₼+ xərclədin',
    icon: '💸',
    category: 'special',
    requirement: 200,
    color: '#a855f7',
  },
  {
    id: 'early_adopter',
    title: 'İlk istifadəçi',
    description: 'Tətbiqin ilk günlərində qoşuldun',
    icon: '🌟',
    category: 'special',
    requirement: 1,
    color: '#9333ea',
  },
];

// Initialize achievements in storage
export const initializeAchievements = async (): Promise<Achievement[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Create initial achievements (all locked)
    const initialAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      unlocked: false,
      progress: 0,
    }));

    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(initialAchievements));
    return initialAchievements;
  } catch (error) {
    console.error('Failed to initialize achievements', error);
    return [];
  }
};

// Get all achievements
export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (!stored) {
      return await initializeAchievements();
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get achievements', error);
    return [];
  }
};

// Save achievements
const saveAchievements = async (achievements: Achievement[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error('Failed to save achievements', error);
  }
};

// Calculate progress and unlock achievements
export const checkAndUnlockAchievements = async (
  entries: DatasetEntry[]
): Promise<{ newlyUnlocked: Achievement[]; updated: Achievement[] }> => {
  const achievements = await getAchievements();
  const newlyUnlocked: Achievement[] = [];

  // Calculate stats
  const totalScans = entries.length;
  const totalSpend = entries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const VAT_RATE = 0.18;
  const totalCashback = entries.reduce((sum, e) => sum + (e.totalAmount || 0) * VAT_RATE, 0);

  // Find max single receipt amount
  const maxSingleReceipt = entries.length > 0 
    ? Math.max(...entries.map(e => e.totalAmount || 0))
    : 0;

  // Check streaks (simplified - just check if we have scans in recent days)
  const last7Days = entries.filter(e => {
    const entryDate = new Date(e.createdAt || '');
    const daysDiff = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  }).length;

  const last30Days = entries.filter(e => {
    const entryDate = new Date(e.createdAt || '');
    const daysDiff = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  }).length;

  // Update achievements
  const updatedAchievements = achievements.map(achievement => {
    if (achievement.unlocked) {
      return achievement;
    }

    let currentProgress = 0;

    // Calculate progress based on category
    switch (achievement.id) {
      // Scanning achievements
      case 'first_scan':
      case 'scan_5':
      case 'scan_10':
      case 'scan_25':
      case 'scan_50':
        currentProgress = totalScans;
        break;

      // Savings achievements
      case 'cashback_50':
      case 'cashback_100':
      case 'cashback_250':
      case 'cashback_500':
        currentProgress = totalCashback;
        break;

      // Spending achievements
      case 'spend_500':
      case 'spend_1000':
      case 'spend_2500':
        currentProgress = totalSpend;
        break;

      // Loyalty achievements
      case 'week_streak':
        currentProgress = last7Days;
        break;

      case 'month_streak':
      case 'daily_active':
        currentProgress = last30Days;
        break;

      // Special achievements
      case 'big_spender':
        currentProgress = maxSingleReceipt;
        break;

      case 'early_adopter':
        currentProgress = entries.length > 0 ? 1 : 0;
        break;
    }

    const unlocked = currentProgress >= achievement.requirement;

    if (unlocked && !achievement.unlocked) {
      newlyUnlocked.push({ ...achievement, unlocked: true, unlockedAt: new Date().toISOString() });
      return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString(), progress: currentProgress };
    }

    return { ...achievement, progress: currentProgress };
  });

  await saveAchievements(updatedAchievements);

  return { newlyUnlocked, updated: updatedAchievements };
};

// Get achievement stats
export const getAchievementStats = async (): Promise<{
  total: number;
  unlocked: number;
  locked: number;
  percentage: number;
}> => {
  const achievements = await getAchievements();
  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  return {
    total,
    unlocked,
    locked: total - unlocked,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  };
};

