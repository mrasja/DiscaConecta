'use client';
import { useEffect, useRef } from 'react';

export function useAndroidBackButton(customHandler?: () => boolean) {
  const handlerRef = useRef(customHandler);

  useEffect(() => {
    handlerRef.current = customHandler;
  });

  useEffect(() => {
    let pluginHandle: { remove: () => void } | null = null;

    async function setup() {
      try {
        const { App } = await import('@capacitor/app');
        pluginHandle = await App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          if (handlerRef.current?.()) return;
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
      } catch {
        // Not on native platform — no-op
      }
    }

    setup();
    return () => { pluginHandle?.remove(); };
  }, []);
}
