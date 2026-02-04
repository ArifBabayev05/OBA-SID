import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatasetEntry } from './datasetService';
import { buildInsights } from './insightsService';

export const AI_SUMMARY_KEY = 'ai_summary';

export interface AISummary {
  headline: string;
  bulletPoints: string[];
  recommendations: string[];
  timestamp: string;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
  savingsTip: string;
  weeklyPrediction?: string;
}

const callLLM = async (prompt: string): Promise<string | null> => {
  const apiKey = "AIzaSyAQQnX3bEfBbd72QXzVEC4YCnKxHVsp25k";
  if (!apiKey) return null;

  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const fullPrompt = `
Sən Azərbaycan alıcıları üçün şəxsi grocery qənaət köməkçisisən.
Cavabları çox qısa, praktik və sadə Azərbaycan dilində yaz.
Fokus: qənaət, endirimlər, növbəti ağıllı alışlar.

Məlumat:
${prompt}
`.trim();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData ??
      null;

    if (!text) {
      return null;
    }

    return text as string;
  } catch (error: any) {
    return null;
  }
};


export const generateAISummary = async (entries: DatasetEntry[]): Promise<AISummary> => {
  const insights = buildInsights(entries);

  if (entries.length === 0) {
    return {
      headline: 'Qəbz skan etməyə başlayın',
      bulletPoints: ['Qəbzlərinizi skan edin', 'Xərclərinizi izləyin', 'Qənaət edin'],
      recommendations: [
        'Qəbz skan etməklə başlayın',
        'Mağaza məlumatlarınız toplanacaq',
        'AI təhlili tezliklə hazır olacaq'
      ],
      timestamp: new Date().toISOString(),
      spendingTrend: 'stable',
      savingsTip: 'İlk qəbzinizi skan edərək ağıllı qənaət tövsiyələri alın.',
    };
  }

  const latestStore = entries[0]?.storeName || 'naməlum mağaza';
  const latestTotal = entries[0]?.totalAmount?.toFixed(2) ?? '0.00';
  const totalSpend = entries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const topProducts = insights.topProducts.slice(0, 3).map(p => p.name).join(', ') || 'məlumat yoxdur';

  const weeklyTrends = insights.weeklyTrends;
  let spendingTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (weeklyTrends.length >= 2) {
    const lastWeek = weeklyTrends[weeklyTrends.length - 1].amount;
    const previousWeek = weeklyTrends[weeklyTrends.length - 2].amount;
    if (lastWeek > previousWeek * 1.1) {
      spendingTrend = 'increasing';
    } else if (lastWeek < previousWeek * 0.9) {
      spendingTrend = 'decreasing';
    }
  }

  const savingsOpportunity = insights.savingsOpportunity;
  const prediction = insights.spendingPrediction;

  const basePrompt = `
İSTİFADƏÇİ PROFİLİ:
- Son qəbz: ${latestStore} - ${latestTotal} AZN
- Son 30 gündə xərcləmə: ${insights.monthlySpend.toFixed(2)} AZN
- Ümumi xərc: ${totalSpend.toFixed(2)} AZN
- Skan edilmiş qəbz sayı: ${entries.length}
- Ən çox alınan məhsullar: ${topProducts}
- Xərc trendi: ${spendingTrend === 'increasing' ? 'Artmaqdadır' : spendingTrend === 'decreasing' ? 'Azalmaqdadır' : 'Sabitdir'}
- Qənaət potensialı: ${savingsOpportunity.potential}₼
- Növbəti həftə proqnozu: ${prediction.nextWeekEstimate}₼ (Etibar: ${prediction.confidence})

TAPŞIRIq:
Yuxarıdakı məlumata əsasən, istifadəçiyə 3 KONKRET və FAYDALI məsləhət ver.
Məsləhətlər konkret rəqəmlərə əsaslanmalıdır:
- Xərc trendindən istifadə edərək büdcə məsləhəti
- Qənaət potensialından yararlanma yolları
- Proqnoza əsasən gələcək planlama
- Konkret məhsul/mağaza tövsiyələri

Format:
Başlıq: <Qısa, praktik başlıq - maksimum 6 söz>
- <Məsləhət 1: konkret rəqəm və təklif>
- <Məsləhət 2: konkret rəqəm və təklif>
- <Məsləhət 3: konkret rəqəm və təklif>

Azərbaycan dilində yaz. Ümumi sözlər yox, KONKRET rəqəm və təkliflər ver.
`;

  const llmResponse = await callLLM(basePrompt);

  let headline = spendingTrend === 'increasing'
    ? 'Xərcləriniz artmaqdadır'
    : spendingTrend === 'decreasing'
      ? 'Yaxşı iş! Xərcləriniz azalır'
      : 'Xərcləriniz sabitdir';

  let recommendations: string[] = [
    `${latestStore} mağazasında son alışınız ${latestTotal} AZN olub`,
    `Bu ay ${insights.monthlySpend.toFixed(2)} AZN xərcləmisiniz`,
    savingsOpportunity.recommendation
  ];

  if (llmResponse) {
    const lines = llmResponse.split('\n').filter(l => l.trim().length > 0);
    const headlineLine = lines.find(l => l.toLowerCase().includes('başlıq') || (!l.startsWith('-') && !l.startsWith('•') && l.length > 10 && l.length < 60));
    if (headlineLine) {
      headline = headlineLine.replace(/başlıq:/i, '').replace(/^[-•\s]+/, '').trim();
    }

    const recLines = lines.filter(l => (l.trim().startsWith('-') || l.trim().startsWith('•')) && l.length > 10);
    if (recLines.length > 0) {
      recommendations = recLines.map(l => l.replace(/^[-•\s]+/, '').trim()).slice(0, 3);
    }
  }

  const summary: AISummary = {
    headline,
    bulletPoints: recommendations.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    timestamp: new Date().toISOString(),
    spendingTrend,
    savingsTip: savingsOpportunity.recommendation,
    weeklyPrediction: `Növbəti həftə təxmini: ${prediction.nextWeekEstimate}₼`,
  };

  await AsyncStorage.setItem(AI_SUMMARY_KEY, JSON.stringify(summary));
  return summary;
};

export const getLatestAISummary = async (): Promise<AISummary | null> => {
  try {
    const stored = await AsyncStorage.getItem(AI_SUMMARY_KEY);
    return stored ? (JSON.parse(stored) as AISummary) : null;
  } catch (error) {
    return null;
  }
};

export const clearAISummary = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AI_SUMMARY_KEY);
  } catch (error) {
  }
};
