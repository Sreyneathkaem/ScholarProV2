"use client";

import { useState, useEffect } from "react";
import { CAMBODIA_PROVINCES } from "@/constants/provinces";

export interface ProvinceItem {
  id: string;
  code: string;
  name: string;
  english: string;
  khmer: string;
}

interface RawGazetteerProvince {
  id?: string;
  code: string;
  english?: string;
  local?: string;
}

// In-memory cache in client session so we don't refetch on every step re-render
let cachedProvinces: ProvinceItem[] | null = null;

const DEFAULT_PROVINCE_ITEMS: ProvinceItem[] = CAMBODIA_PROVINCES.map(
  (name, index) => ({
    id: name.toLowerCase().replace(/\s+/g, "_"),
    code: String(index + 1).padStart(2, "0"),
    name,
    english: name === "Phnom Penh" ? "Phnom Penh Capital" : `${name} Province`,
    khmer: "",
  })
);

export function useProvinces() {
  const [provinces, setProvinces] = useState<ProvinceItem[]>(
    cachedProvinces || DEFAULT_PROVINCE_ITEMS
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedProvinces);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedProvinces) {
      setProvinces(cachedProvinces);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProvinces() {
      try {
        setIsLoading(true);
        // Fetch from live API endpoint
        let response = await fetch("/api/provinces");
        if (!response.ok) {
          // Direct fallback to open gazetteer API if local proxy is unavailable
          response = await fetch(
            "https://raw.githubusercontent.com/NorakGithub/cambodia-gazetteer/main/provinces.json"
          );
        }

        const data = await response.json();
        let items: ProvinceItem[] = [];

        if (data.data && Array.isArray(data.data)) {
          items = data.data;
        } else if (Array.isArray(data)) {
          items = (data as RawGazetteerProvince[]).map((p) => ({
            id: p.id || p.code,
            code: p.code,
            name: (p.english || "")
              .replace(/\s+Province$/i, "")
              .replace(/\s+Capital$/i, "")
              .replace(/\s+Municipality$/i, "")
              .replace(/Siemreap/i, "Siem Reap")
              .replace(/Mondul\s*Kiri/i, "Mondulkiri")
              .replace(/Ratanak\s*Kiri/i, "Ratanakiri")
              .trim(),
            english: p.english || "",
            khmer: p.local || "",
          }));
        }

        if (items.length > 0 && isMounted) {
          cachedProvinces = items;
          setProvinces(items);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load provinces from API";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  return { provinces, isLoading, error };
}
