import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.CLOUDINARY_CLOUD_NAME': JSON.stringify(env.CLOUDINARY_CLOUD_NAME),
      'import.meta.env.CLOUDINARY_API_KEY': JSON.stringify(env.CLOUDINARY_API_KEY),
      'import.meta.env.CLOUDINARY_API_SECRET': JSON.stringify(env.CLOUDINARY_API_SECRET),
      'import.meta.env.CLOUDINARY_UPLOAD_PRESET': JSON.stringify(env.CLOUDINARY_UPLOAD_PRESET),
      'import.meta.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(env.VITE_CLOUDINARY_CLOUD_NAME ?? env.CLOUDINARY_CLOUD_NAME),
      'import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(env.VITE_CLOUDINARY_UPLOAD_PRESET ?? env.CLOUDINARY_UPLOAD_PRESET),
      'import.meta.env.VITE_CLOUDINARY_API_KEY': JSON.stringify(env.VITE_CLOUDINARY_API_KEY ?? env.CLOUDINARY_API_KEY),
      'import.meta.env.VITE_CLOUDINARY_API_SECRET': JSON.stringify(env.VITE_CLOUDINARY_API_SECRET ?? env.CLOUDINARY_API_SECRET),
    },
    server: {
      host: '0.0.0.0',
    },
  };
});
