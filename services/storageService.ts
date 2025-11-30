import AsyncStorage from '@react-native-async-storage/async-storage';
import { Receipt, UserProfile } from '../types';
import { appendDatasetEntry, getDatasetEntries, clearDataset } from './datasetService';
import { generateAISummary, clearAISummary } from './aiAdvisor';

const STORAGE_KEYS = {
  RECEIPTS: 'user_receipts',
  USER_PROFILE: 'user_profile',
};

const VAT_RATE = 0.18;

const normalizeAmount = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[^\d,.-]/g, '')
      .replace(/,/g, '.')
      .replace(/(\..*)\./g, '$1');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

export const saveReceipt = async (receipt: Receipt): Promise<'stored' | 'duplicate'> => {
  try {
    const normalizedTotal = normalizeAmount(receipt.totalAmount);
    const normalizedVatAmount =
      receipt.vatAmount !== undefined
        ? normalizeAmount(receipt.vatAmount)
        : normalizedTotal * VAT_RATE;

    // Limit text field size to prevent AsyncStorage errors
    const limitedReceipt = {
      ...receipt,
      totalAmount: normalizedTotal,
      vatAmount: normalizedVatAmount,
      text: receipt.text ? receipt.text.substring(0, 500) : '',
    };
    
    const existingReceipts = await getReceipts();

    const newReceipts = [limitedReceipt, ...existingReceipts];
    
    // Limit total receipts to prevent storage issues
    const maxReceipts = 100;
    const limitedReceipts = newReceipts.slice(0, maxReceipts);
    
    await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(limitedReceipts));

    await appendDatasetEntry({
      id: limitedReceipt.id,
      storeName: limitedReceipt.storeName,
      totalAmount: limitedReceipt.totalAmount || 0,
      items: limitedReceipt.items || [],
      createdAt: limitedReceipt.date || new Date().toISOString(),
      source: limitedReceipt.imageUrl === 'qr_code' ? 'qr' : 'photo',
      rawText: limitedReceipt.text,
      fiscalId: limitedReceipt.fiscalId,
    });

    const dataset = await getDatasetEntries();
    await generateAISummary(dataset);
    
    // Update VAT balance based on stored amount
    const profile = await getUserProfile();
    const vatAmount = limitedReceipt.vatAmount || 0;
    await saveUserProfile({
      ...profile,
      vatBalance: (profile.vatBalance || 0) + vatAmount
    });
    
    return 'stored';
  } catch (error) {
    console.error('Error saving receipt:', error);
    throw error;
  }
};

export const getReceipts = async (): Promise<Receipt[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const clearAllReceipts = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEYS.RECEIPTS);
  await clearDataset();
  await clearAISummary();
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : { name: 'User', email: 'user@example.com', vatBalance: 0 };
  } catch (error) {
    return { name: 'User', email: 'user@example.com', vatBalance: 0 };
  }
};

