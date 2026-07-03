export const FALLBACK_CATEGORIES = [
  { id: 'main-products', name: '主打商品', slug: 'main-products' },
  { id: 'other-products', name: '其他商品', slug: 'other-products' },
];

const CATEGORY_BY_ID = Object.fromEntries(
  FALLBACK_CATEGORIES.map((category) => [category.id, { name: category.name, slug: category.slug }])
);

export const OBSOLETE_PRODUCT_SLUGS = [
  'sonpin-legacy-gift-box',
  'sonpin-legacy-drip-single',
];

const PRODUCT_IMAGE_PATHS: Record<string, string[]> = {
  'sonpin-drip-essence': ['/sonpin-images/sonpin-drip-essence.jpg'],
  'sonpin-smoked-whole-chicken': ['/sonpin-images/sonpin-smoked-whole-chicken.png'],
  'sonpin-salted-whole-chicken': ['/sonpin-images/sonpin-salted-whole-chicken.png'],
  'sonpin-30-pack-drip-gift-box': ['/sonpin-images/sonpin-30-pack-drip-gift-box.jpg'],
  'sonpin-whole-chicken-12-pack-drip-gift-box': ['/sonpin-images/sonpin-whole-chicken-12-pack-drip-gift-box.jpg'],
  'sonpin-room-temp-drip-gift-box': ['/sonpin-images/sonpin-room-temp-drip-gift-box.jpg'],
  'sonpin-salted-half-chicken': ['/sonpin-images/sonpin-salted-half-chicken.png'],
  'sonpin-smoked-half-chicken': ['/sonpin-images/sonpin-smoked-half-chicken.png'],
  'sonpin-smoked-plate': ['/sonpin-images/sonpin-smoked-plate.png'],
  'sonpin-salted-plate': ['/sonpin-images/sonpin-salted-plate.png'],
  'sonpin-braised-chicken-feet': ['/sonpin-images/sonpin-braised-chicken-feet.png'],
  'sonpin-chicken-gizzard': ['/sonpin-images/sonpin-chicken-gizzard.png'],
  'sonpin-chicken-intestine': [
    '/sonpin-images/sonpin-chicken-intestine.png',
    '/sonpin-images/sonpin-chicken-intestine-detail-1.png',
    '/sonpin-images/sonpin-chicken-intestine-detail-2.png',
  ],
};

const makeProductContent = ({
  lead,
  story,
  notes,
  details,
}: {
  lead: string;
  story: string[];
  notes: string[];
  details: string[];
}) => `
  <section class="ym-product-copy">
    <p class="ym-product-lead">${lead}</p>
    <div class="ym-product-copy-grid">
      <div>
        <h3>商品故事</h3>
        ${story.map((item) => `<p>${item}</p>`).join('')}
      </div>
      <div>
        <h3>商品特色</h3>
        <ul>${notes.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="ym-product-copy-note">
      <h3>規格與備註</h3>
      <ul>${details.map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>
  </section>
`;

const commonChickenStory = [
  '淞品土雞堅持使用自養台灣土雞，口感扎實、肉質鮮甜。',
  '沿用家傳料理手法，保留雞肉原有風味與香氣。',
];

const commonGiftStory = [
  '淞品主打常溫雞精與節慶禮盒，送禮自用都合適。',
  '簡潔包裝與穩定品質，是許多老客人長年回購的原因。',
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'sonpin-drip-essence',
    name: '淞品滴雞精',
    slug: 'sonpin-drip-essence',
    summary: '常溫保存，方便補充日常營養。',
    description: '淞品滴雞精採用台灣土雞細火滴製，保留雞湯原味與營養精華。',
    content: makeProductContent({
      lead: '淞品滴雞精是最經典的日常補給商品。',
      story: commonGiftStory,
      notes: ['65ML / 包，8包入', '常溫保存', '適合送禮與自用'],
      details: ['價格：NT$850', '保存方式依包裝標示'],
    }),
    price: 850,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-drip-essence'],
    category_id: 'main-products',
    specifications: [
      { name: '規格', value: '65ML / 包，8包入' },
      { name: '保存', value: '常溫' },
      { name: '價格', value: 'NT$850' },
    ],
    stock: 99,
    sku: 'SONPIN-DRIP-ESSENCE',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-smoked-whole-chicken',
    name: '淞品煙燻全雞',
    slug: 'sonpin-smoked-whole-chicken',
    summary: '家傳煙燻風味，適合節慶與聚餐。',
    description: '淞品煙燻全雞以家傳手法製作，香氣濃郁、口感紮實。',
    content: makeProductContent({
      lead: '淞品煙燻全雞是許多老客人最熟悉的招牌。',
      story: commonChickenStory,
      notes: ['整隻全雞', '煙燻風味', '適合節慶分享'],
      details: ['價格：NT$700', '依當日備貨安排出貨'],
    }),
    price: 700,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-smoked-whole-chicken'],
    category_id: 'main-products',
    specifications: [
      { name: '規格', value: '整隻全雞' },
      { name: '保存', value: '冷藏/冷凍依包裝標示' },
      { name: '價格', value: 'NT$700' },
    ],
    stock: 30,
    sku: 'SONPIN-SMOKED-WHOLE',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-salted-whole-chicken',
    name: '淞品鹽水全雞',
    slug: 'sonpin-salted-whole-chicken',
    summary: '清爽鹹香，最受家庭客喜愛。',
    description: '淞品鹽水全雞以慢火熟成，保留肉汁與雞香。',
    content: makeProductContent({
      lead: '鹽水口味清爽不膩，是經典的家庭款商品。',
      story: commonChickenStory,
      notes: ['整隻全雞', '鹽水口味', '冷藏配送'],
      details: ['價格：NT$700', '依包裝標示冷藏保存'],
    }),
    price: 700,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-salted-whole-chicken'],
    category_id: 'main-products',
    specifications: [
      { name: '規格', value: '整隻全雞' },
      { name: '保存', value: '冷藏' },
      { name: '價格', value: 'NT$700' },
    ],
    stock: 30,
    sku: 'SONPIN-SALTED-WHOLE',
    categories: CATEGORY_BY_ID['main-products'],
  },
];
