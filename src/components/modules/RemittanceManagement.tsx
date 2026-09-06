import { useEffect, useMemo, useState } from 'react';
import { Check, CreditCard, RefreshCw, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

type RemittanceStatus = 'pending' | 'confirmed' | 'rejected';

type RemittanceRow = {
  id: string;
  order_number: string;
  remittance_amount: number;
  remitter_account_last5: string;
  status: RemittanceStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const statusLabel: Record<RemittanceStatus, string> = {
  pending: '待確認',
  confirmed: '已確認',
  rejected: '已退回',
};

const statusStyle: Record<RemittanceStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const formatCurrency = (value: number) => `NT$ ${Number(value || 0).toLocaleString('zh-TW')}`;

export default function RemittanceManagement() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<RemittanceRow[]>([]);
  const [selected, setSelected] = useState<RemittanceRow | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('remittance_notifications')
      .select('id,order_number,remittance_amount,remitter_account_last5,status,admin_note,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('Failed to load remittance notifications:', error);
      setRows([]);
    } else {
      setRows((data || []) as RemittanceRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => `${row.order_number} ${row.remitter_account_last5} ${row.status} ${row.admin_note || ''}`.toLowerCase().includes(keyword));
  }, [rows, search]);

  const saveStatus = async (status: RemittanceStatus, adminNote: string) => {
    if (!selected) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('remittance_notifications')
      .update({ status, admin_note: adminNote.trim(), updated_at: new Date().toISOString() })
      .eq('id', selected.id)
      .select('id,order_number,remittance_amount,remitter_account_last5,status,admin_note,created_at,updated_at')
      .single();
    if (error) {
      alert(`${t('remittance_management.save_failed', '儲存失敗')}: ${error.message}`);
    } else {
      const updated = data as RemittanceRow;
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSelected(updated);
    }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-700">
            <CreditCard className="h-3.5 w-3.5" /> REMITTANCE NOTICE
          </div>
          <h1 className="text-3xl font-bold text-slate-900">匯款通知管理</h1>
          <p className="mt-2 text-slate-600">管理顧客送出的匯款通知、確認狀態與處理備註。</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 重新整理
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋訂單編號、帳號後五碼或狀態" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">訂單編號</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">匯款金額</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">帳號後五碼</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">狀態</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">送出時間</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">內容</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">{loading ? '載入中...' : '目前沒有匯款通知紀錄'}</td></tr>
              ) : filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-sm text-slate-900">{row.order_number}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{formatCurrency(row.remittance_amount)}</td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-600">{row.remitter_account_last5}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[row.status]}`}>{statusLabel[row.status]}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{new Date(row.created_at).toLocaleString('zh-TW')}</td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelected(row)} className="text-sm font-medium text-amber-700 hover:text-amber-900">查看內容</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setSelected(null)}>
          <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-slate-900">匯款通知內容</h2><p className="mt-1 font-mono text-sm text-slate-500">{selected.order_number}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-slate-500">匯款金額</span><strong>{formatCurrency(selected.remittance_amount)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">帳號後五碼</span><strong>{selected.remitter_account_last5}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">送出時間</span><span>{new Date(selected.created_at).toLocaleString('zh-TW')}</span></div>
            </div>
            <label className="mt-5 block text-sm font-medium text-slate-700">處理備註<textarea defaultValue={selected.admin_note || ''} id="remittance-admin-note" rows={4} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="輸入核對結果或備註" /></label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => void saveStatus('rejected', (document.getElementById('remittance-admin-note') as HTMLTextAreaElement)?.value || '')} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"><X className="h-4 w-4" />退回</button>
              <button type="button" disabled={saving} onClick={() => void saveStatus('confirmed', (document.getElementById('remittance-admin-note') as HTMLTextAreaElement)?.value || '')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"><Check className="h-4 w-4" />確認匯款</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
