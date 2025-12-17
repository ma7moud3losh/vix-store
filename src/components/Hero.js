import React from 'react';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-content fade-in">
          <h2 className="hero-title">
            أناقة رجالية 
            <span className="highlight"> بلمسة عصرية</span>
          </h2>
          <p className="hero-subtitle">
            اكتشف مجموعة VIX الحصرية من الملابس الرجالية المصممة بأناقة وجودة عالية
          </p>
          <div className="hero-buttons">
            <a href="#products" className="cta-button primary">
              <span className="btn-icon">👕</span>
              تصفح المجموعة
            </a>
            <a href="#about" className="cta-button secondary">
              <span className="btn-icon">ℹ️</span>
              تعرف علينا
            </a>
          </div>
          
          {/* إحصائيات */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">عميل راضي</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">150+</span>
              <span className="stat-label">منتج حصري</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">دعم فني</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* خلفية متحركة */}
      <div className="hero-background">
        <div className="bg-overlay"></div>
        <div className="bg-pattern"></div>
      </div>
      
      {/* عناصر جمالية */}
      <div className="hero-elements">
        <div className="element e1"></div>
        <div className="element e2"></div>
        <div className="element e3"></div>
      </div>
    </section>
  );
};

export default Hero;