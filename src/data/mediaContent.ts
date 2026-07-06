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
    title: '為廟慶添光彩造福嘉義縣民　高浚泓慨捐「靈安尊王2號」救護車',
    date: '2021-11-17',
    excerpt: '高浚泓以青山宮慶活動為契機，捐贈全新救護車給嘉義縣消防局，回饋地方。',
    bodyParagraphs: [
      '嘉義縣溪口鄉的淞品生技董事長高浚泓，長年投入養雞事業，也持續默默行善。這次配合台北艋舺青山宮靈安尊王祭典活動，特別捐贈一部全新救護車給嘉義縣消防局，盼能幫助更多需要救護的民眾。',
      '高浚泓以「靈安尊王2號」為名，花費新台幣265萬元購置救護車，並於記者會中完成捐贈儀式。嘉義縣長翁章梁、消防局長呂清海與多位來賓也到場受贈，見證這份回饋鄉里的心意。',
      '他表示，自己從事養雞業有成後，始終相信分享與付出能讓社會更好，這次將資源投入公益，希望讓救護資源更充足，也讓嘉義鄉親多一份安心。',
    ],
    featuredImage: '/upload/media/163738515677.jpg',
    galleryImages: ['/upload/media/163738515677.jpg', '/upload/images/20211120131631.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/231',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '93',
    title: '優質土雞專賣店 淞品全臺首發！(臺灣報導)',
    date: '2013-10-18',
    excerpt: '淞品攜手農委會與中央畜產會，推廣國產土雞專賣店與產製銷一條龍模式。',
    bodyParagraphs: [
      '臺灣土雞消費量龐大，為了讓消費者買到最新鮮、安全、肉質Q彈多汁的國產土雞，淞品商行與農委會、中央畜產會共同舉辦記者會，介紹全新的國產土雞專賣店模式。',
      '淞品透過農業產業價值鏈延伸與整合，搭配政府輔導產業加值發展，打造出台灣第一家產、製、銷一條龍經營的國產土雞專賣店，成為市場上的新標竿。',
      '中央畜產會也指出，這樣的經營模式代表國產土雞產業朝向更完整的消費型態邁進，強調在地、新鮮、健康、安全、美味等特點，讓消費者有更安心的選擇。',
    ],
    featuredImage: '/upload/media/153268322043.jpg',
    galleryImages: ['/upload/media/153268322043.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/93',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '92',
    title: '淞品畜產  煙燻放山雞',
    date: '2013-12-13',
    excerpt: '位於萬華龍山寺附近的煙燻雞與鹹水雞專賣，堅持自家放山雞，常常提早售罄。',
    bodyParagraphs: [
      '位於萬華龍山寺附近巷弄內的淞品畜產，只賣煙燻雞肉與鹹水雞兩種商品，卻常常不到關店時間就已經全數賣完。',
      '店家堅持使用自家飼養的放山雞，肉質扎實有彈性；煙燻雞多汁夠味、雞皮香Q，雞骨頭也十分入味，單吃原味就很過癮。',
      '鹹水雞則走清爽路線，入口滑嫩又保有嚼勁，鹹香湯汁恰到好處，是許多老客人指定會回購的招牌味道。',
    ],
    featuredImage: '/upload/images/20180730144608.jpg',
    galleryImages: ['/upload/images/20180730144608.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/92',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '91',
    title: '艋舺 土雞王',
    date: '2014-02-20',
    excerpt: '從萬華三水市場小攤起家，高浚泓一步步走出土雞產製銷一條龍的品牌路。',
    bodyParagraphs: [
      '高浚泓從萬華三水市場出發，最早是菜市場雞販之子，後來才重新回到賣雞這條路，從小攤位一路做到專賣店。',
      '他早年也曾做過水電工與承包商，歷經工程倒債與市場磨練後，才決定回到熟悉的雞肉生意，並跳過批發市場，直接與雞農契作，建立自己的供應鏈。',
      '為了控制品質，他投入自家養雞與加工環節，讓雞肉從養殖、屠宰到販售都能一條龍管理，也成為傳統市場轉型的代表案例。',
      '文章也提到風災帶來的重大損失，但高浚泓仍持續投入雞業，把多年累積的經驗變成品牌競爭力。',
    ],
    featuredImage: '/upload/images/20180730143542.jpg',
    galleryImages: [
      '/upload/images/20180730143542.jpg',
      '/upload/images/20180730143609.jpg',
      '/upload/images/20180730143635.jpg',
      '/upload/images/20180730143716.jpg',
      '/upload/images/20180730143734.jpg',
      '/upload/images/20180730143753.jpg',
      '/upload/images/20180730143813.jpg',
      '/upload/images/20180730143833.jpg',
    ],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/91',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '90',
    title: '農委會推國產土雞專賣店 (自由時報)',
    date: '2013-10-19',
    excerpt: '在農委會輔導下，淞品成為國產土雞專賣店的示範案例。',
    bodyParagraphs: [
      '自由時報報導指出，淞品土雞專賣店是在農委會輔導下發展起來的國產土雞示範案例，象徵產業朝精緻化與特色化邁進。',
      '文章說明，專賣店從飼養、屠宰、分切、加工到運輸與販售都建立完整流程，並結合產銷履歷、合法屠宰場與獸醫師把關，讓消費者更安心。',
    ],
    featuredImage: '/upload/images/20180730144118.jpg',
    galleryImages: ['/upload/images/20180730144118.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/90',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '83',
    title: '《What\'s New》年菜大桌　少不了這一隻雞',
    date: '2016-01-22',
    excerpt: '年菜一定要有雞，淞品以自養、自屠、自製的一條龍模式，守住年節好味道。',
    bodyParagraphs: [
      '年菜餐桌上少不了雞肉，從台北萬華三水街市場發跡的淞品土雞專賣店，強調食材決定一切，雞一定要自己養，才能守住味道。',
      '高浚泓表示，黑羽母雞肉質細緻、紅羽公雞纖維長體型大，兩者交配出的土雞口感最好，因此他不只做販售，也自己設置屠宰廠與食品加工廠，建立完整鏈條。',
      '專題也介紹了淞品的鹹水雞與煙燻雞等招牌商品，並提到民生店的熟食與生肉分區，年節時總是人潮不斷。',
    ],
    featuredImage: '/upload/images/20180730144951.jpg',
    galleryImages: [
      '/upload/images/20180730144951.jpg',
      '/upload/images/20180730145008.jpg',
      '/upload/images/20180730145025.jpg',
      '/upload/images/20180730145040.jpg',
      '/upload/images/20180730145100.jpg',
      '/upload/images/20180730145114.jpg',
      '/upload/images/20180730145127.jpg',
      '/upload/images/20180730145139.jpg',
    ],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/83',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '66',
    title: '台北補品：淞品滴雞精@雨後',
    date: '2014-03-27',
    excerpt: '部落客開箱淞品滴雞精，從包裝、價格到風味都做了完整分享。',
    bodyParagraphs: [
      '這篇部落格文章從外盒與紙袋開始介紹，先提到淞品滴雞精的包裝很有品牌感，不再只是傳統市場的簡單盒裝。',
      '作者也分享了價格、份量與食用感受，認為這款滴雞精在送禮與日常補養之間都很合適。',
      '文章特別提到紙袋與外盒的設計很有質感，內容物標示也清楚，讓人感覺這不只是市場熟食，而是能當成伴手禮的商品。',
      '飲用感受方面則偏向濃醇順口，作者把它拿來和其他品牌比較，認為淞品的滴雞精有自己明確的品牌印象。',
    ],
    featuredImage: '/upload/images/20180730134845.jpg',
    galleryImages: [
      '/upload/images/20180730134845.jpg',
      '/upload/images/20180730134856.jpg',
      '/upload/images/20180730134908.jpg',
      '/upload/images/20180730134920.jpg',
    ],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/66',
    kind: 'article',
  },
  {
    groupSlug: '79',
    articleSlug: '40',
    title: '淞品商行---令人噴口水的 "白斬雞 & 燻雞"',
    date: '2010-01-01',
    excerpt: '食記分享淞品商行的白斬雞與燻雞，字裡行間都是滿滿的「好吃到流口水」。',
    bodyParagraphs: [
      '這篇食記是以很輕鬆的口吻記錄品嘗淞品商行白斬雞與燻雞的感想，整篇都在傳達「很好吃」這件事。',
      '作者回到萬華一帶尋找這家隱藏版雞肉店，認為它是那種一吃就會想再回頭的店，味道實在讓人印象深刻。',
      '文章裡沒有太多複雜修飾，更多的是對雞肉口感、香氣與回味的直白稱讚，讀起來很有部落客現場試吃的感覺。',
      '文末也留下店名與地址資訊，讓讀者可以直接按圖索驥去找這家店。',
    ],
    featuredImage: '/upload/images/20180730135144.jpg',
    galleryImages: [
      '/upload/images/20180730135144.jpg',
      '/upload/images/20180730135200.jpg',
      '/upload/images/20180730135222.jpg',
      '/upload/images/20180730135241.jpg',
    ],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/79/40',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '115',
    title: '一坪店起家 艋舺土雞王',
    date: '2018-10-20',
    excerpt: '以土雞小攤起家到品牌化經營，這支影音報導完整呈現淞品的成長歷程。',
    bodyParagraphs: [
      '這支影音報導回顧淞品從萬華市場一坪小攤起家的故事，談到如何一步步從熟食雞販走向品牌經營。',
      '影片將創業過程、養雞管理與市場轉型串在一起，也讓人更清楚看見淞品在在地市場中的位置與實力。',
    ],
    featuredImage: '/upload/media/154020592695.jpg',
    galleryImages: ['/upload/media/154020592695.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/U-jVtVyH93M?si=0G1LqoOZ1tjteRnw',
    sourceUrl: 'https://sonpin.tw/media/78/115',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '86',
    title: '?祈?????唳皞停? (???亙)',
    date: '2014-02-19',
    excerpt: '???亙撠赤瘛?????瘚?嚗?憿找?敺??渲都???璇??風蝔?',
    bodyParagraphs: [
      '?????亙?勗?敺?瘚??振???舫?憪神韏瘀?隤芣?隞瘥??砍停?航?撣?痔嚗?敺?撠望閫賊?????',
      '??銋神?唬??曉??偌?餉?撌亦?嚗?敺????渲都??敺??寡都????嚗?Ｗ??箏蝣?',
      '?箔??批?釭嚗??擗???雿???◢?賡??菔之鞈?雿?????ˊ?銝脫?銝璇???',
      '?蝯??典?蝢抵撱箏?撌亙?嚗?瘛?敺?瘞游??渡?撠嚗???摰???楝????鞈????',
    ],
    featuredImage: '/upload/media/153268011775.png',
    galleryImages: ['/upload/media/153268011775.png'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/86',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '80',
    title: '產地每斤飆到48元 土雞店苦撐搶買氣',
    date: '2014-02-10',
    excerpt: '<span style="color: rgb(64, 64, 64); font-fam...',
    bodyParagraphs: [
      '產地每斤飆到48元，土雞店的進貨壓力大增，市場上的買氣也因此被重新洗牌。',
      '這篇報導聚焦在雞價上漲後，土雞專賣店如何在成本與銷售之間維持平衡，努力撐住原本的客源。',
    ],
    featuredImage: '/upload/media/153284322595.jpg',
    galleryImages: ['/upload/media/153284322595.jpg'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/80',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '87',
    title: '?祈????! ??都4撠?鞈??! (?望ㄝ?啗?)',
    date: '2014-01-30',
    excerpt: '?望ㄝ?啗??勗?瘛???都???撠梯都??頞?鈭箸除??',
    bodyParagraphs: [
      '???啗?銝餉??刻?瘛??刻?臬??犖瘞???孵?舀???蝭?嗆?嚗????虜撣豢?皛踹?靘眺??摰Ｖ犖??',
      '?靘???嚗?摰嗅虜撣詨敺???撠望???鞈??嚗?霈振摨?鈭?啣??誨銵冽抒???????',
    ],
    featuredImage: '/upload/media/153268050716.png',
    galleryImages: ['/upload/media/153268050716.png'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/87',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '88',
    title: '?潛?啣??瘛???',
    date: '2013-12-25',
    excerpt: '?餉?蝭?桐?蝝寞???銵?撣嗅?振?祈???????湧???',
    bodyParagraphs: [
      '?敶梢?批捆隞乓?暹?啁??閫漲隞晶瘛???嚗?閫?曄?閬??刻?臬??渲ㄐ?犖瘞???寡??',
      '蝭?桅?暺?券???頨恬?隞亙?摨振?典蝯勗??港葉?郊撱箇?韏瑚??蝣?',
    ],
    featuredImage: '/upload/media/153268058258.png',
    galleryImages: ['/upload/media/153268058258.png'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/88',
    kind: 'article',
  },
  {
    groupSlug: '78',
    articleSlug: '85',
    title: '?Ｚˊ?瑚?璇?嚗悅瘚??擙格?憭? 閮?',
    date: '2013-11-19',
    excerpt: '瘛??齒擙格???閮?嚗恐蝷箇?ˊ?銝璇????芋撘?',
    bodyParagraphs: [
      '?閮?銝餉??臬隞晶瘛?憒?????憌潮???摰啜?撌亙?瑕銝脫?摰??璇?瘚???',
      '???悅瘚????圈悅??霅?銝駁?嚗?????瘨祥??湔?圾??撠??擙株?靘??蝞∠?????',
    ],
    featuredImage: '/upload/media/153268006254.png',
    galleryImages: ['/upload/media/153268006254.png'],
    iframeUrl: '',
    sourceUrl: 'https://sonpin.tw/media/78/85',
    kind: 'article',
  },

  {
    groupSlug: '78',
    articleSlug: '81',
    title: '年代台灣向錢衝-日斬萬雞年賣上億',
    date: '2017-08-19',
    excerpt: '《年代台灣向錢衝》報導淞品土雞從市場攤位一路做到年賣上億的成長故事。',
    bodyParagraphs: [
      '《年代台灣向錢衝》節目介紹淞品土雞從傳統市場攤位出發，逐步發展成品牌店面的歷程。',
      '報導強調淞品以雞販起家、持續擴大經營，靠著品質與市場需求，走出不同於傳統雞攤的路線。',
    ],
    featuredImage: '/upload/media/153284313010.jpg',
    galleryImages: ['/upload/media/153284313010.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/HCTmM1PKLUU',
    sourceUrl: 'https://sonpin.tw/media/78/81',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '77',
    title: '【被倒債300萬】這家土雞店從1坪攤翻身',
    date: '2016-08-07',
    excerpt: '蘋果日報報導淞品土雞從1坪攤位起家，靠產製銷一條龍翻身。',
    bodyParagraphs: [
      '時序進入農曆7月中元普渡拜拜旺季，全年用雞量最高月份，這家老闆賣雞的方法很不一樣。',
      '淞品土雞老闆高浚泓從小看父母在菜市場賣雞，後來從1坪攤位起家，逐步發展成產製銷一條龍的土雞品牌。',
      '他的店裡從生雞、鹹水雞、煙燻甘蔗雞到滴雞精、雞油等產品都有販售，延伸成完整的雞肉供應鏈。',
    ],
    featuredImage: '/upload/media/153284361613.jpg',
    galleryImages: ['/upload/media/153284361613.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/Vx30fW4dLx0',
    sourceUrl: 'https://sonpin.tw/media/78/77',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '84',
    title: '一坪肉攤起家 14年翻身雞販變土雞王 (東森新聞)',
    date: '2014-02-21',
    excerpt: '東森新聞報導高浚泓從一坪肉攤起家，14年後翻身成為土雞王。',
    bodyParagraphs: [
      '東森新聞報導高浚泓從萬華市場的一坪肉攤起家，靠著土雞生意一路打拚。',
      '報導內容提到他從傳統雞販轉型為品牌店，逐步建立更完整的經營模式。',
    ],
    featuredImage: '/upload/media/153284403374.jpg',
    galleryImages: ['/upload/media/153284403374.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/rkNMHRhfMNc',
    sourceUrl: 'https://sonpin.tw/media/78/84',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
  {
    groupSlug: '78',
    articleSlug: '82',
    title: '忙翻天！ 拜拜必需品 雞肉名店「半夜也排隊」',
    date: '2015-02-17',
    excerpt: '報導萬華地區知名雞肉名店在拜拜旺季半夜也有排隊人潮。',
    bodyParagraphs: [
      '今年受到禽流感疫情的影響，雞隻銷售狀況並不好，但是過年要用全雞拜拜，有信譽的老店就變成民眾的最愛。',
      '在台北市萬華地區的知名老店，白天排隊買雞至少要 1 小時以上，店家甚至在除夕前三天 24 小時不打烊。',
    ],
    featuredImage: '/upload/media/153284389246.jpg',
    galleryImages: ['/upload/media/153284389246.jpg'],
    iframeUrl: 'https://www.youtube.com/embed/9NzROZW-VCQ',
    sourceUrl: 'https://sonpin.tw/media/78/82',
    kind: 'video',
    videoPlacement: 'bottom',
    videoMode: 'embed',
  },
];

export const MEDIA_GROUPS = {
  '79': {
    slug: '79',
    title: '報章雜誌',
    label: '報章雜誌',
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
