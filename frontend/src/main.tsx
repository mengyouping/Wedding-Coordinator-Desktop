import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthGate } from './components/AuthGate';
import { SessionLock } from './components/SessionLock';
import { WeddingDataProvider } from './state/WeddingDataProvider';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <WeddingDataProvider>
        <SessionLock>
          <App />
        </SessionLock>
      </WeddingDataProvider>
    </AuthGate>
  </StrictMode>
);
