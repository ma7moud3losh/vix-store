import React, { useState, useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import Products from './Products';
import About from './About';
import Footer from './Footer';
import CartPopup from './CartPopup';
import { productsData } from '../data/products';

const HomePage = () => {
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // تحميل المنتجات من localStorage أو البيانات الافتراضية
    const savedProducts = JSON.parse(localStorage.getItem('vixProducts'));
    if (savedProducts && savedProducts.length > 0) {
      setProducts(savedProducts);
    } else {
      setProducts(productsData);
    }
  }, []);

  const addToCart = (product, selectedColor, selectedSize) => {
    const cartItem = {
      ...product,
      selectedColor,
      selectedSize,
      cartId: Date.now(),
      quantity: 1
    };
    
    setCart([...cart, cartItem]);
    setCartVisible(true);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  return (
    <>
      <Header cartCount={cart.length} onCartClick={() => setCartVisible(true)} />
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
      />
    </>
  );
};

export default HomePage;