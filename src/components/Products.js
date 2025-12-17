import React, { useState } from 'react';
import ProductCard from './ProductCard';

const Products = ({ products, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  const categories = ['الكل', ...new Set(products.map(p => p.category))];

  const filteredProducts = selectedCategory === 'الكل' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  return (
    <section className="products-section" id="products">
      <div className="container">
        <div className="section-header fade-in">
          <h2 className="section-title">مجموعتنا الحصرية</h2>
          <p className="section-subtitle">تصاميم فريدة تلبي ذوق الرجل العصري</p>
        </div>
        
        <div className="categories-filter fade-in">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
                
              {category}
            </button>
          ))}
        </div>
        
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
              />
            ))
          ) : (
            <div className="no-products">
              <p>لا توجد منتجات في هذه الفئة</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Products;