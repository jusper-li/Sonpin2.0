import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Database,
  GripVertical,
  LayoutGrid as Layout,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import ImageUpload from '../ImageUpload';
import { isSupabaseContentEnabled, supabase } from '../../lib/supabase';
import { toHomepageManagementSections } from '../../data/homepageContent';
import {
  createDefaultHomepageHeroBlocks,
  HOMEPAGE_HERO_BLOCKS_SETTING_KEY,
  HomepageHeroBlock,
  HomepageHeroProduct,
  mergeHomepageHeroProducts,
  normalizeHomepageHeroBlocks,
  resolveHomepageHeroBlock,
} from '../../data/homepageHeroBlocks';
import { useLanguage } from '../../contexts/LanguageContext';

type HomepageSection = {
  id: string;
  section_type: string;
  title: string;
  content: any;
  sort_order: number;
  is_active: boolean;
};

type SettingsRow = {
  setting_key: string;
  setting_value: any;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  images?: string[] | null;
  is_active?: boolean | null;
};

type HeroBlockFormState = {
  id: string;
  mode: 'product' | 'custom';
  product_id: string;
  product_slug: string;
  title: string;
  image: string;
  href: string;
  is_active: boolean;
  sort_order: number;
};

const HERO_BLOCKS_CACHE_KEY = 'ym_homepage_hero_blocks_cache_v1';

const EMPTY_FORM: HeroBlockFormState = {
  id: '',
  mode: 'product',
  product_id: '',
  product_slug: '',
  title: '',
  image: '',
  href: '',
  is_active: true,
  sort_order: 1,
};

