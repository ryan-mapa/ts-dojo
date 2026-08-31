import * as monaco from 'monaco-editor';
// NOTE the specifiers. monaco-editor's package `exports` map is
// `"./*": "./esm/vs/*.js"`, so the widely-copied `monaco-editor/esm/vs/...`
// form resolves to `esm/vs/esm/vs/...` and fails outright on Vite 8.
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import { loader } from '@monaco-editor/react';

// @monaco-editor/react fetches Monaco from a CDN by default. That breaks offline
// dev and adds a hard runtime dependency on jsDelivr in production, so point it
// at the copy we bundle instead.
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

export { monaco };
