import { FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS } from "@/data/mockData";
import * as FileSystem from "expo-file-system/legacy";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
// Gemini 2.0 Flash is state of the art and fast.
// Using v1beta for maximum compatibility with latest models.
const model = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
// Mock location metadata
const STORE_META: Record<
  string,
  { distanceKm: number; address: string; eta: string }
> = {};

const randomMeta = () => {
  const distance = +(0.5 + Math.random() * 2.5).toFixed(1);
  return {
    distanceKm: distance,
    address: "Yaxın filial",
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
    id: "electronics",
    keywords: [
      "elektron",
      "qulaq",
      "telefon",
      "noutbuk",
      "powerbank",
      "speaker",
      "mouse",
    ],
    basePrice: 80,
    variance: 220,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "grocery",
    keywords: [
      "meyvə",
      "tərəvəz",
      "süd",
      "çörək",
      "ərzaq",
      "pendir",
      "ət",
      "yumurta",
      "şirə",
    ],
    basePrice: 2,
    variance: 8,
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "beverage",
    keywords: ["içki", "şirə", "cola", "su", "çay", "qəhvə"],
    basePrice: 1.5,
    variance: 5,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "household",
    keywords: [
      "gigiyena",
      "təmizlik",
      "şampun",
      "sabun",
      "məişət",
      "detergent",
    ],
    basePrice: 3,
    variance: 12,
    image:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "default",
    keywords: [],
    basePrice: 4,
    variance: 15,
    image:
      "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&w=600&q=80",
  },
];

