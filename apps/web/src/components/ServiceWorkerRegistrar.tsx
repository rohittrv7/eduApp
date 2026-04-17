'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/register-sw';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
