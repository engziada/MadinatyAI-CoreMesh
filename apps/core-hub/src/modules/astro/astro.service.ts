import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@madinatyai/prisma';
import {
  buildSystemInstruction,
  buildRouterSystemInstruction,
  type LocaleCode,
} from './astro-knowledge';

const MODEL_NAME = 'llama-3.1-8b-instant';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SERPER_API_URL = 'https://google.serper.dev/search';

type SearchResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type DiscoveryItem = {
  name: string;
  note: string;
  rating: string;
  sourceName: string;
  sourceUrl: string;
};

type DiscoveryPayload = {
  intro: string;
  items: DiscoveryItem[];
  followup: string;
};

type GroqMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

type GroqChoice = {
  message?: {
    content?: string;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
  };
};

interface ChatHistoryEntry {
  role: string;
  content: string;
}

export interface AstroChatResult {
  reply: string;
}

const SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'search_madinaty_web',
    description:
      'Search the trusted public web (Google Maps, Tripadvisor, Instagram, Facebook) for physical places, shops, products, services, outings, or rentals located inside Madinaty city. Do NOT use this for questions about Madinaty AI, the ERP project, or our platform services. Use this ONLY for live local city discovery.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "Focused search query. Keep it short, relevant, and in the user's language.",
        },
      },
      required: ['query'],
    },
  },
};

const INITIATE_WHATSAPP_TOOL = {
  type: 'function' as const,
  function: {
    name: 'initiate_whatsapp_session',
    description:
      'Initiate a direct WhatsApp session with the user/visitor when they ask about the platform, our projects (like ERP), or our services, AND the answer is not in the provided facts, OR when they explicitly want to contact us. Requires the visitor\'s WhatsApp phone number (Egyptian format).',
    parameters: {
      type: 'object',
      properties: {
        visitorPhone: {
          type: 'string',
          description:
            'The visitor\'s WhatsApp phone number in Egyptian format (e.g., 01xxxxxxxxx or +201xxxxxxxxx). MUST be provided by the user in the chat. DO NOT use the admin number +201026655008.',
        },
        visitorName: {
          type: 'string',
          description: 'The visitor\'s name.',
        },
        query: {
          type: 'string',
          description: "The visitor's query or question that wasn't answered.",
        },
      },
      required: ['visitorPhone'],
    },
  },
};

const SEARCH_LISTINGS_TOOL = {
  type: 'function' as const,
  function: {
    name: 'search_listings',
    description:
      'Search active listings in the Souk ElKanto marketplace (resident-to-resident second-hand items for sale inside Madinaty). Use this when the user asks about buying, browsing, or finding items for sale — e.g. "is there a sofa for sale?", "looking for kids toys", "find electronics". Returns matching listings with title, price, condition, and district.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for listing title/description. Keep it short, e.g. "sofa", "kids toys", "laptop".',
        },
      },
      required: ['query'],
    },
  },
};

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function getSourceSiteName(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('google.com')) return 'Google Maps';
    if (host.includes('tripadvisor.com')) return 'Tripadvisor';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('facebook.com')) return 'Facebook';
    return host.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function replaceBareUrlsWithHotlinks(text: string): string {
  const urlRegex = /(?<!\]\()https?:\/\/[^\s)]+/g;
  return text.replace(urlRegex, (url) => `[${getSourceSiteName(url)}](${url})`);
}

function normalizeSourceName(name: string, url: string): string {
  const site = getSourceSiteName(url);
  const n = name.trim().toLowerCase();
  if (n.includes('google')) return 'Google Maps';
  if (n.includes('trip')) return 'Tripadvisor';
  if (n.includes('insta')) return 'Instagram';
  if (n.includes('face')) return 'Facebook';
  return site;
}

function buildSerperQuery(message: string): string {
  return [
    message,
    'Madinaty',
    'New Cairo',
    'Egypt',
    '(site:google.com/maps OR site:tripadvisor.com OR site:facebook.com OR site:instagram.com)',
  ].join(' ');
}

function isMadinatyRelevant(result: SearchResult): boolean {
  const text = `${result.title ?? ''} ${result.snippet ?? ''} ${result.link ?? ''}`.toLowerCase();
  return (
    text.includes('madinaty') ||
    text.includes('مدينتي') ||
    text.includes('new cairo') ||
    text.includes('القاهرة الجديدة')
  );
}

