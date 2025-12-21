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
            <p>📞 +201144382584</p>
            <p>📍 المطرية الدقهليه</p>
          </div>
          <div className="footer-section">
            <h4>تابعنا</h4>
            <div className="social-icons">
               <a href="https://instagram.com" class="social-icon" target="_blank">
        <div class="icon-circle instagram">📸</div>
    </a>
               <a href="https://www.facebook.com/share/1AeNcy2JsK/?mibextid=wwXIfr" 
       class="facebook-btn pulse"
       target="_blank"
       title="تابعنا على فيسبوك">
        👤
    </a>
              <a href="https://whatsapp.com/channel/0029VbBueWq6rsQp2oOLmA3D" 
   class="whatsapp-channel"
   target="_blank"
   title="انضم لقناة واتساب">
    💬
</a>
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
