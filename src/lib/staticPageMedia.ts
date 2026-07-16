export interface StaticPageImage {
  slot: string;
  url: string;
  alt: string;
}

export const normalizeStaticPageImages = (value: unknown): StaticPageImage[] => {
  if (!Array.isArray(value)) return [];

  return value.reduce<StaticPageImage[]>((acc, item) => {
    const image = item as Partial<StaticPageImage>;
    const slot = typeof image.slot === 'string' ? image.slot.trim() : '';
    const url = typeof image.url === 'string' ? image.url.trim() : '';
    const alt = typeof image.alt === 'string' ? image.alt.trim() : '';

    if (!slot || !url) return acc;

    acc.push({
      slot,
      url,
      alt,
    });
    return acc;
  }, []);
};
