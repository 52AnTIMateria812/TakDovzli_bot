let categories = [];
let products = [];

// Состояние приложения
let state = {
    cart: [], // { id, qty }
    liked: new Set(),
    viewed: new Set(),
    currentView: 'view-catalog',
    viewStack: ['view-catalog'], // для кнопки назад
    activeProduct: null
};

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Развернуть на максимальную высоту

// Элементы DOM
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const backBtn = document.getElementById('back-button');
const headerTitle = document.getElementById('header-title');

const categoriesList = document.getElementById('categories-list');
const productsGrid = document.getElementById('products-grid');
const recommendationsGrid = document.getElementById('recommendations-grid');

const cartBadge = document.getElementById('cart-badge');
const cartItemsList = document.getElementById('cart-items-list');
const emptyCartMsg = document.getElementById('cart-empty-message');
const checkoutForm = document.querySelector('.checkout-form');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal = document.getElementById('summary-total');

// Инициализация
async function init() {
    try {
        const catRes = await fetch('/api/categories');
        categories = await catRes.json();
        
        const prodRes = await fetch('/api/products');
        products = await prodRes.json();
    } catch (e) {
        console.error("Ошибка загрузки данных с сервера:", e);
    }

    renderCategories();
    renderProducts(products);
    
    // Настройка навигации
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.dataset.view;
            navigateTo(targetView);
        });
    });

    backBtn.addEventListener('click', goBack);

    // Настройка поиска
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.title.toLowerCase().includes(query));
        renderProducts(filtered);
    });

    // Настройка действий оформления заказа
    setupFormValidation();

    // Настройка информации пользователя TG, если доступна
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        document.getElementById('profile-name').textContent = tg.initDataUnsafe.user.first_name;
        document.getElementById('profile-username').textContent = '@' + (tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.id);
    }
}

// Логика навигации
function navigateTo(viewId) {
    if (viewId === 'view-product') {
        state.viewStack.push(viewId);
    } else {
        state.viewStack = [viewId]; // Сброс стека для основных вкладок
    }
    state.currentView = viewId;
    updateView();
}

function goBack() {
    if (state.viewStack.length > 1) {
        state.viewStack.pop();
        state.currentView = state.viewStack[state.viewStack.length - 1];
        updateView();
    }
}

function updateView() {
    views.forEach(v => v.classList.add('hidden'));
    views.forEach(v => v.classList.remove('active'));
    
    document.getElementById(state.currentView).classList.remove('hidden');
    document.getElementById(state.currentView).classList.add('active');

    // Обновление нижней навигации
    if (['view-catalog', 'view-cart', 'view-profile'].includes(state.currentView)) {
        navItems.forEach(n => n.classList.remove('active'));
        document.querySelector(`.nav-item[data-view="${state.currentView}"]`)?.classList.add('active');
        document.getElementById('bottom-nav').style.display = 'flex';
        backBtn.classList.add('hidden');
    } else {
        // Просмотр товара
        document.getElementById('bottom-nav').style.display = 'none';
        backBtn.classList.remove('hidden');
    }

    // Обновление определенных представлений
    if (state.currentView === 'view-cart') renderCart();
    if (state.currentView === 'view-catalog') document.getElementById('catalog-title').scrollIntoView();
}

// Рендеринг
function formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₽';
}

function renderCategories() {
    categoriesList.innerHTML = categories.map(c => `
        <div class="category-card" style="background-image: url('${c.img}')">
            <span>${c.name}</span>
        </div>
    `).join('');
}

function renderProducts(list, container = productsGrid) {
    container.innerHTML = list.map(p => {
        const isLiked = state.liked.has(p.id);
        const inCart = state.cart.find(item => item.id === p.id);
        
        return `
        <div class="product-card" onclick="openProduct(${p.id})">
            <div class="product-image-container">
                <img src="${p.img}" alt="${p.title}">
                <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(event, ${p.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
            </div>
            <div class="product-info">
                <div class="product-title">${p.title}</div>
                <div class="product-price">${formatPrice(p.price)}</div>
                <button class="add-btn" onclick="addToCart(event, ${p.id})">${inCart ? 'В корзине' : 'Добавить'}</button>
            </div>
        </div>
    `}).join('');
}

// Взаимодействие с товаром
function openProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    state.activeProduct = p;
    state.viewed.add(id);
    
    document.getElementById('product-carousel').style.backgroundImage = `url('${p.img}')`;
    document.getElementById('product-detail-title').textContent = p.title;
    document.getElementById('product-detail-price').textContent = formatPrice(p.price);
    document.getElementById('product-detail-desc').textContent = p.desc;
    
    updateProductViewCartControls();
    navigateTo('view-product');
}

function toggleLike(e, id) {
    e.stopPropagation();
    if (state.liked.has(id)) {
        state.liked.delete(id);
    } else {
        state.liked.add(id);
    }
    renderProducts(products); // Обновление для изменения сердечек
}

function addToCart(e, id) {
    if (e) e.stopPropagation();
    const item = state.cart.find(x => x.id === id);
    if (!item) {
        state.cart.push({ id, qty: 1 });
    }
    updateCartBadge();
    if (e) renderProducts(products); // обновление текста кнопки
    if (state.currentView === 'view-product') updateProductViewCartControls();
}

