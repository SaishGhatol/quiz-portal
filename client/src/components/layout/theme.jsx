import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check if user has a stored preference or use system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'light';
    
    // If no saved preference, use system preference
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  };

  const [isDay, setIsDay] = useState(getInitialTheme);

  useEffect(() => {
    // Add or remove 'dark-mode' class on body for CSS selectors
    document.body.classList.toggle('dark-mode', !isDay);
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDay ? 'light' : 'dark');
    
    // Apply theme colors to root element using CSS variables
    if (!isDay) {
      document.documentElement.style.setProperty('--bg-primary', '#121212');
      document.documentElement.style.setProperty('--bg-secondary', '#1e1e1e');
      document.documentElement.style.setProperty('--bg-tertiary', '#2d2d2d');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#e0e0e0');
      document.documentElement.style.setProperty('--text-tertiary', '#a0a0a0');
      document.documentElement.style.setProperty('--accent-color', '#8b5cf6');
      document.documentElement.style.setProperty('--border-color', '#333333');
      document.documentElement.style.setProperty('--card-bg', '#1e1e1e');
      document.documentElement.style.setProperty('--card-hover-bg', '#252525');
      document.documentElement.style.setProperty('--header-bg', '#121212');
      document.documentElement.style.setProperty('--button-bg', '#8b5cf6');
      document.documentElement.style.setProperty('--button-text', '#ffffff');
      document.documentElement.style.setProperty('--quiz-gradient-from', '#1e1e1e');
      document.documentElement.style.setProperty('--quiz-gradient-to', '#2d2d2d');
      document.documentElement.style.setProperty('--hero-gradient-from', '#121212');
      document.documentElement.style.setProperty('--hero-gradient-to', '#1e1e1e');
      document.documentElement.style.setProperty('--stat-bg-1', '#1a237e');
      document.documentElement.style.setProperty('--stat-bg-2', '#006064');
      document.documentElement.style.setProperty('--stat-bg-3', '#4a148c');
      document.documentElement.style.setProperty('--cta-gradient-from', '#4a148c');
      document.documentElement.style.setProperty('--cta-gradient-to', '#1a237e');
      document.documentElement.style.setProperty('--testimonial-bg', '#1e1e1e');
      document.documentElement.style.setProperty('--features-bg', '#121212');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
      document.documentElement.style.setProperty('--bg-tertiary', '#e5e5e5');
      document.documentElement.style.setProperty('--text-primary', '#000000');
      document.documentElement.style.setProperty('--text-secondary', '#333333');
      document.documentElement.style.setProperty('--text-tertiary', '#666666');
      document.documentElement.style.setProperty('--accent-color', '#4f46e5');
      document.documentElement.style.setProperty('--border-color', '#e0e0e0');
      document.documentElement.style.setProperty('--card-bg', '#ffffff');
      document.documentElement.style.setProperty('--card-hover-bg', '#f9fafb');
      document.documentElement.style.setProperty('--header-bg', '#4338ca');
      document.documentElement.style.setProperty('--button-bg', '#4f46e5');
      document.documentElement.style.setProperty('--button-text', '#ffffff');
      document.documentElement.style.setProperty('--quiz-gradient-from', '#f5f5f5');
      document.documentElement.style.setProperty('--quiz-gradient-to', '#ffffff');
      document.documentElement.style.setProperty('--hero-gradient-from', '#f0f9ff');
      document.documentElement.style.setProperty('--hero-gradient-to', '#e0f2fe');
      document.documentElement.style.setProperty('--stat-bg-1', '#dbeafe');
      document.documentElement.style.setProperty('--stat-bg-2', '#d1fae5');
      document.documentElement.style.setProperty('--stat-bg-3', '#fef3c7');
      document.documentElement.style.setProperty('--cta-gradient-from', '#4f46e5');
      document.documentElement.style.setProperty('--cta-gradient-to', '#7c3aed');
      document.documentElement.style.setProperty('--testimonial-bg', '#ffffff');
      document.documentElement.style.setProperty('--features-bg', '#f5f7fa');
    }
  }, [isDay]);

  const toggleMode = () => setIsDay(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDay, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
