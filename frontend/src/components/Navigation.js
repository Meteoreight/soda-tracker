import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          SodaStream Tracker
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>
            Dashboard
          </Link>
          <Link to="/history" className={isActive('/history')}>
            History
          </Link>
          <Link to="/analytics" className={isActive('/analytics')}>
            Analytics
          </Link>
          <Link to="/cylinders" className={isActive('/cylinders')}>
            Cylinders
          </Link>
          <Link to="/settings" className={isActive('/settings')}>
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;