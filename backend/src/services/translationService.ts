import { ENV } from '../config/env';

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage: string;
  provider: string;
}

const PHRASE_DICTIONARY: Array<{ en: string; translations: Record<string, string> }> = [
  {
    en: 'hello',
    translations: {
      es: 'hola',
      fr: 'bonjour',
      de: 'hallo',
      ja: 'こんにちは',
      hi: 'नमस्ते',
      zh: '你好',
      ar: 'مرحبا',
    },
  },
  {
    en: 'hi',
    translations: {
      es: 'hola',
      fr: 'salut',
      de: 'hallo',
      ja: 'こんにちは',
      hi: 'नमस्ते',
      zh: '嗨',
      ar: 'مرحبا',
    },
  },
  {
    en: 'thank you',
    translations: {
      es: 'gracias',
      fr: 'merci',
      de: 'danke',
      ja: 'ありがとうございます',
      hi: 'धन्यवाद',
      zh: '谢谢',
      ar: 'شكرا لك',
    },
  },
  {
    en: 'thanks',
    translations: {
      es: 'gracias',
      fr: 'merci',
      de: 'danke',
      ja: 'ありがとうございます',
      hi: 'धन्यवाद',
      zh: '谢谢',
      ar: 'شكرا',
    },
  },
  {
    en: 'shipping',
    translations: {
      es: 'envío',
      fr: 'livraison',
      de: 'Versand',
      ja: '配送',
      hi: 'शिपिंग',
      zh: '运费',
      ar: 'الشحن',
    },
  },
  {
    en: 'delivery',
    translations: {
      es: 'entrega',
      fr: 'livraison',
      de: 'Lieferung',
      ja: '配達',
      hi: 'डिलीवरी',
      zh: '递送',
      ar: 'التوصيل',
    },
  },
  {
    en: 'order',
    translations: {
      es: 'pedido',
      fr: 'commande',
      de: 'Bestellung',
      ja: '注文',
      hi: 'ऑर्डर',
      zh: '订单',
      ar: 'طلب',
    },
  },
  {
    en: 'price',
    translations: {
      es: 'precio',
      fr: 'prix',
      de: 'Preis',
      ja: '価格',
      hi: 'कीमत',
      zh: '价格',
      ar: 'السعر',
    },
  },
  {
    en: 'discount',
    translations: {
      es: 'descuento',
      fr: 'remise',
      de: 'Rabatt',
      ja: '割引',
      hi: 'छूट',
      zh: '折扣',
      ar: 'خصم',
    },
  },
  {
    en: 'warranty',
    translations: {
      es: 'garantía',
      fr: 'garantie',
      de: 'Garantie',
      ja: '保証',
      hi: 'वारंटी',
      zh: '保修',
      ar: 'الضمان',
    },
  },
  {
    en: 'return',
    translations: {
      es: 'devolución',
      fr: 'retour',
      de: 'Rückgabe',
      ja: '返品',
      hi: 'वापसी',
      zh: '退货',
      ar: 'إرجاع',
    },
  },
  {
    en: 'refund',
    translations: {
      es: 'reembolso',
      fr: 'remboursement',
      de: 'Rückerstattung',
      ja: '返金',
      hi: 'रिफंड',
      zh: '退款',
      ar: 'استرداد',
    },
  },
  {
    en: 'tracking number',
    translations: {
      es: 'número de seguimiento',
      fr: 'numéro de suivi',
      de: 'Sendungsnummer',
      ja: '追跡番号',
      hi: 'ट्रैकिंग नंबर',
      zh: '追踪号码',
      ar: 'رقم التتبع',
    },
  },
  {
    en: 'in stock',
    translations: {
      es: 'en stock',
      fr: 'en stock',
      de: 'auf Lager',
      ja: '在庫あり',
      hi: 'स्टॉक में उपलब्ध',
      zh: '有现货',
      ar: 'متوفر في المخزون',
    },
  },
  {
    en: 'customer support',
    translations: {
      es: 'soporte al cliente',
      fr: 'service client',
      de: 'Kundensupport',
      ja: 'カスタマーサポート',
      hi: 'ग्राहक सहायता',
      zh: '客户支持',
      ar: 'دعم العملاء',
    },
  },
  {
    en: 'how long does shipping take',
    translations: {
      es: '¿cuánto tarda el envío?',
      fr: 'combien de temps prend la livraison ?',
      de: 'wie lange dauert der Versand?',
      ja: '配送にはどのくらい時間がかかりますか？',
      hi: 'शिपिंग में कितना समय लगता है?',
      zh: '运送需要多长时间？',
      ar: 'كم من الوقت يستغرق الشحن؟',
    },
  },
  {
    en: 'your tracking number is',
    translations: {
      es: 'tu número de seguimiento es',
      fr: 'votre numéro de suivi est',
      de: 'Ihre Sendungsnummer lautet',
      ja: 'お客様の追跡番号は',
      hi: 'आपका ट्रैकिंग नंबर है',
      zh: '您的追踪号码是',
      ar: 'رقم التتبع الخاص بك هو',
    },
  },
  {
    en: 'when will my order arrive',
    translations: {
      es: '¿cuándo llegará mi pedido?',
      fr: 'quand ma commande arrivera-t-elle ?',
      de: 'wann kommt meine Bestellung an?',
      ja: '注文はいつ届きますか？',
      hi: 'मेरा ऑर्डर कब आएगा?',
      zh: '我的订单什么时候到达？',
      ar: 'متى سيصل طلبي؟',
    },
  },
];

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  hi: 'हिन्दी',
  zh: '中文',
  ar: 'العربية',
};

