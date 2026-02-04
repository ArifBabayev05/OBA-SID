import axios from 'axios';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { PurchaseItem, Receipt } from '../types';

if (typeof (globalThis as any).Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

const OCR_API_KEY = 'helloworld';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

// Extract document ID from e-kassa URL
export const extractDocIdFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/doc=([^&]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

// Fetch receipt image from e-kassa API and save locally
export const fetchReceiptFromEKassa = async (docId: string): Promise<string> => {
  try {
    const response = await axios.get(
      `https://monitoring.e-kassa.gov.az/pks-monitoring/2.0.0/documents/${docId}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 15000,
        responseType: 'arraybuffer',
      }
    );

    if (!response || !response.data) {
      throw new Error('Invalid response from e-kassa API');
    }

    const base64Data = Buffer.from(response.data).toString('base64');
    const cacheDir =
      (FileSystem as any).cacheDirectory ||
      (FileSystem as any).documentDirectory ||
      '';
    const fileUri = `${cacheDir}ekassa-${docId}.jpg`;
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: (FileSystem as any).EncodingType?.Base64 ?? 'base64',
    });

    return fileUri;
  } catch (error: any) {
    throw new Error(`Failed to fetch receipt: ${error?.message || 'Unknown error'}`);
  }
};

// Process receipt image with OCR
export const processReceiptImage = async (imageUri: string): Promise<Partial<Receipt>> => {
  try {
    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('apikey', OCR_API_KEY);
    formData.append('isTable', 'true');

    const response = await axios.post(OCR_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      const parsedText = response.data.ParsedResults[0].ParsedText;
      const lines = parsedText.split('\n');

      const aiParsed = await aiParseReceiptStructure(parsedText);
      let total = 0;
      let items: PurchaseItem[] = [];
      let detectedStore: string | undefined;

      if (aiParsed && aiParsed.totalAmount && aiParsed.items && aiParsed.items.length > 0) {
        total = aiParsed.totalAmount;
        items = aiParsed.items;
        detectedStore = aiParsed.storeName;
      } else {
        const parsed = parseReceiptText(lines);
        total = parsed.total;
        items = parsed.items;
        detectedStore = parsed.detectedStore;
      }

      const storeName = detectedStore || extractStoreName(parsedText);

      return {
        text: parsedText.substring(0, 500),
        totalAmount: total,
        items,
        date: new Date().toISOString(),
        imageUrl: imageUri,
        storeName,
        fiscalId: extractFiscalId(parsedText),
        id: Date.now().toString(),
      };
    }

    throw new Error('No text found in receipt');
  } catch (error) {
    throw error;
  }
};

// Process QR code data - extract URL, download image, and run OCR
export const processQRCode = async (qrData: string): Promise<Partial<Receipt>> => {
  try {
    const docId = extractDocIdFromUrl(qrData);
    if (!docId) {
      throw new Error('Invalid QR code format');
    }

    const imageUri = await fetchReceiptFromEKassa(docId);
    const receiptData = await processReceiptImage(imageUri);

    if (!receiptData.text) {
      throw new Error('Failed to extract data from receipt');
    }

    const storeName =
      extractStoreName(receiptData.text) ||
      receiptData.storeName ||
      'Unknown Store';

    return {
      ...receiptData,
      id: Date.now().toString(),
      date: receiptData.date || new Date().toISOString(),
      storeName,
      fiscalId: docId,
    };
  } catch (error: any) {
    throw new Error(error?.message || 'Unknown error');
  }
};

const numericLineRegex = /^\s*[\d\s\.\-:/]+$/;
const dateRegex = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/;
const totalKeywords = /(total|cəmi|sum|umi)/i;

const parseReceiptText = (
  lines: string[]
): { total: number; items: PurchaseItem[]; detectedStore?: string } => {
  let total = 0;
  const items: PurchaseItem[] = [];
  let detectedStore: string | undefined;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    if (dateRegex.test(line) || line.toLowerCase().includes('cashier')) return;
    if (line.toLowerCase().includes('object name')) {
      detectedStore = line.split(':').pop()?.trim() || detectedStore;
      return;
    }
    if (numericLineRegex.test(line)) return;

    const priceMatches = line.match(/\d+[.,]\d{2}/g);
    if (priceMatches && priceMatches.length > 0) {
      const value = parseFloat(priceMatches[priceMatches.length - 1].replace(',', '.'));
      if (totalKeywords.test(line.toLowerCase())) {
        total = value;
        return;
      }
      const cleaned = line.replace(priceMatches.join(' '), '').trim();
      if (cleaned.length > 1 && !cleaned.toLowerCase().includes('tax')) {
        items.push({
          name: cleaned,
          price: value,
          category: categorizeProduct(cleaned),
        });
      }
    }
  });

  if (total === 0 && items.length > 0) {
    total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  return { total, items, detectedStore };
};

const extractStoreName = (text: string): string | undefined => {
  if (!text) return undefined;
  const storeMatch =
    text.match(/Obyektin adı[:\s]+(.+)/i) ||
    text.match(/Store[:\s]+(.+)/i);

  if (storeMatch) {
    return storeMatch[1].split('\n')[0].trim();
  }

  const firstLine = text
    .split('\n')
    .map(line => line.trim())
    .find(Boolean);

  return firstLine || undefined;
};

const categorizeProduct = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.match(/milk|süt|yogurt|cheese|pendir|butter|cream/)) return 'Dairy';
  if (lower.match(/bread|çörək|bun|loaf|baguette/)) return 'Bakery';
  if (lower.match(/meat|chicken|beef|turkey|liver|sausage|balıq|fish/)) return 'Meat & Fish';
  if (lower.match(/apple|banana|fruit|pear|peach|fruit|grape|orange|vegetable|salad|tomato|cucumber|potato|carrot/)) return 'Fresh Produce';
  if (lower.match(/rice|pasta|flour|sugar|salt|oil|lentil|beans/)) return 'Pantry';
  if (lower.match(/coffee|tea|cola|drink|juice|water|soda/)) return 'Beverages';
  if (lower.match(/soap|detergent|clean|shampoo|toothpaste|paper/)) return 'Household';
  if (lower.match(/chocolate|snack|chips|candy|biscuit|cracker/)) return 'Snacks';
  return 'General';
};

const extractFiscalId = (text: string): string | undefined => {
  const match =
    text.match(/fiscal id[:\s]*([a-z0-9\-]+)/i) ||
    text.match(/fiskal id[:\s]*([a-z0-9]+)/i) ||
    text.match(/Fiskal ID[:\s]*([A-Za-z0-9]+)/);
  return match ? match[1].trim() : undefined;
};

const aiParseReceiptStructure = async (
  text: string
): Promise<{ items?: PurchaseItem[]; totalAmount?: number; storeName?: string } | null> => {
  const apiKey = "AIzaSyAQQnX3bEfBbd72QXzVEC4YCnKxHVsp25k";
  if (!apiKey) return null;

  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = `
Sən OCR mətni analiz edən assistanssan. Aşağıdakı qəbz mətini təhlil et və strukturlu JSON cavab ver.

VACIB QAYDA:
1. "storeName": Mağaza adını dəqiq tap. 
2. "items": YALNIZ mahsul adlarını daxil et.
3. "totalAmount": Ümumi məbləği tap.

JSON Schema:
{
 "storeName": string,
 "items": [{ "name": string, "price": number }],
 "totalAmount": number
}

OCR Mətni:
"""
${text}
"""

Yalnız JSON cavab ver.
  `.trim();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const textPart =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!textPart) return null;
    const parsed = JSON.parse(textPart);
    if (!parsed) return null;

    return {
      storeName: parsed.storeName,
      totalAmount: parsed.totalAmount,
      items: Array.isArray(parsed.items)
        ? parsed.items
          .filter((it: any) => it?.name && it?.price)
          .map((it: any) => ({
            name: it.name,
            price: Number(it.price),
            category: categorizeProduct(it.name),
          }))
        : undefined,
    };
  } catch (error: any) {
    return null;
  }
};