function safeDiscoveryFallback(locale: LocaleCode): string {
  if (locale === 'ar') {
    return [
      'حالياً تعذّر الوصول لمصادر بحث الويب الموثوقة أو لم أجد نتائج كافية داخل مدينتي.',
      'لن أذكر أسماء غير مؤكدة.',
      'حاول إضافة تفاصيل أدق مثل: النوع، المنطقة، والميزانية.',
    ].join(' ');
  }
  return [
    'Trusted web search is currently unavailable or returned insufficient in-Madinaty results.',
    "I won't list unverified venue names.",
    'Try adding more detail such as category, district, and budget.',
  ].join(' ');
}

function buildDiscoveryGroundingInstruction(locale: LocaleCode): string {
  if (locale === 'ar') {
    return [
      'أنت مساعد مدينتي للبحث المحلي.',
      'استخدم حصراً بيانات المصادر المقدمة لك في الرسالة ولا تضف أي معلومة من عندك.',
      'لا تختلق أسماء أو أسعار أو تقييمات أو عناوين.',
      'إذا كانت معلومة غير موجودة في المصادر، اكتب: غير متاح.',
      'أخرج JSON صالح فقط بدون أي نص إضافي.',
      'صيغة JSON المطلوبة: {"intro":"جملة افتتاحية ودودة قصيرة بالعربية","items":[{"name":"...","note":"وصف قصير مستخلص من snippet","rating":"...","sourceName":"...","sourceUrl":"..."}],"followup":"سؤال متابعة قصير"}',
      'name يجب أن يكون اسم المكان الفعلي مأخوذاً فقط من title أو من username/handle في الرابط.',
      'ممنوع منعاً باتاً استخدام اسم طبق أو منتج كـ name.',
      'إذا لم تستطع تحديد الاسم الفعلي للمكان، استبعد هذه النتيجة.',
      'sourceName يجب أن يكون أحد: Google Maps, Tripadvisor, Instagram, Facebook.',
    ].join(' ');
  }
  return [
    'You are Madinaty local discovery assistant.',
    'Use only the provided source data from the user message.',
    'Do not invent names, prices, ratings, addresses, or hours.',
    'If a field is missing in source data, write: Not available.',
    'Output valid JSON only and no extra text.',
    'Required JSON format: {"intro":"short friendly opener","items":[{"name":"...","note":"short helpful note from snippet","rating":"...","sourceName":"...","sourceUrl":"..."}],"followup":"short follow-up question"}',
    'name must be the actual establishment, taken only from the result `title` field or the account handle in the URL.',
    'Never use a dish name, menu item, or product as the venue name.',
    'If the venue name cannot be identified, drop the result.',
    'sourceName must be one of: Google Maps, Tripadvisor, Instagram, Facebook.',
  ].join(' ');
}

function tryParseDiscoveryPayload(raw: string, locale: LocaleCode): DiscoveryPayload | null {
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<DiscoveryPayload>;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    const items = parsed.items
      .map((item) => ({
        name: String(item?.name ?? '').trim(),
        note: String(item?.note ?? '').trim(),
        rating: String(item?.rating ?? '').trim(),
        sourceName: String(item?.sourceName ?? '').trim(),
        sourceUrl: String(item?.sourceUrl ?? '').trim(),
      }))
      .filter((item) => item.name && item.sourceUrl)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        sourceName: normalizeSourceName(item.sourceName || '', item.sourceUrl),
        note: item.note || (locale === 'ar' ? 'غير متاح' : 'Not available'),
        rating: item.rating || (locale === 'ar' ? 'غير متاح' : 'Not available'),
      }));
    if (items.length === 0) return null;
    return {
      intro: String(parsed.intro ?? '').trim(),
      items,
      followup: String(parsed.followup ?? '').trim(),
    };
  } catch {
    return null;
  }
}

function renderDiscoveryPayload(locale: LocaleCode, payload: DiscoveryPayload): string {
  const lines: string[] = [];
  if (payload.intro) lines.push(payload.intro, '');
  payload.items.forEach((item) => {
    if (locale === 'ar') {
      lines.push(`- **${item.name}** — ${item.note} — التقييم: ${item.rating} — المصدر: [${item.sourceName}](${item.sourceUrl})`);
    } else {
      lines.push(`- **${item.name}** — ${item.note} — Rating: ${item.rating} — Source: [${item.sourceName}](${item.sourceUrl})`);
    }
  });
  if (payload.followup) lines.push('', payload.followup);
  return lines.join('\n');
}

