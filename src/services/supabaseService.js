import supabase from '../config/supabase';

// ==================== خدمات المنتجات ====================

export const productService = {
  // جلب جميع المنتجات
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // جلب منتج بواسطة ID
  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // إضافة منتج جديد
  async addProduct(product) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            ...product,
            colors: JSON.stringify(product.colors || []),
            sizes: JSON.stringify(product.sizes || []),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // تحديث منتج
  async updateProduct(id, updates) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          colors: JSON.stringify(updates.colors || []),
          sizes: JSON.stringify(updates.sizes || []),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // حذف منتج
  async deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // جلب المنتجات حسب الفئة
  async getProductsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // البحث في المنتجات
  async searchProducts(query) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
};

// ==================== خدمات الطلبات ====================

export const orderService = {
  // إنشاء طلب جديد
  async createOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            ...orderData,
            items: JSON.stringify(orderData.items || []),
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // جلب جميع الطلبات
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // تحديث حالة الطلب
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};

// ==================== خدمات الصور ====================

export const imageService = {
  // رفع صورة إلى Storage
  async uploadImage(file, folder = 'products') {
    try {
      const fileName = `${folder}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('vix-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // الحصول على رابط عام للصورة
      const { data: urlData } = supabase.storage
        .from('vix-images')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // حذف صورة
  async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from('vix-images')
        .remove([filePath]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // جلب جميع الصور من مجلد
  async getImagesFromFolder(folder = 'products') {
    try {
      const { data, error } = await supabase.storage
        .from('vix-images')
        .list(folder);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }
};

// ==================== خدمات المصادقة ====================

export const authService = {
  // تسجيل دخول الإدارة
  async adminLogin(username, password, secret) {
    try {
      // تحقق من بيانات الدخول في جدول المستخدمين
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('secret_key', secret)
        .single();
      
      if (error) throw new Error('Invalid credentials');
      
      // حفظ جلسة المستخدم
      localStorage.setItem('vix_admin_token', data.id);
      localStorage.setItem('vix_admin_user', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // تسجيل خروج
  logout() {
    localStorage.removeItem('vix_admin_token');
    localStorage.removeItem('vix_admin_user');
    window.location.href = '/';
  },

  // التحقق من حالة تسجيل الدخول
  isAuthenticated() {
    const token = localStorage.getItem('vix_admin_token');
    const user = localStorage.getItem('vix_admin_user');
    return !!(token && user);
  },

  // جلب بيانات المستخدم الحالي
  getCurrentUser() {
    const user = localStorage.getItem('vix_admin_user');
    return user ? JSON.parse(user) : null;
  }
};

// ==================== خدمات الإحصائيات ====================

export const statsService = {
  // جلب إحصائيات المتجر
  async getStoreStats() {
    try {
      // عدد المنتجات
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      // عدد الطلبات
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      // إجمالي المبيعات
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount');
      
      const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // الفئات الأكثر مبيعاً
      const { data: categoriesData } = await supabase
        .from('products')
        .select('category, sales_count');
      
      const bestCategory = categoriesData?.reduce((prev, current) => 
        (prev.sales_count || 0) > (current.sales_count || 0) ? prev : current
      )?.category || 'None';
      
      return {
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalSales,
        bestCategory
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // تحديث عداد المبيعات للمنتج
  async updateProductSales(productId) {
    try {
      // جلب المنتج الحالي
      const { data: product } = await supabase
        .from('products')
        .select('sales_count')
        .eq('id', productId)
        .single();
      
      const newCount = (product?.sales_count || 0) + 1;
      
      const { error } = await supabase
        .from('products')
        .update({ sales_count: newCount })
        .eq('id', productId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating sales count:', error);
      throw error;
    }
  }
};

// ==================== خدمات متقدمة ====================

export const advancedService = {
  // تنزيل نسخة احتياطية من البيانات
  async backupData() {
    try {
      const [products, orders, users] = await Promise.all([
        productService.getAllProducts(),
        orderService.getAllOrders(),
        supabase.from('admin_users').select('*')
      ]);
      
      const backup = {
        timestamp: new Date().toISOString(),
        products: products.data || products,
        orders: orders.data || orders,
        users: users.data || []
      };
      
      // يمكنك حفظها في Storage أو إرجاعها للتحميل
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  // استيراد البيانات
  async importData(data) {
    try {
      // استيراد المنتجات
      if (data.products && data.products.length > 0) {
        for (const product of data.products) {
          await productService.addProduct(product);
        }
      }
      
      // استيراد المستخدمين (إذا كان هناك صلاحية)
      if (data.users && data.users.length > 0) {
        for (const user of data.users) {
          await supabase.from('admin_users').insert(user);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  // جلب سجل التعديلات
  async getAuditLog() {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }
};

// ==================== خدمات التخزين المحلي (Fallback) ====================

export const fallbackService = {
  // دعم التخزين المحلي إذا تعطل Supabase
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(`vix_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(`vix_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }
};

// تصدير جميع الخدمات
export default {
  productService,
  orderService,
  imageService,
  authService,
  statsService,
  advancedService,
  fallbackService,
  testConnection: async () => {
    try {
      const { data, error } = await supabase.from('products').select('count');
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
};