// Global functions
function updateAccountMenu() {
  const token = localStorage.getItem('token');
  const accountMenu = document.getElementById('account-menu');
  if (accountMenu) {
    const loginLinks = accountMenu.querySelectorAll('.login-link');
    const dashboardLink = accountMenu.querySelector('.dashboard-link');
    if (token) {
      loginLinks.forEach(link => (link.style.display = 'none'));
      dashboardLink.style.display = 'block';
    } else {
      loginLinks.forEach(link => (link.style.display = 'block'));
      dashboardLink.style.display = 'none';
    }
  }
}

function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  cart[productId] = (cart[productId] || 0) + 1;
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart');
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '{}');
  if (cart[productId]) delete cart[productId];
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart(); // Assume loadCart is defined elsewhere
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

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const dropdownParents = document.querySelectorAll('.dropdown-parent');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      dropdownParents.forEach(dp => dp.classList.remove('active'));
    });

    dropdownParents.forEach(dp => {
      dp.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          dp.classList.toggle('active');
        }
      });
    });
  }

  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', async e => {
      const query = e.target.value;
      if (query.length < 3) return;
      try {
        const response = await fetch(`http://localhost:3000/api/products?search=${query}`);
        const data = await response.json();
        if (data.success) {
          let suggestions = document.querySelector('.search-suggestions');
          if (suggestions) suggestions.remove();
          suggestions = document.createElement('div');
          suggestions.className = 'search-suggestions';
          suggestions.innerHTML = data.products.map(product => `
            <a href="product.html?id=${product._id}" class="suggestion-item">
              ${product.name} - $${product.price}
            </a>
          `).join('');
          document.body.appendChild(suggestions);

          suggestions.addEventListener('mouseleave', () => suggestions.remove());
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    });
  }
});

// Track recently viewed
window.addEventListener('popstate', () => {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) {
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (!recentlyViewed.includes(id)) {
      recentlyViewed.unshift(id);
      recentlyViewed = recentlyViewed.slice(0, 10); // Limit to 10 items
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }
  }
});