import { CAMBODIA_PROVINCES } from '@utils/cambodia-provinces';

export interface ProvinceItem {
  id: string;
  code: string;
  name: string;
  english: string;
  khmer: string;
}

// In-memory cache to prevent repeated remote network requests
let cachedProvinces: ProvinceItem[] | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const cleanProvinceName = (english: string): string => {
  return english
    .replace(/\s+Province$/i, '')
    .replace(/\s+Capital$/i, '')
    .replace(/\s+Municipality$/i, '')
    .replace(/Siemreap/i, 'Siem Reap')
    .replace(/Mondul\s*Kiri/i, 'Mondulkiri')
    .replace(/Ratanak\s*Kiri/i, 'Ratanakiri')
    .trim();
};

export const getCambodiaProvinces = async (): Promise<{ success: boolean; data: ProvinceItem[] }> => {
  const now = Date.now();
  if (cachedProvinces && now - lastFetchedAt < CACHE_TTL_MS) {
    return { success: true, data: cachedProvinces };
  }

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/NorakGithub/cambodia-gazetteer/main/provinces.json',
      { signal: AbortSignal.timeout(6000) }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch gazetteer: ${response.status}`);
    }

    const rawData = await response.json();
    if (Array.isArray(rawData) && rawData.length > 0) {
      cachedProvinces = rawData.map((p: any) => ({
        id: p.id || p.code,
        code: p.code,
        name: cleanProvinceName(p.english || ''),
        english: p.english || '',
        khmer: p.local || '',
      }));
      lastFetchedAt = now;
      return { success: true, data: cachedProvinces };
    }
  } catch (error) {
    console.warn('Remote gazetteer API fetch warning, fallback activated:', error);
  }

  // Graceful fallback to official 25 administrative divisions if external fetch fails
  const fallbackData: ProvinceItem[] = CAMBODIA_PROVINCES.map((name, index) => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    code: String(index + 1).padStart(2, '0'),
    name,
    english: name === 'Phnom Penh' ? 'Phnom Penh Capital' : `${name} Province`,
    khmer: '',
  }));

  cachedProvinces = fallbackData;
  lastFetchedAt = now;
  return { success: true, data: fallbackData };
};
