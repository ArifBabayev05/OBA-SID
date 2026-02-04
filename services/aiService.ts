import { FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS } from '@/data/mockData';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

const API_KEY = "AIzaSyAQQnX3bEfBbd72QXzVEC4YCnKxHVsp25k";
// Using gemini-1.5-flash because it supports vision and is fast
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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
      const errText = await response.text();
      Alert.alert('Gemini Error', errText);
      return null;
    }

    const data = await response.json();
    // console.log('Gemini response', JSON.stringify(data, null, 2));
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
      return null;
    }

    const confidence = typeof result?.confidence === 'number'
      ? result.confidence
      : 0.65;

    // Lower threshold slightly to be more permissive, but keep it reasonable
    if (confidence < 0.25) {
      return null;
    }

    // Find matches in mock database (Oba Market products only)
    const allProducts = [...FEATURED_PRODUCTS, ...RECOMMENDED_PRODUCTS];

    // 1. Try exact name match or partial match
    let matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(result.name.toLowerCase()) ||
      result.name.toLowerCase().includes(p.name.toLowerCase())
    );

    // 2. If no exact matches, fallback to category for specific categories (e.g. fruits)
    // But be careful not to suggest random things for distinct items like "iPhone" -> "Makaron"
    if (matches.length === 0) {
      const categoryMatches = allProducts.filter(p =>
        p.category.toLowerCase() === result.category.toLowerCase()
      );
      // Only include category matches if they share some keyword or strictly same category?
      // For now, let's include top 3 category matches if empty
      // But only if category is 'Food' related?
      // User request: "Oba marketdə satılmaz deyə... tapılmadı bildir".
      // So if I scan a 'Bracelet' and Oba doesn't sell it, matches should be empty.

      // Let's only use category fallback if the detected category is one of our known categories 
      // (from mockData logic).
      const knownCategories = new Set(allProducts.map(p => p.category.toLowerCase()));
      if (knownCategories.has(result.category.toLowerCase())) {
        matches = categoryMatches.slice(0, 3);
      }
    }

    const foundInStore = matches.length > 0;

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
    console.error('Smart Lens error:', error);
    return null;
  }
};
