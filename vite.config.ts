import { haloThemePlugin } from "@halo-dev/vite-plugin-halo-theme";
import { defineConfig } from "vite-plus";

// 生成物与第三方资源不参与检查：templates/ 是构建输出，dist/ 与字体为打包产物，
// .agents / .trae / .claude 为本地 skill 安装目录
const ignored = [".agents", ".trae", ".claude", "templates", "dist", "public/assets/fonts"];

export default defineConfig({
  plugins: [haloThemePlugin()],
  lint: { options: { typeAware: true, typeCheck: true }, ignorePatterns: ignored },
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    endOfLine: "lf",
    sortPackageJson: true,
    insertFinalNewline: true,
    sortImports: {},
    ignorePatterns: ignored,
  },
  staged: {
    // 只对文本源文件触发检查，避免字体等二进制产物进入格式化流程；
    // 同时忽略空匹配，防止仅暂存非检查文件时 pre-commit 误判失败
    "*.{ts,js,mjs,cjs,css,html,json,md,yaml,yml}": ["vp check --no-error-on-unmatched-pattern"],
  },
});
