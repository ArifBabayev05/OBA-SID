export interface PurchaseItem {
  name: string;
  price: number;
  category?: string;
  store?: string; // Where it was bought
}

export interface Receipt {
  id: string;
  date: string;
  totalAmount: number;
  items: PurchaseItem[];
  text: string;
  imageUrl: string;
  storeName?: string; // Store name from OCR or QR
  fiscalId?: string;
  vatAmount?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  vatBalance: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: any; // Local require or remote URI
  category: string;
  store: string; // Which store has this price
  weight?: string;
  isDiscount?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Icon name or image
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'scanning' | 'savings' | 'spending' | 'loyalty' | 'special';
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // Current progress towards requirement
  color: string; // Badge color
}

export interface SpendingTrend {
  date: string; // YYYY-MM-DD
  amount: number;
  receiptsCount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
