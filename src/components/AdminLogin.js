import React, { useState, useEffect } from 'react';
// تعليق استيراد Supabase مؤقتاً
// import { supabase } from '../utils/supabase';

const AdminPanel = ({ products, setProducts, onLogout, onBack }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    colors: ['#000000', '#C41E3A', '#1E3A8A'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 10,
    rating: 4.5
  });
  const [loading, setLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    revenue: 0
  });

  // تحميل الطلبات من localStorage (بديل مؤقت)
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    try {
      setLoading(true);
      // تحميل من localStorage بدلاً من Supabase
      const savedOrders = JSON.parse(localStorage.getItem('vix_orders') || '[]');
      console.log('الطلبات المحفوظة محلياً:', savedOrders);
      
      // حساب الإحصائيات
      const total = savedOrders.length;
      const pending = savedOrders.filter(order => order.status === 'pending' || !order.status).length;
      const delivered = savedOrders.filter(order => order.status === 'delivered').length;
      const revenue = savedOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      setOrders(savedOrders);
      setOrderStats({ total, pending, delivered, revenue });
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... باقي الدوال تبقى كما هي مع تعديل بسيط

  // مثال: تعديل دالة حذف الطلب لتعمل مع localStorage
  const deleteOrder = (orderId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    const updatedOrders = orders.filter(order => order.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem('vix_orders', JSON.stringify(updatedOrders));
    
    // تحديث الإحصائيات
    loadOrders();
    alert('تم حذف الطلب بنجاح');
  };

  // مثال: تعديل دالة تحديث حالة الطلب
  const markAsDelivered = (orderId) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: 'delivered' };
      }
      return order;
    });
    
    setOrders(updatedOrders);
    localStorage.setItem('vix_orders', JSON.stringify(updatedOrders));
    loadOrders();
    alert('تم تحديث حالة الطلب إلى "تم التوصيل"');
  };

  // ... باقي الكود يبقى كما هو

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>لوحة إدارة VIX (نسخة محلية)</h1>
        <div className="admin-actions">
          <button onClick={onBack} className="admin-btn">العودة للرئيسية</button>
          <button onClick={onLogout} className="logout-btn">تسجيل الخروج</button>
          <button onClick={loadOrders} className="refresh-btn" disabled={loading}>
            {loading ? 'جاري التحميل...' : 'تحديث الطلبات'}
          </button>
        </div>
      </div>
      
      {/* ... باقي الـ JSX يبقى كما هو ... */}
    </div>
  );
};

export default AdminPanel;