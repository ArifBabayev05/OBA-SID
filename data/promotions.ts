export interface Promotion {
  id: string;
  productName: string;
  store: string;
  originalPrice: number;
  promoPrice: number;
  expiresAt: string;
  description?: string;
}

export const PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    productName: 'Milk',
    store: 'Bravo',
    originalPrice: 1.95,
    promoPrice: 1.70,
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Weekend dairy savings',
  },
  {
    id: 'promo-2',
    productName: 'Latte',
    store: 'Araz',
    originalPrice: 6.5,
    promoPrice: 5.8,
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Coffee lovers discount',
  },
  {
    id: 'promo-3',
    productName: 'Rice',
    store: 'OBA',
    originalPrice: 15.0,
    promoPrice: 12.3,
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Weekly staples promo',
  },
  {
    id: 'promo-4',
    productName: 'Bread',
    store: 'Bravo',
    originalPrice: 1.2,
    promoPrice: 0.9,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Breakfast essentials',
  },
];

