import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, FileText, Globe, Plus, Save, Search, ToggleLeft, ToggleRight, Trash2, X, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../ImageUpload';

interface SEOSetting {
  id: string;
  page_path: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string | null;
  canonical_url: string | null;
  robots: string | null;
  schema_markup: any;
}

interface SiteSettingRow {
  id: string | number;
  setting_key: string;
  setting_value: any;
}

interface GoogleAnalyticsSetting {
  enabled: boolean;
  measurement_id: string;
  stream_name: string;
  stream_url: string;
  stream_id: string;
}

const GOOGLE_ANALYTICS_SETTING_KEY = 'google_analytics';

const DEFAULT_GOOGLE_ANALYTICS: GoogleAnalyticsSetting = {
  enabled: true,
  measurement_id: 'G-JVFN8M2DXT',
  stream_name: '淞品土雞 - GA4',
  stream_url: 'http://www.sonpin.tw/',
  stream_id: '5044756741',
};

export default function SEOManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [seoSettings, setSeoSettings] = useState<SEOSetting[]>([]);
  const [googleAnalytics, setGoogleAnalytics] = useState<GoogleAnalyticsSetting>(DEFAULT_GOOGLE_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSeo, setEditingSeo] = useState<SEOSetting | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [seoForm, setSeoForm] = useState({
    page_path: '',
    title: '',
    description: '',
    keywords: '',
    og_image: '',
    canonical_url: '',
    robots: 'index, follow',
    schema_markup: null as any,
  });

  useEffect(() => {
    void loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      const [seoResponse, analyticsResponse] = await Promise.all([
        supabase.from('seo_settings').select('*').order('page_path'),
        supabase
          .from('site_settings')
          .select('id,setting_key,setting_value')
          .eq('setting_key', GOOGLE_ANALYTICS_SETTING_KEY)
          .maybeSingle(),
      ]);

      if (seoResponse.error) throw seoResponse.error;
      if (analyticsResponse.error) throw analyticsResponse.error;

      setSeoSettings((seoResponse.data || []) as SEOSetting[]);

      const analyticsRow = analyticsResponse.data as SiteSettingRow | null;
      const analyticsValue = (analyticsRow?.setting_value || {}) as Partial<GoogleAnalyticsSetting>;
      setGoogleAnalytics({
        ...DEFAULT_GOOGLE_ANALYTICS,
        ...analyticsValue,
        enabled: Boolean(analyticsValue.enabled ?? DEFAULT_GOOGLE_ANALYTICS.enabled),
        measurement_id: String(analyticsValue.measurement_id || DEFAULT_GOOGLE_ANALYTICS.measurement_id).trim(),
        stream_name: String(analyticsValue.stream_name || DEFAULT_GOOGLE_ANALYTICS.stream_name).trim(),
        stream_url: String(analyticsValue.stream_url || DEFAULT_GOOGLE_ANALYTICS.stream_url).trim(),
        stream_id: String(analyticsValue.stream_id || DEFAULT_GOOGLE_ANALYTICS.stream_id).trim(),
      });
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
      alert('載入 SEO 資料失敗。');
    } finally {
      setLoading(false);
    }
  };

  const saveSeoSetting = async () => {
    try {
      if (!seoForm.page_path.trim()) {
        alert('請輸入頁面路徑。');
        return;
      }
      if (!seoForm.title.trim()) {
        alert('請輸入標題。');
        return;
      }

      const payload = {
        page_path: seoForm.page_path.trim(),
        title: seoForm.title.trim(),
        description: seoForm.description.trim(),
        keywords: seoForm.keywords.trim(),
        og_image: seoForm.og_image.trim() || null,
        canonical_url: seoForm.canonical_url.trim() || null,
        robots: seoForm.robots.trim() || 'index, follow',
        schema_markup: seoForm.schema_markup,
      };

      if (editingSeo) {
        const { error } = await supabase.from('seo_settings').update(payload).eq('id', editingSeo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('seo_settings').insert([payload]);
        if (error) throw error;
      }

      await loadSeoSettings();
      closeForm();
      alert('SEO 設定已儲存。');
    } catch (error) {
      console.error('Failed to save SEO setting:', error);
      alert(`儲存 SEO 設定失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const saveGoogleAnalyticsSetting = async () => {
    if (!googleAnalytics.measurement_id.trim()) {
      alert('請輸入 GA4 Measurement ID。');
      return;
    }

    setSavingAnalytics(true);
    try {
      const { data: existingRow, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', GOOGLE_ANALYTICS_SETTING_KEY)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload: GoogleAnalyticsSetting = {
        enabled: Boolean(googleAnalytics.enabled),
        measurement_id: googleAnalytics.measurement_id.trim(),
        stream_name: googleAnalytics.stream_name.trim(),
        stream_url: googleAnalytics.stream_url.trim(),
        stream_id: googleAnalytics.stream_id.trim(),
      };

      if (existingRow?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: payload }).eq('id', existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([
          {
            setting_key: GOOGLE_ANALYTICS_SETTING_KEY,
            setting_value: payload,
          },
        ]);
        if (error) throw error;
      }

      await loadSeoSettings();
      alert('Google Analytics 設定已更新。');
    } catch (error) {
      console.error('Failed to save Google Analytics setting:', error);
      alert(`儲存 GA4 設定失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSavingAnalytics(false);
    }
  };

  const deleteSeoSetting = async (id: string) => {
    if (!confirm('確定要刪除這筆 SEO 設定嗎？')) return;

    try {
      const { error } = await supabase.from('seo_settings').delete().eq('id', id);
      if (error) throw error;
      await loadSeoSettings();
      alert('SEO 設定已刪除。');
    } catch (error) {
      console.error('Failed to delete SEO setting:', error);
      alert('刪除 SEO 設定失敗。');
    }
  };

  const openForm = (seo?: SEOSetting) => {
    if (seo) {
      setEditingSeo(seo);
      setSeoForm({
        page_path: seo.page_path,
        title: seo.title,
        description: seo.description || '',
        keywords: seo.keywords || '',
        og_image: seo.og_image || '',
        canonical_url: seo.canonical_url || '',
        robots: seo.robots || 'index, follow',
        schema_markup: seo.schema_markup || null,
      });
    } else {
      setEditingSeo(null);
      setSeoForm({
        page_path: '',
        title: '',
        description: '',
        keywords: '',
        og_image: '',
        canonical_url: '',
        robots: 'index, follow',
        schema_markup: null,
      });
    }

    setShowPreview(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSeo(null);
  };

  const filteredSettings = useMemo(
    () =>
      seoSettings.filter(
        (seo) =>
          seo.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seo.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, seoSettings]
  );

  if (loading) {
    return <div className="p-6">載入中...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SEO 管理</h1>
          <p className="mt-2 text-slate-600">集中管理頁面 SEO 與後台可切換的網站分析設定。</p>
        </div>
        <button
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          新增 SEO
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-700" />
            <h3 className="font-bold text-blue-900">SEO 建議</h3>
          </div>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>標題建議控制在 50-60 字元內。</li>
            <li>描述建議控制在 150-160 字元內。</li>
            <li>關鍵字請以品牌與主題為主。</li>
            <li>每個頁面都盡量有唯一的 canonical URL。</li>
          </ul>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-700" />
            <h3 className="font-bold text-green-900">Schema 說明</h3>
          </div>
          <ul className="space-y-1 text-sm text-green-800">
            <li>可直接儲存 JSON-LD 結構化資料。</li>
            <li>商品頁建議使用 Product schema。</li>
            <li>內容頁可使用 Article schema。</li>
            <li>品牌首頁可搭配 Organization / WebSite。</li>
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-700" />
            <h3 className="font-bold text-amber-900">OG 圖片</h3>
          </div>
          <ul className="space-y-1 text-sm text-amber-800">
            <li>建議尺寸：1200 x 630 px。</li>
            <li>圖片請保留品牌主視覺與主要產品。</li>
            <li>避免使用過於複雜或裁切過大的版面。</li>
            <li>盡量使用網站內可長期保留的圖片。</li>
          </ul>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-slate-700" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">網站分析 / GA4</h2>
            <p className="text-sm text-slate-600">集中管理 Google Analytics，之後只要在這裡改 ID 就能切換。</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            {googleAnalytics.enabled ? <ToggleRight className="h-6 w-6 text-emerald-600" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
            <div>
              <div className="font-medium text-slate-900">啟用 GA4</div>
              <div className="text-xs text-slate-500">關閉後前台就不會載入 Google tag。</div>
            </div>
            <input
              type="checkbox"
              className="ml-auto h-4 w-4"
              checked={googleAnalytics.enabled}
              onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, enabled: e.target.checked })}
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-1 text-sm font-medium text-slate-900">Measurement ID</div>
            <input
              type="text"
              value={googleAnalytics.measurement_id}
              onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, measurement_id: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-1 text-sm font-medium text-slate-900">串流名稱</div>
            <input
              type="text"
              value={googleAnalytics.stream_name}
              onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, stream_name: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="淞品土雞 - GA4"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-1 text-sm font-medium text-slate-900">串流網址</div>
            <input
              type="url"
              value={googleAnalytics.stream_url}
              onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, stream_url: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://www.sonpin.tw/"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-1 text-sm font-medium text-slate-900">串流 ID</div>
            <input
              type="text"
              value={googleAnalytics.stream_id}
              onChange={(e) => setGoogleAnalytics({ ...googleAnalytics, stream_id: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="5044756741"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">前台會優先讀取這組設定。若 Measurement ID 留空或關閉，GA 不會載入。</p>
          <button
            onClick={saveGoogleAnalyticsSetting}
            disabled={savingAnalytics}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingAnalytics ? '儲存中...' : '儲存 GA4 設定'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋頁面路徑或標題..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredSettings.length === 0 ? (
            <div className="p-12 text-center">
              <Globe className="mx-auto mb-4 h-16 w-16 text-slate-300" />
              <h3 className="mb-2 text-lg font-bold text-slate-900">尚未建立 SEO 設定</h3>
              <p className="mb-4 text-slate-600">{searchTerm ? '找不到符合的項目。' : '目前還沒有任何頁面 SEO 設定。'}</p>
              {!searchTerm && (
                <button
                  onClick={() => openForm()}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  建立第一筆 SEO
                </button>
              )}
            </div>
          ) : (
            filteredSettings.map((seo) => (
              <div key={seo.id} className="p-6 hover:bg-slate-50">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm text-slate-700">{seo.page_path}</span>
                      {seo.robots && (
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            seo.robots.includes('noindex') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {seo.robots}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">{seo.title}</h3>
                    {seo.description && <p className="mb-2 line-clamp-2 text-sm text-slate-600">{seo.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {seo.keywords && (
                        <span>
                          關鍵字: {seo.keywords}
                        </span>
                      )}
                      {seo.og_image && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          OG 圖片
                        </span>
                      )}
                      {seo.canonical_url && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Canonical URL
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openForm(seo)}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSeoSetting(seo.id)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 py-8">
          <div className="mx-4 w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900">{editingSeo ? '編輯 SEO 設定' : '新增 SEO 設定'}</h2>
              <button onClick={closeForm} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-16rem)] space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">頁面路徑 *</label>
                  <input
                    type="text"
                    value={seoForm.page_path}
                    onChange={(e) => setSeoForm({ ...seoForm, page_path: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                    placeholder="/about"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">標題 *</label>
                  <input
                    type="text"
                    value={seoForm.title}
                    onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="淞品土雞｜關於我們"
                    maxLength={60}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Meta 描述</label>
                  <textarea
                    value={seoForm.description}
                    onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    rows={3}
                    maxLength={160}
                    placeholder="簡短描述頁面內容"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">關鍵字</label>
                  <input
                    type="text"
                    value={seoForm.keywords}
                    onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="淞品土雞,品牌故事,土雞禮盒"
                  />
                </div>

                <div className="col-span-2">
                  <ImageUpload
                    value={seoForm.og_image}
                    onChange={(url) => setSeoForm({ ...seoForm, og_image: url })}
                    label="OG 圖片"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Canonical URL</label>
                  <input
                    type="url"
                    value={seoForm.canonical_url}
                    onChange={(e) => setSeoForm({ ...seoForm, canonical_url: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="https://sonpin.tw/about"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Robots</label>
                  <select
                    value={seoForm.robots}
                    onChange={(e) => setSeoForm({ ...seoForm, robots: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Schema.org JSON-LD</label>
                  <textarea
                    value={seoForm.schema_markup ? JSON.stringify(seoForm.schema_markup, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                        setSeoForm({ ...seoForm, schema_markup: parsed });
                      } catch {
                        // ignore invalid JSON while typing
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                    rows={6}
                    placeholder='{"@context":"https://schema.org","@type":"Product","name":"Product Name"}'
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                  <Eye className="h-4 w-4" />
                  {showPreview ? '隱藏預覽' : '顯示預覽'}
                </button>

                {showPreview && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <div className="max-w-2xl">
                      <div className="mb-1 text-xl text-blue-700 hover:underline">{seoForm.title || 'SEO 標題'}</div>
                      <div className="mb-1 text-sm text-green-700">https://sonpin.tw{seoForm.page_path || '/'}</div>
                      <div className="text-sm text-slate-600">{seoForm.description || '頁面描述預覽...'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-6">
              <button onClick={closeForm} className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100">
                取消
              </button>
              <button onClick={saveSeoSetting} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
                <Save className="h-4 w-4" />
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
