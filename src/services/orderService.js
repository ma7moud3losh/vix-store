// src/services/orderService.js - نسخة محدثة
import { supabase } from './supabase';

export const orderService = {
  async saveOrder(orderData) {
    try {
      console.log('📦 حفظ الطلب:', orderData);
      
      // التحقق من صحة الجلسة أولاً
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error:', sessionError);
        // يمكنك الاستمرار بدون جلسة إذا سمحت سياسات RLS
      }
      
      // بيانات الطلب الأساسية
      const order = {
        customer_name: orderData.customerInfo.name,
        customer_phone: orderData.customerInfo.phone,
        customer_address: orderData.customerInfo.address,
        customer_notes: orderData.customerInfo.notes || '',
        total_price: orderData.totalPrice,
        items_count: orderData.cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
        status: 'pending',
        payment_method: 'cash_on_delivery',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // إضافة user_id إذا كان المستخدم مسجلاً دخوله
        ...(session?.user?.id && { user_id: session.user.id })
      };

      // محاولة إدخال الطلب
      let orderResult, orderError;
      
      try {
        console.log('محاولة إدخال الطلب...');
        const result = await supabase
          .from('orders')
          .insert([order])
          .select('id')
          .single();
        
        orderResult = result.data;
        orderError = result.error;
        
      } catch (error) {
        console.error('Insert error:', error);
        
        // إذا كان الخطأ بسبب JWT، حاول تسجيل الدخول كـ anonymous
        if (error.message.includes('JWT') || error.code === 401) {
          console.log('JWT error detected, trying anonymous auth...');
          
          // محاولة الدخول كـ anonymous user
          await this.tryAnonymousAuth();
          
          // إعادة المحاولة
          const retryResult = await supabase
            .from('orders')
            .insert([order])
            .select('id')
            .single();
          
          orderResult = retryResult.data;
          orderError = retryResult.error;
        } else {
          throw error;
        }
      }

      if (orderError) {
        console.error('Order insert error:', orderError);
        
        // رسائل خطأ واضحة
        if (orderError.message.includes('JWT')) {
          throw new Error('خطأ في مصادقة المستخدم. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.');
        }
        throw orderError;
      }

      const orderId = orderResult.id;
      console.log('تم إنشاء الطلب برقم:', orderId);

      // إدخال عناصر الطلب
      const orderItems = orderData.cart.map(item => ({
        order_id: orderId,
        product_id: item.id || null,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity || 1,
        color: item.selectedColor || null,
        size: item.selectedSize || null
      }));

      console.log('إدخال عناصر الطلب...');
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items insert error:', itemsError);
        
        // حذف الطلب إذا فشلت العناصر
        await supabase.from('orders').delete().eq('id', orderId);
        throw itemsError;
      }

      return {
        success: true,
        orderId: orderId,
        message: 'تم حفظ الطلب بنجاح'
      };

    } catch (error) {
      console.error('Error saving order:', error);
      
      let userFriendlyError = 'فشل في حفظ الطلب';
      
      if (error.message.includes('JWT')) {
        userFriendlyError = 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.';
      } else if (error.code === 401) {
        userFriendlyError = 'خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.';
      } else if (error.code === 42501) {
        userFriendlyError = 'لا تملك الصلاحية لإضافة طلب جديد.';
      }
      
      return {
        success: false,
        error: userFriendlyError,
        originalError: error.message
      };
    }
  },

  // دالة للمصادقة المجهولة
  async tryAnonymousAuth() {
    try {
      // إنشاء معرف فريد للمستخدم المجهول
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email: `${anonymousId}@anonymous.com`,
        password: 'anonymous_password_' + Date.now()
      });
      
      // إذا فشل تسجيل الدخول، جرب signUp بدلاً من signIn
      if (error) {
        console.log('Trying anonymous sign up...');
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${anonymousId}@anonymous.com`,
          password: 'anonymous_password_' + Date.now(),
          options: {
            data: {
              name: 'مشتري',
              is_anonymous: true
            }
          }
        });
        
        if (signUpError) {
          console.warn('Anonymous auth failed:', signUpError);
        }
      }
      
    } catch (authError) {
      console.warn('Anonymous auth attempt failed:', authError);
    }
  }
};