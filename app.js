/* =========================================
   Lin's Happy Bowl – Main Application JS
   ========================================= */

// ---- DATA STORE (localStorage) ----
const STORAGE_KEYS = {
    meals: 'lhb_meals',
    orders: 'lhb_orders',
    pricing: 'lhb_pricing',
};

function getMeals() {
    const data = localStorage.getItem(STORAGE_KEYS.meals);
    return data ? JSON.parse(data) : [];
}

function saveMeals(meals) {
    localStorage.setItem(STORAGE_KEYS.meals, JSON.stringify(meals));
}

function getOrders() {
    const data = localStorage.getItem(STORAGE_KEYS.orders);
    return data ? JSON.parse(data) : [];
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

function getPricing() {
    const data = localStorage.getItem(STORAGE_KEYS.pricing);
    return data ? JSON.parse(data) : { defaultPrice: 149, deliveryFee: 0 };
}

function savePricingData(pricing) {
    localStorage.setItem(STORAGE_KEYS.pricing, JSON.stringify(pricing));
}

// ---- DEMO DATA ----
function initDemoData() {
    if (getMeals().length > 0) return;

    const today = new Date();
    const demoMeals = [];
    const mealTemplates = [
        { name: 'Kuřecí steak s grilovanou zeleninou a rýží', desc: 'Šťavnatý kuřecí steak s čerstvou grilovanou zeleninou podávaný s jasmínovou rýží.', weight: 380, price: 159, allergens: '1, 7', slot: 1 },
        { name: 'Hovězí guláš s houskovým knedlíkem', desc: 'Tradiční český hovězí guláš s domácím houskovým knedlíkem.', weight: 400, price: 179, allergens: '1, 3, 7, 9', slot: 2 },
        { name: 'Losos na másle se špenátem a bramborovou kaší', desc: 'Čerstvý losos na másle podávaný se špenátem a krémovou bramborovou kaší.', weight: 350, price: 199, allergens: '4, 7', slot: 3 },
        { name: 'Vegetariánské Buddha bowl', desc: 'Mísa plná quinoy, avokáda, cizrny, pečené batáty a tahini dresinku.', weight: 420, price: 149, allergens: '11', slot: 4 },
        { name: 'Krůtí medailonky s bramborovým gratinem', desc: 'Jemné krůtí medailonky s domácím bramborovým gratinem a zeleninovým salátem.', weight: 370, price: 169, allergens: '1, 3, 7', slot: 1 },
        { name: 'Pad Thai s tofu a arašídy', desc: 'Thajské rýžové nudle s tofu, čerstvou zeleninou a arašídy.', weight: 350, price: 155, allergens: '1, 5, 6', slot: 2 },
        { name: 'Pečené kuřecí stehno s dušenou zeleninou', desc: 'Pečené kuřecí stehno na bylinkách s dušenou mrkví a brokolicí.', weight: 390, price: 145, allergens: '9', slot: 3 },
        { name: 'Těstoviny Carbonara', desc: 'Italské těstoviny se smetanovou omáčkou, slaninou a parmazánem.', weight: 360, price: 155, allergens: '1, 3, 7', slot: 4 },
    ];

    const images = [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
    ];

    for (let dayOffset = 2; dayOffset <= 14; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = formatDateISO(date);
        const mealsForDay = dayOffset <= 6 ? 4 : 2;

        for (let i = 0; i < mealsForDay; i++) {
            const tpl = mealTemplates[(dayOffset + i) % mealTemplates.length];
            demoMeals.push({
                id: generateId(),
                date: dateStr,
                slot: tpl.slot,
                name: tpl.name,
                description: tpl.desc,
                weight: tpl.weight,
                price: tpl.price,
                allergens: tpl.allergens,
                image: images[(dayOffset + i) % images.length],
            });
        }
    }

    saveMeals(demoMeals);
}

// ---- HELPERS ----
function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateCZ(dateStr) {
    const parts = dateStr.split('-');
    return `${parseInt(parts[2])}. ${parseInt(parts[1])}. ${parts[0]}`;
}

const CZ_DAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const CZ_DAYS_SHORT = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

function getDayName(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return CZ_DAYS[d.getDay()];
}

function getDayNameShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return CZ_DAYS_SHORT[d.getDay()];
}

function getMealsForDate(dateStr) {
    return getMeals().filter(m => m.date === dateStr).sort((a, b) => a.slot - b.slot);
}

// ---- NAVBAR ----
document.addEventListener('DOMContentLoaded', () => {
    initDemoData();

    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    // Init sections if on homepage
    if (document.getElementById('menuGrid')) {
        initDatePicker();
        initMenuSection();
        initOrderForm();
    }
});

// ---- MENU DATE PICKER ----
function initDatePicker() {
    const buttons = document.querySelectorAll('.menu-date-picker .date-btn');
    const today = new Date();

    buttons.forEach(btn => {
        const offset = parseInt(btn.dataset.offset);
        const date = new Date(today);
        date.setDate(date.getDate() + offset);
        const dateStr = formatDateISO(date);

        btn.dataset.date = dateStr;
        btn.querySelector('.date-day').textContent = getDayName(dateStr);
        btn.querySelector('.date-full').textContent = formatDateCZ(dateStr);

        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMenu(dateStr);
        });
    });

    // Load first date
    const firstDate = buttons[0]?.dataset.date;
    if (firstDate) renderMenu(firstDate);
}

