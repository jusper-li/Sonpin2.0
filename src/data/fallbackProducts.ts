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
  'sonpin-30-pack-drip-gift-box': ['/sonpin-images/163081696885.jpg', '/sonpin-images/20240618103536.jpg'],
  'sonpin-whole-chicken-12-pack-drip-gift-box': ['/sonpin-images/163081802847.jpg', '/sonpin-images/20240618103604.jpg'],
  'sonpin-room-temp-drip-gift-box': ['/sonpin-images/175136093578.jpg', '/sonpin-images/20250701170434.jpg', '/sonpin-images/20250701175515.jpg'],
  'sonpin-salted-half-chicken': ['/sonpin-images/153268378688.png', '/sonpin-images/20180730140352.png'],
  'sonpin-smoked-half-chicken': ['/sonpin-images/153268393092.png', '/sonpin-images/20180730140213.png'],
  'sonpin-salted-plate': ['/sonpin-images/153268404282.png', '/sonpin-images/20180730141121.png'],
  'sonpin-smoked-plate': ['/sonpin-images/153268438297.png', '/sonpin-images/20180730141138.png'],
  'sonpin-braised-chicken-feet': ['/sonpin-images/153268469617.png', '/sonpin-images/20180730141215.png', '/sonpin-images/20180730141239.png'],
  'sonpin-chicken-gizzard': ['/sonpin-images/153268485723.png', '/sonpin-images/20180730141311.png', '/sonpin-images/20180730141326.png'],
  'sonpin-chicken-intestine': [
    '/sonpin-images/153268493255.png',
    '/sonpin-images/20180730141358.png',
    '/sonpin-images/20180730141419.png',
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
        <h3>商品特色</h3>
        ${story.map((item) => `<p>${item}</p>`).join('')}
      </div>
      <div>
        <h3>商品亮點</h3>
        <ul>${notes.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="ym-product-copy-note">
      <h3>規格與提醒</h3>
      <ul>${details.map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>
  </section>
`;

const commonChickenStory = [
  '淞品以國產土雞為核心，從飼養、處理到販售都維持穩定流程，讓產品品質更一致。',
  '主打原味、煙燻與鹽水風味，適合家庭餐桌、節慶聚餐與日常備餐。',
];

const commonGiftStory = [
  '嚴選滴煉雞精與禮盒包裝，兼顧送禮體面與自用便利。',
  '適合長輩滋補、節慶拜訪、企業贈禮與日常補充營養。',
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'sonpin-drip-essence',
    name: '淞品滴雞精',
    slug: 'sonpin-drip-essence',
    summary: '選用台灣土雞慢火滴煉，保留雞肉精華的高湯風味。',
    description: '選用台灣土雞慢火滴煉，保留雞肉精華的高湯風味。',
    content: makeProductContent({
      lead: '慢火滴煉的經典滋補商品，保留雞湯香氣與原始風味。',
      story: commonGiftStory,
      notes: ['65ML / 8 包入', '適合日常保養與送禮', '冷藏保存更安心'],
      details: ['售價：NT$850', '保存方式：依包裝標示冷藏保存'],
    }),
    price: 850,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-drip-essence'],
    category_id: 'main-products',
    specifications: [
      { name: '包裝', value: '65ML / 8 包入' },
      { name: '風味', value: '滴雞精' },
      { name: '售價', value: 'NT$850' },
    ],
    stock: 99,
    sku: 'SONPIN-DRIP-ESSENCE',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-smoked-whole-chicken',
    name: '淞品煙燻雞-全雞',
    slug: 'sonpin-smoked-whole-chicken',
    summary: '以傳統工法製作，適合家庭分享與宴客。',
    description: '以傳統工法製作，適合家庭分享與宴客。',
    content: makeProductContent({
      lead: '以煙燻工法呈現雞肉香氣，肉質紮實、風味濃郁。',
      story: commonChickenStory,
      notes: ['全雞份量', '煙燻香氣明顯', '適合聚餐分享'],
      details: ['售價：NT$700', '建議冷藏並盡快食用'],
    }),
    price: 700,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-smoked-whole-chicken'],
    category_id: 'main-products',
    specifications: [
      { name: '包裝', value: '全雞' },
      { name: '風味', value: '煙燻' },
      { name: '售價', value: 'NT$700' },
    ],
    stock: 30,
    sku: 'SONPIN-SMOKED-WHOLE',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-salted-whole-chicken',
    name: '淞品鹽水雞-全雞',
    slug: 'sonpin-salted-whole-chicken',
    summary: '以簡單調味突顯雞肉原味，是日常餐桌的人氣選擇。',
    description: '以簡單調味突顯雞肉原味，是日常餐桌的人氣選擇。',
    content: makeProductContent({
      lead: '鹽水滷製保留原味鮮甜，口感清爽耐吃。',
      story: commonChickenStory,
      notes: ['全雞份量', '鹽水口味清爽', '適合常備菜'],
      details: ['售價：NT$700', '建議冷藏保存，食用前回溫'],
    }),
    price: 700,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-salted-whole-chicken'],
    category_id: 'main-products',
    specifications: [
      { name: '包裝', value: '全雞' },
      { name: '風味', value: '鹽水' },
      { name: '售價', value: 'NT$700' },
    ],
    stock: 30,
    sku: 'SONPIN-SALTED-WHOLE',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-30-pack-drip-gift-box',
    name: '30包滴雞精禮盒',
    slug: 'sonpin-30-pack-drip-gift-box',
    summary: '大容量禮盒設計，適合長輩滋補或企業贈禮。',
    description: '大容量禮盒設計，適合長輩滋補或企業贈禮。',
    content: makeProductContent({
      lead: '30 包入禮盒，份量充足，適合長期滋補或團體送禮。',
      story: commonGiftStory,
      notes: ['65ML / 30 包入', '送禮實用', '保養補充首選'],
      details: ['售價：NT$3,000', '保存方式：依包裝標示冷藏保存'],
    }),
    price: 3000,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-30-pack-drip-gift-box'],
    category_id: 'main-products',
    specifications: [
      { name: '包裝', value: '65ML / 30 包入' },
      { name: '風味', value: '滴雞精' },
      { name: '售價', value: 'NT$3000' },
    ],
    stock: 20,
    sku: 'SONPIN-30PACK-DRIP',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-whole-chicken-12-pack-drip-gift-box',
    name: '1隻雞+12包滴雞精禮盒',
    slug: 'sonpin-whole-chicken-12-pack-drip-gift-box',
    summary: '兼具熟食與滋補，適合節慶贈禮。',
    description: '兼具熟食與滋補，適合節慶贈禮。',
    content: makeProductContent({
      lead: '一盒同時包含雞肉與滴雞精，送禮更有份量。',
      story: commonGiftStory,
      notes: ['1 隻雞 + 12 包滴雞精', '送禮體面', '節慶組合熱銷'],
      details: ['售價：NT$1,900', '保存方式：依包裝標示冷藏保存'],
    }),
    price: 1900,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-whole-chicken-12-pack-drip-gift-box'],
    category_id: 'main-products',
    specifications: [
      { name: '組合', value: '1 隻雞 + 12 包滴雞精' },
      { name: '風味', value: '雞肉與滴雞精' },
      { name: '售價', value: 'NT$1900' },
    ],
    stock: 20,
    sku: 'SONPIN-CHICKEN-12PACK',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-room-temp-drip-gift-box',
    name: '淞品常溫滴雞精禮盒',
    slug: 'sonpin-room-temp-drip-gift-box',
    summary: '常溫包裝設計，保存與攜帶都更彈性。',
    description: '常溫包裝設計，保存與攜帶都更彈性。',
    content: makeProductContent({
      lead: '常溫版本的滴雞精禮盒，攜帶與存放都更方便。',
      story: commonGiftStory,
      notes: ['50ML / 8 包入', '常溫保存更彈性', '送禮與自用都合適'],
      details: ['售價：NT$850', '保存方式：依包裝標示常溫保存'],
    }),
    price: 850,
    sale_price: null,
    member_price: null,
    images: PRODUCT_IMAGE_PATHS['sonpin-room-temp-drip-gift-box'],
    category_id: 'main-products',
    specifications: [
      { name: '包裝', value: '50ML / 8 包入' },
      { name: '風味', value: '滴雞精' },
      { name: '售價', value: 'NT$850' },
    ],
    stock: 20,
    sku: 'SONPIN-ROOM-TEMP-DRIP',
    categories: CATEGORY_BY_ID['main-products'],
  },
  {
    id: 'sonpin-salted-half-chicken',
    name: '淞品鹽水雞-半隻(暫不提供網路購買)',
    slug: 'sonpin-salted-half-chicken',
    summary: '採用經典鹽水滷製，適合現場選購。',
    description: '採用經典鹽水滷製，適合現場選購。',
    content: makeProductContent({
      lead: '半隻份量最適合小家庭或單次現場取餐。',
      story: commonChickenStory,
      notes: ['半隻份量', '現場販售為主', '鹽水口味'],
      details: ['售價：NT$350', '目前僅供門市販售'],
    }),
    price: 350,
    sale_price: 330,
    member_price: null,
    images: ['/sonpin-images/153268378688.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '半隻' },
      { name: '風味', value: '鹽水' },
      { name: '售價', value: 'NT$350' },
    ],
    stock: 25,
    sku: 'SONPIN-SALTED-HALF',
    categories: CATEGORY_BY_ID['other-products'],
  },
  {
    id: 'sonpin-smoked-half-chicken',
    name: '淞品煙燻雞-半隻(暫不提供網路購買)',
    slug: 'sonpin-smoked-half-chicken',
    summary: '煙燻工法讓雞肉更具風味，適合現場購買。',
    description: '煙燻工法讓雞肉更具風味，適合現場購買。',
    content: makeProductContent({
      lead: '半隻煙燻雞，風味濃郁，適合喜歡香氣層次的客人。',
      story: commonChickenStory,
      notes: ['半隻份量', '煙燻香氣', '目前僅供門市販售'],
      details: ['售價：NT$350', '目前僅供門市販售'],
    }),
    price: 350,
    sale_price: 330,
    member_price: null,
    images: ['/sonpin-images/153268393092.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '半隻' },
      { name: '風味', value: '煙燻' },
      { name: '售價', value: 'NT$350' },
    ],
    stock: 25,
    sku: 'SONPIN-SMOKED-HALF',
    categories: CATEGORY_BY_ID['other-products'],
  },
  {
    id: 'sonpin-salted-plate',
    name: '淞品鹽水雞-小盤(暫不提供網路購買)',
    slug: 'sonpin-salted-plate',
    summary: '小份量盤裝，適合單人享用。',
    description: '小份量盤裝，適合單人享用。',
    content: makeProductContent({
      lead: '小盤份量的鹽水雞，方便即食與單人享用。',
      story: commonChickenStory,
      notes: ['小盤份量', '適合即食', '目前僅供門市販售'],
      details: ['售價：NT$120', '目前僅供門市販售'],
    }),
    price: 120,
    sale_price: null,
    member_price: null,
    images: ['/sonpin-images/153268404282.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '小盤' },
      { name: '風味', value: '鹽水' },
      { name: '售價', value: 'NT$120' },
    ],
    stock: 40,
    sku: 'SONPIN-SALTED-PLATE',
    categories: CATEGORY_BY_ID['other-products'],
  },
  {
    id: 'sonpin-smoked-plate',
    name: '淞品煙燻雞-小盤(暫不提供網路購買)',
    slug: 'sonpin-smoked-plate',
    summary: '適合即食與小份分享。',
    description: '適合即食與小份分享。',
    content: makeProductContent({
      lead: '小盤煙燻雞，適合下班後帶回家快速上桌。',
      story: commonChickenStory,
      notes: ['小盤份量', '煙燻香氣', '目前僅供門市販售'],
      details: ['售價：NT$120', '目前僅供門市販售'],
    }),
    price: 120,
    sale_price: null,
    member_price: null,
    images: ['/sonpin-images/153268438297.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '小盤' },
      { name: '風味', value: '煙燻' },
      { name: '售價', value: 'NT$120' },
    ],
    stock: 40,
    sku: 'SONPIN-SMOKED-PLATE',
    categories: CATEGORY_BY_ID['other-products'],
  },
  {
    id: 'sonpin-braised-chicken-feet',
    name: '淞品滷鳳爪-真空包裝(暫不提供網路購買)',
    slug: 'sonpin-braised-chicken-feet',
    summary: '適合下酒、配飯或現場選購。',
    description: '適合下酒、配飯或現場選購。',
    content: makeProductContent({
      lead: '滷香入味的鳳爪，適合配菜與下酒。',
      story: [
        '真空包裝方便攜帶，保留滷汁香氣與口感。',
        '是許多熟客會順手帶走的經典熟食。',
      ],
      notes: ['真空包裝', '滷香入味', '目前僅供門市販售'],
      details: ['售價：NT$150', '目前僅供門市販售'],
    }),
    price: 150,
    sale_price: 130,
    member_price: null,
    images: ['/sonpin-images/153268469617.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '真空包裝' },
      { name: '風味', value: '滷味' },
      { name: '售價', value: 'NT$150' },
    ],
    stock: 30,
    sku: 'SONPIN-BRAISED-FEET',
    categories: CATEGORY_BY_ID['other-products'],
  },
  {
    id: 'sonpin-chicken-gizzard',
    name: '淞品雞胗-真空包裝(暫不提供網路購買)',
    slug: 'sonpin-chicken-gizzard',
    summary: '滷製後保留香氣，方便攜帶。',
    description: '滷製後保留香氣，方便攜帶。',
    content: makeProductContent({
      lead: '雞胗口感彈牙，適合當作下酒菜或便當配菜。',
      story: [
        '真空包裝便於保存與攜帶，適合現場選購。',
        '口感紮實，滷香明確，是熟食攤常見的人氣品項。',
      ],
      notes: ['真空包裝', '口感彈牙', '目前僅供門市販售'],
      details: ['售價：NT$150', '目前僅供門市販售'],
    }),
    price: 150,
    sale_price: 130,
    member_price: null,
    images: ['/sonpin-images/153268485723.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '真空包裝' },
      { name: '風味', value: '滷味' },
      { name: '售價', value: 'NT$150' },
    ],
    stock: 30,
    sku: 'SONPIN-CHICKEN-GIZZARD',
    categories: CATEGORY_BY_ID['other-products'],
  },
  {
    id: 'sonpin-chicken-intestine',
    name: '淞品雞腸-真空包裝(暫不提供網路購買)',
    slug: 'sonpin-chicken-intestine',
    summary: '滷香風味濃郁，適合熟食商品陳列。',
    description: '滷香風味濃郁，適合熟食商品陳列。',
    content: makeProductContent({
      lead: '雞腸經過滷製後風味濃郁，適合熟食與便當配菜。',
      story: [
        '真空包裝便於保存，適合門市熟食陳列。',
        '滷香明顯，口感滑順，適合喜歡下飯配菜的客人。',
      ],
      notes: ['真空包裝', '滷香濃郁', '目前僅供門市販售'],
      details: ['售價：NT$150', '目前僅供門市販售'],
    }),
    price: 150,
    sale_price: 130,
    member_price: null,
    images: ['/sonpin-images/153268493255.png'],
    category_id: 'other-products',
    specifications: [
      { name: '包裝', value: '真空包裝' },
      { name: '風味', value: '滷味' },
      { name: '售價', value: 'NT$150' },
    ],
    stock: 30,
    sku: 'SONPIN-CHICKEN-INTESTINE',
    categories: CATEGORY_BY_ID['other-products'],
  },
];
