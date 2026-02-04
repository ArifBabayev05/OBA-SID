import { FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS } from '@/data/mockData';
import * as FileSystem from 'expo-file-system/legacy';

const API_KEY = "AIzaSyAQQnX3bEfBbd72QXzVEC4YCnKxHVsp25k";
// Gemini 2.0 Flash is state of the art and fast. 
// Using v1beta for maximum compatibility with latest models.
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Mock location metadata
const STORE_META: Record<
  string,
  { distanceKm: number; address: string; eta: string }
> = {};

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
  basePrice: number;
  variance: number;
  image: string;
};

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'electronics',
    keywords: ['elektron', 'qulaq', 'telefon', 'noutbuk', 'powerbank', 'speaker', 'mouse'],
    basePrice: 80,
    variance: 220,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'grocery',
    keywords: ['meyvə', 'tərəvəz', 'süd', 'çörək', 'ərzaq', 'pendir', 'ət', 'yumurta', 'şirə'],
    basePrice: 2,
    variance: 8,
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'beverage',
    keywords: ['içki', 'şirə', 'cola', 'su', 'çay', 'qəhvə'],
    basePrice: 1.5,
    variance: 5,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'household',
    keywords: ['gigiyena', 'təmizlik', 'şampun', 'sabun', 'məişət', 'detergent'],
    basePrice: 3,
    variance: 12,
    image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'default',
    keywords: [],
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
  foundInStore: boolean;
}

export const identifyProductFromImage = async (imageUri: string): Promise<ProductAnalysis | null> => {
  if (!API_KEY) {
    return null;
  }

  try {
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: (FileSystem as any).EncodingType
        ? (FileSystem as any).EncodingType.Base64
        : 'base64',
    });

    const prompt = `
Sən market məhsullarını tanıyan vizual köməkçisən.
Şəkli analiz et və əsas məhsulu tap. Əgər şəkil məhsul deyilsə (selfi, otaq, maşın və s.)
onda "isProduct" = false yaz.

Qəti şəkildə YALNIZ bu JSON formatında cavab ver və başqa heç nə yazma:
{
  "isProduct": true | false,
  "name": "Məhsulun Azərbaycan dilində ümumi adı (məs: 'Alma', 'Süd', 'Çörək', 'Qolbaq')",
  "category": "Məhsul kateqoriyası (məs: 'Meyvə və tərəvəz', 'Aksessuar')",
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

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const textPart = parts.find((part: any) => typeof part.text === 'string' && part.text.trim().length > 0);
    const text = textPart?.text?.trim();

    if (!text) {
      return null;
    }

    const jsonStr = text.replace(/```json|```/g, '').trim();
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }

    const isProduct = result?.isProduct !== false;
    if (!isProduct) {
      return null;
    }

    const confidence = typeof result?.confidence === 'number'
      ? result.confidence
      : 0.65;

    if (confidence < 0.25) {
      return null;
    }

    const allProducts = [...FEATURED_PRODUCTS, ...RECOMMENDED_PRODUCTS];

    let matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(result.name.toLowerCase()) ||
      result.name.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matches.length === 0) {
      const categoryMatches = allProducts.filter(p =>
        p.category.toLowerCase() === result.category.toLowerCase()
      );
      const knownCategories = new Set(allProducts.map(p => p.category.toLowerCase()));
      if (knownCategories.has(result.category.toLowerCase())) {
        matches = categoryMatches.slice(0, 3);
      }
    }

    const foundInStore = matches.length > 0;

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
      .sort((a, b) => a.price - b.price);

    const bestPrice = finalMatches.length > 0
      ? finalMatches.reduce((best, current) => (current.price < best.price ? current : best), finalMatches[0])
      : undefined;

    const closestStore = finalMatches.length > 0
      ? finalMatches.reduce((closest, current) => (current.distanceKm < closest.distanceKm ? current : closest), finalMatches[0])
      : undefined;

    return {
      detectedName: result.name,
      category: result.category,
      confidence,
      isProduct,
      matches: finalMatches,
      bestPrice,
      closestStore,
      foundInStore,
    };

  } catch (error) {
    return null;
  }
};