function initMenuSection() {
    // Already handled by initDatePicker
}

function renderMenu(dateStr) {
    const grid = document.getElementById('menuGrid');
    const empty = document.getElementById('menuEmpty');
    const meals = getMealsForDate(dateStr);

    // Clear existing cards
    grid.querySelectorAll('.menu-card').forEach(c => c.remove());

    if (meals.length === 0) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            ${meal.image
                ? `<img class="menu-card-image" src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name)}" loading="lazy">`
                : '<div class="menu-card-image-placeholder">🍽️</div>'
            }
            <div class="menu-card-body">
                <span class="menu-card-slot">Jídlo ${meal.slot}</span>
                <h3>${escapeHtml(meal.name)}</h3>
                ${meal.description ? `<p class="menu-card-desc">${escapeHtml(meal.description)}</p>` : ''}
                <div class="menu-card-meta">
                    <span class="menu-card-weight">${meal.weight}g</span>
                    ${meal.allergens ? `<span class="menu-card-allergens">Alergeny: ${escapeHtml(meal.allergens)}</span>` : ''}
                    <span class="menu-card-price">${meal.price} Kč</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---- ORDER FORM ----
let selectedMeals = {}; // { mealId: quantity }
let currentStep = 1;

function initOrderForm() {
    const orderDateSelect = document.getElementById('orderDate');
    if (!orderDateSelect) return;

    const today = new Date();

    // Populate date options (2-14 days ahead)
    for (let i = 2; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = formatDateISO(date);
        const meals = getMealsForDate(dateStr);
        if (meals.length > 0) {
            const opt = document.createElement('option');
            opt.value = dateStr;
            opt.textContent = `${getDayName(dateStr)} – ${formatDateCZ(dateStr)} (${meals.length} jídel)`;
            orderDateSelect.appendChild(opt);
        }
    }

    orderDateSelect.addEventListener('change', () => {
        selectedMeals = {};
        renderOrderMeals(orderDateSelect.value);
        updateLivePrice();
    });

    // Form submit
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitOrder();
    });
}

function renderOrderMeals(dateStr) {
    const grid = document.getElementById('orderMealsGrid');

    if (!dateStr) {
        grid.innerHTML = '<p class="text-muted">Nejprve vyberte datum pro zobrazení dostupných jídel.</p>';
        return;
    }

    const meals = getMealsForDate(dateStr);

    if (meals.length === 0) {
        grid.innerHTML = '<p class="text-muted">Pro tento den nejsou k dispozici žádná jídla.</p>';
        return;
    }

    grid.innerHTML = meals.map(meal => `
        <div class="order-meal-card" data-meal-id="${meal.id}" onclick="toggleMeal('${meal.id}')">
            <div class="order-meal-check"></div>
            ${meal.image
                ? `<img class="order-meal-img" src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name)}">`
                : ''
            }
            <div class="order-meal-info">
                <h4>${escapeHtml(meal.name)}</h4>
                <p>${meal.weight}g ${meal.allergens ? '| Alergeny: ' + escapeHtml(meal.allergens) : ''}</p>
            </div>
            <span class="order-meal-price">${meal.price} Kč</span>
            <div class="order-meal-qty" onclick="event.stopPropagation()">
                <button type="button" onclick="changeMealQty('${meal.id}', -1)">−</button>
                <span id="qty-${meal.id}">0</span>
                <button type="button" onclick="changeMealQty('${meal.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function toggleMeal(mealId) {
    if (selectedMeals[mealId]) {
        delete selectedMeals[mealId];
    } else {
        selectedMeals[mealId] = 1;
    }
    updateMealCardUI(mealId);
    updateLivePrice();
}

function changeMealQty(mealId, delta) {
    const current = selectedMeals[mealId] || 0;
    const newQty = Math.max(0, current + delta);

    if (newQty === 0) {
        delete selectedMeals[mealId];
    } else {
        selectedMeals[mealId] = newQty;
    }
    updateMealCardUI(mealId);
    updateLivePrice();
}

function updateMealCardUI(mealId) {
    const card = document.querySelector(`[data-meal-id="${mealId}"]`);
    if (!card) return;

    const qty = selectedMeals[mealId] || 0;
    const qtyEl = document.getElementById(`qty-${mealId}`);
    if (qtyEl) qtyEl.textContent = qty;

    card.classList.toggle('selected', qty > 0);
}

function updateLivePrice() {
    const meals = getMeals();
    let total = 0;

    for (const [mealId, qty] of Object.entries(selectedMeals)) {
        const meal = meals.find(m => m.id === mealId);
        if (meal) {
            total += meal.price * qty;
        }
    }

    const totalEl = document.getElementById('totalPrice');
    if (totalEl) totalEl.textContent = `${total} Kč`;
}

