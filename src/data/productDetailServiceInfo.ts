export interface ProductDetailServiceSection {
  title: string;
  items: string[];
}

export interface ProductDetailServiceSettings {
  sections: ProductDetailServiceSection[];
}

export const PRODUCT_DETAIL_SERVICE_SETTING_KEY = 'product_detail_service';

export const DEFAULT_PRODUCT_DETAIL_SERVICE_SECTIONS: ProductDetailServiceSection[] = [
  {
    title: '付款方式',
    items: ['銀行轉帳（匯款後出貨）', '請於下單後依完成頁顯示的匯款資訊完成轉帳'],
  },
  {
    title: '運送方式',
    items: ['黑貓宅急便', '門市自取'],
  },
  {
    title: '出貨與到貨',
    items: ['訂單成立後會盡快安排出貨', '實際到貨時間依物流公司配送為準'],
  },
  {
    title: '退換貨提醒',
    items: ['食品類商品基於衛生考量，拆封後恕無法退換貨', '若商品有瑕疵，請於收到後盡快聯繫客服'],
  },
];

export const DEFAULT_PRODUCT_DETAIL_SERVICE: ProductDetailServiceSettings = {
  sections: DEFAULT_PRODUCT_DETAIL_SERVICE_SECTIONS,
};

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function normalizeProductDetailServiceSettings(value: unknown): ProductDetailServiceSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PRODUCT_DETAIL_SERVICE;
  }

  const sections = Array.isArray((value as ProductDetailServiceSettings).sections)
    ? (value as ProductDetailServiceSettings).sections
        .map((section) => ({
          title: normalizeText(section?.title),
          items: Array.isArray(section?.items)
            ? section.items.map(normalizeText).filter(Boolean)
            : [],
        }))
        .filter((section) => section.title || section.items.length > 0)
    : [];

  return {
    sections: sections.length > 0 ? sections : DEFAULT_PRODUCT_DETAIL_SERVICE_SECTIONS,
  };
}
