export type MediaArticleKind = 'article' | 'video';

export interface MediaArticle {
  groupSlug: string;
  articleSlug: string;
  title: string;
  date: string;
  excerpt: string;
  bodyParagraphs: string[];
  featuredImage: string;
  galleryImages: string[];
  iframeUrl: string;
  sourceUrl: string;
  kind: MediaArticleKind;
  videoPlacement?: 'top' | 'bottom';
  videoMode?: 'embed' | 'external';
}

export const MEDIA_ARTICLES: MediaArticle[] = [
  {
    groupSlug: '79',
    articleSlug: '231',
    title: '為廟慶添光彩造福嘉義縣民 高浚泓慨捐「靈安尊王2號」救護車',
    date: '2021-11-17',
    excerpt:
      '淞品生技高浚泓董事長在青山宮慶典期間捐贈全新救護車給嘉義縣消防局，以實際行動回饋地方。',
    bodyParagraphs: [
      '高浚泓董事長結合青山宮慶典活動，捐贈一部全新的救護車給嘉義縣消防局，希望把善念化成實際幫助。',
      '捐贈的「靈安尊王2號」象徵著對家鄉與公益的支持，也讓嘉義縣的救護量能更完整。',
      '這則報導記錄了現場捐贈與致意的過程，呈現淞品品牌持續投入公益的一面。',
    ],
    featuredImage: '/sonpin-images/20211120131631.jpg',
    galleryImages: ['/sonpin-images/20211120131631.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/231',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '93',
    title: '優質土雞專賣店淞品全臺首發！(臺灣報導)',
    date: '2013-10-18',
    excerpt:
      '農委會輔導的國產土雞專賣店案例，從產、製、銷一條龍與產銷履歷建立品牌典範。',
    bodyParagraphs: [
      '這篇報導介紹淞品如何透過契養、合格屠宰、加工分切與配送，建立全台少見的一條龍模式。',
      '文中也提到產銷履歷、獸醫把關與合格工廠登記，凸顯品牌在食品安全與規模化上的基礎。',
      '是淞品品牌早期的重要媒體紀錄之一。',
    ],
    featuredImage: '/sonpin-images/20180730144951.jpg',
    galleryImages: ['/sonpin-images/20180730144951.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/93',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '92',
    title: '淞品畜產 煙燻放山雞',
    date: '2013-12-13',
    excerpt:
      '自由時報週末生活版介紹萬華三水街的淞品畜產，說明煙燻與鹹水雞的特色。',
    bodyParagraphs: [
      '報導描述店家位於龍山寺附近，只賣煙燻與鹹水兩種雞肉，常常在打烊前就完售。',
      '文章也提到店家堅持使用自家飼養放山雞，煙燻雞香氣足、雞皮香Q，鹹水雞則較爽口而有咬勁。',
      '附帶的店家資訊包括電話、地址與營業時間，讓消費者能直接前往購買。',
    ],
    featuredImage: '/sonpin-images/20180730144608.jpg',
    galleryImages: ['/sonpin-images/20180730144608.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/92',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '91',
    title: '艋舺 土雞王',
    date: '2014-02-20',
    excerpt:
      '從萬華三水市場一坪小攤做到土雞專賣店，走出產製銷一條龍的市場傳奇。',
    bodyParagraphs: [
      '這篇報導回顧高浚泓從雞販之子到創立品牌的過程，也寫出他歷經倒債、轉行與回到市場重新出發的故事。',
      '報導提到淞品以鹹水雞與煙燻雞為主，並延伸滴雞精等加工產品，逐步建立完整的品牌鏈。',
      '這是外界認識「艋舺土雞王」很重要的一篇人物報導。',
    ],
    featuredImage: '/sonpin-images/20180730143542.jpg',
    galleryImages: ['/sonpin-images/20180730143542.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/91',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '90',
    title: '農委會推國產土雞專賣店(自由時報)',
    date: '2013-10-19',
    excerpt:
      '農委會與媒體報導淞品成為國產土雞專賣店示範案例，強調在地、安心與品牌化。',
    bodyParagraphs: [
      '自由時報報導淞品土雞專賣店如何在農委會輔導下，成為國產土雞專賣店的代表案例。',
      '內容聚焦在品牌化經營、產地供應鏈與消費者對國產土雞的信任感。',
    ],
    featuredImage: '/sonpin-images/20180730144118.jpg',
    galleryImages: ['/sonpin-images/20180730144118.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/90',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '83',
    title: '《What\'s New》年菜大桌 少不了這一隻雞',
    date: '2016-01-22',
    excerpt:
      '以年菜雞肉為主題，介紹淞品如何靠自養、屠宰與加工建立好口碑。',
    bodyParagraphs: [
      '報導指出辦年菜時，雞肉是餐桌上不可或缺的菜色，而淞品靠的是自家養殖與穩定的品質。',
      '文中提到黑羽母雞與紅羽公雞的搭配、屠宰與加工廠的設置，以及鹹水雞、煙燻雞兩大招牌。',
      '這篇也讓更多消費者認識淞品在春節前夕的熱銷情況。',
    ],
    featuredImage: '/sonpin-images/20180730143542.jpg',
    galleryImages: ['/sonpin-images/20180730143542.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/83',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '66',
    title: '台北補品：淞品滴雞精@雨後',
    date: '2014-03-27',
    excerpt:
      '介紹淞品滴雞精的包裝、產品說明與每組售價，展現品牌延伸到加工食品的樣貌。',
    bodyParagraphs: [
      '報導從包裝設計切入，提到淞品已從傳統熟雞店延伸到滴雞精商品，顯示品牌的轉型。',
      '內容也介紹產品背面的說明、每組售價與每包容量，讓消費者能直接了解商品資訊。',
      '這篇文章是淞品加工食品發展的重要紀錄。',
    ],
    featuredImage: '/sonpin-images/20180730134845.jpg',
    galleryImages: ['/sonpin-images/20180730134845.jpg', '/sonpin-images/20180730134856.jpg', '/sonpin-images/20180730134908.jpg', '/sonpin-images/20180730134920.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/66',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '40',
    title: '淞品商行---令人噴口水的 "白斬雞 & 燻雞"',
    date: '2010-01-01',
    excerpt:
      '早期部落格食記，介紹淞品的白斬雞與燻雞，文中對雞肉的鮮甜與排隊人氣印象深刻。',
    bodyParagraphs: [
      '文章把淞品視為艋舺一帶的隱藏版好店，特別提到白斬雞與燻雞都很受歡迎。',
      '整篇食記以驚豔與推薦為主，文字直接點出雞肉的鮮嫩與讓人想再回訪的魅力。',
      '是淞品在網路上累積口碑的早期例子之一。',
    ],
    featuredImage: '/sonpin-images/20180730134920.jpg',
    galleryImages: ['/sonpin-images/20180730134920.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/40',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '115',
    title: '一坪店起家 艋舺土雞王',
    date: '2018-10-20',
    excerpt:
      '影片報導回顧淞品從萬華一坪攤位起家的經過，影片嵌入已改成可正常播放的 YouTube 來源。',
    bodyParagraphs: [
      '這支影音報導回顧淞品從市場小攤起家、一路轉型為品牌店面的過程。',
      '內容強調鹹水雞與煙燻雞是店內主力，也帶到高浚泓如何透過產製銷整合站穩市場。',
    ],
    featuredImage: '/sonpin-images/20180730150202.jpg',
    galleryImages: ['/sonpin-images/20180730150202.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/U-jVtVyH93M?si=0G1LqoOZ1tjteRnw',
    sourceUrl: 'https://sonpin.tw/media/78/115',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '81',
    title: '年代台灣向錢衝-日斬萬雞年賣上億',
    date: '2017-08-19',
    excerpt:
      '年代新聞專題介紹淞品如何靠產製銷一條龍與市場口碑，做到高銷量的熟雞品牌。',
    bodyParagraphs: [
      '這則影音報導把焦點放在淞品的營運規模、產品供應與品牌經營。',
      '影片原站嵌入 YouTube 來源，內容主軸是熟雞銷售、土雞來源與加工流程。',
    ],
    featuredImage: '/sonpin-images/20180730150231.jpg',
    galleryImages: ['/sonpin-images/20180730150231.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/HCTmM1PKLUU',
    sourceUrl: 'https://sonpin.tw/media/78/81',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '86',
    title: '萬華土雞王 邰智源就愛這味 (蘋果日報)',
    date: '2014-02-19',
    excerpt:
      '蘋果日報報導淞品從雞販家庭出身到回到市場賣雞的轉折故事。',
    bodyParagraphs: [
      '報導描述高浚泓從小幫家裡賣雞，之後歷經水電、承包工程與回到市場賣雞的過程。',
      '文章也點出他如何靠鹹水雞、煙燻雞與品牌口碑闖出名號。',
    ],
    featuredImage: '/sonpin-images/20180730145541.jpg',
    galleryImages: ['/sonpin-images/20180730145541.jpg', '/sonpin-images/20180730145553.jpg', '/sonpin-images/20180730145614.jpg'],
    iframeUrl: '',
    sourceUrl: 'http://www.appledaily.com.tw/realtimenews/article/finance/20140219/347316/%E3%80%90%E7%9F%AD%E7%89%87%E3%80%91%E8%90%AC%E8%8F%AF%E5%9C%9F%E9%9B%9E%E7%8E%8B%E3%80%80%E9%82%B0%E6%99%BA%E6%BA%90%E5%B0%B1%E6%84%9B%E9%80%99%E5%91%B3',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '87',
    title: '萬華土雞肉店! 凌晨開賣4小時賣光! (東森新聞)',
    date: '2014-01-30',
    excerpt:
      '東森新聞報導萬華雞肉店的高人氣，並提到凌晨開賣、短時間完售的現象。',
    bodyParagraphs: [
      '這則報導聚焦在淞品的排隊人潮與快速完售的銷售情況。',
      '標題點出凌晨開賣、短短四小時賣光的超高人氣。',
    ],
    featuredImage: '/sonpin-images/20180730145541.jpg',
    galleryImages: ['/sonpin-images/20180730145541.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/87',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '88',
    title: '發現新台灣-淞品商行',
    date: '2013-12-25',
    excerpt:
      '節目報導淞品商行的市場故事，屬於早期曝光的重要媒體片段。',
    bodyParagraphs: [
      '這篇影音報導是節目型內容，主要在介紹淞品商行的店面與雞肉商品。',
      '雖然原站頁面文字不多，但它是淞品早期被節目看見的重要紀錄。',
    ],
    featuredImage: '/sonpin-images/20180730145541.jpg',
    galleryImages: ['/sonpin-images/20180730145541.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/88',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '82',
    title: '忙翻天！ 拜拜必需品 雞肉名店「半夜也排隊」',
    date: '2015-02-17',
    excerpt:
      '報導春節與普渡旺季的排隊盛況，說明有信譽的老店在拜拜市場中的角色。',
    bodyParagraphs: [
      '文章提到因禽流感與節慶需求，雞肉老店在過年前後常常大排長龍。',
      '店家甚至會在除夕前連續營業、增加出貨，滿足民眾拜拜用雞的需求。',
    ],
    featuredImage: '/sonpin-images/20180730145541.jpg',
    galleryImages: ['/sonpin-images/20180730145541.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/9NzROZW-VCQ',
    sourceUrl: 'https://sonpin.tw/media/78/82',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '84',
    title: '一坪肉攤起家 14年翻身雞販變土雞王 (東森新聞)',
    date: '2014-02-21',
    excerpt:
      '東森新聞以人物故事角度報導高浚泓從市場一坪小攤翻身的歷程。',
    bodyParagraphs: [
      '報導再次回到淞品的起家故事，強調從市場攤位做到土雞專賣品牌的過程。',
      '文章呈現的是一位傳統雞販如何把生意做成品牌的轉變。',
    ],
    featuredImage: '/sonpin-images/20180730145541.jpg',
    galleryImages: ['/sonpin-images/20180730145541.jpg', '/sonpin-images/20180730145553.jpg', '/sonpin-images/20180730145614.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/84',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '85',
    title: '產製銷一條龍，鮮流土雞新鮮有夠證 記者會',
    date: '2013-11-19',
    excerpt:
      '介紹淞品從養殖、屠宰到加工與販售的一條龍模式，並記錄記者會現場。',
    bodyParagraphs: [
      '這則報導以記者會為主題，說明淞品如何把產、製、銷串成完整供應鏈。',
      '內容重點在「新鮮有夠證」的品牌訴求與現場公開說明。',
    ],
    featuredImage: '/sonpin-images/20180730145541.jpg',
    galleryImages: ['/sonpin-images/20180730145541.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/85',
    kind: 'article',
  },
];

export const MEDIA_GROUPS = {
  '79': {
    slug: '79',
    title: '相關報導',
    label: '新聞公告',
  },
  '78': {
    slug: '78',
    title: '影音報導',
    label: '影音報導',
  },
} as const;

export const getMediaGroup = (slug: string) => MEDIA_GROUPS[slug as keyof typeof MEDIA_GROUPS] || null;

export const getMediaArticlesByGroup = (groupSlug: string) =>
  MEDIA_ARTICLES.filter((article) => article.groupSlug === groupSlug);

export const getMediaArticle = (groupSlug: string, articleSlug: string) =>
  MEDIA_ARTICLES.find((article) => article.groupSlug === groupSlug && article.articleSlug === articleSlug) ||
  (groupSlug === '78' && articleSlug === '77'
    ? MEDIA_ARTICLES.find((article) => article.groupSlug === '78' && article.articleSlug === '81') || null
    : null);
