// theme-package 会把根目录下所有 *.yaml 打进主题包，pnpm-lock.yaml 因此被误包含。
// 这里在打包期间临时移走锁文件，打包结束后恢复。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = process.cwd();
const lockfile = path.join(root, "pnpm-lock.yaml");
const backup = path.join(root, ".pnpm-lock.yaml.bak");
const cli = createRequire(import.meta.url).resolve("@halo-dev/theme-package-cli");

// 上次异常退出导致锁文件未恢复时，先还原
if (fs.existsSync(backup) && !fs.existsSync(lockfile)) {
  fs.renameSync(backup, lockfile);
}

const hasLockfile = fs.existsSync(lockfile);

try {
  if (hasLockfile) {
    fs.renameSync(lockfile, backup);
  }
  execFileSync(process.execPath, [cli], { cwd: root, stdio: "inherit" });
} finally {
  if (hasLockfile && fs.existsSync(backup)) {
    fs.renameSync(backup, lockfile);
  }
}
