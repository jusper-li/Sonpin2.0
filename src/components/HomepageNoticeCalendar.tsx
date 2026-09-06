import { Bell, CalendarDays, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadBlogData, type LoadedBlogArticle } from '../lib/blog';
import { isSupabaseContentEnabled, supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const GOOGLE_CALENDAR_SETTING_KEY = 'google_calendar_embed_url';
const DEFAULT_GOOGLE_CALENDAR_URL = 'https://www.google.com/calendar/embed?showTitle=0&showTabs=0&mode=AGENDA&height=300&wkst=1&bgcolor=%23FFFFFF&src=kcpl5an84hvcs3n9rrkebd9l54%40group.calendar.google.com&color=%23B1440E&ctz=Asia%2FTaipei';

const getCalendarUrl = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  return String(record.embed_url || record.url || '').trim();
};

export default function HomepageNoticeCalendar() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<LoadedBlogArticle[]>([]);
  const [calendarUrl, setCalendarUrl] = useState(DEFAULT_GOOGLE_CALENDAR_URL);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const blogPromise = loadBlogData({ publishedOnly: true });
      const calendarPromise = isSupabaseContentEnabled
        ? supabase.from('site_settings').select('setting_value').eq('setting_key', GOOGLE_CALENDAR_SETTING_KEY).maybeSingle()
        : Promise.resolve({ data: null, error: null });
      const [blogResult, calendarResult] = await Promise.allSettled([blogPromise, calendarPromise]);

      if (cancelled) return;
      if (blogResult.status === 'fulfilled') {
        setAnnouncements(blogResult.value.articles.filter((article) => article.category_slug === 'bulletin').slice(0, 3));
      }
      if (calendarResult.status === 'fulfilled' && !calendarResult.value.error) {
        const configuredUrl = getCalendarUrl(calendarResult.value.data?.setting_value);
        if (configuredUrl) setCalendarUrl(configuredUrl);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <section className="sonpin-notice-calendar-section">
    <div className="sonpin-container sonpin-notice-calendar-grid">
      <div className="sonpin-announcement-panel">
        <div className="sonpin-section-heading">
          <div><p className="sonpin-eyebrow"><Bell size={14} /> {t('homepage.notice.badge', '最新公告')}</p><h2>{t('homepage.notice.heading', '公告消息')}</h2></div>
          <Link to="/blog/categories/bulletin" className="sonpin-text-link">{t('homepage.notice.viewAll', '查看全部')} <ExternalLink size={14} /></Link>
        </div>
        <div className="sonpin-announcement-list">
          {announcements.length > 0 ? announcements.map((article) => <Link to={`/blog/posts/${article.slug}`} className="sonpin-announcement-item" key={article.slug}><span>{article.published_at}</span><strong>{article.title}</strong><ExternalLink size={14} /></Link>) : <p className="sonpin-empty-notice">{t('homepage.notice.empty', '目前沒有最新公告。')}</p>}
        </div>
      </div>
      <div className="sonpin-calendar-panel">
        <div className="sonpin-section-heading"><div><p className="sonpin-eyebrow"><CalendarDays size={14} /> {t('homepage.calendar.badge', '活動行事曆')}</p><h2>{t('homepage.calendar.heading', 'Google 行事曆')}</h2></div></div>
        {calendarUrl ? <iframe className="sonpin-calendar-frame" src={calendarUrl} title={t('homepage.calendar.heading', 'Google 行事曆')} loading="lazy" /> : <div className="sonpin-calendar-empty"><CalendarDays size={32} /><p>{t('homepage.calendar.empty', '尚未設定 Google 行事曆嵌入網址。')}</p><span>{t('homepage.calendar.settingHint', '請於 site_settings 建立 google_calendar_embed_url。')}</span></div>}
      </div>
    </div>
  </section>;
}
