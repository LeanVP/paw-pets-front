// Configuración de Vite: la herramienta que levanta el sitio (npm run dev) y lo empaqueta (npm run build)
// Plugin oficial para que Vite entienda JSX y React
import react from '@vitejs/plugin-react';
// defineConfig: función de Vite que ayuda al editor a autocompletar la configuración
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // Activa el plugin de React
  plugins: [react()],
  server: {
    // Aquí se indica la dirección del backend durante el desarrollo.
    // Vite reenvía /api/v1/... a http://localhost:8080/api/v1/... (igual que en el ejemplo del profesor).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
