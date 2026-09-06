export const CART_ANNOUNCEMENT_SETTING_KEY = 'cart_announcement';

export interface CartAnnouncementSettings {
  enabled: boolean;
  title: string;
  content: string;
  image: string;
  image_alt: string;
  link_url: string;
  link_label: string;
}

export const DEFAULT_CART_ANNOUNCEMENT: CartAnnouncementSettings = {
  enabled: false,
  title: '購物提醒',
  content: '',
  image: '',
  image_alt: '購物提醒',
  link_url: '',
  link_label: '了解更多',
};

export const normalizeCartAnnouncement = (value: unknown): CartAnnouncementSettings => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    enabled: source.enabled === true,
    title: typeof source.title === 'string' ? source.title : DEFAULT_CART_ANNOUNCEMENT.title,
    content: typeof source.content === 'string' ? source.content : DEFAULT_CART_ANNOUNCEMENT.content,
    image: typeof source.image === 'string' ? source.image : DEFAULT_CART_ANNOUNCEMENT.image,
    image_alt: typeof source.image_alt === 'string' ? source.image_alt : DEFAULT_CART_ANNOUNCEMENT.image_alt,
    link_url: typeof source.link_url === 'string' ? source.link_url : DEFAULT_CART_ANNOUNCEMENT.link_url,
    link_label: typeof source.link_label === 'string' ? source.link_label : DEFAULT_CART_ANNOUNCEMENT.link_label,
  };
};
