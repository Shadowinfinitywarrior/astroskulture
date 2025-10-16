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

function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  cart[productId] = (cart[productId] || 0) + 1;
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart');
  updateCartCount();
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  if (cart[productId]) {
    delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    // Reload cart if on cart page
    if (typeof loadCart === 'function') {
      loadCart();
    }
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.textContent = totalItems;
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function addToWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    alert('Added to wishlist');
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('search');
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
          const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
          const data = await response.json();
          
          if (data.success && data.products && data.products.length > 0) {
            const suggestions = document.createElement('div');
            suggestions.className = 'search-suggestions';
            suggestions.innerHTML = data.products.map(product => `
              <a href="product.html?id=${product._id}" class="suggestion-item">
                <img src="${product.images && product.images.length > 0 ? product.images[0] : 'placeholder.jpg'}" alt="${product.name}" width="40" height="40">
                <div>
                  <div class="product-name">${product.name}</div>
                  <div class="product-price">$${product.price}</div>
                </div>
              </a>
            `).join('');
            
            // Position suggestions below search input
            const searchRect = searchInput.getBoundingClientRect();
            suggestions.style.position = 'absolute';
            suggestions.style.top = `${searchRect.bottom + window.scrollY}px`;
            suggestions.style.left = `${searchRect.left + window.scrollX}px`;
            suggestions.style.width = `${searchRect.width}px`;
            
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateAccountMenu();
  updateCartCount();
  setupMobileMenu();
  setupSearch();
  trackRecentlyViewed();
});

// Update account menu and cart count when page loads
window.addEventListener('load', () => {
  updateAccountMenu();
  updateCartCount();
});
