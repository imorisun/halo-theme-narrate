import { haloThemePlugin } from "@halo-dev/vite-plugin-halo-theme";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [haloThemePlugin()],
  lint: { options: { typeAware: true, typeCheck: true }, ignorePatterns: [".agents", ".trae"] },
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    endOfLine: "lf",
    sortPackageJson: true,
    insertFinalNewline: true,
    sortImports: {},
    sortTailwindcss: {},
    ignorePatterns: [".agents", ".trae"],
  },
  staged: {
    // 仅暂存 HTML / CSS / Markdown 等非脚本文件时，lint 没有可检查的目标，
    // 需要忽略空匹配，否则 pre-commit 会误判失败
    "*": ["vp check --no-error-on-unmatched-pattern"],
  },
});
