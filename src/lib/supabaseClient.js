// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// استخدم هذه القيم مباشرة (تأكد من نسخها من Supabase)
const supabaseUrl = 'https://ootgcnmthcwqkhtdbsue.supabase.co' // تأكد من هذا الرابط

// المفتاح الصحيح من Supabase (ابدأ بهذا)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdGdjbm10aGN3cWtodGRic3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjY5NzksImV4cCI6MjA4MTU0Mjk3OX0.JP0uy3TLUDxTcD_KLm3KTRnp5hR5f48ipqXsxCrpu00'

console.log('📌 محاولة الاتصال بـ Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length || 'غير موجود');

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// دالة اختبار بسيطة
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 اختبار الاتصال بـ Supabase...');
    
    // محاولة قراءة بسيطة
    const { data, error } = await supabase
      .from('orders')
      .select('count')
      .limit(1)
      .single()
      .catch(() => ({ data: null, error: { message: 'خطأ في الاتصال' } }));

    if (error) {
      console.error('❌ خطأ:', error.message);
      return false;
    }
    
    console.log('✅ الاتصال ناجح!');
    return true;
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
    return false;
  }
}