// ---- MULTI-STEP FORM ----
function nextStep(step) {
    // Validate current step
    if (!validateStep(currentStep)) return;

    if (step === 4) {
        renderOrderSummary();
    }

    setStep(step);
}

function prevStep(step) {
    setStep(step);
}

function setStep(step) {
    currentStep = step;

    // Update form steps
    document.querySelectorAll('.form-step').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.step) === step);
    });

    // Update progress
    document.querySelectorAll('.progress-step').forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (stepNum === step) s.classList.add('active');
        if (stepNum < step) s.classList.add('completed');
    });

    // Scroll to form
    document.getElementById('objednavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateStep(step) {
    if (step === 1) {
        const orderDate = document.getElementById('orderDate').value;
        if (!orderDate) {
            alert('Prosím vyberte datum objednávky.');
            return false;
        }
        if (Object.keys(selectedMeals).length === 0) {
            alert('Prosím vyberte alespoň jedno jídlo.');
            return false;
        }
        return true;
    }

    if (step === 2) {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        let valid = true;

        if (!firstName) {
            document.getElementById('firstName').classList.add('error');
            valid = false;
        } else {
            document.getElementById('firstName').classList.remove('error');
        }

        if (!lastName) {
            document.getElementById('lastName').classList.add('error');
            valid = false;
        } else {
            document.getElementById('lastName').classList.remove('error');
        }

        if (!email || !email.includes('@')) {
            document.getElementById('email').classList.add('error');
            valid = false;
        } else {
            document.getElementById('email').classList.remove('error');
        }

        if (!phone) {
            document.getElementById('phone').classList.add('error');
            valid = false;
        } else {
            document.getElementById('phone').classList.remove('error');
        }

        if (!valid) alert('Prosím vyplňte všechna povinná pole.');
        return valid;
    }

    if (step === 3) {
        return true; // Payment always has a default selection
    }

    return true;
}

function renderOrderSummary() {
    const summary = document.getElementById('orderSummary');
    const meals = getMeals();
    const orderDate = document.getElementById('orderDate').value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value;

    let mealsHtml = '';
    let total = 0;

    for (const [mealId, qty] of Object.entries(selectedMeals)) {
        const meal = meals.find(m => m.id === mealId);
        if (meal) {
            const subtotal = meal.price * qty;
            total += subtotal;
            mealsHtml += `
                <div class="summary-row">
                    <span>${escapeHtml(meal.name)} × ${qty}</span>
                    <span>${subtotal} Kč</span>
                </div>
            `;
        }
    }

    summary.innerHTML = `
        <div class="summary-section">
            <h4>Datum</h4>
            <p>${getDayName(orderDate)} – ${formatDateCZ(orderDate)}</p>
        </div>
        <div class="summary-section">
            <h4>Vybraná jídla</h4>
            ${mealsHtml}
        </div>
        <div class="summary-section">
            <h4>Kontaktní údaje</h4>
            <p>${escapeHtml(document.getElementById('firstName').value)} ${escapeHtml(document.getElementById('lastName').value)}</p>
            <p>${escapeHtml(document.getElementById('email').value)}</p>
            <p>${escapeHtml(document.getElementById('phone').value)}</p>
            ${document.getElementById('street').value ? `<p>${escapeHtml(document.getElementById('street').value)}, ${escapeHtml(document.getElementById('city').value)} ${escapeHtml(document.getElementById('zip').value)}</p>` : ''}
            ${document.getElementById('note').value ? `<p><em>Poznámka: ${escapeHtml(document.getElementById('note').value)}</em></p>` : ''}
        </div>
        <div class="summary-section">
            <h4>Způsob platby</h4>
            <p>${payment === 'cash' ? 'Hotově při převzetí' : 'Bankovní převod'}</p>
        </div>
        <div class="summary-section">
            <div class="summary-row summary-total">
                <span>Celkem k úhradě:</span>
                <span>${total} Kč</span>
            </div>
        </div>
    `;
}

function submitOrder() {
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms.checked) {
        alert('Prosím potvrďte souhlas s obchodními podmínkami.');
        return;
    }

    const meals = getMeals();
    const orderDate = document.getElementById('orderDate').value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value;

    let total = 0;
    const orderMeals = [];
    for (const [mealId, qty] of Object.entries(selectedMeals)) {
        const meal = meals.find(m => m.id === mealId);
        if (meal) {
            total += meal.price * qty;
            orderMeals.push({ name: meal.name, qty, price: meal.price });
        }
    }

    const order = {
        id: generateId(),
        orderNumber: 'OBJ-' + Date.now().toString().slice(-6),
        date: orderDate,
        meals: orderMeals,
        total: total,
        customer: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            zip: document.getElementById('zip').value,
            note: document.getElementById('note').value,
        },
        payment: payment,
        status: 'new',
        createdAt: new Date().toISOString(),
    };

    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Show confirmation
    document.getElementById('orderNumber').textContent = order.orderNumber;
    setStep(5);
}
