import React from 'react';

const About = () => {
  return (
    <section className="about-section" id="about">
      <div className="container">
        <div className="about-content fade-in">
          <h2 className="section-title">علامة VIX</h2>
          <p className="about-text">
            نؤمن في VIX بأن الأناقة الرجالية تتجاوز المظهر الخارجي لتكون انعكاسًا للشخصية والثقة. 
            منذ تأسيسنا، نسعى لتقديم ملابس تجمع بين الأناقة الكلاسيكية واللمسات العصرية، 
            مصنوعة من أفضل المواد مع انتباه للتفاصيل التي تحدث الفرق.
          </p>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">✂️</div>
              <h3>جودة التصنيع</h3>
              <p>نستخدم أفضل أنواع الأقمشة والمواد في تصنيع منتجاتنا</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎨</div>
              <h3>تصميم فريد</h3>
              <p>تصاميم حصرية تجمع بين الأناقة الكلاسيكية واللمسات العصرية</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🚚</div>
              <h3>توصيل سريع</h3>
              <p>خدمة توصيل سريعة وموثوقة لجميع أنحاء مصر</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;