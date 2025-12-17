import React, { useState, useEffect, useRef } from 'react';
import { orderService } from '../services/orderService';

const CartPopup = ({ cart, isVisible, onClose, onRemoveItem, onUpdateQuantity, totalPrice, onClearCart }) => {
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cartPopupRef = useRef(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (showCheckoutForm) {
          setShowCheckoutForm(false);
        } else {
          onClose();
        }
      }
    };
    
    if (isVisible) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
      if (!isVisible) {
        setShowCheckoutForm(false);
        setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
        setFormErrors({});
        setIsSubmitting(false);
      }
    };
  }, [isVisible, onClose, showCheckoutForm]);

  useEffect(() => {
    if (showCheckoutForm) {
      setTimeout(() => {
        const firstInput = document.querySelector('.form-input');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [showCheckoutForm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({
      ...customerInfo,
      [name]: value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!customerInfo.name.trim()) {
      errors.name = 'الرجاء إدخال الاسم';
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = 'الرجاء إدخال رقم الهاتف';
    } else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(customerInfo.phone)) {
      errors.phone = 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015)';
    }
    
    if (!customerInfo.address.trim()) {
      errors.address = 'الرجاء إدخال العنوان';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // استخدام orderService مباشرة
        const result = await orderService.saveOrder({
          customerInfo,
          cart,
          totalPrice
        });
        
        if (result.success) {
          // تفريغ السلة بعد إتمام الشراء
          if (onClearCart) {
            onClearCart();
          }
          
          // إعادة تعيين النموذج
          setShowCheckoutForm(false);
          setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
          setIsSubmitting(false);
          
          // استخدام message إذا كان موجوداً
          const successMessage = result.message || `✅ تم تأكيد طلبك بنجاح!`;
          
          // عرض رسالة تأكيد
          alert(`${successMessage}\n\nرقم الطلب: #${result.orderId}\nالاسم: ${customerInfo.name}\nالهاتف: ${customerInfo.phone}\n\nسيتم التواصل معك خلال 24 ساعة.`);
          
          onClose();
        } else {
          setIsSubmitting(false);
          
          // رسائل خطأ مفصلة بناءً على نوع الخطأ
          let errorMessage = result.error || 'حدث خطأ غير معروف';
          
          if (errorMessage.includes('item_total') || errorMessage.includes('generated column')) {
            errorMessage = 'خطأ في قاعدة البيانات: الحقل "item_total" محسوب تلقائياً. يرجى تحديث خدمة حفظ الطلب.';
          } else if (errorMessage.includes('image_url')) {
            errorMessage = 'خطأ في قاعدة البيانات: الحقل "image_url" غير موجود. يرجى تحديث خدمة حفظ الطلب.';
          }
          
          alert(`❌ ${errorMessage}\nيرجى المحاولة مرة أخرى أو التواصل مع الدعم.`);
        }
      } catch (error) {
        console.error('Checkout error:', error);
        setIsSubmitting(false);
        alert('⚠️ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleBackToCart = () => {
    setShowCheckoutForm(false);
    setFormErrors({});
  };

  const handleOverlayClick = (e) => {
    if (cartPopupRef.current && !cartPopupRef.current.contains(e.target)) {
      if (showCheckoutForm) {
        handleBackToCart();
      } else {
        onClose();
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="cart-overlay" onClick={handleOverlayClick}></div>
      <div className="cart-popup" ref={cartPopupRef}>
        <div className="cart-header">
          <h2>{showCheckoutForm ? 'إتمام الشراء' : 'سلة التسوق'}</h2>
          <button 
            className="close-cart" 
            onClick={showCheckoutForm ? handleBackToCart : onClose}
            aria-label="إغلاق"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>سلة التسوق فارغة</p>
            <button className="continue-shopping" onClick={onClose}>
              متابعة التسوق
            </button>
          </div>
        ) : (
          <>
            {!showCheckoutForm ? (
              // عرض سلة التسوق الأصلية
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.cartId}>
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <div className="cart-item-options">
                          {item.selectedColor && (
                            <div className="item-color">
                              <span>اللون:</span>
                              <div 
                                className="color-display" 
                                style={{ backgroundColor: item.selectedColor }}
                                title={item.selectedColor}
                              />
                            </div>
                          )}
                          {item.selectedSize && (
                            <div className="item-size">
                              <span>المقاس:</span>
                              <span>{item.selectedSize}</span>
                            </div>
                          )}
                        </div>
                        <div className="item-price">{item.price} جنيه</div>
                        <div className="quantity-control">
                          <button 
                            className="quantity-btn"
                            onClick={() => onUpdateQuantity(item.cartId, (item.quantity || 1) - 1)}
                            disabled={(item.quantity || 1) <= 1}
                            aria-label="تقليل الكمية"
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity || 1}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => onUpdateQuantity(item.cartId, (item.quantity || 1) + 1)}
                            aria-label="زيادة الكمية"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button 
                        className="remove-item" 
                        onClick={() => onRemoveItem(item.cartId)}
                        aria-label="إزالة المنتج"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="cart-footer">
                  <div className="cart-summary">
                    <div className="cart-total">
                      <span>المجموع:</span>
                      <span>{totalPrice} جنيه</span>
                    </div>
                    <div className="cart-shipping">
                      <span>التوصيل:</span>
                      <span>مجاني</span>
                    </div>
                    <div className="cart-final-total">
                      <span>الإجمالي:</span>
                      <span>{totalPrice} جنيه</span>
                    </div>
                  </div>
                  
                  <div className="cart-actions">
                    <button className="continue-shopping" onClick={onClose}>
                      متابعة التسوق
                    </button>
                    <button 
                      className="checkout-btn" 
                      onClick={() => setShowCheckoutForm(true)}
                    >
                      إتمام الشراء
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // عرض نموذج إتمام الشراء
              <>
                <div className="cart-items">
                  <div className="checkout-form">
                    <div className="form-section">
                      <h3 className="form-title">معلومات الشحن</h3>
                      
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">الاسم بالكامل *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={customerInfo.name}
                          onChange={handleInputChange}
                          placeholder="أدخل اسمك بالكامل"
                          className={`form-input ${formErrors.name ? 'error' : ''}`}
                          autoComplete="name"
                          disabled={isSubmitting}
                        />
                        {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">رقم الهاتف *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={customerInfo.phone}
                          onChange={handleInputChange}
                          placeholder="مثال: 01012345678"
                          className={`form-input ${formErrors.phone ? 'error' : ''}`}
                          autoComplete="tel"
                          disabled={isSubmitting}
                        />
                        {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="address" className="form-label">العنوان التفصيلي *</label>
                        <textarea
                          id="address"
                          name="address"
                          value={customerInfo.address}
                          onChange={handleInputChange}
                          placeholder="المحافظة، المدينة، الحي، الشارع، رقم المنزل"
                          rows="3"
                          className={`form-textarea ${formErrors.address ? 'error' : ''}`}
                          autoComplete="street-address"
                          disabled={isSubmitting}
                        />
                        {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="notes" className="form-label">ملاحظات إضافية (اختياري)</label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={customerInfo.notes}
                          onChange={handleInputChange}
                          placeholder="أي ملاحظات إضافية للطلب"
                          rows="2"
                          className="form-textarea"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    <div className="order-summary">
                      <h3 className="form-title">ملخص الطلب</h3>
                      <div className="order-items-list">
                        {cart.map((item) => (
                          <div className="order-item" key={item.cartId}>
                            <div className="order-item-info">
                              <span className="order-item-name">{item.name}</span>
                              {item.selectedColor && (
                                <span className="order-item-option">اللون: {item.selectedColor}</span>
                              )}
                              {item.selectedSize && (
                                <span className="order-item-option">المقاس: {item.selectedSize}</span>
                              )}
                            </div>
                            <div className="order-item-quantity-price">
                              <span className="order-item-quantity">{item.quantity || 1} × {item.price} جنيه</span>
                              <span className="order-item-total">{(item.price * (item.quantity || 1)).toFixed(2)} جنيه</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="cart-footer">
                  <div className="cart-summary">
                    <div className="cart-total">
                      <span>المجموع:</span>
                      <span>{totalPrice} جنيه</span>
                    </div>
                    <div className="cart-shipping">
                      <span>التوصيل:</span>
                      <span>مجاني</span>
                    </div>
                    <div className="cart-final-total">
                      <span>الإجمالي:</span>
                      <span>{totalPrice} جنيه</span>
                    </div>
                  </div>
                  
                  <div className="cart-actions">
                    <button 
                      className="continue-shopping" 
                      onClick={handleBackToCart}
                      disabled={isSubmitting}
                    >
                      العودة للسلة
                    </button>
                    <button 
                      className="checkout-btn" 
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'جاري المعالجة...' : 'تأكيد الطلب'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default CartPopup;