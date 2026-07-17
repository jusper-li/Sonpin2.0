export interface HomepageSubmenuItem {
  label: string;
  title: string;
  href: string;
}

export interface HomepageSectionContent {
  label?: string;
  subtitle?: string;
  title?: string;
  number?: string;
  submenu?: HomepageSubmenuItem[];
  background_image?: string;
  image?: string;
  description?: string;
  main_title?: string;
  tagline?: string;
  href?: string;
  link?: string;
  youtube?: string;
  video_url?: string;
  video_title?: string;
  video_description?: string;
  cta_label?: string;
}

export interface HomepageSection {
  id: string;
  label: string;
  subtitle: string;
  title: string;
  number: string;
  submenu?: HomepageSubmenuItem[];
  section_type: string;
  content: HomepageSectionContent;
  background_image?: string;
  description?: string;
}

export interface HeaderNavItem {
  label: string;
  href: string;
}

export interface HeaderSettings {
  logo_text: string;
  logo_image: string;
  navigation: HeaderNavItem[];
  show_cart: boolean;
  show_language_selector: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterSettings {
  about_text: string;
  contact_email: string;
  contact_phone: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  copyright_text: string;
  link_groups: FooterLinkGroup[];
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'hero',
    label: '淞品土雞專賣店',
    subtitle: '品牌故事',
    title: '淞品土雞專賣店',
    number: '01',
    section_type: 'hero',
    content: {
      label: '淞品土雞專賣店',
      main_title: '淞品',
      subtitle: '土雞專賣店',
      tagline: '產、製、銷一條龍',
      title: '淞品土雞專賣店',
      description: '從萬華三水街市場起家，堅持自養台灣土雞，提供煙燻雞、鹹水雞、滴雞精與多款土雞熟食。',
      number: '01',
      background_image: '/sonpin-images/20250701170434.jpg',
    },
    background_image: '/sonpin-images/20250701170434.jpg',
  },
  {
    id: 'shop',
    label: '商品介紹',
    subtitle: '主打商品',
    title: '商品介紹',
    number: '02',
    section_type: 'shop',
    submenu: [
      { label: '商品介紹', title: '前往商品', href: '/products' },
      { label: '主打商品', title: '主打商品', href: '/products/6' },
    ],
    content: {
      label: '商品介紹',
      subtitle: '主打商品',
      title: '商品介紹',
      description: '淞品經典滴雞精、煙燻雞、鹹水雞與節慶禮盒，適合自用與送禮。',
      number: '02',
      background_image: '/sonpin-images/175135830617.jpg',
      submenu: [
        { label: '商品介紹', title: '前往商品', href: '/products' },
        { label: '主打商品', title: '主打商品', href: '/products/6' },
      ],
    },
    background_image: '/sonpin-images/175135830617.jpg',
  },
  {
    id: 'story',
    label: '關於淞品',
    subtitle: '品牌緣起',
    title: '關於淞品',
    number: '03',
    section_type: 'story',
    submenu: [
      { label: '關於淞品', title: '品牌故事', href: '/about' },
      { label: '饕客分享', title: '饕客分享', href: '/service' },
    ],
    content: {
      label: '關於淞品',
      subtitle: '品牌緣起',
      title: '關於淞品',
      description: '艋舺起家的土雞品牌，將傳統市場精神轉化為穩定、安心、可追溯的雞肉與滴雞精商品。',
      number: '03',
      background_image: '/sonpin-images/20260623131731.jpg',
      submenu: [
        { label: '關於淞品', title: '品牌故事', href: '/about' },
        { label: '饕客分享', title: '饕客分享', href: '/service' },
      ],
    },
    background_image: '/sonpin-images/20260623131731.jpg',
  },
  {
    id: 'video',
    label: '影音區塊',
    subtitle: '品牌影音',
    title: '品牌影音',
    number: '04',
    section_type: 'video',
    submenu: [
      { label: '影音專區', title: '影音專區', href: '/media' },
      { label: '了解更多', title: '了解更多影音內容', href: '/media' },
    ],
    content: {
      label: '影音區塊',
      subtitle: '品牌影音',
      title: '品牌影音',
      description: '透過影片帶你認識淞品土雞的品牌故事與真實現場。',
      number: '04',
      href: '/media',
      youtube: 'https://www.youtube.com/embed/U-jVtVyH93M',
      video_title: '品牌影音介紹',
      video_description: '觀看淞品土雞的品牌故事與相關影音內容。',
      background_image: '/sonpin-images/20250701170434.jpg',
      submenu: [
        { label: '影音專區', title: '影音專區', href: '/media' },
        { label: '了解更多', title: '了解更多影音內容', href: '/media' },
      ],
    },
    background_image: '/sonpin-images/20250701170434.jpg',
  },
  {
    id: 'contact',
    label: '客服中心',
    subtitle: '聯絡我們',
    title: '客服中心',
    number: '05',
    section_type: 'contact',
    submenu: [
      { label: '客服中心', title: '聯絡我們', href: '/contact' },
      { label: '店頭資訊', title: '門市據點', href: '/store' },
    ],
    content: {
      label: '客服中心',
      subtitle: '聯絡我們',
      title: '客服中心',
      description: '訂購專線、匯款資訊與門市聯絡方式皆可在這裡查詢，出貨與付款由專人核對。',
      number: '05',
      background_image: '/sonpin-images/153285185380.jpg',
      submenu: [
        { label: '客服中心', title: '聯絡我們', href: '/contact' },
        { label: '店頭資訊', title: '門市據點', href: '/store' },
      ],
    },
    background_image: '/sonpin-images/153285185380.jpg',
  },
];

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  logo_text: '淞品土雞專賣店',
  logo_image: '/LOGO-1.png',
  navigation: [
    { label: '首頁', href: '/' },
    { label: '關於淞品', href: '/about' },
    { label: '商品介紹', href: '/products' },
    { label: '購物須知', href: '/shipping' },
    { label: '饕客分享', href: '/service' },
    { label: '店頭資訊', href: '/store' },
    { label: '生產製程', href: '/process' },
    { label: '相關報導', href: '/media' },
    { label: '會員專區', href: '/member' },
    { label: '客服中心', href: '/contact' },
    { label: '\u8a02\u55ae\u67e5\u8a62', href: '/order-query' },
  ],
  show_cart: true,
  show_language_selector: true,
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  about_text: '淞品土雞專賣店堅持自養土雞、產製銷一條龍，提供可安心選購的雞肉商品與滴雞精禮盒。',
  contact_email: 'service@sonpin.tw',
  contact_phone: '02-2338-0018',
  social_links: {
    facebook: '',
    instagram: '',
    youtube: '',
  },
  copyright_text: '© 2026 淞品土雞專賣店. All Rights Reserved.',
  link_groups: [
    {
      title: '品牌資訊',
      links: [
        { label: '關於淞品', href: '/about' },
        { label: '商品介紹', href: '/products' },
        { label: '饕客分享', href: '/service' },
        { label: '相關報導', href: '/media' },
      ],
    },
    {
      title: '服務資訊',
      links: [
        { label: '購物須知', href: '/shipping' },
        { label: '店頭資訊', href: '/store' },
        { label: '客服中心', href: '/contact' },
        { label: '\u8a02\u55ae\u67e5\u8a62', href: '/order-query' },
        { label: '常見問題', href: '/faq' },
      ],
    },
    {
      title: '政策資訊',
      links: [
        { label: '退換貨說明', href: '/returns' },
        { label: '隱私權政策', href: '/privacy' },
      ],
    },
  ],
};

export const toHomepageManagementSections = (
  sections: HomepageSection[] = DEFAULT_HOMEPAGE_SECTIONS
) => sections.map((section, index) => ({
  id: section.id,
  section_type: section.section_type,
  title: section.title,
  content: {
    ...section.content,
    label: section.content.label || section.label,
    title: section.content.title || section.title,
    subtitle: section.content.subtitle || section.subtitle,
    number: section.content.number || section.number,
    submenu: section.content.submenu || section.submenu || [],
  },
  sort_order: index + 1,
  is_active: true,
  source: 'local' as const,
}));
