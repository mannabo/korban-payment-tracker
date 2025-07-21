import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return {
    width: screenSize.width,
    height: screenSize.height,
    isMobile: screenSize.width <= 768,
    isTablet: screenSize.width > 768 && screenSize.width <= 1024,
    isDesktop: screenSize.width > 1024,
    isSmallMobile: screenSize.width <= 480,
  };
};