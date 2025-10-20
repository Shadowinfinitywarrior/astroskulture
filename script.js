// Global functions
function updateAccountMenu() {
  const token = localStorage.getItem('token');
  const accountMenu = document.getElementById('account-menu');
  if (accountMenu) {
    const loginLinks = accountMenu.querySelectorAll('.login-link');
    const dashboardLink = accountMenu.querySelector('.dashboard-link');
    if (token) {
      loginLinks.forEach(link => (link.style.display = 'none'));
      if (dashboardLink) dashboardLink.style.display = 'block';
    } else {
      loginLinks.forEach(link => (link.style.display = 'block'));
      if (dashboardLink) dashboardLink.style.display = 'none';
    }
  }
}

function addToCart(productId, size = 'M', quantity = 1) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const itemKey = `${productId}_${size}`;
  
  if (cart[itemKey]) {
    cart[itemKey].quantity += quantity;
  } else {
    cart[itemKey] = {
      productId: productId,
      size: size,
      quantity: quantity,
      addedAt: new Date().toISOString()
    };
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  showCartNotification('Added to cart');
  updateCartCount();
}

function removeFromCart(productId, size = 'M') {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const itemKey = `${productId}_${size}`;
  
  if (cart[itemKey]) {
    delete cart[itemKey];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCartNotification('Item removed from cart');
    
    // Reload cart if on cart page
    if (typeof loadCart === 'function') {
      loadCart();
    }
  }
}

function updateCartItemQuantity(productId, size, change) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const itemKey = `${productId}_${size}`;
  
  if (cart[itemKey]) {
    const currentQty = cart[itemKey].quantity;
    const newQty = Math.max(0, currentQty + change);
    
    if (newQty === 0) {
      delete cart[itemKey];
    } else {
      cart[itemKey].quantity = newQty;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Reload cart if on cart page
    if (typeof loadCart === 'function') {
      loadCart();
    }
    
    // Update product page quantity if exists
    const quantityElement = document.getElementById(`quantity-${productId}`);
    if (quantityElement) {
      quantityElement.textContent = newQty;
    }
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  
  // Update cart count in navigation
  const cartCounts = document.querySelectorAll('.cart-count');
  cartCounts.forEach(cartCount => {
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
  });
  
  // Update mobile cart count
  const mobileCart = document.querySelector('.mobile-cart');
  if (mobileCart) {
    const existingCount = mobileCart.querySelector('.cart-count');
    if (existingCount) {
      existingCount.textContent = totalItems;
      existingCount.style.display = totalItems > 0 ? 'inline' : 'none';
    } else if (totalItems > 0) {
      const countBadge = document.createElement('span');
      countBadge.className = 'cart-count';
      countBadge.textContent = totalItems;
      mobileCart.appendChild(countBadge);
    }
  }
  
  return totalItems;
}

function showCartNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">✓</span>
      <span class="notification-text">${message}</span>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function addToWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showCartNotification('Added to wishlist');
  } else {
    showCartNotification('Already in wishlist');
  }
}

function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  wishlist = wishlist.filter(id => id !== productId);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  showCartNotification('Removed from wishlist');
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Product Page Specific Functions
function changeMainImage(imageSrc) {
  const mainImage = document.getElementById('main-product-image');
  if (mainImage) {
    mainImage.src = imageSrc;
    mainImage.style.opacity = '0';
    setTimeout(() => {
      mainImage.style.opacity = '1';
    }, 150);
  }
  
  // Update active thumbnail
  document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.classList.remove('active');
    if (thumb.src === imageSrc || thumb.getAttribute('data-src') === imageSrc) {
      thumb.classList.add('active');
    }
  });
}

function selectSize(button) {
  // Remove active class from all size buttons
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked button
  button.classList.add('active');
  return button.getAttribute('data-size');
}

