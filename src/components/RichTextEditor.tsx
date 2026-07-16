import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Type,
  Underline,
  Upload,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface RichTextEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  minHeightClassName?: string;
  placeholder?: string;
}

type Command =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull';

const FONT_SIZE_OPTIONS = [
  { label: '12px', value: '2' },
  { label: '14px', value: '3' },
  { label: '16px', value: '4' },
  { label: '18px', value: '5' },
  { label: '22px', value: '6' },
];

export default function RichTextEditor({
  value,
  onChange,
  minHeightClassName = 'min-h-[280px]',
  placeholder,
}: RichTextEditorProps) {
  const { t } = useLanguage();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [assetMode, setAssetMode] = useState<'link' | 'image' | null>(null);
  const [assetUrl, setAssetUrl] = useState('');
  const [fontSize, setFontSize] = useState('4');
  const [uploadingImage, setUploadingImage] = useState(false);

  const resolvedPlaceholder = placeholder || t('rich_text_editor.placeholder', '請輸入內容...');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || htmlMode) return;
    if (editor.innerHTML !== value) editor.innerHTML = value || '';
  }, [value, htmlMode]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const syncEditor = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  const runCommand = (command: Command) => {
    focusEditor();
    document.execCommand(command);
    syncEditor();
  };

  const insertAsset = (mode: 'link' | 'image') => {
    setAssetMode(mode);
    setAssetUrl('');
  };

  const confirmAssetInsert = () => {
    if (!assetMode) return;
    const url = assetUrl.trim();
    if (!url) return;

    focusEditor();
    document.execCommand(assetMode === 'link' ? 'createLink' : 'insertImage', false, url);
    syncEditor();

    setAssetMode(null);
    setAssetUrl('');
  };

  const uploadAndInsertImage = () => {
    setAssetMode(null);
    setAssetUrl('');
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('image_upload.invalid_file', '請選擇圖片檔案。'));
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('homepage-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('homepage-images').getPublicUrl(fileName);
      if (!data?.publicUrl) throw new Error('無法取得圖片網址');

      focusEditor();
      document.execCommand('insertImage', false, data.publicUrl);
      syncEditor();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert(t('image_upload.upload_failed', '圖片上傳失敗，請稍後再試。'));
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const clearFormat = () => {
    focusEditor();
    document.execCommand('removeFormat');
    syncEditor();
  };

  const applyFontSize = (nextSize: string) => {
    setFontSize(nextSize);
    focusEditor();
    document.execCommand('fontSize', false, nextSize);
    syncEditor();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <button type="button" onClick={() => runCommand('bold')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.bold', '粗體')}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('italic')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.italic', '斜體')}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('underline')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.underline', '底線')}>
          <Underline className="h-4 w-4" />
        </button>
        <button type="button" onClick={clearFormat} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.clear_format', '清除格式')}>
          <Type className="h-4 w-4" />
        </button>

        <select
          value={fontSize}
          onChange={(event) => applyFontSize(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs"
          title={t('rich_text_editor.font_size', '字級')}
        >
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => runCommand('insertUnorderedList')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.bullet_list', '項目符號清單')}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('insertOrderedList')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.number_list', '編號清單')}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('justifyLeft')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.align_left', '靠左')}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('justifyCenter')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.align_center', '置中')}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('justifyRight')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.align_right', '靠右')}>
          <AlignRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand('justifyFull')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.align_justify', '左右對齊')}>
          <AlignJustify className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => insertAsset('link')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.insert_link', '插入連結')}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => insertAsset('image')} className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100" title={t('rich_text_editor.insert_image', '插入圖片網址')}>
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={uploadAndInsertImage}
          className="rounded-md border border-slate-300 bg-white p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          title={t('rich_text_editor.upload_image', '上傳並插入圖片')}
          disabled={uploadingImage}
        >
          <Upload className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setHtmlMode((prev) => !prev)}
          className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-xs hover:bg-slate-100"
        >
          {htmlMode ? t('rich_text_editor.visual_mode', '視覺模式') : t('rich_text_editor.html_mode', 'HTML 模式')}
        </button>
      </div>

      {assetMode && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <input
            type="url"
            value={assetUrl}
            onChange={(event) => setAssetUrl(event.target.value)}
            className="min-w-[240px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            placeholder={assetMode === 'link' ? 'https://example.com' : 'https://example.com/image.jpg'}
          />
          <button type="button" onClick={confirmAssetInsert} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
            {t('rich_text_editor.insert', '插入')}
          </button>
          <button
            type="button"
            onClick={() => {
              setAssetMode(null);
              setAssetUrl('');
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            {t('rich_text_editor.cancel', '取消')}
          </button>
        </div>
      )}

      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {htmlMode ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full resize-y border-0 p-3 font-mono text-sm outline-none ${minHeightClassName}`}
          placeholder={resolvedPlaceholder}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncEditor}
          className={`w-full p-3 text-sm leading-7 outline-none ${minHeightClassName}`}
          data-placeholder={resolvedPlaceholder}
        />
      )}
    </div>
  );
}
