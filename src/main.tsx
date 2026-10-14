import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/anton/400.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/base.css';
import './styles/scenes.css';
import { AppProvider } from './lib/state';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
