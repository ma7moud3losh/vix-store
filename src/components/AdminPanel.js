import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { productService } from '../services/productService';

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
  const [syncStatus, setSyncStatus] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalRevenue: 0
  });
  
  // حالات للصورة
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // فلترة المنتجات
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // فلترة الطلبات
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadProductsFromSupabase();
    loadOrdersFromSupabase();
  }, []);

  const loadProductsFromSupabase = async () => {
    try {
      setLoading(true);
      setSyncStatus('جاري تحميل المنتجات...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في تحميل المنتجات من Supabase:', error);
        setSyncStatus('❌ فشل تحميل المنتجات من السحابة');
        const localProducts = JSON.parse(localStorage.getItem('vix_products') || '[]');
        if (localProducts.length > 0) {
          setProducts(localProducts);
        }
        return;
      }

      if (data && data.length > 0) {
        setProducts(data);
        localStorage.setItem('vix_products', JSON.stringify(data));
        setSyncStatus(`✅ تم تحميل ${data.length} منتج من السحابة`);
      } else {
        setSyncStatus('⚠️ لا توجد منتجات في قاعدة البيانات');
      }
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      setSyncStatus('❌ حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersFromSupabase = async () => {
    try {
      setLoading(true);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // استخدام select بسيط بدون join مع products
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('id, order_id, product_id, product_name, product_price, quantity, color, size, image_url')
            .eq('order_id', order.id);

          if (itemsError) {
            console.error(`خطأ في عناصر الطلب ${order.id}:`, itemsError);
            return { ...order, order_items: [] };
          }

          // إضافة معلومات المنتج الافتراضية
          const orderItems = (itemsData || []).map(item => ({
            ...item,
            product: {
              name: item.product_name || 'منتج غير محدد',
              price: item.product_price || 0,
              image_url: item.image_url || ''
            }
          }));

          return { ...order, order_items: orderItems };
        })
      );

      setOrders(ordersWithItems);
      
      const total = ordersWithItems.length;
      const pending = ordersWithItems.filter(o => o.status === 'pending').length;
      const completed = ordersWithItems.filter(o => 
        o.status === 'completed' || o.status === 'delivered'
      ).length;
      const totalRevenue = ordersWithItems
        .filter(o => o.status === 'completed' || o.status === 'delivered')
        .reduce((sum, order) => sum + (order.total_price || order.total_amount || 0), 0);
      
      setOrderStats({ total, pending, completed, totalRevenue });
      
      localStorage.setItem('vix_orders_backup', JSON.stringify(ordersWithItems));
      
    } catch (error) {
      console.error('خطأ في تحميل الطلبات:', error);
      const localOrders = JSON.parse(localStorage.getItem('vix_orders') || '[]');
      setOrders(localOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('⚠️ الرجاء اختيار ملف صورة فقط (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ حجم الصورة كبير جداً! الحد الأقصى 5MB');
      return;
    }

    setSelectedImage(file);
    
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    setSyncStatus('✅ تم اختيار الصورة، اضف المنتج لحفظها');
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      image: url
    }));
    
    if (selectedImage) {
      setSelectedImage(null);
      setImagePreview('');
    }
  };

  const uploadImageToSupabase = async (file) => {
    try {
      setUploadingImage(true);
      setSyncStatus('جاري رفع الصورة...');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      setSyncStatus('✅ تم رفع الصورة بنجاح');
      return publicUrl;
      
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      setSyncStatus('❌ فشل رفع الصورة');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProductToSupabase = async (productData) => {
    try {
      setLoading(true);
      setSyncStatus('جاري حفظ المنتج...');
      
      let imageUrl = productData.image;
      
      if (selectedImage) {
        imageUrl = await uploadImageToSupabase(selectedImage);
      }
      
      const productToSave = {
        name: productData.name,
        price: parseFloat(productData.price),
        category: productData.category,
        description: productData.description,
        image: imageUrl,
        colors: productData.colors,
        sizes: productData.sizes,
        stock: parseInt(productData.stock) || 10,
        rating: parseFloat(productData.rating) || 4.5,
        sku: `VIX-${productData.category.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        updated_at: new Date().toISOString(),
        status: 'active'
      };

      let result;
      
      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productToSave)
          .eq('id', editingProduct.id)
          .select();

        if (error) throw error;
        result = data?.[0];
        setSyncStatus('✅ تم تحديث المنتج في السحابة');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productToSave])
          .select();

        if (error) throw error;
        result = data?.[0];
        setSyncStatus('✅ تم إضافة المنتج إلى السحابة');
      }

      await loadProductsFromSupabase();
      
      setSelectedImage(null);
      setImagePreview('');
      
      return result;
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error);
      setSyncStatus('❌ فشل حفظ المنتج');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      
      if (typeof orderId === 'number') {
        orderId = orderId.toString();
      }
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('خطأ في تحديث الحالة:', error);
        
        // إذا كان الخطأ بسبب RLS، حاول تحديث الحالة فقط
        if (error.code === '42501' || error.message.includes('row-level security')) {
          alert('⚠️ ليس لديك صلاحية تحديث الطلبات. يرجى التواصل مع المسؤول.');
        }
        throw error;
      }
      
      await loadOrdersFromSupabase();
      
      alert(`تم تحديث حالة الطلب إلى "${getStatusText(newStatus)}"`);
      return true;
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      alert('فشل تحديث حالة الطلب');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    try {
      setLoading(true);
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) console.error('خطأ في حذف عناصر الطلب:', itemsError);
      
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;
      
      await loadOrdersFromSupabase();
      
      alert('تم حذف الطلب بنجاح');
    } catch (error) {
      console.error('خطأ في حذف الطلب:', error);
      alert('فشل حذف الطلب');
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderTotal = (order) => {
    if (order.total_price) return parseFloat(order.total_price);
    
    if (order.total_amount) return parseFloat(order.total_amount);
    
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.reduce((total, item) => {
        const price = parseFloat(item.product_price || item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return total + (price * quantity);
      }, 0);
    }
    
    return 0;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'قيد الانتظار',
      'processing': 'قيد التجهيز',
      'shipped': 'تم الشحن',
      'delivered': 'تم التوصيل',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'active': 'نشط',
      'inactive': 'غير نشط',
      'out_of_stock': 'نفذ من المخزون',
      'archived': 'مؤرشف'
    };
    
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#f59e0b',
      'processing': '#3b82f6',
      'shipped': '#8b5cf6',
      'delivered': '#10b981',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'active': '#10b981',
      'inactive': '#6b7280',
      'out_of_stock': '#ef4444',
      'archived': '#8b5cf6'
    };
    
    return colorMap[status] || '#6c757d';
  };

  const changeProductStatus = async (productId, newStatus) => {
    const statusText = getStatusText(newStatus);
    
    if (window.confirm(`هل تريد تغيير حالة المنتج إلى "${statusText}"؟`)) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('products')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (error) throw error;
        
        alert(`✅ تم تغيير حالة المنتج إلى ${statusText}`);
        await loadProductsFromSupabase();
        
      } catch (error) {
        console.error('خطأ في تغيير حالة المنتج:', error);
        alert(`❌ فشل تغيير الحالة: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟\nهذا الإجراء لا يمكن التراجع عنه!')) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) {
          if (error.code === '42501') {
            alert('❌ ليس لديك صلاحية حذف المنتجات\nيرجى التواصل مع المسؤول');
          } else {
            alert(`❌ فشل حذف المنتج: ${error.message}`);
          }
          return;
        }
        
        alert('✅ تم حذف المنتج بنجاح');
        
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        localStorage.setItem('vix_products', JSON.stringify(updatedProducts));
        
      } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        alert('⚠️ حدث خطأ غير متوقع أثناء الحذف');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      image: product.image,
      colors: product.colors || ['#000000', '#C41E3A', '#1E3A8A'],
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      stock: product.stock || 10,
      rating: product.rating || 4.5
    });
    setImagePreview(product.image || '');
    setSelectedImage(null);
    setActiveTab('products');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleColorChange = (index, color) => {
    const newColors = [...formData.colors];
    newColors[index] = color;
    setFormData({
      ...formData,
      colors: newColors
    });
  };

  const addColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, '#000000']
    });
  };

  const removeColor = (index) => {
    if (formData.colors.length > 1) {
      const newColors = formData.colors.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        colors: newColors
      });
    }
  };

  const handleSizeChange = (index, size) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = size;
    setFormData({
      ...formData,
      sizes: newSizes
    });
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, 'M']
    });
  };

  const removeSize = (index) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        sizes: newSizes
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image && !selectedImage) {
      alert('⚠️ الرجاء إضافة صورة للمنتج');
      return;
    }
    
    try {
      await saveProductToSupabase(formData);
      
      setFormData({
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
      
      setEditingProduct(null);
      setActiveTab('products');
    } catch (error) {
      alert('حدث خطأ أثناء حفظ المنتج.');
    }
  };

  const filteredProducts = products.filter(product => {
    if (productStatusFilter !== 'all' && product.status !== productStatusFilter) {
      return false;
    }
    
    if (productCategoryFilter !== 'all' && product.category !== productCategoryFilter) {
      return false;
    }
    
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const filteredOrders = orders.filter(order => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
      return false;
    }
    
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      if (dateFilter === 'today') {
        return orderDate.toDateString() === today.toDateString();
      }
      
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return orderDate >= weekAgo;
      }
      
      if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return orderDate >= monthAgo;
      }
    }
    
    return true;
  });

  const StatsCard = ({ title, value, color, icon }) => (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: color }}>{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>لوحة إدارة VIX - متصل بـ Supabase</h1>
        <div className="admin-actions">
          <button onClick={onBack} className="admin-btn">🏠 العودة للرئيسية</button>
          <button onClick={onLogout} className="logout-btn">🚪 تسجيل الخروج</button>
          <button 
            onClick={() => {
              if (activeTab === 'products') loadProductsFromSupabase();
              else loadOrdersFromSupabase();
            }} 
            className="sync-btn"
            disabled={loading}
          >
            🔄 {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
          </button>
        </div>
      </div>

      <div className="sync-status">
        <p>{syncStatus}</p>
      </div>

      <div className="stats-container">
        <StatsCard 
          title="إجمالي الطلبات" 
          value={orderStats.total} 
          color="#1E3A8A"
          icon="📦"
        />
        <StatsCard 
          title="قيد الانتظار" 
          value={orderStats.pending} 
          color="#f59e0b"
          icon="⏳"
        />
        <StatsCard 
          title="مكتملة" 
          value={orderStats.completed} 
          color="#10b981"
          icon="✅"
        />
        <StatsCard 
          title="الإيرادات" 
          value={`${orderStats.totalRevenue.toFixed(2)} جنيه`} 
          color="#8b5cf6"
          icon="💰"
        />
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 المنتجات ({products.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          🛒 الطلبات ({orders.length})
        </button>
      </div>

      <div className="admin-container">
        {activeTab === 'products' ? (
          <div className="products-tab">
            <div className="admin-form-section">
              <h2>{editingProduct ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}</h2>
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>اسم المنتج:</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      placeholder="قميص VIX الكلاسيكي"
                    />
                  </div>
                  <div className="form-group">
                    <label>السعر (جنيه):</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="1"
                      step="0.01"
                      disabled={loading}
                      placeholder="299"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>الفئة:</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    >
                      <option value="">اختر الفئة</option>
                      <option value="قمصان">قمصان</option>
                      <option value="جاكيتات">جاكيتات</option>
                      <option value="بناطيل">بناطيل</option>
                      <option value="تيشيرتات">تيشيرتات</option>
                      <option value="هودي">هودي</option>
                      <option value="معاطف">معاطف</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>المخزون:</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      disabled={loading}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>صورة المنتج:</label>
                  <div className="image-upload-section">
                    <div className="upload-options">
                      <label className="upload-btn">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          disabled={loading || uploadingImage}
                          className="file-input"
                        />
                        <span className="btn-content">
                          📁 اختر صورة من جهازك
                        </span>
                      </label>
                      
                      <div className="or-separator">أو</div>
                      
                      <div className="url-input-container">
                        <input
                          type="url"
                          name="image"
                          value={formData.image}
                          onChange={handleImageUrlChange}
                          placeholder="أدخل رابط الصورة"
                          disabled={loading || selectedImage}
                          className="url-input"
                        />
                        <small className="url-note">رابط الصورة (اختياري إذا اخترت صورة)</small>
                      </div>
                    </div>
                    
                    {(imagePreview || formData.image) && (
                      <div className="image-preview-container">
                        <p className="preview-title">معاينة الصورة:</p>
                        <div className="preview-image-wrapper">
                          <img 
                            src={imagePreview || formData.image} 
                            alt="معاينة المنتج" 
                            className="preview-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x300?text=صورة+غير+متوفرة';
                            }}
                          />
                          {selectedImage && (
                            <div className="image-info">
                              <span className="file-name">{selectedImage.name}</span>
                              <span className="file-size">
                                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, image: '' }));
                          }}
                          disabled={loading || uploadingImage}
                        >
                          ✕ حذف الصورة
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="image-tips">
                    <small>💡 يمكنك اختيار صورة من جهازك (JPG, PNG, GIF - بحد أقصى 5MB)</small>
                    <small>💡 أو استخدام رابط صورة من الإنترنت</small>
                  </div>
                </div>

                <div className="form-group">
                  <label>وصف المنتج:</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    disabled={loading}
                    placeholder="وصف مفصل للمنتج..."
                    className="description-textarea"
                  />
                </div>

                <div className="form-group">
                  <label>الألوان المتاحة:</label>
                  <div className="colors-section">
                    <div className="colors-list">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="color-item">
                          <div className="color-preview" style={{ backgroundColor: color }}>
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => handleColorChange(index, e.target.value)}
                              disabled={loading}
                              className="color-picker"
                            />
                          </div>
                          <div className="color-input-wrapper">
                            <input
                              type="text"
                              value={color}
                              onChange={(e) => handleColorChange(index, e.target.value)}
                              disabled={loading}
                              className="color-input"
                              placeholder="#000000"
                            />
                            <button
                              type="button"
                              className="remove-color-btn"
                              onClick={() => removeColor(index)}
                              disabled={formData.colors.length <= 1 || loading}
                              title="حذف اللون"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      className="add-color-btn"
                      onClick={addColor}
                      disabled={loading}
                    >
                      <span className="plus-icon">+</span> إضافة لون جديد
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>المقاسات المتاحة:</label>
                  <div className="sizes-section">
                    <div className="sizes-list">
                      {formData.sizes.map((size, index) => (
                        <div key={index} className="size-item">
                          <input
                            type="text"
                            value={size}
                            onChange={(e) => handleSizeChange(index, e.target.value)}
                            maxLength="4"
                            disabled={loading}
                            className="size-input"
                            placeholder="S"
                          />
                          <button
                            type="button"
                            className="remove-size-btn"
                            onClick={() => removeSize(index)}
                            disabled={formData.sizes.length <= 1 || loading}
                            title="حذف المقاس"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      className="add-size-btn"
                      onClick={addSize}
                      disabled={loading}
                    >
                      <span className="plus-icon">+</span> إضافة مقاس جديد
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading || uploadingImage}
                  >
                    {loading ? 'جاري الحفظ...' : 
                     uploadingImage ? 'جاري رفع الصورة...' : 
                     (editingProduct ? '💾 تحديث المنتج' : '➕ إضافة المنتج')}
                  </button>
                  
                  {editingProduct && (
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setEditingProduct(null);
                        setFormData({
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
                        setSelectedImage(null);
                        setImagePreview('');
                      }}
                      disabled={loading || uploadingImage}
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="products-list-section">
              <div className="section-header">
                <h2>المنتجات الحالية ({filteredProducts.length} من {products.length})</h2>
                <div className="filters">
                  <input
                    type="text"
                    placeholder="🔍 ابحث عن منتج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <select 
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="active">🟢 نشط</option>
                    <option value="inactive">⚫ غير نشط</option>
                    <option value="out_of_stock">🔴 نفذ من المخزون</option>
                    <option value="archived">📦 مؤرشف</option>
                  </select>
                  <select 
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">جميع الفئات</option>
                    <option value="قمصان">قمصان</option>
                    <option value="جاكيتات">جاكيتات</option>
                    <option value="بناطيل">بناطيل</option>
                    <option value="تيشيرتات">تيشيرتات</option>
                    <option value="هودي">هودي</option>
                    <option value="معاطف">معاطف</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="no-data">
                  <p>📭 لا توجد منتجات تطابق معايير البحث</p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="product-card">
                      <div className="product-image-container">
                        <img 
                          src={product.image || 'https://via.placeholder.com/300x300?text=لا+توجد+صورة'} 
                          alt={product.name}
                          className="product-image"
                        />
                        <div className="product-status-badge" style={{ backgroundColor: getStatusColor(product.status || 'active') }}>
                          {getStatusText(product.status || 'active')}
                        </div>
                      </div>

                      <div className="product-info">
                        <div className="product-header">
                          <h3 className="product-name">{product.name}</h3>
                          <div className="product-price">{product.price} جنيه</div>
                        </div>
                        
                        <div className="product-category">📂 {product.category || 'غير محدد'}</div>
                        
                        <div className="product-stock">
                          <span className="stock-label">المخزون:</span>
                          <span className={`stock-value ${product.stock < 5 ? 'low' : 'good'}`}>
                            {product.stock || 0} قطعة
                          </span>
                        </div>
                        
                        {product.colors && product.colors.length > 0 && (
                          <div className="product-colors">
                            <div className="colors-label">الألوان:</div>
                            <div className="colors-list">
                              {product.colors.slice(0, 3).map((color, index) => (
                                <div 
                                  key={index}
                                  className="color-chip"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                              {product.colors.length > 3 && (
                                <span className="more-colors">+{product.colors.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="product-sizes">
                            <div className="sizes-label">المقاسات:</div>
                            <div className="sizes-list">
                              {product.sizes.slice(0, 4).map((size, index) => (
                                <span key={index} className="size-chip">
                                  {size}
                                </span>
                              ))}
                              {product.sizes.length > 4 && (
                                <span className="more-sizes">+{product.sizes.length - 4}</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="product-rating">
                          <div className="stars">
                            {Array(5).fill(0).map((_, index) => (
                              <span 
                                key={index} 
                                className={`star ${index < Math.round(product.rating || 0) ? 'filled' : ''}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="rating-number">({product.rating || 0})</span>
                        </div>
                        
                        <div className="product-actions">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(product)}
                            disabled={loading}
                          >
                            ✏️ تعديل
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(product.id)}
                            disabled={loading}
                          >
                            🗑️ حذف
                          </button>
                          
                          <select 
                            className="status-dropdown"
                            value={product.status || 'active'}
                            onChange={(e) => changeProductStatus(product.id, e.target.value)}
                            disabled={loading}
                            style={{
                              backgroundColor: getStatusColor(product.status || 'active'),
                              color: 'white'
                            }}
                          >
                            <option value="active">🟢 نشط</option>
                            <option value="inactive">⚫ غير نشط</option>
                            <option value="out_of_stock">🔴 نفذ</option>
                            <option value="archived">📦 مؤرشف</option>
                          </select>
                        </div>
                        
                        {product.sku && (
                          <div className="product-sku">
                            <small>SKU: {product.sku}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="orders-section">
            <div className="section-header">
              <h2>الطلبات الواردة ({filteredOrders.length} من {orders.length})</h2>
              <div className="filters">
                <select 
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">⏳ قيد الانتظار</option>
                  <option value="processing">🔄 قيد التجهيز</option>
                  <option value="shipped">🚚 تم الشحن</option>
                  <option value="delivered">📦 تم التوصيل</option>
                  <option value="completed">✅ مكتمل</option>
                  <option value="cancelled">❌ ملغي</option>
                </select>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">كل التواريخ</option>
                  <option value="today">اليوم</option>
                  <option value="week">آخر أسبوع</option>
                  <option value="month">آخر شهر</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading">⏳ جاري تحميل الطلبات...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="no-data">
                <p>📭 لا توجد طلبات تطابق معايير البحث</p>
              </div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>العميل</th>
                      <th>التواصل</th>
                      <th>المنتجات</th>
                      <th>الإجمالي</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="order-row">
                        <td>
                          <strong>#ORD{order.id.toString().slice(-8)}</strong>
                        </td>
                        <td>
                          <div className="customer-info">
                            <strong>{order.customer_name}</strong>
                            <small>{order.customer_email}</small>
                            <div className="address">{order.customer_address}</div>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <div className="phone">📞 {order.customer_phone}</div>
                            {order.customer_notes && (
                              <div className="notes">📝 {order.customer_notes}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="order-items">
                            {order.order_items && order.order_items.map((item, index) => (
                              <div key={index} className="order-item">
                                <div className="item-header">
                                  <span className="item-name">{item.product?.name || item.product_name || 'منتج'}</span>
                                  <span className="item-quantity">× {item.quantity}</span>
                                </div>
                                <div className="item-details">
                                  {item.color && (
                                    <span className="item-color">
                                      <span 
                                        className="color-indicator" 
                                        style={{ backgroundColor: item.color }}
                                      />
                                      {item.color}
                                    </span>
                                  )}
                                  {item.size && (
                                    <span className="item-size">📏 {item.size}</span>
                                  )}
                                  <span className="item-price">💰 {(item.product_price || item.price || 0) * (item.quantity || 1)} جنيه</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <strong className="order-total">
                            {calculateOrderTotal(order).toFixed(2)} جنيه
                          </strong>
                        </td>
                        <td>
                          <select 
                            className="status-select"
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={loading}
                            style={{
                              backgroundColor: getStatusColor(order.status),
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              minWidth: '150px'
                            }}
                          >
                            <option value="pending" style={{backgroundColor: '#f59e0b', color: '#000'}}>
                              ⏳ قيد الانتظار
                            </option>
                            <option value="processing" style={{backgroundColor: '#3b82f6', color: 'white'}}>
                              🔄 قيد التجهيز
                            </option>
                            <option value="shipped" style={{backgroundColor: '#8b5cf6', color: 'white'}}>
                              🚚 تم الشحن
                            </option>
                            <option value="delivered" style={{backgroundColor: '#10b981', color: 'white'}}>
                              📦 تم التوصيل
                            </option>
                            <option value="completed" style={{backgroundColor: '#10b981', color: 'white'}}>
                              ✅ مكتمل
                            </option>
                            <option value="cancelled" style={{backgroundColor: '#ef4444', color: 'white'}}>
                              ❌ ملغي
                            </option>
                          </select>
                        </td>
                        <td>
                          {new Date(order.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <div className="order-actions">
                            <button 
                              className="view-btn"
                              onClick={() => {
                                const orderDetails = `
                                  تفاصيل الطلب #${order.id}
                                  
                                  العميل: ${order.customer_name}
                                  الهاتف: ${order.customer_phone}
                                  العنوان: ${order.customer_address}
                                  
                                  المنتجات:
                                  ${order.order_items?.map(item => 
                                    `- ${item.product_name} (${item.quantity} × ${item.product_price} جنيه)`
                                  ).join('\n')}
                                  
                                  الإجمالي: ${calculateOrderTotal(order).toFixed(2)} جنيه
                                  الحالة: ${getStatusText(order.status)}
                                  التاريخ: ${new Date(order.created_at).toLocaleString('ar-EG')}
                                `;
                                alert(orderDetails);
                              }}
                            >
                              👁️ عرض
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => deleteOrder(order.id)}
                              disabled={loading}
                            >
                              🗑️ حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-panel {
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #000000;
          min-height: 100vh;
          color: #fff;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 24px;
          color: #fff;
        }

        .admin-actions {
          display: flex;
          gap: 10px;
        }

        .admin-btn, .logout-btn, .sync-btn {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .sync-btn {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .admin-btn:hover, .logout-btn:hover, .sync-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sync-status {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.1);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-content h3 {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #9ca3af;
        }

        .stat-value {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }

        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 1px solid #333;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #9ca3af;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-btn.active {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border-bottom: 3px solid #3b82f6;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .admin-container {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .section-header h2 {
          margin: 0;
          color: #fff;
          font-size: 20px;
        }

        .filters {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-input, .filter-select {
          background: rgba(255, 255, 255, 1);
          border: 1px solid #333;
          color: #000000ff;
          padding: 8px 12px;
          border-radius: 6px;
          min-width: 150px;
        }

        .search-input:focus, .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .product-image-container{
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .product-image-container img{
        object-fit: contain;
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-card:hover .product-image {
          transform: scale(1.05);
        }

        .product-status-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          text-transform: uppercase;
        }

        .product-info {
          padding: 15px;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .product-name {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          flex: 1;
        }

        .product-price {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 18px;
          margin-right: 10px;
        }

        .product-category {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .product-stock {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .stock-label {
          color: #9ca3af;
          font-size: 14px;
        }

        .stock-value {
          font-weight: bold;
          font-size: 16px;
        }

        .stock-value.good {
          color: #10b981;
        }

        .stock-value.low {
          color: #ef4444;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .product-colors, .product-sizes {
          margin-bottom: 12px;
        }

        .colors-label, .sizes-label {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .colors-list, .sizes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .color-chip {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .color-chip:hover {
          transform: scale(1.2);
          border-color: white;
        }

        .size-chip {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          min-width: 30px;
          text-align: center;
        }

        .more-colors, .more-sizes {
          color: #9ca3af;
          font-size: 12px;
          margin-right: 5px;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 15px;
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .star {
          color: #6b7280;
          font-size: 16px;
        }

        .star.filled {
          color: #fbbf24;
        }

        .rating-number {
          color: #9ca3af;
          font-size: 14px;
        }

        .product-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .edit-btn {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .delete-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        .status-dropdown {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }

        .product-sku {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .products-table-container, .orders-table-container {
          overflow-x: auto;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
        }

        .products-table, .orders-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        .orders-table th {
          background: rgba(255, 255, 255, 0.05);
          color: #9ca3af;
          padding: 15px;
          text-align: right;
          font-weight: 500;
          border-bottom: 1px solid #333;
        }

        .order-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.3s ease;
        }

        .order-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .orders-table td {
          padding: 15px;
          color: #fff;
          vertical-align: top;
        }

        .no-data, .loading {
          text-align: center;
          padding: 50px;
          color: #9ca3af;
          font-size: 18px;
        }

        .loading {
          color: #60a5fa;
        }

        .customer-info, .contact-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .order-items {
          max-height: 150px;
          overflow-y: auto;
        }

        .order-item {
          padding: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .item-details {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #9ca3af;
        }

        .color-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-left: 5px;
          vertical-align: middle;
        }

        .order-actions {
          display: flex;
          gap: 5px;
        }

        .view-btn, .delete-btn {
          padding: 6px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .view-btn {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
        }

        .view-btn:hover, .delete-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
          
          .product-form .form-row {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .filters {
            width: 100%;
          }
          
          .search-input, .filter-select {
            flex: 1;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
          
          .product-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
