import { isMissingSupabaseTableError, isSupabaseContentEnabled, isSupabaseNetworkError, supabase } from './supabase';

export const BATCH_DOCUMENTS_BUCKET = 'batch-documents';

export interface BatchDocument {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface BatchDocumentRow {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  description: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at?: string;
  updated_at?: string;
}

const normalizeBatchDocument = (row: BatchDocumentRow): BatchDocument => ({
  id: row.id,
  title: row.title || row.file_name,
  file_name: row.file_name || row.title,
  file_url: row.file_url,
  storage_path: row.storage_path,
  description: row.description || '',
  is_active: row.is_active !== false,
  sort_order: Number.isFinite(row.sort_order) ? Number(row.sort_order) : 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const loadBatchDocuments = async (options: { publishedOnly?: boolean } = {}) => {
  const publishedOnly = options.publishedOnly ?? true;

  if (!isSupabaseContentEnabled) {
    return [] as BatchDocument[];
  }

  try {
    let query = supabase
      .from('batch_documents')
      .select('id,title,file_name,file_url,storage_path,description,is_active,sort_order,created_at,updated_at');

    if (publishedOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('sort_order', { ascending: true }).order('updated_at', { ascending: false });
    if (error) throw error;

    return ((data || []) as BatchDocumentRow[]).map(normalizeBatchDocument);
  } catch (error) {
    if (isMissingSupabaseTableError(error) || isSupabaseNetworkError(error)) return [];
    console.error('Failed to load batch documents:', error);
    return [];
  }
};
