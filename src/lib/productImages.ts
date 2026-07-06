import { normalizeBlogSlug } from './blog';

type ProductLike = {
  name?: string;
  slug?: string;
  category_slug?: string;
  categorySlug?: string;
  images?: string[];
};

type ProductImageRule = {
  match: string[];
  images: string[];
};

const normalizeProductKey = (value?: string | null) => normalizeBlogSlug(value || '');

const PRODUCT_IMAGE_RULES: ProductImageRule[] = [
  {
    match: ['淞品滴雞精', '滴雞精', 'sonpin-drip-essence'],
    images: ['/sonpin-images/154399503735.jpg'],
  },
  {
    match: ['30包滴雞精禮盒', '30包', 'sonpin-30-pack-drip-gift-box'],
    images: ['/sonpin-images/163081696885.jpg', '/sonpin-images/20240618103536.jpg'],
  },
  {
    match: ['1隻雞12包滴雞精禮盒', '1隻雞+12包滴雞精禮盒', 'sonpin-whole-chicken-12-pack-drip-gift-box'],
    images: ['/sonpin-images/163081802847.jpg', '/sonpin-images/20240618103604.jpg'],
  },
  {
    match: ['淞品煙燻雞全雞', '煙燻雞全雞', 'sonpin-smoked-whole-chicken'],
    images: ['/sonpin-images/153268445615.png', '/sonpin-images/20180730140953.png'],
  },
  {
    match: ['淞品鹹水雞全雞', '鹹水雞全雞', 'sonpin-salted-whole-chicken'],
    images: ['/sonpin-images/153268460556.png', '/sonpin-images/20180730141012.png'],
  },
  {
    match: ['淞品鹹水雞半隻', '鹹水雞半隻', 'sonpin-salted-half-chicken'],
    images: ['/sonpin-images/153268378688.png'],
  },
  {
    match: ['淞品煙燻雞半隻', '煙燻雞半隻', 'sonpin-smoked-half-chicken'],
    images: ['/sonpin-images/153268393092.png'],
  },
  {
    match: ['淞品鹹水雞小盤', '鹹水雞小盤', 'sonpin-salted-plate'],
    images: ['/sonpin-images/153268404282.png'],
  },
  {
    match: ['淞品煙燻雞小盤', '煙燻雞小盤', 'sonpin-smoked-plate'],
    images: ['/sonpin-images/153268438297.png'],
  },
  {
    match: ['淞品滷鳳爪', '滷鳳爪', 'sonpin-braised-chicken-feet'],
    images: ['/sonpin-images/153268469617.png'],
  },
  {
    match: ['淞品雞胗', '雞胗', 'sonpin-chicken-gizzard'],
    images: ['/sonpin-images/153268485723.png'],
  },
  {
    match: ['淞品雞腸', '雞腸', 'sonpin-chicken-intestine'],
    images: ['/sonpin-images/153268493255.png'],
  },
  {
    match: ['常溫滴雞精', 'room-temp-drip', 'sonpin-room-temp-drip-gift-box'],
    images: ['/sonpin-images/sonpin-room-temp-drip-gift-box.jpg'],
  },
];

const uniqueImages = (images: string[]) => Array.from(new Set(images.filter(Boolean)));

export const resolveSonpinProductImages = (product: ProductLike) => {
  const explicitImages = uniqueImages(product.images || []);
  const normalizedTokens = [product.name, product.slug, product.category_slug, product.categorySlug]
    .map(normalizeProductKey)
    .filter(Boolean);

  const matchedRule = PRODUCT_IMAGE_RULES.find((rule) =>
    rule.match.some((term) => {
      const normalizedTerm = normalizeProductKey(term);
      return normalizedTokens.some((token) => token.includes(normalizedTerm) || normalizedTerm.includes(token));
    }),
  );

  if (explicitImages.length > 0) {
    return explicitImages;
  }

  if (!matchedRule) {
    return explicitImages;
  }

  return uniqueImages(matchedRule.images);
};
