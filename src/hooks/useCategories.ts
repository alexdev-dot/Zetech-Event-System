import { useState, useEffect } from "react";
import { categories as fallbackCategories } from "@/data/events";

export interface CategoryItem {
  id?: number;
  name: string;
  subCategories: string[];
}

let _cachedCategories: CategoryItem[] | null = null;
const _listeners: Array<(cats: CategoryItem[]) => void> = [];

function notifyListeners(cats: CategoryItem[]) {
  _cachedCategories = cats;
  _listeners.forEach((fn) => fn(cats));
}

export function invalidateCategoriesCache() {
  _cachedCategories = null;
  fetchCategoriesFromServer().then(notifyListeners).catch(() => {});
}

async function fetchCategoriesFromServer(): Promise<CategoryItem[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed");
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("Empty");
  return data.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    subCategories: Array.isArray(cat.subcategories)
      ? cat.subcategories.map((s: any) => s.name)
      : [],
  }));
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(
    _cachedCategories ?? fallbackCategories
  );
  const [loading, setLoading] = useState(!_cachedCategories);

  useEffect(() => {
    _listeners.push(setCategories);
    return () => {
      const idx = _listeners.indexOf(setCategories);
      if (idx > -1) _listeners.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    if (_cachedCategories) {
      setCategories(_cachedCategories);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCategoriesFromServer()
      .then((cats) => {
        notifyListeners(cats);
        setLoading(false);
      })
      .catch(() => {
        setCategories(fallbackCategories);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}
