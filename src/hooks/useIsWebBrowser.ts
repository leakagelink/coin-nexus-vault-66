
import { useState, useEffect } from 'react';

export function useIsWebBrowser() {
  const [isWebBrowser, setIsWebBrowser] = useState(false);

  useEffect(() => {
    // Check if it's a web browser (not mobile app)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileApp = /nadex|app/.test(userAgent) || 
                       window.location.href.includes('capacitor://') ||
                       window.location.href.includes('http://localhost') ||
                       window.innerWidth < 768; // Consider mobile viewport as app
    
    setIsWebBrowser(!isMobileApp);
  }, []);

  return isWebBrowser;
}