@Injectable()
export class AstroService {
  private readonly logger = new Logger(AstroService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async chat(message: string, history: ChatHistoryEntry[], locale?: LocaleCode): Promise<AstroChatResult> {
    const detectedLocale: LocaleCode = locale ?? (isArabic(message) ? 'ar' : 'en');

    const groqKey = this.config.get<string>('GROQ_API_KEY');
    if (!groqKey) {
      this.logger.error('GROQ_API_KEY is not set — Astro chat cannot function');
      return {
        reply: detectedLocale === 'ar'
          ? 'مرحباً! أنا أسترو، مساعدك في مدينتي. الخدمة بتشتغل بس محتاجة مفتاح API. تواصل مع الإدارة لتفعيل المساعد الذكي.'
          : "Hi! I'm Astro, your Madinaty assistant. The service is running but needs an API key. Please contact admin to enable the AI assistant.",
      };
    }

    const systemInstruction = buildRouterSystemInstruction(
      buildSystemInstruction(detectedLocale),
      detectedLocale,
    );

    const safeHistory: GroqMessage[] = (history ?? [])
      .filter((entry) => entry.content)
      .slice(-6)
      .map((entry) => ({
        role: entry.role === 'ai' ? 'assistant' : 'user',
        content: entry.content,
      }));

    try {
      const firstChoice = await this.callGroq(
        groqKey,
        [
          { role: 'system', content: systemInstruction },
          ...safeHistory,
          { role: 'user', content: message },
        ],
        true,
        false,
      );

      const toolCall = firstChoice?.message?.tool_calls?.[0];

      // ── Tool: initiate_whatsapp_session ──
      if (toolCall && toolCall.function?.name === 'initiate_whatsapp_session') {
        const result = await this.handleWhatsAppInitiation(toolCall.function.arguments, detectedLocale);
        return { reply: result };
      }

      // ── Tool: search_madinaty_web ──
      if (toolCall && toolCall.function?.name === 'search_madinaty_web') {
        let searchQuery = message;
        try {
          const args = JSON.parse(toolCall.function.arguments || '{}') as { query?: string };
          if (args.query?.trim()) searchQuery = args.query.trim();
        } catch { /* fall back to original message */ }

        try {
          const results = await this.searchTrustedDiscovery(searchQuery);
          if (results && results.length > 0) {
            const groundedReply = await this.synthesizeDiscoveryReply(groqKey, detectedLocale, searchQuery, results);
            if (groundedReply) return { reply: groundedReply };
            return { reply: this.formatDiscoveryReply(detectedLocale, searchQuery, results) };
          }
        } catch (err) {
          this.logger.error(`Serper discovery error: ${(err as Error).message}`);
        }
        return { reply: safeDiscoveryFallback(detectedLocale) };
      }

      // ── Tool: search_listings (Souk ElKanto) ──
      if (toolCall && toolCall.function?.name === 'search_listings') {
        let searchQuery = message;
        try {
          const args = JSON.parse(toolCall.function.arguments || '{}') as { query?: string };
          if (args.query?.trim()) searchQuery = args.query.trim();
        } catch { /* fall back to original message */ }

        const listingReply = await this.searchSoukListings(searchQuery, detectedLocale);
        return { reply: listingReply };
      }

      // ── Direct reply (no tool call) ──
      const directReply = firstChoice?.message?.content?.trim() ?? '';
      const fallback = detectedLocale === 'ar'
        ? 'أنا متخصص في مدينتي فقط. جرب سؤالاً يخص المدينة.'
        : 'I am focused on Madinaty. Try asking about the city.';
      return { reply: directReply || fallback };
    } catch (err) {
      this.logger.error(`Groq chat error: ${(err as Error).message}`);
      return { reply: 'Madinaty Assistant is currently offline.' };
    }
  }

  // ─────────────── Groq API call ───────────────

  private async callGroq(
    apiKey: string,
    messages: GroqMessage[],
    useTools: boolean,
    useJson: boolean,
  ): Promise<GroqChoice | null> {
    const body: Record<string, unknown> = {
      model: MODEL_NAME,
      temperature: 0,
      max_tokens: 650,
      messages,
    };
    if (useTools) {
      body.tools = [SEARCH_LISTINGS_TOOL, SEARCH_TOOL, INITIATE_WHATSAPP_TOOL];
      body.tool_choice = 'auto';
    }
    if (useJson) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`Groq HTTP ${response.status}: ${err}`);
    }

