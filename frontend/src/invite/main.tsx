import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InviteApp } from './InviteApp';
import './invite.css';

createRoot(document.getElementById('invite-root')!).render(<StrictMode><InviteApp /></StrictMode>);
