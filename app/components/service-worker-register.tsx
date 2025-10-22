'use client';

import * as React from 'react';

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((error) => {
          console.error('service-worker-registration-error', error);
        });
    }
  }, []);

  return null;
}
