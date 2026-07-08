import { Fragment, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { isMissingSupabaseTableError, supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShippingCategory {
  id: string;
  name: string;
  quantity: number;
  quantity_to: number | null;
  amount: number;
  is_active: boolean;
  created_at?: string | null;
}

interface ShippingFormRow {
  id?: string;
  name: string;
  quantity: number;
  quantity_to: number | null;
  amount: number;
  is_active: boolean;
}

interface ShippingCategoryGroup {
  name: string;
  rows: ShippingCategory[];
}

const formatCurrency = (amount: number) => `NT$ ${Number(amount || 0).toLocaleString('zh-TW')}`;

const formatRange = (row: ShippingCategory) => {
  const start = Math.max(1, Number(row.quantity || 1));
  const end = row.quantity_to === null ? null : Math.max(start, Number(row.quantity_to || 0));
  return end === null ? `${start}+` : `${start}-${end}`;
};

const createEmptyRow = (): ShippingFormRow => ({
  name: '',
  quantity: 1,
  quantity_to: null,
  amount: 0,
  is_active: true,
});

const groupShippingCategories = (rows: ShippingCategory[]) => {
  const groups = new Map<string, ShippingCategory[]>();

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;

    const existing = groups.get(name) || [];
    existing.push(row);
    existing.sort((a, b) => {
      const quantityA = Number(a.quantity || 0);
      const quantityB = Number(b.quantity || 0);
      if (quantityA !== quantityB) return quantityA - quantityB;
      const endA = a.quantity_to === null ? Number.MAX_SAFE_INTEGER : Number(a.quantity_to || 0);
      const endB = b.quantity_to === null ? Number.MAX_SAFE_INTEGER : Number(b.quantity_to || 0);
      return endA - endB;
    });
    groups.set(name, existing);
  }

  return Array.from(groups.entries())
    .map(([name, groupRows]) => ({ name, rows: groupRows }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
};

export default function ShippingManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ShippingCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSingle, setEditingSingle] = useState<ShippingCategory | null>(null);
  const [formRows, setFormRows] = useState<ShippingFormRow[]>([createEmptyRow()]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipping_categories')
        .select('id,name,quantity,quantity_to,amount,is_active,created_at')
        .order('name', { ascending: true })
        .order('quantity', { ascending: true });

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

  const groupedRows = useMemo(() => groupShippingCategories(rows), [rows]);

  const openForm = (target?: ShippingCategory | ShippingCategory[]) => {
    if (Array.isArray(target) && target.length > 0) {
      setEditingSingle(target[0] || null);
      setFormRows(
        target.map((row) => ({
          id: row.id,
          name: row.name,
          quantity: row.quantity,
          quantity_to: row.quantity_to,
          amount: row.amount,
          is_active: row.is_active,
        }))
      );
    } else if (target) {
      setEditingSingle(target);
      setFormRows([
        {
          id: target.id,
          name: target.name,
          quantity: target.quantity,
          quantity_to: target.quantity_to,
          amount: target.amount,
          is_active: target.is_active,
        },
      ]);
    } else {
      setEditingSingle(null);
      setFormRows([createEmptyRow()]);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSingle(null);
    setFormRows([createEmptyRow()]);
  };

  const updateFormRow = (index: number, field: keyof ShippingFormRow, value: string | number | boolean | null) => {
    setFormRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const addFormRow = () => {
    setFormRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeFormRow = (index: number) => {
    setFormRows((prev) => (prev.length > 1 ? prev.filter((_, rowIndex) => rowIndex !== index) : prev));
  };

  const normalizePayload = (row: ShippingFormRow) => {
    const start = Math.max(1, Number(row.quantity || 1));
    const end =
      row.quantity_to === null || row.quantity_to === undefined || row.quantity_to === 0
        ? null
        : Math.max(start, Number(row.quantity_to || 0));

    return {
      name: row.name.trim(),
      quantity: start,
      quantity_to: end,
      amount: Math.max(0, Number(row.amount || 0)),
      is_active: row.is_active,
    };
  };

  const save = async () => {
    const validRows = formRows.filter((row) => row.name.trim());
    if (validRows.length === 0) {
      alert('請至少輸入一筆運費分類');
      return;
    }

    setSaving(true);
    try {
      if (editingSingle) {
        for (const row of validRows) {
          const payload = normalizePayload(row);
          if (row.id) {
            const { error } = await supabase.from('shipping_categories').update(payload).eq('id', row.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('shipping_categories').insert(payload);
            if (error) throw error;
          }
        }
      } else {
        const payload = validRows.map(normalizePayload);
        const { error } = await supabase.from('shipping_categories').insert(payload);
        if (error) throw error;
      }

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

  const removeGroup = async (groupName: string) => {
    if (!confirm(`確定要刪除「${groupName}」這個運費設定底下的所有級距嗎？`)) return;

    try {
      const { error } = await supabase.from('shipping_categories').delete().eq('name', groupName);
      if (error) throw error;
      await load();
    } catch (error) {
      console.error('Failed to delete shipping category group:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('shipping_management.title', '?祥閮剖?')}</h1>
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
            {t('common.refresh', '??渡?')}
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
          <div className="text-sm text-slate-500">{t('shipping_management.total_count', '??蝮賣')}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">{t('shipping_management.active_count', '啟用中')}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{stats.activeCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900">{t('shipping_management.list_title', '?祥???”')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">級距</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">金額</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    {loading ? t('common.loading', '載入中...') : t('shipping_management.empty_state', '目前沒有運費設定')}
                  </td>
                </tr>
              )}
              {groupedRows.map((group) => (
                <Fragment key={group.name}>
                  <tr className="bg-slate-100">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{group.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            共 {group.rows.length} 個級距，商品會歸到同一個設定下
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openForm(group.rows)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {t('common.edit', '編輯')}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGroup(group.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('common.delete', '刪除')}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatRange(row)}
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
                        <button
                          type="button"
                          onClick={() => openForm(row)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {t('common.edit', '編輯')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingSingle ? '編輯運費設定' : '新增運費設定'}
              </h2>
              <button type="button" onClick={closeForm} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addFormRow}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  新增級距列
                </button>
              </div>

              {formRows.map((row, index) => (
                <div key={row.id ?? index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{editingSingle ? '運費設定' : `級距 ${index + 1}`}</div>
                    {formRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFormRow(index)}
                        className="text-sm text-rose-600 hover:text-rose-700"
                      >
                        刪除這列
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">名稱</label>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateFormRow(index, 'name', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="輸入名稱，例如常溫宅配"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">起點</label>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateFormRow(index, 'quantity', Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">終點</label>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity_to ?? ''}
                          onChange={(e) =>
                            updateFormRow(index, 'quantity_to', e.target.value === '' ? null : Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          placeholder="留空代表無上限"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">金額</label>
                      <input
                        type="number"
                        min={0}
                        value={row.amount}
                        onChange={(e) => updateFormRow(index, 'amount', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => updateFormRow(index, 'is_active', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      啟用
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


