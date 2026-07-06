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

const bankTransferNotice = `請以客服提供的最新匯款資訊為準。
聯絡電話：02-2338-0018
服務時間：週一至週日 上午 09:00 - 17:00`;

export const STATIC_PAGE_FALLBACKS: Record<string, StaticPageFallback> = {
  about: {
    slug: 'about',
    title: '關於淞品',
    meta_description: '認識淞品土雞專賣店的品牌起點、經營理念與堅持。',
    sections: [
      {
        type: 'intro',
        title: '關於淞品',
        content:
          '淞品土雞從傳統市場起家，長年專注在土雞與熟食雞品的品質管理，逐步建立起產、製、銷一條龍的品牌基礎。',
      },
      {
        type: 'section',
        title: '品牌理念',
        content:
          '我們相信，好的雞肉不只是新鮮，還要有穩定的供應、透明的流程與能讓顧客安心的品牌服務。',
      },
      {
        type: 'section',
        title: '經營堅持',
        content:
          '從雞隻來源到加工與販售，每一個環節都盡量維持一致標準，讓顧客不論是自用、拜拜或送禮，都能買得放心。',
      },
      {
        type: 'section',
        title: '聯絡方式',
        content: '如需訂購、詢問門市資訊或合作細節，請直接聯絡客服。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  story: {
    slug: 'story',
    title: '品牌故事',
    meta_description: '淞品土雞如何從市場攤位一路走向品牌化經營。',
    sections: [
      {
        type: 'intro',
        title: '品牌故事',
        content:
          '淞品的故事，始於市場第一線的日常，最後走向更完整的品牌經營與加工體系。',
      },
      {
        type: 'section',
        title: '起點',
        content:
          '早期從傳統市場開始累積客群，靠的是熟悉產品、了解顧客需求，以及一步一步建立口碑。',
      },
      {
        type: 'section',
        title: '成長',
        content:
          '隨著市場變化與消費者需求提升，淞品逐漸把飼養、加工、販售整合成更完整的服務模式。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  contact: {
    slug: 'contact',
    title: '客服中心',
    meta_description: '聯絡淞品土雞客服，取得訂購與售後協助。',
    sections: [
      {
        type: 'intro',
        title: '客服中心',
        content:
          '如果您想訂購、詢問商品、確認門市資訊或處理售後問題，都可以直接聯絡我們。',
      },
      {
        type: 'section',
        title: '聯絡資料',
        content: '電話：02-2338-0018\nEmail：service@sonpin.tw\n服務時間：週一至週日 上午 09:00 - 17:00',
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
    meta_description: '說明淞品土雞的訂購、配送與出貨注意事項。',
    sections: [
      {
        type: 'intro',
        title: '購物須知',
        content:
          '下單前建議先確認商品內容、配送方式與可出貨時間，以便我們順利安排訂單。',
      },
      {
        type: 'section',
        title: '配送方式',
        content:
          '依商品屬性安排冷藏或冷凍配送，實際出貨時間與配送條件請以客服確認為準。',
      },
      {
        type: 'section',
        title: '付款方式',
        content:
          '可依當期服務內容選擇線上付款、匯款或門市付款，若有異動以客服公告為準。',
      },
      {
        type: 'section',
        title: '訂購提醒',
        content:
          '若為節慶、團購或大量訂購，建議提早聯絡客服，以利安排備貨與出貨。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  returns: {
    slug: 'returns',
    title: '退換貨說明',
    meta_description: '說明淞品土雞產品的退換貨與售後處理方式。',
    sections: [
      {
        type: 'intro',
        title: '退換貨說明',
        content:
          '食品類商品基於保存與衛生考量，退換貨規範會依商品狀況與出貨條件個別處理。',
      },
      {
        type: 'section',
        title: '可受理情況',
        content:
          '若商品在配送過程中有明顯損壞、品項錯誤或品質異常，請在收到商品後盡快聯絡客服。',
      },
      {
        type: 'section',
        title: '處理方式',
        content:
          '客服會依實際狀況協助確認退貨、換貨或補寄安排，必要時請提供照片與訂單資訊。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
  privacy: {
    slug: 'privacy',
    title: '隱私權政策',
    meta_description: '說明淞品土雞對使用者資料的保護與處理方式。',
    sections: [
      {
        type: 'intro',
        title: '隱私權政策',
        content:
          '我們重視您的個人資料與使用紀錄，並會以合理且必要的方式蒐集、使用與保存。',
      },
      {
        type: 'section',
        title: '資料蒐集',
        content:
          '在您使用網站、訂購商品或聯絡客服時，可能會留下聯絡資訊、訂單資料與必要的服務紀錄。',
      },
      {
        type: 'section',
        title: '資料使用',
        content:
          '資料僅用於訂單處理、客服聯繫、服務優化與法令要求之必要用途，不會任意提供給無關第三方。',
      },
      {
        type: 'section',
        title: 'Cookie 與網站分析',
        content:
          '網站可能使用 Cookie 或分析工具，以改善瀏覽體驗與服務品質。您可透過瀏覽器設定管理 Cookie。',
      },
      {
        type: 'section',
        title: '聯絡窗口',
        content:
          '若您想查詢、修改或要求刪除個人資料，請直接聯絡客服，我們會依規定協助處理。',
      },
    ],
    updated_at: '2026-07-03T00:00:00+00:00',
  },
};

export const getStaticPageFallback = (slug: string) => STATIC_PAGE_FALLBACKS[slug] || null;
