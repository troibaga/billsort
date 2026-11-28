import { existsSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'BILLSORT_');
  const filename = env.BILLSORT_APK_FILENAME || 'BillWise.apk';
  if (!/^[\w.-]+\.apk$/i.test(filename)) throw new Error('Use a plain APK filename.');
  const apkUrl = existsSync('public/downloads/' + filename) ? '/downloads/' + filename : null;
  return {
    plugins: [react(), viteSingleFile()],
    define: { __BILLSORT_APK_URL__: JSON.stringify(apkUrl) },
  };
});
