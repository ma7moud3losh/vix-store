import React, { useState } from 'react';

const Header = ({ cartCount, onCartClick, showAdminButton, onAdminClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`header ${menuOpen ? 'menu-open' : ''}`}>
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1 className="logo-text">VIX</h1>
            <span className="logo-subtitle">ملابس رجالية فاخرة</span>
          </div>
          
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
          
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={() => setMenuOpen(false)}>الرئيسية</a>
            <a href="#products" onClick={() => setMenuOpen(false)}>المنتجات</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>من نحن</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>اتصل بنا</a>
            
            {showAdminButton && (
              <button 
                className="admin-nav-btn" 
                onClick={() => {
                  setMenuOpen(false);
                  onAdminClick();
                }}
              >
                <span className="admin-icon">⚙️</span>
                <span>الإدارة</span>
              </button>
            )}
          </nav>
          
          <div className="header-actions">
            <button className="cart-btn" onClick={onCartClick}>
              <span className="cart-icon">🛒</span>
              <span className="cart-count">{cartCount}</span>
            </button>
            
            {showAdminButton && !menuOpen && (
              <button 
                className="admin-header-btn" 
                onClick={onAdminClick}
                title="لوحة التحكم"
              >
                <span className="admin-icon">⚙️</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;