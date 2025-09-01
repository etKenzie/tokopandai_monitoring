import { useEffect, useRef } from 'react';

/**
 * Hook to handle session persistence and prevent unnecessary auth reloads
 * during tab switches and browser focus changes
 */
export const useSessionPersistence = () => {
  const isTabVisible = useRef(true);
  const lastActivity = useRef(Date.now());
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      const wasVisible = isTabVisible.current;
      isTabVisible.current = !document.hidden;
      
      if (wasVisible && !isTabVisible.current) {
        // Tab became hidden - store last activity time
        lastActivity.current = Date.now();
             } else if (!wasVisible && isTabVisible.current) {
         // Tab became visible - just log, don't refresh session
         const timeSinceLastActivity = Date.now() - lastActivity.current;
         console.log(`Tab became visible after ${Math.round(timeSinceLastActivity / 1000)}s - no session refresh needed`);
       }
    };

    // Handle window focus/blur events
    const handleFocus = () => {
      isTabVisible.current = true;
      lastActivity.current = Date.now();
    };

    const handleBlur = () => {
      lastActivity.current = Date.now();
    };

    // Handle page visibility API
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
    }

    // Disabled periodic session health check to prevent unnecessary auth reloads
    // sessionCheckInterval.current = setInterval(() => {
    //   if (isTabVisible.current) {
    //     console.log('Periodic session health check');
    //   }
    // }, 10 * 60 * 1000);

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      }
      
      // No interval to clean up since we disabled periodic checks
      // if (sessionCheckInterval.current) {
      //   clearInterval(sessionCheckInterval.current);
      // }
    };
  }, []);

  return {
    isTabVisible: isTabVisible.current,
    lastActivity: lastActivity.current,
  };
};
