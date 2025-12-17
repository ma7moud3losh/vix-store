// خدمة التخزين المحلي
export const storage = {
  // حفظ المنتجات
  saveProducts: (products) => {
    try {
      localStorage.setItem('vix_products', JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  },

  // تحميل المنتجات
  loadProducts: () => {
    try {
      const products = localStorage.getItem('vix_products');
      return products ? JSON.parse(products) : [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  },

  // حفظ حالة الإدارة
  saveAdminStatus: (isAdmin) => {
    localStorage.setItem('vix_admin', isAdmin ? 'true' : 'false');
  },

  // تحميل حالة الإدارة
  loadAdminStatus: () => {
    return localStorage.getItem('vix_admin') === 'true';
  },

  // تحويل الصورة لـ base64
  imageToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
};