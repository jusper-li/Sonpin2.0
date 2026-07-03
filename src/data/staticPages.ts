export interface StaticPageSection {
  type: 'intro' | 'section';
  title: string;
  content: string;
}

export interface StaticPageFallback {
  slug: string;
  title: string;
  meta_description: string;
  sections: StaticPageSection[];
  updated_at: string;
}

const bankTransferNotice = `訂購專線：02-2338-0018
轉帳銀行：永豐銀行 萬華分行 銀行代碼：807
轉帳帳號：105-001-0014900-4
戶名：淞品生技股份有限公司
統編：27522811

(PS. 轉帳或匯款完成請於星期二~星期日上午9:00~17:00務必來電確認，以便出貨，感恩。)`;

export const STATIC_PAGE_FALLBACKS: Record<string, StaticPageFallback> = {
  about: {
    slug: 'about',
    title: '品牌緣起',
    meta_description: '淞品土雞專賣店品牌故事、聯絡資訊與匯款資料。',
    sections: [
      {
        type: 'intro',
        title: '品牌故事',
        content:
          '艋舺（現萬華），曾經是最繁華的地方，淞品雞肉在艋舺傳香了10幾年，是來過艋舺的人都不會錯過的美味。',
      },
      {
        type: 'section',
        title: '品牌故事',
        content:
          '淞品商行位在萬華廟口三水市場內，每天不絕於耳用菜刀剁雞的聲音，從破曉的五六點一直到傍晚五六點都沒停過。淞品門口的排隊人潮也從來不曾間斷過，最出名的煙燻雞及鹹水雞是老闆的家傳秘方。',
      },
      {
        type: 'section',
        title: '品牌故事',
        content:
          '我們堅持使用自養的台灣土雞，遵循家傳的料理法，淞品的味道10幾年沒變過，將來也不會變。我們傳承的不只是好口味，更是一份對美食精神的堅持。',
      },
      {
        type: 'section',
        title: '聯絡資訊',
        content: bankTransferNotice,
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  story: {
    slug: 'story',
    title: '品牌故事',
    meta_description: '淞品土雞專賣店品牌故事。',
    sections: [
      {
        type: 'intro',
        title: '品牌故事',
        content:
          '艋舺（現萬華）曾是台北最繁華的街區之一，淞品土雞在這裡陪著在地市場走過十多年，成為許多人到萬華時一定會想到的熟悉味道。',
      },
      {
        type: 'section',
        title: '傳承與堅持',
        content:
          '從三水市場的剁雞聲，到每天排隊的人潮，淞品一路靠著自養台灣土雞、家傳料理法與穩定風味累積口碑，呈現的不只是雞肉料理，更是對食材與味道的執著。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  contact: {
    slug: 'contact',
    title: '客服中心',
    meta_description: '淞品土雞專賣店客服與匯款資訊。',
    sections: [
      {
        type: 'intro',
        title: '客服中心',
        content:
          '如需訂購、確認匯款或洽詢商品資訊，歡迎直接來電聯繫，或透過門市資訊到現場詢問。',
      },
      {
        type: 'section',
        title: '客服資訊',
        content: '訂購專線：02-2338-0018\nEmail：service@sonpin.tw\n服務時間：週二至週日上午 09:00 - 17:00',
      },
      {
        type: 'section',
        title: '匯款資訊',
        content: bankTransferNotice,
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  shipping: {
    slug: 'shipping',
    title: '購物須知',
    meta_description: '淞品土雞專賣店購物、配送與退貨須知。',
    sections: [
      {
        type: 'intro',
        title: '購物須知',
        content:
          '依消費者保護法第19條規定，生鮮冷凍食品不適用7日猶豫期。若商品本身有瑕疵或出貨內容與訂單不符，請儘速與我們聯絡。',
      },
      {
        type: 'section',
        title: '退換貨說明',
        content:
          '商品一經拆封、食用、解凍、保存不當，或因個人口味偏好因素，恕無法退換貨。若收到商品有明顯瑕疵，請保留原包裝與照片並立即與客服聯繫。',
      },
      {
        type: 'section',
        title: '配送與門市',
        content:
          '線上訂單將依排程出貨，恕無法指定門市自取。產品已投保產品責任險，食品業登錄字號為 Q-127522811-00001-3。',
      },
      {
        type: 'section',
        title: '匯款提醒',
        content: bankTransferNotice,
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  returns: {
    slug: 'returns',
    title: '退貨條款',
    meta_description: '淞品土雞專賣店退換貨相關規範。',
    sections: [
      {
        type: 'intro',
        title: '退貨條款',
        content:
          '為維護食品安全與消費權益，生鮮冷凍商品一經出貨後，若非商品本身瑕疵或訂單出貨錯誤，恕不接受退換。',
      },
      {
        type: 'section',
        title: '可受理情況',
        content:
          '若商品在到貨時有明顯損壞、錯件或規格不符，請於收件後儘速與客服聯絡，並保留完整包裝與相關照片，以利後續處理。',
      },
      {
        type: 'section',
        title: '不受理情況',
        content:
          '商品已拆封、食用、解凍、保存不當，或因個人口味、喜好等主觀因素，皆不在退換範圍內。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  privacy: {
    slug: 'privacy',
    title: '隱私權政策',
    meta_description: '淞品土雞專賣店隱私權與資料保護說明。',
    sections: [
      {
        type: 'intro',
        title: '隱私權政策',
        content:
          '我們重視使用者隱私與資料保護，僅在完成訂單、會員服務與客服聯繫所需範圍內使用相關資訊。',
      },
      {
        type: 'section',
        title: '資料使用',
        content:
          '網站會在必要範圍內使用您提供的聯絡資料，以完成訂單通知、出貨聯繫與客服回覆。除法令要求或履行服務所需，不會任意揭露給第三方。',
      },
      {
        type: 'section',
        title: 'Cookie 與瀏覽資料',
        content:
          '網站可能使用 Cookie 或類似技術，以改善瀏覽體驗、維持登入狀態與統計網站使用情形。您可自行調整瀏覽器設定限制 Cookie。',
      },
      {
        type: 'section',
        title: '政策修訂',
        content:
          '若隱私權政策有調整，將以網站公告方式更新內容。建議您不定期查看，以了解最新的資料處理方式。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
};

export const getStaticPageFallback = (slug: string) => STATIC_PAGE_FALLBACKS[slug] || null;