export class TranslationService {
  /**
   * Detects the primary language of a text string using Unicode ranges and lexical markers.
   */
  public detectLanguage(text: string): string {
    if (!text || !text.trim()) return 'en';
    const trimmed = text.trim();

    // Script-based detection
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) return 'ja';
    if (/[\u4E00-\u9FFF]/.test(trimmed)) return 'zh';
    if (/[\u0900-\u097F]/.test(trimmed)) return 'hi';
    if (/[\u0600-\u06FF]/.test(trimmed)) return 'ar';

    const lower = trimmed.toLowerCase();

    // Spanish markers
    if (
      /[¿¡ñáéíóúü]/.test(lower) ||
      /\b(hola|gracias|pedido|envío|precio|cuánto|cuándo|quiero|ayuda|por favor|buenos días)\b/.test(lower)
    ) {
      return 'es';
    }

    // French markers
    if (
      /[àâçéèêëîïôùûüÿœ]/.test(lower) ||
      /\b(bonjour|merci|commande|livraison|prix|combien|pouvez|aide|s'il vous plaît)\b/.test(lower)
    ) {
      return 'fr';
    }

    // German markers
    if (
      /[äöüß]/.test(lower) ||
      /\b(hallo|danke|bestellung|versand|preis|wieviel|wann|hilfe|bitte|guten tag)\b/.test(lower)
    ) {
      return 'de';
    }

    return 'en';
  }

  /**
   * Translates text to the requested target language.
   * Uses Gemini (when configured) or live translation API with a 3-second timeout,
   * and falls back to the built-in deterministic multilingual commerce dictionary.
   */
  public async translateText(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<TranslationResult> {
    const cleanText = text?.trim() || '';
    const normalizedTarget = (targetLang || 'en').toLowerCase().split('-')[0];
    const detectedSource = sourceLang
      ? sourceLang.toLowerCase().split('-')[0]
      : this.detectLanguage(cleanText);

    if (!cleanText || detectedSource === normalizedTarget) {
      return {
        translatedText: text,
        detectedSourceLanguage: detectedSource,
        provider: 'native',
      };
    }

    // 1. Try Gemini API if configured
    if (ENV.GEMINI_API_KEY) {
      try {
        const langName = LANGUAGE_LABELS[normalizedTarget] || normalizedTarget;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Translate the following e-commerce customer/seller chat message into ${langName} (${normalizedTarget}). Preserve order IDs, tracking numbers, URLs, and prices accurately. Output ONLY the translated text without quotes or commentary:\n\n${cleanText}`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = (await geminiRes.json()) as any;
          const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) {
            return {
              translatedText: translated,
              detectedSourceLanguage: detectedSource,
              provider: 'gemini',
            };
          }
        }
      } catch {
        // Fall through to live translation API / offline fallback
      }
    }

    // 2. Try Google Translate public endpoint with 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const slParam = sourceLang ? detectedSource : 'auto';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
        slParam
      )}&tl=${encodeURIComponent(normalizedTarget)}&dt=t&q=${encodeURIComponent(cleanText)}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as any;
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translatedChunks = data[0]
            .map((chunk: any) => (Array.isArray(chunk) ? chunk[0] : ''))
            .filter(Boolean);
          const combined = translatedChunks.join('').trim();
          const apiDetected = typeof data[2] === 'string' ? data[2] : detectedSource;
          if (combined) {
            return {
              translatedText: combined,
              detectedSourceLanguage: apiDetected,
              provider: 'google-translate',
            };
          }
        }
      }
    } catch {
      // Fall through to deterministic dictionary translator
    }

    // 3. Deterministic offline fallback dictionary & phrase replacement
    const fallbackResult = this.offlineTranslate(cleanText, detectedSource, normalizedTarget);
    return {
      translatedText: fallbackResult,
      detectedSourceLanguage: detectedSource,
      provider: 'convocart-multilingual-fallback',
    };
  }

  private offlineTranslate(text: string, sourceLang: string, targetLang: string): string {
    let result = text;
    let replacedAny = false;

    // Sort longest phrases first to avoid partial match overrides
    const sorted = PHRASE_DICTIONARY.slice().sort((a, b) => b.en.length - a.en.length);

    for (const entry of sorted) {
      const sourceText = sourceLang === 'en' ? entry.en : entry.translations[sourceLang];
      const targetText = targetLang === 'en' ? entry.en : entry.translations[targetLang];
      if (!sourceText || !targetText) continue;

      const escaped = sourceText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, targetText);
        replacedAny = true;
      } else if (sourceLang !== 'en' && result.toLowerCase().includes(sourceText.toLowerCase())) {
        result = result.replace(new RegExp(escaped, 'gi'), targetText);
        replacedAny = true;
      }
    }

    if (replacedAny) {
      return result;
    }

    const langBadge = LANGUAGE_LABELS[targetLang] || targetLang.toUpperCase();
    return `[${langBadge}] ${text}`;
  }
}

export const translationService = new TranslationService();
