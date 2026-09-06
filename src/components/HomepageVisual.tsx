import { useEffect, useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import BatchDocumentSearch from './BatchDocumentSearch';
import DeferredSiteFooter from './DeferredSiteFooter';
import HomepageNoticeCalendar from './HomepageNoticeCalendar';
import SiteHeader from './SiteHeader';
import type { HomepageSection } from '../data/homepageContent';
import { getOptimizedProductImage } from '../utils/optimizedImages';
import { useLanguage } from '../contexts/LanguageContext';

interface HomepageVisualProps { sections: HomepageSection[]; }
const imageFor = (section: HomepageSection) => section.background_image || section.content?.background_image || section.content?.image || '';
const media = (section: HomepageSection) => getOptimizedProductImage(imageFor(section))?.src || imageFor(section);
const videoFor = (section?: HomepageSection) => {
  const value = section?.content?.youtube || section?.content?.video_url || '';
  if (value.includes('youtube.com/embed/')) return value;
  const watch = value.match(/[?&]v=([^&]+)/i);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}?rel=0`;
  const short = value.match(/youtu\.be\/([^?&/]+)/i);
  return short?.[1] ? `https://www.youtube.com/embed/${short[1]}?rel=0` : value;
};
const matches = (section: HomepageSection, terms: string[]) => terms.some((term) => `${section.title}${section.label}${section.content?.title || ''}`.includes(term));
const findSection = (sections: HomepageSection[], terms: string[]) => sections.find((section) => matches(section, terms));
const LEGACY_SITE_VIDEOS = [
  { id: 'm_ttHq4dFWk', title: '淞品畜產 煙燻放山雞', terms: ['煙燻', '燻雞'] },
  { id: 'HCTmM1PKLUU', title: '淞品土雞-生產園區', terms: ['生產園區', '生產'] },
  { id: 'U-jVtVyH93M', title: '淞品土雞專賣店-媒體推薦', terms: ['媒體推薦', '媒體'] },
] as const;

