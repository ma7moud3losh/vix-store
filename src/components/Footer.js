import React from 'react';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">VIX</h3>
            <p>ملابس رجالية فاخرة تجمع بين الأناقة والراحة</p>
          </div>
          <div className="footer-section">
            <h4>روابط سريعة</h4>
            <a href="#home">الرئيسية</a>
            <a href="#products">المنتجات</a>
            <a href="#about">من نحن</a>
            <a href="#contact">اتصل بنا</a>
          </div>
          <div className="footer-section">
            <h4>اتصل بنا</h4>
            <p>📞 01234567890</p>
            <p>📧 info@vix.com</p>
            <p>📍 القاهرة، مصر</p>
          </div>
          <div className="footer-section">
            <h4>تابعنا</h4>
            <div className="social-icons">
              <a href="#">📘</a>
              <a href="#">📷</a>
              <a href="#">🐦</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2023 VIX. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;