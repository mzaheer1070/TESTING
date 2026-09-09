import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
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
