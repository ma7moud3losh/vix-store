import { createClient } from '@supabase/supabase-js';

// استبدل هذه القيم بروابط Supabase الخاصة بك
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ootgcnmthcwqkhtdbsue.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdGdjbm10aGN3cWtodGRic3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjY5NzksImV4cCI6MjA4MTU0Mjk3OX0.JP0uy3TLUDxTcD_KLm3KTRnp5hR5f48ipqXsxCrpu00';

// إنشاء العميل
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// دالة لاختبار الاتصال
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count');
    if (error) throw error;
    console.log('✅ الاتصال بـ Supabase ناجح');
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بـ Supabase:', error.message);
    return false;
  }
};

// دالة لحفظ بيانات تجريبية
export const seedSampleData = async () => {
  try {
    // تحقق إذا كان هناك منتجات بالفعل
    const { data: existingProducts } = await supabase.from('products').select('*');
    
    if (!existingProducts || existingProducts.length === 0) {
      // إضافة منتجات تجريبية
      const sampleProducts = [
        {
          name: "قميص VIX الكلاسيكي",
          price: 299,
          category: "قمصان",
          description: "قميص قطني عالي الجودة بتصميم كلاسيكي وأنيق",
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          colors: ["#000000", "#1E3A8A", "#374151", "#C41E3A"],
          sizes: ["S", "M", "L", "XL"],
          stock: 15,
          rating: 4.8,
          sku: "VIX-SHIRT-001"
        },
        {
          name: "جاكيت جلد طبيعي",
          price: 899,
          category: "جاكيتات",
          description: "جاكيت جلد طبيعي عالي الجودة بتصميم عصري",
          image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          colors: ["#000000", "#8B4513", "#654321"],
          sizes: ["M", "L", "XL", "XXL"],
          stock: 8,
          rating: 4.9,
          sku: "VIX-JACKET-001"
        }
      ];

      const { error } = await supabase.from('products').insert(sampleProducts);
      
      if (error) throw error;
      console.log('✅ تم إضافة بيانات تجريبية');
    }
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات التجريبية:', error.message);
  }
};