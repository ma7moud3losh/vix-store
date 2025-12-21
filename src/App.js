import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Products from './components/Products';
import About from './components/About';
import Footer from './components/Footer';
import CartPopup from './components/CartPopup';
import AdminPanel from './components/AdminPanel';
import { storage } from './utils/storage';
import { supabase } from './utils/supabase';




const App = () => {

  // استبدال useEffect الحالي في App.js بهذا:
useEffect(() => {
  const fetchProducts = async () => {
    console.log('🔄 جاري تحميل المنتجات من Supabase...');
    
    try {
      // محاولة الجلب من Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ فشل تحميل من Supabase:', error.message);
        
        // استخدام البيانات المحلية كبديل
        const localProducts = JSON.parse(localStorage.getItem('vix_products') || '[]');
        
        if (localProducts.length > 0) {
          console.log(`📱 استخدام ${localProducts.length} منتج من localStorage`);
          setProducts(localProducts);
        } else {
          console.log('📝 إنشاء بيانات افتراضية...');
          
          // بيانات افتراضية للطوارئ
          const defaultProducts = [
            {
              id: 1,
              name: "قميص VIX الكلاسيكي",
              price: 299,
              category: "قمصان",
              image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
              description: "قميص قطني عالي الجودة",
              colors: ['#000000', '#C41E3A'],
              sizes: ['S', 'M', 'L', 'XL'],
              stock: 15,
              rating: 4.8,
              sku: 'VIX-001',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              name: "جاكيت جلد VIX",
              price: 899,
              category: "جاكيتات",
              image: "https://images.unsplash.com/photo-1551028719-00167b16eac5",
              description: "جاكيت جلد طبيعي",
              colors: ['#000000', '#8B4513'],
              sizes: ['M', 'L', 'XL'],
              stock: 8,
              rating: 4.9,
              sku: 'VIX-002',
              created_at: new Date().toISOString()
            }
          ];
          
          setProducts(defaultProducts);
          localStorage.setItem('vix_products', JSON.stringify(defaultProducts));
        }
        
        return;
      }
      
      // إذا نجح الاتصال
      if (data && data.length > 0) {
        console.log(`✅ تم تحميل ${data.length} منتج من Supabase`);
        setProducts(data);
        
        // حفظ نسخة محلية
        localStorage.setItem('vix_products', JSON.stringify(data));
      } else {
        console.log('⚠️ لا توجد منتجات في Supabase');
        
        // استخدام بيانات محلية
        const localProducts = JSON.parse(localStorage.getItem('vix_products') || '[]');
        if (localProducts.length > 0) {
          setProducts(localProducts);
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ غير متوقع:', error);
    }
  };
  
  fetchProducts();
}, []);
  const [currentView, setCurrentView] = useState('home');
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);

  // تحميل البيانات من التخزين المحلي
useEffect(() => {
  const handleScroll = () => {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (elementTop < windowHeight - 100) {
        element.classList.add('visible');
      }
    });
  };

  const adminStatus = storage.loadAdminStatus();
  if (adminStatus) {
    setIsAdmin(true);
  }

  window.addEventListener('scroll', handleScroll);
  setTimeout(handleScroll, 100);

  return () => window.removeEventListener('scroll', handleScroll);
}, []);



  
  // حفظ المنتجات عند التغيير
  useEffect(() => {
    if (products.length > 0) {
      storage.saveProducts(products);
    }
  }, [products]);

  // مفاتيح الاختصار للإدارة
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl + Shift + A لإظهار/إخفاء زر الإدارة
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminButton(prev => !prev);
      }
      
      // Esc للخروج من أي عرض
      if (e.key === 'Escape') {
        if (currentView !== 'home') {
          setCurrentView('home');
        }
        setCartVisible(false);
      }
      
      // Ctrl + Alt + L لدخول الإدارة مباشرة
      if (e.ctrlKey && e.altKey && e.key === 'L') {
        e.preventDefault();
        setCurrentView('login');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentView]);

  // تسجيل دخول الإدارة
  const handleAdminLogin = (e) => {
    e.preventDefault();
    
    // التحقق من بيانات الدخول
    const isCredentialsValid = 
      loginData.username === 'admin' && 
      loginData.password === 'vix2023';
    
    const isSecretValid = adminSecret === 'VIX123';
    
    if (isCredentialsValid && isSecretValid) {
      setIsAdmin(true);
      storage.saveAdminStatus(true);
      setLoginError('');
      setCurrentView('admin');
      setLoginData({ username: '', password: '' });
      setAdminSecret('');
      setSecretVisible(false);
    } else {
      setLoginError('بيانات الدخول غير صحيحة');
    }
  };

  // تسجيل خروج الإدارة
  const handleAdminLogout = () => {
    setIsAdmin(false);
    storage.saveAdminStatus(false);
    setCurrentView('home');
    setShowAdminButton(false);
  };

  // إضافة منتج للسلة
  const addToCart = (product, selectedColor, selectedSize) => {
    const existingItem = cart.find(item => 
      item.id === product.id && 
      item.selectedColor === selectedColor && 
      item.selectedSize === selectedSize
    );

    if (existingItem) {
      // زيادة الكمية إذا المنتج موجود
      setCart(cart.map(item =>
        item.cartId === existingItem.cartId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // إضافة منتج جديد
      const cartItem = {
        ...product,
        selectedColor,
        selectedSize,
        cartId: Date.now() + Math.random(),
        quantity: 1
      };
      setCart([...cart, cartItem]);
    }
    
    setCartVisible(true);
  };

  // إزالة منتج من السلة
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  // تحديث كمية المنتج
  const updateQuantity = (cartId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartId);
      return;
    }
    
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // حساب الإجمالي
  const getTotalPrice = () => {
    return cart.reduce((total, item) => 
      total + (item.price * (item.quantity || 1)), 0
    );
  };

  // تحديث المنتجات
  const updateProducts = (newProducts) => {
    setProducts(newProducts);
    storage.saveProducts(newProducts);
  };

  // تفريغ السلة بعد الشراء
  const clearCart = () => {
    setCart([]);
    setCartVisible(false);
  };

  // زر الوصول للإدارة
  const AdminAccessButton = () => {
    if (!showAdminButton || currentView === 'admin' || currentView === 'login') return null;
    
    return (
      <button 
        className="admin-access-btn"
        onClick={() => setCurrentView('login')}
        title="لوحة التحكم (Ctrl+Shift+A)"
      >
        ⚙️
      </button>
    );
  };

  // عرض المحتوى حسب الصفحة الحالية
  const renderContent = () => {
    switch(currentView) {
      case 'admin':
        return (
          <AdminPanel 
            products={products}
            setProducts={updateProducts}
            onLogout={handleAdminLogout}
            onBack={() => setCurrentView('home')}
          />
        );
        
      case 'login':
        return (
          <div className="admin-login-page">
            <div className="login-backdrop" onClick={() => setCurrentView('home')}></div>
            <div className="login-modal">
              <div className="modal-header">
                <h2>VIX Admin Panel</h2>
                <button className="close-modal" onClick={() => setCurrentView('home')}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAdminLogin} className="login-form">
                  <div className="form-group">
                    <label>اسم المستخدم</label>
                    <input 
                      type="text" 
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      placeholder="أدخل اسم المستخدم"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>كلمة المرور</label>
                    <input 
                      type="password" 
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      placeholder="أدخل كلمة المرور"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>الكود السري</label>
                    <div className="secret-input">
                      <input 
                        type={secretVisible ? "text" : "password"}
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        placeholder="أدخل الكود السري"
                        required
                      />
                      <button 
                        type="button"
                        className="toggle-secret"
                        onClick={() => setSecretVisible(!secretVisible)}
                      >
                        {secretVisible ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  
                  {loginError && <div className="error-message">{loginError}</div>}
                  
                  <div className="form-actions">
                    <button type="submit" className="login-btn">
                      دخول لوحة التحكم
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setCurrentView('home')}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
                
                
                  </div>
                </div>
              </div>
            
        );
        
      default:
        return (
          <>
            <Header 
              cartCount={cart.length} 
              onCartClick={() => setCartVisible(true)}
              showAdminButton={showAdminButton}
              onAdminClick={() => setCurrentView('login')}
            />
            <Hero />
            <Products products={products} onAddToCart={addToCart} />
            <About />
            <Footer />
            <CartPopup 
              cart={cart}
              isVisible={cartVisible}
              onClose={() => setCartVisible(false)}
              onRemoveItem={removeFromCart}
              onUpdateQuantity={updateQuantity}
              totalPrice={getTotalPrice()}
              onClearCart={clearCart}
            />
            <AdminAccessButton />
          </>
        );
    }
  };

  return (
    <div className="app">
      {renderContent()}
    </div>
  );
};

export default App;
