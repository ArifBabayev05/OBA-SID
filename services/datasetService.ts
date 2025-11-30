import * as FileSystem from 'expo-file-system/legacy';
import { PurchaseItem } from '@/types';

export interface DatasetEntry {
  id: string;
  storeName?: string;
  totalAmount: number;
  items: PurchaseItem[];
  createdAt: string;
  source: 'qr' | 'photo';
  rawText?: string;
  fiscalId?: string;
}

const datasetDir =
  (FileSystem.documentDirectory as string | undefined) ??
  (FileSystem.cacheDirectory as string | undefined) ??
  '';

const DATASET_FILE = `${datasetDir}receipt-dataset.json`;

const ensureDatasetFile = async () => {
  try {
    const info = await FileSystem.getInfoAsync(DATASET_FILE);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(DATASET_FILE, '[]', {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch (error) {
    console.error('Dataset ensure error:', error);
    throw error;
  }
};

export const getDatasetEntries = async (): Promise<DatasetEntry[]> => {
  try {
    await ensureDatasetFile();
    const data = await FileSystem.readAsStringAsync(DATASET_FILE, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Dataset read error:', error);
    return [];
  }
};

export const appendDatasetEntry = async (entry: DatasetEntry): Promise<void> => {
  try {
    const entries = await getDatasetEntries();
    const updated = [entry, ...entries].slice(0, 500);
    await FileSystem.writeAsStringAsync(DATASET_FILE, JSON.stringify(updated), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Dataset append error:', error);
  }
};

export const getDatasetFilePath = () => DATASET_FILE;

export const clearDataset = async (): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(DATASET_FILE, '[]', {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Dataset clear error:', error);
  }
};

