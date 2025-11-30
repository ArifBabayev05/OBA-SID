import * as FileSystem from 'expo-file-system/legacy';
import { FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS } from '@/data/mockData';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// Using gemini-1.5-flash because it supports vision and is fast
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const STORE_META: Record<
  string,
  { distanceKm: number; address: string; eta: string }
> = {
  'Bravo': { distanceKm: 0.4, address: '28 May filialı', eta: '5 dəq' },
  'Araz Market': { distanceKm: 0.6, address: 'Nizami küçəsi', eta: '7 dəq' },
  'Bazarstore': { distanceKm: 1.1, address: 'Port Baku', eta: '12 dəq' },
  'Rahat Market': { distanceKm: 0.9, address: '28 May metrosu', eta: '10 dəq' },
  'Neptun': { distanceKm: 1.8, address: 'Gənclik mall', eta: '16 dəq' },
  'CityMart': { distanceKm: 1.2, address: 'Neftçilər pr.14', eta: '13 dəq' },
  'BirMarket': { distanceKm: 2.4, address: 'Əhmədli filialı', eta: '18 dəq' },
  // Electronics / tech stores
  'Kontakt Home': { distanceKm: 1.5, address: '28 Mall', eta: '14 dəq' },
  'Baku Electronics': { distanceKm: 1.1, address: 'Zabitlər parkı', eta: '11 dəq' },
  'Maxi.az': { distanceKm: 2.1, address: 'Sahil filialı', eta: '18 dəq' },
  'IRSHAD': { distanceKm: 0.8, address: 'Təbriz küçəsi', eta: '9 dəq' },
};

const GROCERY_STORES = ['Bravo', 'Araz Market', 'Bazarstore', 'Rahat Market', 'Neptun', 'CityMart'];
const ELECTRONIC_STORES = ['Kontakt Home', 'Baku Electronics', 'Maxi.az', 'IRSHAD'];

const randomMeta = () => {
  const distance = +(0.5 + Math.random() * 2.5).toFixed(1);
  return {
    distanceKm: distance,
    address: 'Yaxın filial',
    eta: `${Math.max(3, Math.round(distance * 8))} dəq`,
  };
};

type CategoryConfig = {
  id: string;
  keywords: string[];
  stores: string[];
  basePrice: number;
  variance: number;
  image: string;
};

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'electronics',
    keywords: ['elektron', 'qulaq', 'telefon', 'noutbuk', 'powerbank', 'speaker', 'mouse'],
    stores: ELECTRONIC_STORES,
    basePrice: 80,
    variance: 220,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'grocery',
    keywords: ['meyvə', 'tərəvəz', 'süd', 'çörək', 'ərzaq', 'pendir', 'ət', 'yumurta', 'şirə'],
    stores: GROCERY_STORES,
    basePrice: 2,
    variance: 8,
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'beverage',
    keywords: ['içki', 'şirə', 'cola', 'su', 'çay', 'qəhvə'],
    stores: GROCERY_STORES,
    basePrice: 1.5,
    variance: 5,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'household',
    keywords: ['gigiyena', 'təmizlik', 'şampun', 'sabun', 'məişət', 'detergent'],
    stores: ['Bravo', 'Araz Market', 'Bazarstore', 'CityMart'],
    basePrice: 3,
    variance: 12,
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'default',
    keywords: [],
    stores: GROCERY_STORES,
    basePrice: 4,
    variance: 15,
    image: 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=600&q=80',
  },
];

const getCategoryConfig = (normalizedName: string, normalizedCategory: string): CategoryConfig => {
  const fullText = `${normalizedName} ${normalizedCategory}`.trim();
  return (
    CATEGORY_CONFIGS.find(cfg =>
      cfg.keywords.some(keyword => fullText.includes(keyword))
    ) ?? CATEGORY_CONFIGS.find(cfg => cfg.id === 'default')!
  );
};

const createMockMatch = (
  store: string,
  detectedName: string,
  detectedCategory: string,
  config: CategoryConfig
) => ({
  id: `${store}-${detectedName}-${Math.random().toString(36).slice(2, 6)}`.toLowerCase(),
  name: detectedName,
  category: detectedCategory,
  store,
  price: +(config.basePrice + Math.random() * config.variance).toFixed(2),
  image: config.image,
});

export interface ProductMatch {
  store: string;
  price: number;
  name: string;
  image: string;
  distanceKm: number;
  address: string;
  eta: string;
}

export interface ProductAnalysis {
  detectedName: string;
  category: string;
  confidence: number;
  isProduct: boolean;
  matches: ProductMatch[];
  bestPrice?: ProductMatch;
  closestStore?: ProductMatch;
}

