import React, { useContext } from 'react';
import { ThemeContext } from './theme';

const ToggleButton = () => {
  const { isDay, toggleMode } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleMode}
      className={`toggle-button ${isDay ? 'light-mode' : 'dark-mode'}`}
      aria-label={isDay ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className="toggle-thumb"></span>
      <span className="toggle-text">
        {isDay ? '🌙 Eclipsed Mode' : '🌤️ Daylight Mode'}
      </span>
    </button>
  );
};

export default ToggleButton;