function updateProductViewCartControls() {
    const p = state.activeProduct;
    const item = state.cart.find(x => x.id === p.id);
    const addBtn = document.getElementById('add-to-cart-btn');
    const qtyVal = document.getElementById('qty-value');
    
    if (item) {
        qtyVal.textContent = `${item.qty} шт.`;
        addBtn.textContent = 'В корзине';
        // Позволить добавлять больше через стандартную кнопку или просто оставить 'В корзине'
    } else {
        qtyVal.textContent = `0 шт.`;
        addBtn.textContent = 'Добавить';
    }
    
    // Подключение кнопок + / - на странице товара
    document.getElementById('qty-minus').onclick = () => updateCartQty(p.id, -1, true);
    document.getElementById('qty-plus').onclick = () => updateCartQty(p.id, 1, true);
    addBtn.onclick = () => addToCart(null, p.id);
}

function updateCartQty(id, delta, isFromProductPage = false) {
    const index = state.cart.findIndex(x => x.id === id);
    if (index === -1 && delta > 0) {
        addToCart(null, id);
        return;
    }
    if (index > -1) {
        state.cart[index].qty += delta;
        if (state.cart[index].qty <= 0) {
            state.cart.splice(index, 1);
        }
    }
    updateCartBadge();
    if (state.currentView === 'view-cart') renderCart();
    if (isFromProductPage) updateProductViewCartControls();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(x => x.id !== id);
    updateCartBadge();
    renderCart();
}

function updateCartBadge() {
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    if (count > 0) {
        cartBadge.textContent = count;
        cartBadge.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
    }
}

// Рендеринг корзины
function renderCart() {
    if (state.cart.length === 0) {
        emptyCartMsg.classList.remove('hidden');
        cartItemsList.classList.add('hidden');
        checkoutForm.classList.add('hidden');
        document.getElementById('checkout-btn').classList.add('disabled');
        return;
    }
    
    emptyCartMsg.classList.add('hidden');
    cartItemsList.classList.remove('hidden');
    checkoutForm.classList.remove('hidden');

    let total = 0;

    cartItemsList.innerHTML = state.cart.map(item => {
        const p = products.find(x => x.id === item.id);
        const itemTotal = p.price * item.qty;
        total += itemTotal;
        return `
            <div class="cart-item">
                <img src="${p.img}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${p.title}</div>
                    <div class="cart-item-controls">
                        <div class="cart-item-qty">
                            <button onclick="updateCartQty(${p.id}, -1)">-</button>
                            <span>${item.qty} шт.</span>
                            <button onclick="updateCartQty(${p.id}, 1)">+</button>
                        </div>
                        <button class="cart-item-delete" onclick="removeFromCart(${p.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
                <div class="cart-item-price-info">
                    <span class="cart-item-total">${formatPrice(itemTotal)}</span>
                    <span class="cart-item-unit">${formatPrice(p.price)} / шт.</span>
                </div>
            </div>
        `;
    }).join('');

    summarySubtotal.textContent = formatPrice(total);
    summaryTotal.textContent = formatPrice(total);
    
    // Рендеринг рекомендаций
    const viewedProducts = Array.from(state.viewed).map(id => products.find(x => x.id === id)).filter(Boolean);
    if (viewedProducts.length > 0) {
        renderProducts(viewedProducts, recommendationsGrid);
    } else {
        renderProducts(products.slice(0, 2), recommendationsGrid); // рекомендации по умолчанию
    }

    validateForm(); // Повторная проверка валидности
}

// Валидация формы
function setupFormValidation() {
    const inputs = ['buyer-name', 'buyer-phone', 'buyer-address'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', validateForm);
    });
    
    document.getElementById('checkout-btn').addEventListener('click', submitOrder);
}

function validateForm() {
    const name = document.getElementById('buyer-name').value.trim();
    const phone = document.getElementById('buyer-phone').value.trim();
    const address = document.getElementById('buyer-address').value.trim();
    const btn = document.getElementById('checkout-btn');

    // Простые правила валидации
    let isValid = true;
    
    if (name.length < 2) isValid = false;
    if (phone.length < 10) isValid = false; // заглушка проверки
    if (address.length < 5) isValid = false;
    
    // Переключение ошибок (показывать только если поле тронуто и пустое/невалидное, для простоты просто используем isValid для кнопки)
    if (isValid && state.cart.length > 0) {
        btn.classList.remove('disabled');
        if(tg.MainButton) {
            tg.MainButton.text = 'ОФОРМИТЬ ЗАКАЗ';
            tg.MainButton.show();
            tg.MainButton.onClick(submitOrder);
        }
    } else {
        btn.classList.add('disabled');
        if(tg.MainButton) tg.MainButton.hide();
    }
}

function submitOrder() {
    if (document.getElementById('checkout-btn').classList.contains('disabled')) return;
    
    const orderData = {
        name: document.getElementById('buyer-name').value,
        phone: document.getElementById('buyer-phone').value,
        address: document.getElementById('buyer-address').value,
        comment: document.getElementById('buyer-comment').value,
        items: state.cart,
        total: state.cart.reduce((sum, item) => sum + (products.find(x => x.id === item.id).price * item.qty), 0)
    };

    // Отправка данных в Telegram
    tg.sendData(JSON.stringify(orderData));
}

// Запуск
init();
