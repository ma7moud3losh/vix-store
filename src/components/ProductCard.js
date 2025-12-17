import React, { useState } from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '#000000');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'M');
  const [showAllColors, setShowAllColors] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product, selectedColor, selectedSize);
  };

  // عرض 3 ألوان فقط مع زر "المزيد"
  const displayedColors = showAllColors ? product.colors : product.colors?.slice(0, 3);

  return (
    <div className="product-card fade-in">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        <div className="product-overlay">
          <button 
            className={`add-to-cart-btn add-to-cart-btn-${product.id}`} 
            onClick={handleAddToCart}
          >
            <span className="btn-icon">🛒</span>
            أضف إلى السلة
          </button>
        </div>
        
        {/* شارة الخصم أو الأفضل مبيعاً */}
        {product.bestseller && (
          <div className="product-badge bestseller">
            <span>الأفضل مبيعاً</span>
          </div>
        )}
        
        {product.discount && (
          <div className="product-badge discount">
            <span>-{product.discount}%</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <div className="product-header">
          <span className="product-category">{product.category}</span>
          <div className="product-rating">
            <span className="stars">★★★★★</span>
            <span className="rating-count">({product.rating || 4.8})</span>
          </div>
        </div>
        
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        
        {/* عرض الألوان المتاحة */}
        <div className="available-colors-section">
          <label className="section-label">الألوان المتاحة:</label>
          <div className="colors-grid">
            {displayedColors?.map((color, index) => (
              <div key={index} className="color-item" title={`اللون ${index + 1}`}>
                <div 
                  className={`color-preview ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <span className="check-icon">✓</span>}
                </div>
                <div className="color-code">{color.toUpperCase()}</div>
              </div>
            ))}
            
            {product.colors?.length > 3 && !showAllColors && (
              <button 
                className="more-colors-btn"
                onClick={() => setShowAllColors(true)}
              >
                +{product.colors.length - 3} أكثر
              </button>
            )}
          </div>
        </div>
        
        {/* اختيار المقاس */}
        <div className="size-selector">
          <label className="section-label">اختر المقاس:</label>
          <div className="size-grid">
            {product.sizes?.map((size, index) => (
              <button
                key={index}
                className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                onClick={() => setSelectedSize(size)}
                data-size={size}
              >
                {size}
                <span className="size-label">
                  {size === 'S' ? 'صغير' : 
                   size === 'M' ? 'متوسط' : 
                   size === 'L' ? 'كبير' : 
                   size === 'XL' ? 'اكس لارج' : 
                   size === 'XXL' ? 'دبل اكس لارج' : size}
                </span>
              </button>
            ))}
          </div>
          <div className="size-guide-link">
            <button className="guide-btn">دليل المقاسات</button>
          </div>
        </div>
        
        <div className="product-footer">
          <div className="product-price">
            <span className="current-price">{product.price} جنيه</span>
            {product.oldPrice && (
              <span className="old-price">{product.oldPrice} جنيه</span>
            )}
          </div>
          
          <div className="product-actions">
            <button className="wishlist-btn" title="أضف للمفضلة">
              ♡
            </button>
            <button className="quick-view-btn" title="عرض سريع">
              👁️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;