function reorderBlocks(blocks: HomepageHeroBlock[], draggedId: string, targetId: string) {
  const fromIndex = blocks.findIndex((block) => block.id === draggedId);
  const toIndex = blocks.findIndex((block) => block.id === targetId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return blocks;
  }

  const next = [...blocks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  return next.map((block, index) => ({
    ...block,
    sort_order: index + 1,
  }));
}

export default function HomepageManagement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'heroBlocks' | 'sections'>('heroBlocks');
  const [loading, setLoading] = useState(true);
  const [isLocalContent, setIsLocalContent] = useState(false);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroBlocks, setHeroBlocks] = useState<HomepageHeroBlock[]>([]);
  const [heroProducts, setHeroProducts] = useState<HomepageHeroProduct[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<HomepageHeroBlock | null>(null);
  const [form, setForm] = useState<HeroBlockFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    if (!isSupabaseContentEnabled) {
      loadLocalContent();
      setLoading(false);
      return;
    }

    try {
      const [sectionsRes, heroBlocksRes, productsRes] = await Promise.all([
        supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('site_settings')
          .select('*')
          .eq('setting_key', HOMEPAGE_HERO_BLOCKS_SETTING_KEY),
        supabase
          .from('products')
          .select('id,name,slug,summary,images,is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (sectionsRes.error || heroBlocksRes.error || productsRes.error) {
        loadLocalContent();
        return;
      }

      const sectionRows = (sectionsRes.data || []) as HomepageSection[];
      const settingRows = (heroBlocksRes.data || []) as SettingsRow[];
      const heroBlocksRow = settingRows.find((row) => row.setting_key === HOMEPAGE_HERO_BLOCKS_SETTING_KEY);
      const productRows = (productsRes.data || []) as ProductRow[];

      setSections(sectionRows);
      setHeroProducts(mergeHomepageHeroProducts(productRows));
      setHeroBlocks(normalizeHomepageHeroBlocks(heroBlocksRow?.setting_value));
      setIsLocalContent(false);
    } catch (error) {
      console.error('Failed to load homepage management data:', error);
      loadLocalContent();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalContent = () => {
    const products = mergeHomepageHeroProducts();
    setSections(toHomepageManagementSections());
    setHeroProducts(products);
    setHeroBlocks(createDefaultHomepageHeroBlocks(products));
    setIsLocalContent(true);
  };

  const heroSourceProducts = useMemo(
    () => (heroProducts.length ? heroProducts : mergeHomepageHeroProducts()),
    [heroProducts],
  );

  const resolvedHeroBlocks = useMemo(() => {
    const configuredBlocks = heroBlocks.length ? heroBlocks : createDefaultHomepageHeroBlocks(heroSourceProducts);

    return configuredBlocks
      .filter((block) => block.is_active !== false)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((block) => {
        const resolved = resolveHomepageHeroBlock(block, heroSourceProducts);
        return resolved ? { ...resolved, mode: block.mode, product_id: block.product_id, product_slug: block.product_slug } : null;
      })
      .filter((block): block is NonNullable<typeof block> => Boolean(block));
  }, [heroBlocks, heroSourceProducts]);

  const localNotice = useMemo(
    () =>
      t(
        'homepage_management.local_notice',
        '目前顯示的是本地首頁內容示意。若要正式同步，請確認 Supabase 的 homepage_sections、site_settings 與 products 已啟用並可讀取。',
      ),
    [t],
  );

  const persistHeroBlocks = async (nextBlocks: HomepageHeroBlock[], message?: string) => {
    const normalized = normalizeHomepageHeroBlocks(nextBlocks);

    if (isSupabaseContentEnabled) {
      const { data: existingRow, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', HOMEPAGE_HERO_BLOCKS_SETTING_KEY)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRow?.id) {
        const { error } = await supabase.from('site_settings').update({ setting_value: normalized }).eq('id', existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([
          {
            setting_key: HOMEPAGE_HERO_BLOCKS_SETTING_KEY,
            setting_value: normalized,
          },
        ]);
        if (error) throw error;
      }
    } else {
      localStorage.setItem(HERO_BLOCKS_CACHE_KEY, JSON.stringify(normalized));
    }

    setHeroBlocks(normalized);
    if (message) alert(message);
    return normalized;
  };

  const openCreateForm = () => {
    const nextOrder = heroBlocks.length ? Math.max(...heroBlocks.map((block) => Number(block.sort_order || 0))) + 1 : 1;
    setEditingBlock(null);
    setForm({
      ...EMPTY_FORM,
      sort_order: nextOrder,
      id: `hero-${Date.now()}`,
    });
    setIsEditorOpen(true);
  };

  const openEditForm = (block: HomepageHeroBlock) => {
    setEditingBlock(block);
    setForm({
      id: block.id,
      mode: block.mode,
      product_id: block.product_id || '',
      product_slug: block.product_slug || '',
      title: block.title || '',
      image: block.image || '',
      href: block.href || '',
      is_active: block.is_active !== false,
      sort_order: Number(block.sort_order || 1),
    });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setIsEditorOpen(false);
    setEditingBlock(null);
    setForm(EMPTY_FORM);
  };

  const handleProductSelect = (productId: string) => {
    const selected = heroSourceProducts.find((product) => product.id === productId);
    if (!selected) {
      setForm((current) => ({ ...current, product_id: '', product_slug: '' }));
      return;
    }

    const nextImage = selected.images?.[0] || '';
    setForm((current) => ({
      ...current,
      mode: 'product',
      product_id: selected.id,
      product_slug: selected.slug,
      title: selected.name,
      image: current.image || nextImage,
      href: `/product/${selected.slug}`,
    }));
  };

  const saveHeroBlock = async () => {
    if (!form.title.trim()) {
      alert('請輸入首頁商品標題。');
      return;
    }
    if (!form.image.trim()) {
      alert('請上傳或輸入圖片網址。');
      return;
    }
    if (!form.href.trim()) {
      alert('請輸入連結網址。');
      return;
    }

    const nextBlock: HomepageHeroBlock = {
      id: form.id || `hero-${Date.now()}`,
      mode: form.mode,
      product_id: form.mode === 'product' ? form.product_id || undefined : undefined,
      product_slug: form.mode === 'product' ? form.product_slug || undefined : undefined,
      title: form.title.trim(),
      image: form.image.trim(),
      href: form.href.trim(),
      is_active: form.is_active,
      sort_order: Number(form.sort_order || 1),
    };

    const nextBlocks = [...heroBlocks];
    const existingIndex = nextBlocks.findIndex((block) => block.id === nextBlock.id);
    if (existingIndex >= 0) {
      nextBlocks[existingIndex] = nextBlock;
    } else {
      nextBlocks.push(nextBlock);
    }

    setSaving(true);
    try {
      await persistHeroBlocks(nextBlocks, '首頁商品已儲存。');
      closeEditor();
    } catch (error) {
      console.error('Failed to save homepage hero block:', error);
      alert(`儲存首頁商品失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteHeroBlock = async (id: string) => {
    if (!confirm('確定要刪除這個首頁商品嗎？')) return;

    setSaving(true);
    try {
      await persistHeroBlocks(
        heroBlocks.filter((block) => block.id !== id),
        '首頁商品已刪除。',
      );
    } catch (error) {
      console.error('Failed to delete homepage hero block:', error);
      alert(`刪除首頁商品失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const moveHeroBlock = async (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;

    const nextBlocks = reorderBlocks(heroBlocks, draggedId, targetId);
    if (nextBlocks === heroBlocks) return;

    try {
      await persistHeroBlocks(nextBlocks);
    } catch (error) {
      console.error('Failed to reorder homepage hero blocks:', error);
      alert(`排序更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const handleDropToBlankArea = async () => {
    if (!draggedBlockId) return;

    const draggedIndex = heroBlocks.findIndex((block) => block.id === draggedBlockId);
    if (draggedIndex < 0) return;

    const nextBlocks = [...heroBlocks];
    const [moved] = nextBlocks.splice(draggedIndex, 1);
    nextBlocks.push(moved);

    try {
      await persistHeroBlocks(
        nextBlocks.map((block, index) => ({ ...block, sort_order: index + 1 })),
        '首頁商品排序已更新。',
      );
    } catch (error) {
      console.error('Failed to move homepage hero block to end:', error);
      alert(`排序更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const startDrag = (blockId: string) => {
    setDraggedBlockId(blockId);
  };

  const endDrag = () => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  if (loading) {
    return <div className="p-6">{t('common.loading', '載入中...')}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">{t('homepage_management.title', '首頁管理')}</h1>
        <p className="text-slate-600">{t('homepage_management.subtitle', '管理首頁、頁首與頁尾內容')}</p>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <div className="flex flex-wrap gap-6">
          <TabButton active={activeTab === 'sections'} icon={Layout} label={t('homepage_management.tab_sections', '首頁區塊')} onClick={() => setActiveTab('sections')} />
          <TabButton active={activeTab === 'heroBlocks'} icon={Package} label={t('homepage_management.tab_hero_products', '首頁商品')} onClick={() => setActiveTab('heroBlocks')} />
        </div>
      </div>

      {isLocalContent && (
        <div className="mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Database className="mt-0.5 h-5 w-5 flex-none" />
          <div>
            <div className="font-semibold">{t('homepage_management.local_title', '本地示意內容')}</div>
            <p className="mt-1 text-amber-800">{localNotice}</p>
          </div>
        </div>
      )}

      {activeTab === 'heroBlocks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              共 {heroBlocks.length} 個首頁商品，啟用中 {heroBlocks.filter((item) => item.is_active !== false).length} 個
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                重新整理
              </button>
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                新增首頁商品
              </button>
            </div>
          </div>

          {heroBlocks.length === 0 ? (
            <EmptyState text={t('homepage_management.empty_hero_blocks', '尚未建立首頁商品。')} />
          ) : (
            <div
              className="space-y-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={async () => {
                await handleDropToBlankArea();
              }}
            >
              {heroBlocks
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((block, index) => {
                  const resolved = resolveHomepageHeroBlock(block, heroSourceProducts);
                  const isDropTarget = dragOverBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => startDrag(block.id)}
                      onDragEnd={endDrag}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (draggedBlockId && draggedBlockId !== block.id) {
                          setDragOverBlockId(block.id);
                        }
                      }}
                      onDrop={async (event) => {
                        event.preventDefault();
                        if (draggedBlockId) {
                          await moveHeroBlock(draggedBlockId, block.id);
                        }
                        endDrag();
                      }}
                      className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${
                        isDropTarget ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                      } ${draggedBlockId === block.id ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          {resolved?.image ? (
                            <img src={resolved.image} alt={resolved.title} className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            <span className="text-xs">無圖片</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <button
                                  type="button"
                                  className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                                  onMouseDown={() => startDrag(block.id)}
                                  aria-label="拖曳排序"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                                <span>區塊 {index + 1} ｜ 排序 {block.sort_order}</span>
                              </div>
                              <div className="mt-1 truncate text-lg font-semibold text-slate-900">
                                {resolved?.title || block.title || '未命名首頁商品'}
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {resolved?.href || block.href || '尚未設定連結'}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {block.mode === 'product'
                                  ? `商品模式${block.product_slug ? ` ｜ ${block.product_slug}` : ''}`
                                  : '自訂模式'}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  block.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {block.is_active !== false ? '顯示中' : '已隱藏'}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(block)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                  編輯
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteHeroBlock(block.id)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  刪除
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.length === 0 ? (
            <EmptyState text={t('homepage_management.empty_sections', '尚未建立首頁區塊。')} />
          ) : (
            sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-slate-500">{section.section_type}</div>
                <div className="mt-1 font-semibold text-slate-900">{section.title}</div>
                <div className="mt-2 text-sm text-slate-600">{section.is_active ? t('common.active', '顯示中') : t('common.hidden', '已隱藏')}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">共同頁首頁尾設定</div>
        <p className="mt-1">
          頁首、頁尾內容已統一到「共同頁首頁尾」管理。要調整 Logo、導覽、聯絡資訊或頁尾連結，請到那個頁面修改。
        </p>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingBlock ? '編輯首頁商品' : '新增首頁商品'}</h2>
                <p className="text-sm text-slate-500">可建立商品模式或自訂模式的首頁輪播區塊。</p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="模式">
                  <select
                    value={form.mode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mode: event.target.value === 'custom' ? 'custom' : 'product',
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  >
                    <option value="product">商品模式</option>
                    <option value="custom">自訂模式</option>
                  </select>
                </Field>

                <Field label="排序">
                  <input
                    type="number"
                    min={1}
                    value={form.sort_order}
                    onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value || 1) }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  />
                </Field>
              </div>

              {form.mode === 'product' && (
                <Field label="選擇商品">
                  <select
                    value={form.product_id}
                    onChange={(event) => handleProductSelect(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                  >
                    <option value="">請選擇商品</option>
                    {heroSourceProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="標題">
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                />
              </Field>

              <Field label="圖片">
                <ImageUpload
                  value={form.image}
                  onChange={(url) => setForm((current) => ({ ...current, image: url }))}
                  label="上傳或更換圖片"
                />
              </Field>

              <Field label="連結網址">
                <input
                  type="text"
                  value={form.href}
                  onChange={(event) => setForm((current) => ({ ...current, href: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                顯示於首頁
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <div className="text-sm text-slate-500">
                {editingBlock ? `正在編輯：${editingBlock.id}` : '新增後會立即更新首頁輪播。'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveHeroBlock}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? '儲存中...' : '儲存首頁商品'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-2 pb-3 transition-colors ${
        active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
      {text}
    </div>
  );
}
