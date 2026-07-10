import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const NotificationManager: React.FC = () => {
  const currentState = useStore((state) => state.currentState);
  const lastTransition = useStore((state) => state.lastTransition);
  const reminderMinutes = useStore((state) => state.settings.reminderMinutes);
  
  const notifiedRef = useRef(false);

  // Reset notification flag when aligners are put back in
  useEffect(() => {
    if (currentState === 'wearing') {
      notifiedRef.current = false;
    }
  }, [currentState]);

  useEffect(() => {
    if (currentState !== 'out') return;

    // Check every 5 seconds
    const interval = setInterval(() => {
      if (notifiedRef.current) return;

      const elapsedMs = Date.now() - lastTransition;
      const thresholdMs = reminderMinutes * 60 * 1000;

      if (elapsedMs >= thresholdMs) {
        triggerNotification(Math.floor(elapsedMs / (60 * 1000)));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentState, lastTransition, reminderMinutes]);

  const triggerNotification = (elapsedMinutes: number) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification('AlignTrack', {
          body: `You've had your aligners out for ${elapsedMinutes} minutes.`,
          icon: '/pwa-192x192.png',
          tag: 'aligntrack-reminder',
        });
        notifiedRef.current = true;
      } catch (err) {
        console.error('Failed to trigger notification:', err);
      }
    }
  };

  return null;
};
export default NotificationManager;
