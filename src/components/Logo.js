// components/Logo.js
import React from 'react';
import logoImage from '/vix-clothing-store/public/images/5908892311238675359.jpg'; // أو مسار صورة

const Logo = () => {
  return (
    <div className="logo">
      <div className="logo-image-container">
        {/* استخدام صورة أو SVG */}
        <img 
          src={logoImage || "/logo.jpg"} 
          alt="VIX Logo" 
          className="logo-image"
          onError={(e) => {
            // إذا فشل تحميل الصورة، استبدلها ببديل
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div class="logo-fallback" style="
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #3b82f6, #1e3a8a);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 20px;
              ">
                VIX
              </div>
            `;
          }}
        />
      </div>
      <h1 className="logo-text">VIX</h1>
      <span className="logo-subtitle">ملابس رجالية فاخرة</span>
    </div>
  );
};

export default Logo;