const getCategoryConfig = (
  normalizedName: string,
  normalizedCategory: string,
): CategoryConfig => {
  const fullText = `${normalizedName} ${normalizedCategory}`.trim();
  const found =
    CATEGORY_CONFIGS.find((cfg) =>
      cfg.keywords.some((keyword) => fullText.includes(keyword)),
    ) ?? CATEGORY_CONFIGS.find((cfg) => cfg.id === "default")!;
  console.log("[aiService] getCategoryConfig:", {
    fullText,
    foundCategory: found.id,
  });
  return found;
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

export const identifyProductFromImage = async (
  imageUri: string,
): Promise<ProductAnalysis | null> => {
  console.log("[aiService] ===== identifyProductFromImage START =====");
  console.log("[aiService] imageUri:", imageUri);

  if (!API_KEY) {
    console.log("[aiService] ❌ API_KEY yoxdur, return null");
    return null;
  }
  console.log("[aiService] ✅ API_KEY mövcuddur");

  try {
    console.log("[aiService] Base64 oxunur...");
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: (FileSystem as any).EncodingType
        ? (FileSystem as any).EncodingType.Base64
        : "base64",
    });
    console.log(
      "[aiService] ✅ Base64 uğurla oxundu, uzunluq:",
      base64Data.length,
    );

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

    console.log("[aiService] Gemini API-yə sorğu göndərilir...");
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            ],
          },
        ],
      }),
    });

    console.log(
      "[aiService] Gemini API status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.log("[aiService] ENV: ", API_KEY);
      console.log("[aiService] ❌ API xətası, response body:", errorBody);
      return null;
    }

    const data = await response.json();
    console.log(
      "[aiService] ✅ Gemini raw response:",
      JSON.stringify(data, null, 2),
    );

    const candidate = data?.candidates?.[0];
    console.log("[aiService] Candidate:", JSON.stringify(candidate, null, 2));

    const parts = candidate?.content?.parts ?? [];
    console.log("[aiService] Parts sayı:", parts.length);

    const textPart = parts.find(
      (part: any) =>
        typeof part.text === "string" && part.text.trim().length > 0,
    );
    const text = textPart?.text?.trim();
    console.log("[aiService] Extracted text:", text);

    if (!text) {
      console.log("[aiService] ❌ Gemini-dən text gəlmədi, return null");
      return null;
    }

    const jsonStr = text.replace(/```json|```/g, "").trim();
    console.log("[aiService] JSON string (cleaned):", jsonStr);

    let result;
    try {
      result = JSON.parse(jsonStr);
      console.log(
        "[aiService] ✅ JSON parse uğurlu:",
        JSON.stringify(result, null, 2),
      );
    } catch (e) {
      console.log("[aiService] ❌ JSON parse xətası:", e);
      console.log("[aiService] JSON parse edilə bilmədi, return null");
      return null;
    }

    const isProduct = result?.isProduct !== false;
    console.log("[aiService] isProduct:", isProduct);

    if (!isProduct) {
      console.log("[aiService] ❌ Məhsul deyil (isProduct=false), return null");
      return null;
    }

    const confidence =
      typeof result?.confidence === "number" ? result.confidence : 0.65;
    console.log("[aiService] Confidence:", confidence);

    if (confidence < 0.25) {
      console.log(
        "[aiService] ❌ Confidence çox aşağıdır (<0.25), return null",
      );
      return null;
    }

    const allProducts = [...FEATURED_PRODUCTS, ...RECOMMENDED_PRODUCTS];
    console.log("[aiService] Mock məhsul sayı:", allProducts.length);
    console.log("[aiService] Axtarılan məhsul adı:", result.name);
    console.log("[aiService] Axtarılan kateqoriya:", result.category);

    let matches = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(result.name.toLowerCase()) ||
        result.name.toLowerCase().includes(p.name.toLowerCase()),
    );
    console.log("[aiService] Ad üzrə tapılan matches:", matches.length);
    if (matches.length > 0) {
      console.log(
        "[aiService] Ad üzrə tapılan məhsullar:",
        matches.map((m) => ({
          name: m.name,
          price: m.price,
          store: m.store,
          category: m.category,
        })),
      );
    }

    if (matches.length === 0) {
      console.log(
        "[aiService] Ad üzrə match tapılmadı, kateqoriya üzrə axtarılır...",
      );
      const categoryMatches = allProducts.filter(
        (p) => p.category.toLowerCase() === result.category.toLowerCase(),
      );
      console.log(
        "[aiService] Kateqoriya üzrə tapılan:",
        categoryMatches.length,
      );
      if (categoryMatches.length > 0) {
        console.log(
          "[aiService] Kateqoriya matchları:",
          categoryMatches.map((m) => ({
            name: m.name,
            price: m.price,
            category: m.category,
          })),
        );
      }

      const knownCategories = new Set(
        allProducts.map((p) => p.category.toLowerCase()),
      );
      console.log("[aiService] Mövcud kateqoriyalar:", [...knownCategories]);

      if (knownCategories.has(result.category.toLowerCase())) {
        matches = categoryMatches.slice(0, 3);
        console.log(
          "[aiService] Kateqoriya ilə match tapıldı, istifadə olunur:",
          matches.length,
        );
      } else {
        console.log("[aiService] Kateqoriya da bazada yoxdur");
      }
    }

    const foundInStore = matches.length > 0;
    console.log("[aiService] foundInStore:", foundInStore);

    const finalMatches = matches
      .map((p) => {
        const meta = STORE_META[p.store] ?? randomMeta();
        return {
          store: p.store,
          price: p.price,
          name: p.name,
          image: typeof p.image === "string" ? p.image : "",
          distanceKm: meta.distanceKm,
          address: meta.address,
          eta: meta.eta,
        };
      })
      .sort((a, b) => a.price - b.price);

    console.log(
      "[aiService] Final matches (sorted by price):",
      JSON.stringify(finalMatches, null, 2),
    );

    const bestPrice =
      finalMatches.length > 0
        ? finalMatches.reduce(
            (best, current) => (current.price < best.price ? current : best),
            finalMatches[0],
          )
        : undefined;
    console.log(
      "[aiService] Best price:",
      bestPrice
        ? `${bestPrice.name} - ${bestPrice.price}₼ @ ${bestPrice.store}`
        : "yoxdur",
    );

    const closestStore =
      finalMatches.length > 0
        ? finalMatches.reduce(
            (closest, current) =>
              current.distanceKm < closest.distanceKm ? current : closest,
            finalMatches[0],
          )
        : undefined;
    console.log(
      "[aiService] Closest store:",
      closestStore
        ? `${closestStore.store} - ${closestStore.distanceKm}km`
        : "yoxdur",
    );

    const finalResult: ProductAnalysis = {
      detectedName: result.name,
      category: result.category,
      confidence,
      isProduct,
      matches: finalMatches,
      bestPrice,
      closestStore,
      foundInStore,
    };

    console.log("[aiService] ===== FINAL RESULT =====");
    console.log("[aiService] detectedName:", finalResult.detectedName);
    console.log("[aiService] category:", finalResult.category);
    console.log("[aiService] confidence:", finalResult.confidence);
    console.log("[aiService] isProduct:", finalResult.isProduct);
    console.log("[aiService] foundInStore:", finalResult.foundInStore);
    console.log("[aiService] matches count:", finalResult.matches.length);
    console.log(
      "[aiService] Full result:",
      JSON.stringify(finalResult, null, 2),
    );
    console.log("[aiService] ===== identifyProductFromImage END =====");

    return finalResult;
  } catch (error) {
    console.log("[aiService] ❌ CATCH BLOCK - Ümumi xəta:", error);
    return null;
  }
};
