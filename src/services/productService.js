// src/services/productService.js
import { supabase } from './supabase';

export const productService = {
  // جلب جميع المنتجات
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, products: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // جلب منتج واحد
  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, product: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // إضافة منتج جديد
  async createProduct(productData) {
    try {
      // التحقق من الصلاحيات
      const canCreate = await this.checkPermission('create');
      if (!canCreate) {
        throw new Error('ليس لديك صلاحية إضافة منتجات');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return { success: true, product: data[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // تحديث منتج
  async updateProduct(id, updates) {
    try {
      // التحقق من الصلاحيات
      const canUpdate = await this.checkPermission('update');
      if (!canUpdate) {
        throw new Error('ليس لديك صلاحية تعديل المنتجات');
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, product: data[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // حذف منتج
  async deleteProduct(id) {
    try {
      // التحقق من الصلاحيات (المسؤول فقط)
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('فقط المسؤولون يمكنهم حذف المنتجات');
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'تم حذف المنتج بنجاح' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // تغيير حالة المنتج
  async changeProductStatus(id, newStatus) {
    try {
      // التحقق من الصلاحيات
      const canUpdate = await this.checkPermission('update');
      if (!canUpdate) {
        throw new Error('ليس لديك صلاحية تغيير حالة المنتج');
      }

      // التحقق من صحة الحالة
      const validStatuses = ['active', 'inactive', 'out_of_stock', 'archived'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('حالة غير صالحة');
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          status: newStatus,
          last_status_change: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { 
        success: true, 
        product: data[0],
        message: `تم تغيير حالة المنتج إلى ${this.getStatusText(newStatus)}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // التحقق من الصلاحيات
  async checkPermission(action) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = roleData?.role || 'customer';

      // صلاحيات حسب الدور
      const permissions = {
        'admin': ['read', 'create', 'update', 'delete'],
        'editor': ['read', 'create', 'update'],
        'viewer': ['read'],
        'customer': ['read']
      };

      return permissions[role]?.includes(action) || false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  },

  // التحقق إذا كان مسؤولاً
  async isAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return roleData?.role === 'admin';
    } catch (error) {
      return false;
    }
  },

  // نص الحالة
  getStatusText(status) {
    const statusMap = {
      'active': '🟢 نشط',
      'inactive': '⚫ غير نشط',
      'out_of_stock': '🔴 نفذ من المخزون',
      'archived': '📦 مؤرشف'
    };
    return statusMap[status] || status;
  },

  // لون الحالة
  getStatusColor(status) {
    const colorMap = {
      'active': '#10b981',
      'inactive': '#6b7280',
      'out_of_stock': '#ef4444',
      'archived': '#8b5cf6'
    };
    return colorMap[status] || '#6b7280';
  },

  // الحالات المتاحة
  getAvailableStatuses(currentStatus) {
    const allStatuses = [
      { value: 'active', label: '🟢 نشط', description: 'المنتج متاح للبيع' },
      { value: 'inactive', label: '⚫ غير نشط', description: 'المنتج غير متاح مؤقتاً' },
      { value: 'out_of_stock', label: '🔴 نفذ من المخزون', description: 'المنتج غير متاح حالياً' },
      { value: 'archived', label: '📦 مؤرشف', description: 'المنتج غير معروض' }
    ];

    // يمكنك إضافة منطق للتحكم في الانتقالات
    return allStatuses;
  }
};