function switchTab(tabName) {
  // Hide all tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab panel
  const activePanel = document.getElementById(tabName);
  if (activePanel) {
    activePanel.classList.add('active');
  }
  
  // Activate selected tab button
  const activeBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

function buyNow(productId, size = 'M') {
  const selectedSize = size || getSelectedSize();
  if (!selectedSize) {
    alert('Please select a size');
    return;
  }
  addToCart(productId, selectedSize, 1);
  window.location.href = 'cart.html';
}

function buyNowWithSize() {
  const productId = document.querySelector('[data-product-id]')?.getAttribute('data-product-id');
  const selectedSize = getSelectedSize();
  if (!selectedSize) {
    alert('Please select a size');
    return;
  }
  buyNow(productId, selectedSize);
}

function getSelectedSize() {
  const activeSize = document.querySelector('.size-btn.active');
  return activeSize ? activeSize.getAttribute('data-size') : null;
}

function addToCartWithSize() {
  const productId = document.querySelector('[data-product-id]')?.getAttribute('data-product-id');
  const selectedSize = getSelectedSize();
  if (!selectedSize) {
    alert('Please select a size');
    return;
  }
  addToCart(productId, selectedSize, 1);
}

// Search functionality
function setupSearch() {
  const searchInputs = document.querySelectorAll('#search, #mobile-search');
  
  searchInputs.forEach(searchInput => {
    if (searchInput) {
      let searchTimeout;
      
      searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Remove existing suggestions
        const existingSuggestions = document.querySelector('.search-suggestions');
        if (existingSuggestions) {
          existingSuggestions.remove();
        }
        
        if (query.length < 2) return;
        
        // Debounce search
        searchTimeout = setTimeout(async () => {
          try {
            const response = await fetch(`/api/products/search/suggestions?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success && data.suggestions && data.suggestions.length > 0) {
              const suggestions = document.createElement('div');
              suggestions.className = 'search-suggestions';
              suggestions.innerHTML = data.suggestions.map(product => `
                <a href="product.html?id=${product._id}" class="suggestion-item">
                  <img src="${product.image || 'logo.png'}" alt="${product.name}" onerror="this.src='logo.png'">
                  <div class="suggestion-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                  </div>
                </a>
              `).join('');
              
              // Position suggestions below search input
              const searchRect = searchInput.getBoundingClientRect();
              suggestions.style.position = 'absolute';
              suggestions.style.top = `${searchRect.bottom + window.scrollY}px`;
              suggestions.style.left = `${searchRect.left + window.scrollX}px`;
              suggestions.style.width = `${searchRect.width}px`;
              suggestions.style.zIndex = '1000';
              suggestions.style.background = 'white';
              suggestions.style.border = '1px solid #ddd';
              suggestions.style.borderRadius = '4px';
              suggestions.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
              suggestions.style.maxHeight = '300px';
              suggestions.style.overflowY = 'auto';
              
              document.body.appendChild(suggestions);
              
              // Remove suggestions when clicking outside or on a suggestion
              const removeSuggestions = () => {
                if (suggestions.parentNode) {
                  suggestions.remove();
                }
                document.removeEventListener('click', removeSuggestions);
              };
              
              setTimeout(() => {
                document.addEventListener('click', removeSuggestions);
              }, 100);
              
            }
          } catch (error) {
            console.error('Search error:', error);
          }
        }, 300);
      });
      
      // Clear suggestions when search is cleared
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          const suggestions = document.querySelector('.search-suggestions');
          if (suggestions) {
            suggestions.remove();
          }
        }, 200);
      });
    }
  });
}

// Mobile menu functionality
function setupMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const dropdownParents = document.querySelectorAll('.dropdown-parent');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      // Close all dropdowns when toggling menu
      dropdownParents.forEach(dp => dp.classList.remove('active'));
    });

    // Dropdown functionality for mobile
    dropdownParents.forEach(dp => {
      const link = dp.querySelector('a');
      if (link) {
        link.addEventListener('click', (e) => {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            e.stopPropagation();
            dp.classList.toggle('active');
          }
        });
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        dropdownParents.forEach(dp => dp.classList.remove('active'));
      }
    });
  }
}

// Track recently viewed products
function trackRecentlyViewed() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (productId && window.location.pathname.includes('product.html')) {
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    
    // Add to beginning
    recentlyViewed.unshift(productId);
    
    // Keep only last 10 items
    recentlyViewed = recentlyViewed.slice(0, 10);
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }
}

// Product image gallery functions
function initImageGallery() {
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.getElementById('main-product-image');
  
  if (thumbnails.length > 0 && mainImage) {
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const newSrc = thumb.src || thumb.getAttribute('data-src');
        if (mainImage.src !== newSrc) {
          mainImage.style.opacity = '0';
          setTimeout(() => {
            mainImage.src = newSrc;
            mainImage.style.opacity = '1';
          }, 150);
        }
        
        // Update active thumbnail
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }
}

// Load recommended products
async function loadRecommendedProducts(category, currentProductId, limit = 4) {
  try {
    const response = await fetch(`/api/products?category=${category}&limit=${limit}`);
    const data = await response.json();
    if (data.success) {
      const recommended = data.products.filter(p => p._id !== currentProductId).slice(0, limit);
      displayRecommendedProducts(recommended);
    }
  } catch (error) {
    console.error('Error loading recommended products:', error);
  }
}

function displayRecommendedProducts(products) {
  const container = document.getElementById('recommended-products');
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = '<p>No recommended products found.</p>';
    return;
  }
  
  container.innerHTML = products.map(product => {
    const discount = product.originalPrice && product.originalPrice > product.price ? 
      Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    return `
      <div class="product-card">
        <div class="product-image">
          <img src="${product.images && product.images[0] ? product.images[0] : 'logo.png'}" 
               alt="${product.name}" 
               onerror="this.src='logo.png'"
               onclick="window.location.href='product.html?id=${product._id}'">
          ${discount > 0 ? 
            `<div class="discount-badge">${discount}% OFF</div>` : ''
          }
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="rating">
            <span class="stars">${'★'.repeat(Math.floor(product.rating || 4))}${'☆'.repeat(5-Math.floor(product.rating || 4))}</span>
            <span class="review-count">(${product.reviewCount || 0})</span>
          </div>
          <div class="price">
            <span class="current-price">₹${product.price.toFixed(2)}</span>
            ${product.originalPrice && product.originalPrice > product.price ? 
              `<span class="original-price">₹${product.originalPrice.toFixed(2)}</span>` : ''
            }
          </div>
          <button class="btn view-product-btn" onclick="window.location.href='product.html?id=${product._id}'">
            View Product
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Add to recently viewed
function addToRecentlyViewed(productId) {
  let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  if (!recentlyViewed.includes(productId)) {
    recentlyViewed.unshift(productId);
    recentlyViewed = recentlyViewed.slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }
}

// Initialize product page
function initProductPage() {
  if (window.location.pathname.includes('product.html')) {
    initImageGallery();
    
    // Add tab functionality if tabs exist
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
      tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const tabName = this.getAttribute('data-tab') || this.textContent.toLowerCase();
          switchTab(tabName);
        });
      });
    }
  }
}

// Format currency
function formatCurrency(amount) {
  return '₹' + parseFloat(amount).toFixed(2);
}

// Calculate discount percentage
function calculateDiscount(originalPrice, currentPrice) {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateAccountMenu();
  updateCartCount();
  setupMobileMenu();
  setupSearch();
  trackRecentlyViewed();
  initProductPage();
});

// Update account menu and cart count when page loads
window.addEventListener('load', () => {
  updateAccountMenu();
  updateCartCount();
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateAccountMenu,
    addToCart,
    removeFromCart,
    updateCartCount,
    logout,
    addToWishlist,
    removeFromWishlist,
    checkAuth,
    changeMainImage,
    selectSize,
    switchTab,
    buyNow,
    buyNowWithSize,
    addToCartWithSize,
    updateCartItemQuantity,
    formatCurrency,
    calculateDiscount
  };
}
