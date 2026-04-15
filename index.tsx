
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Failure: Root element '#root' not found in document.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Mounting Error Detected:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; text-align: center; background: #F8F8F8; min-h-screen; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="border: 4px solid black; background: white; padding: 40px; box-shadow: 8px 8px 0px black;">
          <h1 style="color: #FF4500; font-family: 'Bungee', cursive; font-size: 32px; margin-bottom: 20px;">SIGNAL LOST.</h1>
          <p style="font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #111;">The town hub encountered a fatal transmission error.</p>
          <p style="font-size: 10px; color: #888; margin-top: 20px; text-transform: uppercase;">Technical details logged to console.</p>
          <button onclick="window.location.reload()" style="padding: 15px 30px; background: black; color: white; border: none; cursor: pointer; font-weight: 900; margin-top: 30px; text-transform: uppercase; letter-spacing: 3px; font-size: 10px;">RETRY CONNECTION</button>
        </div>
      </div>
    `;
  }
}
