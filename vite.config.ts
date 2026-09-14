import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      if (entry.name === 'index.html' && fs.existsSync(destPath)) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyStaticAssetsPlugin(): Plugin {
  return {
    name: 'copy-static-legacy-assets',
    closeBundle() {
      const rootDir = __dirname;
      const distDir = path.resolve(rootDir, 'dist');
      if (!fs.existsSync(distDir)) return;

      copyDirRecursive(path.resolve(rootDir, 'js'), path.resolve(distDir, 'js'));
      copyDirRecursive(path.resolve(rootDir, 'projects'), path.resolve(distDir, 'projects'));

      const rootFiles = ['favicon.svg', 'Muhammad_Zaheer_Resume.pdf'];
      for (const file of rootFiles) {
        const src = path.resolve(rootDir, file);
        const dest = path.resolve(distDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [copyStaticAssetsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          projects: path.resolve(__dirname, 'projects.html'),
          apiDashboard: path.resolve(__dirname, 'projects/api-dashboard/index.html'),
          todoApp: path.resolve(__dirname, 'projects/todo-app/index.html'),
          weatherApp: path.resolve(__dirname, 'projects/weather-app/index.html'),
          weatherDashboard: path.resolve(__dirname, 'projects/weather-dashboard/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
