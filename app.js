// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Данные ботов
const bots = [
    { id: 1, name: 'ChatBot Pro', category: 'chat', price: 990, icon: '', description: 'Умный чат-бот для общения' },
    { id: 2, name: 'Auto Moderator', category: 'moderation', price: 1490, icon: '🛡️', description: 'Автомодерация чата' },
    { id: 3, name: 'Music Bot', category: 'music', price: 2990, icon: '🎵', description: 'Музыкальный бот' },
    { id: 4, name: 'Game Bot', category: 'game', price: 1990, icon: '🎮', description: 'Игровой бот' },
    { id: 5, name: 'Admin Bot', category: 'admin', price: 3490, icon: '⚙️', description: 'Бот для администрирования' },
    { id: 6, name: 'Welcome Bot', category: 'chat', price: 790, icon: '👋', description: 'Приветственный бот' },
    { id: 7, name: 'Anti-Spam', category: 'moderation', price: 1290, icon: '🚫', description: 'Защита от спама' },
    { id: 8, name: 'Radio Bot', category: 'music', price: 2490, icon: '📻', description: 'Интернет-радио' },
];

// Состояние приложения
let state = {
    currentCategory: 'all',
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
    orders: JSON.parse(localStorage.getItem('orders') || '[]'),
    balance: parseInt(localStorage.getItem('balance') || '0'),
    user: tg.initDataUnsafe?.user || { first_name: 'Пользователь', username: 'user' }
};

// Сохранение состояния
function saveState() {
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    localStorage.setItem('orders', JSON.stringify(state.orders));
    localStorage.setItem('balance', state.balance.toString());
}

// Отображение товаров
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const filteredBots = bots.filter(bot => {
        const matchesCategory = state.currentCategory === 'all' || bot.category === state.currentCategory;
        const matchesSearch = bot.name.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    grid.innerHTML = filteredBots.map(bot => `
        <div class="product-card">
            <button class="product-favorite ${state.favorites.includes(bot.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(${bot.id})">
                ${state.favorites.includes(bot.id) ? '❤️' : '🤍'}
            </button>
            <div class="product-icon">${bot.icon}</div>
            <div class="product-name">${bot.name}</div>
            <div class="product-footer">
                <div class="product-price">${bot.price} ₽</div>
                <button class="btn-buy" onclick="buyBot(${bot.id})">🛒</button>
            </div>
        </div>
    `).join('');
}

// Отображение избранного
function renderFavorites() {
    const grid = document.getElementById('favorites-grid');
    const favoriteBots = bots.filter(bot => state.favorites.includes(bot.id));
    
    if (favoriteBots.length === 0) {
        grid.innerHTML = '<div class="empty-state">У вас пока нет избранных ботов</div>';
        return;
    }

    grid.innerHTML = favoriteBots.map(bot => `
        <div class="product-card">
            <button class="product-favorite active" onclick="toggleFavorite(${bot.id})">❤️</button>
            <div class="product-icon">${bot.icon}</div>
            <div class="product-name">${bot.name}</div>
            <div class="product-footer">
                <div class="product-price">${bot.price} ₽</div>
                <button class="btn-buy" onclick="buyBot(${bot.id})"></button>
            </div>
        </div>
    `).join('');
}

// Отображение заказов
function renderOrders() {
    const list = document.getElementById('orders-list');
    
    if (state.orders.length === 0) {
        list.innerHTML = '<div class="empty-state">У вас пока нет заказов</div>';
        return;
    }

    list.innerHTML = state.orders.map(order => {
        const bot = bots.find(b => b.id === order.botId);
        return `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-name">${bot.icon} ${bot.name}</div>
                    <div class="order-status">Активен</div>
                </div>
                <div class="order-details">
                    <span>${order.price} ₽</span>
                    <span>${order.date}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Переключение категорий
document.querySelectorAll('.category').forEach(cat => {
    cat.addEventListener('click', () => {
        document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
        cat.classList.add('active');
        state.currentCategory = cat.dataset.category;
        renderProducts();
    });
});

// Поиск
document.getElementById('search-input').addEventListener('input', renderProducts);

// Переключение избранного
function toggleFavorite(botId) {
    const index = state.favorites.indexOf(botId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(botId);
    }
    saveState();
    renderProducts();
    renderFavorites();
    updateStats();
}

// Покупка бота
function buyBot(botId) {
    const bot = bots.find(b => b.id === botId);
    
    if (state.balance < bot.price) {
        tg.showAlert('Недостаточно средств! Пополните баланс.');
        return;
    }

    if (state.orders.find(o => o.botId === botId)) {
        tg.showAlert('Этот бот уже куплен!');
        return;
    }

    tg.showConfirm(`Купить ${bot.name} за ${bot.price} ₽?`, (confirmed) => {
        if (confirmed) {
            state.balance -= bot.price;
            state.orders.push({
                botId: botId,
                price: bot.price,
                date: new Date().toLocaleDateString('ru-RU')
            });
            saveState();
            updateProfile();
            renderOrders();
            updateStats();
            tg.showAlert(`✅ ${bot.name} успешно куплен!`);
        }
    });
}

// Пополнение баланса
document.getElementById('btn-deposit').addEventListener('click', () => {
    tg.showPopup({
        title: 'Пополнение баланса',
        message: 'Введите сумму пополнения:',
        buttons: [
            { id: '100', text: '100 ₽' },
            { id: '500', text: '500 ₽' },
            { id: '1000', text: '1000 ₽' },
            { id: 'cancel', text: 'Отмена', type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId && buttonId !== 'cancel') {
            state.balance += parseInt(buttonId);
            saveState();
            updateProfile();
            tg.showAlert(`✅ Баланс пополнен на ${buttonId} ₽`);
        }
    });
});

// Навигация между страницами
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`page-${pageName}`).classList.add('active');
    document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'favorites') renderFavorites();
    if (pageName === 'orders') renderOrders();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
});

// Обновление профиля
function updateProfile() {
    document.getElementById('profile-name').textContent = state.user.first_name;
    document.getElementById('profile-username').textContent = `@${state.user.username || 'user'}`;
    document.getElementById('balance-amount').textContent = `${state.balance} ₽`;
    document.getElementById('profile-avatar').textContent = state.user.first_name[0].toUpperCase();
}

// Обновление статистики
function updateStats() {
    document.getElementById('orders-count').textContent = `${state.orders.length} заказов`;
    document.getElementById('favorites-count').textContent = `${state.favorites.length} ботов`;
}

// Инициализация
updateProfile();
renderProducts();
updateStats();

// Уведомление Telegram о готовности
tg.ready();
tg.MainButton.hide();