export const identifyProductFromImage = async (imageUri: string): Promise<ProductAnalysis | null> => {
  if (!API_KEY) {
    console.warn('Gemini API key is missing');
    return null;
  }

  try {
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      // Some Expo versions expose EncodingType differently, fallback to raw string
      encoding: (FileSystem as any).EncodingType
        ? (FileSystem as any).EncodingType.Base64
        : 'base64',
    });

    const prompt = `
Sən market məhsullarını tanıyan vizual köməkçisən.
Şəkli analiz et və əsas məhsulu tap. Əgər şəkil məhsul deyilsə (selfi, otaq, maşın və s.)
onda \"isProduct\" = false yaz.

Qəti şəkildə YALNIZ bu JSON formatında cavab ver və başqa heç nə yazma:
{
  "isProduct": true | false,
  "name": "Məhsulun Azərbaycan dilində ümumi adı (məs: 'Alma', 'Süd', 'Çörək')",
  "category": "Məhsul kateqoriyası (məs: 'Meyvə və tərəvəz')",
  "confidence": 0-1 arası ədədi ehtimal (0.93 kimi)
}
Markdown, şərh və ya mətn əlavə ETMƏ.
    `;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log('Gemini response', JSON.stringify(data, null, 2));
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const textPart = parts.find((part: any) => typeof part.text === 'string' && part.text.trim().length > 0);
    const text = textPart?.text?.trim();
    
    if (!text) {
      console.warn('No text returned from Gemini', {
        finishReason: candidate?.finishReason,
        safetyRatings: candidate?.safetyRatings,
      });
      return null;
    }

    // Clean up markdown if present (e.g. ```json ... ```)
    const jsonStr = text.replace(/```json|```/g, '').trim();
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Failed to parse JSON from AI:', text);
      return null;
    }
    
    const isProduct = result?.isProduct !== false;
    if (!isProduct) {
      //const err: any = new Error('Product not detected');
      //err.code = 'NO_PRODUCT';
      //throw err;
      return null;
    }

    const confidence = typeof result?.confidence === 'number'
      ? result.confidence
      : 0.65;
    if (confidence < 0.3) {
      const err: any = new Error('Low confidence product detection');
      err.code = 'NO_PRODUCT';
      throw err;
    }

    // Find matches in mock database (Fuzzy search logic)
    // We look for products that contain the detected name or belong to the same category
    const normalizedName = result.name?.toLowerCase() ?? '';
    const normalizedCategory = result.category?.toLowerCase() ?? '';
    const categoryConfig = getCategoryConfig(normalizedName, normalizedCategory);
    const isElectronics = categoryConfig.id === 'electronics';

    const allProducts = [...FEATURED_PRODUCTS, ...RECOMMENDED_PRODUCTS].filter(p => {
      if (isElectronics) {
        return true;
      }
      return !p.category.toLowerCase().includes('elektron');
    });
    
    // 1. Try exact name match or partial match
    let matches = allProducts.filter(p => 
      p.name.toLowerCase().includes(result.name.toLowerCase()) || 
      result.name.toLowerCase().includes(p.name.toLowerCase())
    );

    // 2. If few matches, fallback to category
    if (matches.length < 2) {
      const categoryMatches = allProducts.filter(p => 
        p.category.toLowerCase().includes(result.category.toLowerCase())
      );
      categoryMatches.forEach(cm => {
        if (!matches.find(m => m.id === cm.id)) {
          matches.push(cm);
        }
      });
    }

    const targetStores = categoryConfig.stores;
    const fallbackName = result.name || 'Naməlum məhsul';
    const fallbackCategory = result.category || 'Məhsul';

    while (matches.length < 3) {
      const store = targetStores[matches.length % targetStores.length];
      matches.push(
        createMockMatch(store, fallbackName, fallbackCategory, categoryConfig) as any
      );
    }

    // Format and sort by price
    const finalMatches = matches
      .map(p => {
        const meta = STORE_META[p.store] ?? randomMeta();
        return {
          store: p.store,
          price: p.price,
          name: p.name,
          image: typeof p.image === 'string' ? p.image : '',
          distanceKm: meta.distanceKm,
          address: meta.address,
          eta: meta.eta,
        };
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 3); // Top 3 cheapest

    const bestPrice = finalMatches.reduce((best, current) => (current.price < best.price ? current : best), finalMatches[0]);
    const closestStore = finalMatches.reduce((closest, current) => (current.distanceKm < closest.distanceKm ? current : closest), finalMatches[0]);

    return {
      detectedName: result.name,
      category: result.category,
      confidence,
      isProduct,
      matches: finalMatches,
      bestPrice,
      closestStore,
    };

  } catch (error) {
    console.error('Smart Lens error:', error);
    return null;
  }
};
