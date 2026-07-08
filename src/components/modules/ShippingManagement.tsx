import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { isMissingSupabaseTableError, supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShippingCategory {
  id: string;
  name: string;
  quantity: number;
  amount: number;
  is_active: boolean;
  created_at?: string | null;
}

const formatCurrency = (amount: number) => `NT$ ${Number(amount || 0).toLocaleString('zh-TW')}`;

const formatQuantityRange = (row: ShippingCategory, rows: ShippingCategory[]) => {
  const sameNameRows = rows
    .filter((item) => item.name === row.name && item.is_active)
    .sort((a, b) => a.quantity - b.quantity);
  const currentIndex = sameNameRows.findIndex((item) => item.id === row.id);
  const nextStart = sameNameRows[currentIndex + 1]?.quantity;
  const start = Math.max(1, Number(row.quantity || 1));

  if (Number.isFinite(nextStart)) {
    return `${start}-${Math.max(start, Number(nextStart) - 1)}`;
  }

  return `${start}+`;
};

export default function ShippingManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ShippingCategory[]>([]);
  const [editingRow, setEditingRow] = useState<ShippingCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    amount: 0,
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipping_categories')
        .select('id,name,quantity,amount,is_active,created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows((data || []) as ShippingCategory[]);
    } catch (error) {
      if (isMissingSupabaseTableError(error)) {
        setRows([]);
        return;
      }

      console.error('Failed to load shipping categories:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(
    () => ({
      activeCount: rows.filter((row) => row.is_active).length,
      totalCount: rows.length,
    }),
    [rows]
  );

  const openForm = (row?: ShippingCategory) => {
    if (row) {
      setEditingRow(row);
      setForm({
        name: row.name,
        quantity: row.quantity,
        amount: row.amount,
        is_active: row.is_active,
      });
    } else {
      setEditingRow(null);
      setForm({
        name: '',
        quantity: 1,
        amount: 0,
        is_active: true,
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRow(null);
  };

  const save = async () => {
    if (!form.name.trim()) {
      alert('請輸入運費分類名稱');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        quantity: Math.max(1, Number(form.quantity || 1)),
        amount: Math.max(0, Number(form.amount || 0)),
        is_active: form.is_active,
      };

      const query = editingRow
        ? supabase.from('shipping_categories').update(payload).eq('id', editingRow.id)
        : supabase.from('shipping_categories').insert(payload);

      const { error } = await query;
      if (error) throw error;

      await load();
      closeForm();
    } catch (error) {
      console.error('Failed to save shipping category:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('確定要刪除這個運費分類嗎？')) return;

    try {
      const { error } = await supabase.from('shipping_categories').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (error) {
      console.error('Failed to delete shipping category:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('shipping_management.title', '運費設定')}</h1>
          <p className="mt-2 text-slate-600">
            {t('shipping_management.subtitle', '建立商品運費分類，讓結帳時依商品自動計算運費。')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', '重新整理')}
          </button>
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t('shipping_management.add', '新增運費分類')}
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">{t('shipping_management.total_count', '分類總數')}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">{t('shipping_management.active_count', '啟用中')}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.activeCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900">{t('shipping_management.list_title', '運費分類列表')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t('shipping_management.column_name', '名稱')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t('shipping_management.column_quantity', '數量')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t('shipping_management.column_amount', '金額')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t('shipping_management.column_status', '狀態')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t('shipping_management.column_actions', '操作')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    {loading ? t('common.loading', '載入中...') : t('shipping_management.empty_state', '尚未建立運費分類')}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatQuantityRange(row, rows)}
                    <div className="text-xs text-slate-400">起點 {row.quantity}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(row.amount)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.is_active ? t('shipping_management.active', '啟用') : t('shipping_management.inactive', '停用')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openForm(row)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {t('common.edit', '編輯')}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('common.delete', '刪除')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingRow ? t('shipping_management.edit_title', '編輯運費分類') : t('shipping_management.add_title', '新增運費分類')}
              </h2>
              <button type="button" onClick={closeForm} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('shipping_management.form_name', '名稱')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder={t('shipping_management.form_name_placeholder', '例如：常溫宅配')}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('shipping_management.form_quantity', '數量')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    請輸入級距起點，例如 1、4、7、10，系統會自動顯示成 1-3、4-6、7-9、10+。
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('shipping_management.form_amount', '金額')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                {t('shipping_management.form_active', '啟用')}
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100"
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? t('common.saving', '儲存中...') : t('common.save', '儲存')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
