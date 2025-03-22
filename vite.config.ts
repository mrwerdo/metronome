import { defineConfig } from "vite";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin,
} from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    svgr({
      svgrOptions: {
        replaceAttrValues: {
          '#000000': 'currentcolor'
        }
      },
      include: '**/*.svg?react'
    }),
    cloudflareDevProxyVitePlugin(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
});