export default function HomepageVisual({ sections }: HomepageVisualProps) {
  const { t } = useLanguage();
  const heroBanners = sections
    .filter((section) => section.section_type === 'hero_product')
    .sort((a, b) => Number(a.number || 0) - Number(b.number || 0));
  const defaultHero = sections.find((section) => section.section_type === 'hero') || heroBanners[0] || sections[0];
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [heroBanners.length]);

  useEffect(() => {
    if (heroBanners.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroBanners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroBanners.length]);

  const hero = heroBanners.length > 0 ? heroBanners[activeHeroIndex % heroBanners.length] : defaultHero;
  if (!hero) return <div className="sonpin-site"><SiteHeader /><main className="min-h-[60vh]" /><DeferredSiteFooter /></div>;

  const contentSections = sections.filter((section) => section !== hero && section.section_type !== 'hero_product');
  // Article titles are localized before this component renders. Select by the
  // database section type so switching languages cannot hide the articles.
  const articleSections = contentSections.filter((section) => section.section_type === 'article');
  const signature = articleSections[0] || findSection(contentSections, ['年菜']);
  const smoky = articleSections[1] || findSection(contentSections, ['萬華', '煙燻', '燻雞']);
  const videoSections = contentSections.filter((section) => section.section_type === 'video');
  const legacyVideoSections: HomepageSection[] = LEGACY_SITE_VIDEOS.flatMap((video, index) => {
    const source = videoSections.find((section) => videoFor(section).includes(video.id)) || findSection(contentSections, [...video.terms]) || videoSections[index] || smoky;
    if (!source) return [];
    return [{
      ...source,
      id: `legacy-video-${video.id}`,
      label: t('homepage.video.label', '影音'),
      title: t(`homepage.video.${video.id}.title`, video.title),
      content: { ...source.content, youtube: `https://www.youtube.com/embed/${video.id}`, video_title: video.title },
    }];
  });
  const storeSections = contentSections.filter((section) => section.section_type === 'store').slice(0, 3);
  const quickLinks = contentSections.flatMap((section) => section.submenu || section.content?.submenu || []).filter((item, index, list) => item.href && list.findIndex((candidate) => candidate.href === item.href) === index).slice(0, 4);

  const editorial = (section: HomepageSection | undefined, reverse = false) => {
    if (!section) return null;
    const video = videoFor(section);
    const href = section.content?.href || section.content?.link || section.submenu?.[0]?.href;
    return <article className={`sonpin-editorial-feature ${reverse ? 'is-reverse' : ''}`} key={section.id}><div className="sonpin-editorial-media">{video ? <iframe src={video} title={section.content?.video_title || section.title} loading="lazy" allowFullScreen /> : <img src={media(section)} alt={section.title} loading="lazy" />}</div><div className="sonpin-editorial-copy"><p className="sonpin-eyebrow">{section.label || section.subtitle}</p><h2>{section.title}</h2><p>{section.description || section.content?.description}</p>{href && <Link to={href} className="sonpin-text-link">{section.content?.cta_label || section.submenu?.[0]?.label || t('homepage.cta.learnMore', '了解更多')} <ArrowRight size={15} /></Link>}</div></article>;
  };

  return <div className="sonpin-site">
    <SiteHeader />
    <main>
      <section className="sonpin-hero"><div className="sonpin-container sonpin-hero-grid"><div className="sonpin-hero-copy"><p className="sonpin-eyebrow">{hero.label || hero.subtitle}</p><h1>{hero.title}</h1><p className="sonpin-lead">{hero.description || hero.content?.description}</p><div className="sonpin-actions"><Link to={hero.content?.href || '/products'} className="sonpin-button sonpin-button-primary">{t('homepage.cta.products', '商品介紹')} <ArrowRight size={16} /></Link><Link to="/about" className="sonpin-button sonpin-button-ghost">{t('homepage.cta.about', '關於淞品')} <ArrowRight size={16} /></Link></div>{heroBanners.length > 1 && <div className="sonpin-hero-dots" aria-label="Banner 選擇">{heroBanners.map((banner, index) => <button type="button" key={banner.id} aria-label={`切換至 Banner ${index + 1}`} aria-current={index === activeHeroIndex} onClick={() => setActiveHeroIndex(index)} />)}</div>}</div><Link to={hero.content?.href || '/products'} className="sonpin-hero-image"><img src={media(hero)} alt={hero.title} loading="eager" /></Link></div></section>
      {quickLinks.length > 0 && <section className="sonpin-quick-links"><div className="sonpin-container sonpin-quick-grid">{quickLinks.map((item) => <Link to={item.href} className="sonpin-quick-link" key={item.href}><span className="sonpin-quick-icon"><MapPin size={19} /></span><span>{item.label}</span><ArrowRight size={15} /></Link>)}</div></section>}
      {(signature || smoky) && <section className="sonpin-section sonpin-editorial-section"><div className="sonpin-container"><div className="sonpin-article-grid">{[signature, smoky].filter((section, index, list): section is HomepageSection => Boolean(section) && list.indexOf(section) === index).map((section) => editorial(section))}</div></div></section>}
      {legacyVideoSections.length > 0 && <section className="sonpin-section sonpin-video-section"><div className="sonpin-container sonpin-video-container"><p className="sonpin-eyebrow">{t('homepage.video.badge', '影音專區')}</p><h2>{t('homepage.video.heading', '淞品故事與品牌影音')}</h2><div className="sonpin-video-grid">{legacyVideoSections.map((section) => <article className="sonpin-video-card" key={section.id}><div className="sonpin-video-frame">{videoFor(section) && <iframe src={videoFor(section)} title={section.content?.video_title || section.title} loading="lazy" allowFullScreen />}</div><p className="sonpin-eyebrow">{section.label || section.subtitle}</p><h3>{section.title}</h3></article>)}</div></div></section>}
      <HomepageNoticeCalendar />
      {storeSections.length > 0 && <section className="sonpin-section sonpin-store-section"><div className="sonpin-container"><div className="sonpin-section-heading"><div><p className="sonpin-eyebrow">{t('homepage.store.badge', 'Store Locations')}</p><h2>{t('homepage.store.heading', '門市據點')}</h2></div><Link to="/store" className="sonpin-text-link">{t('homepage.store.viewAll', '查看全部門市')} <ArrowRight size={15} /></Link></div><div className="sonpin-store-grid">{storeSections.map((section) => <Link to={section.content?.href || '/store'} className="sonpin-store-card" key={section.id}>{imageFor(section) ? <img src={media(section)} alt={section.title} loading="lazy" /> : <div className="sonpin-store-placeholder"><MapPin size={34} /></div>}<div className="sonpin-store-info"><p className="sonpin-eyebrow">{section.label || t('homepage.store.badge', '門市據點')}</p><h3>{section.title}</h3><p>{section.subtitle}</p><p>{section.description || section.content?.description}</p><span className="sonpin-text-link">{t('homepage.store.viewInfo', '前往門市資訊')} <ArrowRight size={15} /></span></div></Link>)}</div></div></section>}
      <section className="sonpin-batch-section"><div className="sonpin-container"><BatchDocumentSearch /></div></section>
    </main>
    <DeferredSiteFooter />
  </div>;
}
