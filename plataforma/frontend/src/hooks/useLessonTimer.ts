import { useEffect, useRef, useCallback } from 'react';
import { pingLessonTime } from '../services/api/lesson.service';

const PING_INTERVAL_MS = 30_000;

/**
 * Heartbeat timer que acumula tiempo activo en una leccion.
 * Envia pings cada 30s y al desmontar. Pausa cuando el tab queda oculto.
 */
export function useLessonTimer(lessonId: string | null) {
  const lastPingRef = useRef<number>(Date.now());
  const isHiddenRef = useRef<boolean>(false);

  const sendDelta = useCallback(() => {
    if (!lessonId || isHiddenRef.current) return;
    const now = Date.now();
    const delta = Math.round((now - lastPingRef.current) / 1000);
    lastPingRef.current = now;
    if (delta > 0) {
      pingLessonTime(lessonId, delta);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId) return;

    lastPingRef.current = Date.now();
    isHiddenRef.current = document.hidden;

    const interval = setInterval(sendDelta, PING_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.hidden) {
        isHiddenRef.current = true;
        sendDelta();
      } else {
        isHiddenRef.current = false;
        lastPingRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      sendDelta();
    };
  }, [lessonId, sendDelta]);
}
