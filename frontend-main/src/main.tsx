import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');
const loadingElement = document.getElementById('app-loading');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  requestAnimationFrame(() => {
    setTimeout(() => {
      if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
          loadingElement.remove();
        }, 300);
      }

      rootElement.classList.add('loaded');
    }, 150);
  });
}