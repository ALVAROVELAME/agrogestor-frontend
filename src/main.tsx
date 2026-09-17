import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'Elemento #root não encontrado. Verifique se o index.html contém <div id="root"></div>'
  );
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);