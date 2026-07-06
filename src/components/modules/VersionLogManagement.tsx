import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock3, RefreshCw, Search, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { confirmAdminAuditLog, recordAdminAuditEvent } from '../../lib/adminAudit';
import { isMissingSupabaseTableError, supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

type AuditLogRow = {
  id: string;
  admin_id: string | null;
  action: string;
  entity_table: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
};

type AdminRow = {
  id: string;
  name: string;
  email: string;
};

const ACTION_LABELS: Record<string, string> = {
  check: '檢查',
  insert: '新增',
  update: '修改',
  delete: '刪除',
  confirm: '確認',
};

export default function VersionLogManagement() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [adminMap, setAdminMap] = useState<Record<string, AdminRow>>({});
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('id,admin_id,action,entity_table,entity_id,metadata,is_confirmed,confirmed_at,confirmed_by,created_at')
        .order('created_at', { ascending: false })
        .limit(150);

      if (error) throw error;

      const rows = (data || []) as AuditLogRow[];
      setLogs(rows);

      const adminIds = new Set<string>();
      rows.forEach((row) => {
        if (row.admin_id) adminIds.add(row.admin_id);
        if (row.confirmed_by) adminIds.add(row.confirmed_by);
      });

      if (adminIds.size > 0) {
        const { data: admins, error: adminError } = await supabase
          .from('admins')
          .select('id,name,email')
          .in('id', Array.from(adminIds));

        if (adminError) throw adminError;

        const nextMap = (admins || []).reduce<Record<string, AdminRow>>((acc, row) => {
          acc[row.id] = row as AdminRow;
          return acc;
        }, {});
        setAdminMap(nextMap);
      } else {
        setAdminMap({});
      }
    } catch (err) {
      console.error('Failed to load version logs:', err);
      const message = err instanceof Error ? err.message : t('common.error', '載入失敗');
      setError(message);
      if (isMissingSupabaseTableError(err)) {
        setLogs([]);
        setAdminMap({});
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadLogs();
    void recordAdminAuditEvent({
      action: 'check',
      entityTable: 'backoffice_module',
      entityId: 'version-logs',
      metadata: { module: 'version-logs', source: 'module-open' },
    });
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      const adminLabel = adminMap[log.admin_id || '']?.name || adminMap[log.admin_id || '']?.email || '';
      const confirmerLabel = adminMap[log.confirmed_by || '']?.name || adminMap[log.confirmed_by || '']?.email || '';
      return [
        log.action,
        log.entity_table,
        log.entity_id,
        adminLabel,
        confirmerLabel,
        JSON.stringify(log.metadata || {}),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [adminMap, logs, searchTerm]);

  const summary = useMemo(() => {
    const total = logs.length;
    const pending = logs.filter((item) => !item.is_confirmed).length;
    const checks = logs.filter((item) => item.action === 'check').length;
    const changes = logs.filter((item) => ['insert', 'update', 'delete'].includes(item.action)).length;
    return { total, pending, checks, changes };
  }, [logs]);

  const handleConfirm = async (logId: string) => {
    setSaving(true);
    try {
      const ok = await confirmAdminAuditLog(logId);
      if (!ok) {
        alert('確認失敗，請稍後再試。');
        return;
      }
      await loadLogs();
    } catch (error) {
      console.error('Failed to confirm audit log:', error);
      alert(error instanceof Error ? error.message : '確認失敗');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));

  const adminLabel = (adminId: string | null) => {
    if (!adminId) return '系統';
    const admin = adminMap[adminId];
    return admin ? `${admin.name} (${admin.email})` : adminId;
  };

  if (loading) {
    return <div className="p-6 text-slate-500">載入版本紀錄中...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <Sparkles className="h-3.5 w-3.5" />
            版本檢查與修改紀錄
          </div>
          <h1 className="text-3xl font-bold text-slate-900">版本紀錄</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            後台每次切換模組都會自動記錄檢查紀錄，資料變動會由資料庫觸發器自動寫入，並可在這裡逐筆確認完成。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Tag className="h-4 w-4" />
            總紀錄
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Clock3 className="h-4 w-4" />
            待確認
          </div>
          <div className="text-2xl font-bold text-amber-600">{summary.pending}</div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <BadgeCheck className="h-4 w-4" />
            檢查次數
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.checks}</div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            修改次數
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.changes}</div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋模組、表格、管理員或備註"
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="mb-2 text-lg font-semibold text-slate-900">目前沒有版本紀錄</p>
            <p>完成一次後台檢查或修改後，這裡會自動出現紀錄。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">事件</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">目標</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">管理員</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">時間</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">確認</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{ACTION_LABELS[log.action] || log.action}</div>
                      <div className="text-xs text-slate-500">{log.action}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-slate-900">{log.entity_table}</div>
                      <div className="text-xs text-slate-500">{log.entity_id || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{adminLabel(log.admin_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${log.is_confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {log.is_confirmed ? '已確認完成' : '待確認'}
                        </span>
                        {log.confirmed_at && <span className="text-xs text-slate-500">確認時間：{formatDateTime(log.confirmed_at)}</span>}
                        {log.confirmed_by && <span className="text-xs text-slate-500">確認人：{adminLabel(log.confirmed_by)}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!log.is_confirmed && (
                        <button
                          type="button"
                          onClick={() => void handleConfirm(log.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          確認完成
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
