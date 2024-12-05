'use client';

import {
  EXP_NV_CONTENT_HTML_STORAGE_KEY,
  EXP_NV_CONTENT_JSON_STORAGE_KEY,
  EXP_NV_CONTENT_MD_STORAGE_KEY,
  EXP_NV_CONTENT_STORAGE_KEY,
} from './editor-storage-keys';
import type { EditorInstance } from './src';

export function createEditorClientContentKey(key: string, keySuffix = '') {
  return keySuffix ? `${key}-${keySuffix}` : key;
}

export function setEditorClientContent(editor: EditorInstance, keySuffix = '') {
  if (!editor) {
    return;
  }

  const json = editor.getJSON();
  const text = editor.getText();
  const html = editor.getHTML();
  const md = editor.storage.markdown.getMarkdown();

  if (html) {
    const htmlKey = createEditorClientContentKey(
      EXP_NV_CONTENT_HTML_STORAGE_KEY,
      keySuffix,
    );

    window.localStorage.setItem(htmlKey, html);
  }

  if (json) {
    const jsonKey = createEditorClientContentKey(
      EXP_NV_CONTENT_JSON_STORAGE_KEY,
      keySuffix,
    );

    window.localStorage.setItem(jsonKey, JSON.stringify(json));
  }

  if (md) {
    const mdKey = createEditorClientContentKey(
      EXP_NV_CONTENT_MD_STORAGE_KEY,
      keySuffix,
    );

    window.localStorage.setItem(mdKey, md);
  }

  if (text) {
    const textKey = createEditorClientContentKey(
      EXP_NV_CONTENT_STORAGE_KEY,
      keySuffix,
    );

    window.localStorage.setItem(textKey, text);
  }
}

export function clearEditorClientContent(
  editor?: EditorInstance | null,
  keySuffix = '',
) {
  window.localStorage.removeItem(
    createEditorClientContentKey(EXP_NV_CONTENT_HTML_STORAGE_KEY, keySuffix),
  );

  window.localStorage.removeItem(
    createEditorClientContentKey(EXP_NV_CONTENT_JSON_STORAGE_KEY, keySuffix),
  );

  window.localStorage.removeItem(
    createEditorClientContentKey(EXP_NV_CONTENT_MD_STORAGE_KEY, keySuffix),
  );

  window.localStorage.removeItem(
    createEditorClientContentKey(EXP_NV_CONTENT_STORAGE_KEY, keySuffix),
  );

  if (editor) {
    editor.chain().setContent('').run();
  }
}