    const payload = (await response.json()) as { choices?: GroqChoice[] };
    return payload.choices?.[0] ?? null;
  }

  // ─────────────── Serper web search ───────────────

  private async searchTrustedDiscovery(message: string): Promise<SearchResult[] | null> {
    const apiKey = this.config.get<string>('SERPER_API_KEY');
    if (!apiKey) return null;

    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: buildSerperQuery(message),
        gl: 'eg',
        hl: 'en',
        num: 10,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`Serper HTTP ${response.status}: ${err}`);
    }

    const payload = (await response.json()) as { organic?: SearchResult[] };
    if (!Array.isArray(payload.organic)) return null;
    return payload.organic.filter(isMadinatyRelevant).slice(0, 5);
  }

  private formatDiscoveryReply(locale: LocaleCode, query: string, results: SearchResult[]): string {
    if (results.length === 0) return safeDiscoveryFallback(locale);

    if (locale === 'ar') {
      const lines = [`نتائج موثوقة داخل مدينتي بخصوص: "${query}"`, ''];
      results.forEach((item, index) => {
        lines.push(`${index + 1}) ${item.title ?? 'نتيجة بدون عنوان'}`);
        lines.push(`المصدر: ${item.link ?? 'غير متاح'}`);
        if (item.snippet) lines.push(`معلومة: ${item.snippet}`);
        lines.push('');
      });
      lines.push('ملاحظة: أعرض فقط نتائج من الويب مع روابط مصدر، بدون اختلاق بيانات.');
      return lines.join('\n');
    }

    const lines = [`Trusted in-Madinaty web results for: "${query}"`, ''];
    results.forEach((item, index) => {
      lines.push(`${index + 1}) ${item.title ?? 'Untitled result'}`);
      lines.push(`Source: ${item.link ?? 'N/A'}`);
      if (item.snippet) lines.push(`Snippet: ${item.snippet}`);
      lines.push('');
    });
    lines.push('Note: Only source-linked web results are shown; no fabricated details.');
    return lines.join('\n');
  }

  private async synthesizeDiscoveryReply(
    apiKey: string,
    locale: LocaleCode,
    query: string,
    results: SearchResult[],
  ): Promise<string | null> {
    const sourcePayload = results.map((item, index) => ({
      index: index + 1,
      title: item.title ?? '',
      link: item.link ?? '',
      snippet: item.snippet ?? '',
    }));

    const userPrompt = locale === 'ar'
      ? [
          `سؤال المستخدم: ${query}`,
          '',
          'بيانات المصادر (JSON):',
          JSON.stringify(sourcePayload, null, 2),
          '',
          'المطلوب: اختر أفضل النتائج داخل مدينتي وقدّم إجابة ودودة ومنظمة، وكل نقطة يجب أن تحتوي على الرابط.',
          'ممنوع إضافة معلومات غير موجودة في JSON.',
        ].join('\n')
      : [
          `User query: ${query}`,
          '',
          'Source data (JSON):',
          JSON.stringify(sourcePayload, null, 2),
          '',
          'Task: pick the best in-Madinaty options and provide a friendly structured answer. Each bullet must include a source link.',
          'Do not add facts not present in JSON.',
        ].join('\n');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: 0,
        max_tokens: 650,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildDiscoveryGroundingInstruction(locale) },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`Groq discovery synthesis HTTP ${response.status}: ${err}`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = payload.choices?.[0]?.message?.content?.trim() ?? '';
    if (!reply) return null;

    const discovery = tryParseDiscoveryPayload(reply, locale);
    if (!discovery) return null;
    return replaceBareUrlsWithHotlinks(renderDiscoveryPayload(locale, discovery));
  }

  // ─────────────── Souk ElKanto listings search ───────────────

  private async searchSoukListings(query: string, locale: LocaleCode): Promise<string> {
    try {
      // Split query into keywords for broader matching.
      // e.g. "bicycle for sale" → ["bicycle", "for", "sale"] → OR per keyword
      const keywords = query.trim().split(/\s+/).filter((k) => k.length >= 2);

      // Build OR conditions: each keyword checked against title and description
      const orConditions: Prisma.SoukListingWhereInput[] = [];
      for (const kw of keywords) {
        orConditions.push(
          { title: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
        );
      }
      // Also try the full query as a single substring (in case of multi-word titles)
      orConditions.push(
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
      );

      const listings = await this.prisma.soukListing.findMany({
        where: {
          status: 'ACTIVE',
          OR: orConditions,
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          askingPrice: true,
          condition: true,
          district: true,
          photos: { orderBy: { position: 'asc' }, take: 1 },
        },
      });

      if (listings.length === 0) {
        // Fallback: show a few recent active listings so the user sees something
        const recent = await this.prisma.soukListing.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            askingPrice: true,
            condition: true,
            district: true,
          },
        });

        if (recent.length === 0) {
          return locale === 'ar'
            ? 'مفيش إعلانات نشطة في سوق الكانتو دلوقتي. تقدر تتصفح السوق بعدين.'
            : 'No active listings in Souk ElKanto right now. Check back later.';
        }

        const fbBase = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3001';

        if (locale === 'ar') {
          const lines = [
            `مفيش إعلانات نشطة بخصوص: "${query}"، بس دي أحدث الإعلانات في السوق:`,
            '',
          ];
          recent.forEach((l) => {
            const url = `${fbBase}/ar/listings/${l.id}`;
            lines.push(`- **[${l.title}](${url})** — ${l.askingPrice} ج.م — حالة: ${l.condition} — منطقة: ${l.district}`);
          });
          lines.push('', `[تقدر تتصفح كل الإعلانات في صفحة السوق](${fbBase}/ar/listings)`);
          return lines.join('\n');
        }

        const enLines = [
          `No active listings for: "${query}", but here are the latest listings in the souk:`,
          '',
        ];
        recent.forEach((l) => {
          const url = `${fbBase}/en/listings/${l.id}`;
          enLines.push(`- **[${l.title}](${url})** — ${l.askingPrice} EGP — condition: ${l.condition} — district: ${l.district}`);
        });
        enLines.push('', `[You can browse all listings on the marketplace page](${fbBase}/en/listings)`);
        return enLines.join('\n');
      }

      const webBase = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3001';

      if (locale === 'ar') {
        const lines = [`لقيت ${listings.length} إعلان في سوق الكانتو بخصوص: "${query}"`, ''];
        listings.forEach((l) => {
          const url = `${webBase}/ar/listings/${l.id}`;
          lines.push(`- **[${l.title}](${url})** — ${l.askingPrice} ج.م — حالة: ${l.condition} — منطقة: ${l.district}`);
        });
        lines.push('', `[تقدر تتصفح كل الإعلانات في صفحة السوق](${webBase}/ar/listings)`);
        return lines.join('\n');
      }

      const lines = [`Found ${listings.length} listing(s) in Souk ElKanto for: "${query}"`, ''];
      listings.forEach((l) => {
        const url = `${webBase}/en/listings/${l.id}`;
        lines.push(`- **[${l.title}](${url})** — ${l.askingPrice} EGP — condition: ${l.condition} — district: ${l.district}`);
      });
      lines.push('', `[You can browse all listings on the marketplace page](${webBase}/en/listings)`);
      return lines.join('\n');
    } catch (err) {
      this.logger.error(`Souk listings search error: ${(err as Error).message}`);
      return locale === 'ar'
        ? 'مقدرش أبحث في الإعلانات دلوقتي. جرب تتصفح السوق مباشرة.'
        : 'I couldn\'t search listings right now. Try browsing the marketplace directly.';
    }
  }

  // ─────────────── WhatsApp initiation ───────────────

  private async handleWhatsAppInitiation(
    rawArgs: string,
    locale: LocaleCode,
  ): Promise<string> {
    let visitorPhone = '';
    let visitorName = 'Visitor';
    let query = '';
    try {
      const args = JSON.parse(rawArgs || '{}') as {
        visitorPhone?: string;
        visitorName?: string;
        query?: string;
      };
      visitorPhone = args.visitorPhone?.trim() || '';
      visitorName = args.visitorName?.trim() || 'Visitor';
      query = args.query?.trim() || '';
    } catch { /* ignore parse errors */ }

    if (!visitorPhone) {
      return locale === 'ar'
        ? 'من فضلك أدخل رقم الواتساب الخاص بك (بالصيغة المصرية) لكي أتمكن من ربطك بفريقنا المباشر.'
        : 'Please provide your personal WhatsApp number (in Egyptian format) so I can connect you with our live team.';
    }

    // Guardrail: prevent AI from hallucinating the admin number as visitor number
    const visitorClean = visitorPhone.replace(/\D/g, '');
    if (
      visitorClean.includes('01026655008') ||
      visitorClean.includes('201026655008') ||
      visitorClean.length < 10
    ) {
      return locale === 'ar'
        ? 'من فضلك أدخل رقم الواتساب الخاص بك (بالصيغة المصرية) لكي أتمكن من ربطك بفريقنا المباشر.'
        : 'Please provide your personal WhatsApp number (in Egyptian format) so I can connect you with our live team.';
    }

    const wahaBaseUrl = this.config.get<string>('WAHA_BASE_URL');
    const wahaApiKey = this.config.get<string>('WAHA_API_KEY');
    const wahaSession = this.config.get<string>('WAHA_SESSION') || 'default';
    const adminPhone = '+201026655008';

    if (!wahaBaseUrl || !wahaApiKey) {
      this.logger.error('WAHA credentials missing in environment variables.');
      return locale === 'ar'
        ? 'عذراً، لم نتمكن من إرسال رسالة واتساب تلقائياً بسبب مشكلة فنية. يرجى التواصل معنا مباشرة على رقمنا: +201026655008.'
        : 'Sorry, we couldn\'t send a WhatsApp message automatically. Please contact us directly at +201026655008.';
    }

    try {
      // Format Egyptian phone number for WAHA
      let digits = visitorPhone.replace(/\D/g, '');
      if (digits.startsWith('002')) digits = digits.slice(2);
      if (digits.startsWith('01') && digits.length === 11) digits = '2' + digits;
      if (digits.startsWith('1') && digits.length === 10) digits = '20' + digits;
      const visitorChatId = `${digits}@c.us`;

      const visitorMessage = locale === 'ar'
        ? `مرحباً ${visitorName}! تلقينا استفسارك على موقع Madinaty AI بخصوص: "${query}". سيقوم أحد ممثلينا بالتواصل معك هنا قريباً.`
        : `Hi ${visitorName}! We received your inquiry on Madinaty AI regarding: "${query}". One of our representatives will chat with you here shortly.`;

      // 1. Send initiation message to visitor
      await fetch(`${wahaBaseUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'X-Api-Key': wahaApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: wahaSession,
          chatId: visitorChatId,
          text: visitorMessage,
        }),
      });

      // 2. Send notification to admin
      const adminChatId = `${adminPhone.replace(/\D/g, '')}@c.us`;
      const adminMessage = `🔔 *استفسار جديد من الموقع (New Website Inquiry)*\n\nالاسم (Name): ${visitorName}\nالتليفون (Phone): ${visitorPhone}\nالاستفسار (Query): ${query}`;

      await fetch(`${wahaBaseUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'X-Api-Key': wahaApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: wahaSession,
          chatId: adminChatId,
          text: adminMessage,
        }),
      });

      return locale === 'ar'
        ? `تم بدء جلسة واتساب بنجاح! لقد أرسلنا رسالة إلى رقمك ${visitorPhone}. سيقوم فريقنا بالتواصل معك الآن.`
        : `WhatsApp session initiated successfully! We've sent a message to your number ${visitorPhone}. Our team will connect with you now.`;
    } catch (err) {
      this.logger.error(`WAHA initiation error: ${(err as Error).message}`);
      return locale === 'ar'
        ? 'عذراً، لم نتمكن من إرسال رسالة واتساب تلقائياً بسبب مشكلة فنية. يرجى التواصل معنا مباشرة على رقمنا: +201026655008.'
        : 'Sorry, we couldn\'t send a WhatsApp message automatically. Please contact us directly at +201026655008.';
    }
  }
}
