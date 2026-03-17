/* =========================================
   Lin's Happy Bowl – Admin Panel JS
   ========================================= */

// ---- AUTH ----
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (sessionStorage.getItem('lhb_admin') === 'true') {
        showDashboard();
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adminUser').value;
            const pass = document.getElementById('adminPass').value;

            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                sessionStorage.setItem('lhb_admin', 'true');
                showDashboard();
            } else {
                alert('Nesprávné přihlašovací údaje.');
            }
        });
    }

    // Image file preview
    const imageFile = document.getElementById('mealImageFile');
    if (imageFile) {
        imageFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('imagePreviewImg').src = ev.target.result;
                    document.getElementById('imagePreview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Meal form
    const mealForm = document.getElementById('mealForm');
    if (mealForm) {
        mealForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveMeal();
        });
    }
});

function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    initAdminCalendar();
    loadOrders();
    loadPricing();
}

function adminLogout() {
    sessionStorage.removeItem('lhb_admin');
    location.reload();
}

// ---- TABS ----
function switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `tab-${tab}`);
    });
}

// ---- CALENDAR ----
let calendarWeekOffset = 0;

function initAdminCalendar() {
    renderCalendar();
}

function adminPrevWeek() {
    calendarWeekOffset--;
    renderCalendar();
}

function adminNextWeek() {
    calendarWeekOffset++;
    renderCalendar();
}

function renderCalendar() {
    const calendar = document.getElementById('adminCalendar');
    const weekLabel = document.getElementById('adminCurrentWeek');
    const today = new Date();

    // Get Monday of current week
    const monday = new Date(today);
    const dayOfWeek = monday.getDay() || 7;
    monday.setDate(monday.getDate() - dayOfWeek + 1 + (calendarWeekOffset * 7));

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    weekLabel.textContent = `${formatDateCZ(formatDateISO(monday))} – ${formatDateCZ(formatDateISO(sunday))}`;

    const meals = getMeals();
    let html = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(date.getDate() + i);
        const dateStr = formatDateISO(date);
        const isToday = dateStr === formatDateISO(today);
        const dayMeals = meals.filter(m => m.date === dateStr).sort((a, b) => a.slot - b.slot);

        html += `
            <div class="admin-day ${isToday ? 'today' : ''}">
                <div class="admin-day-header">${getDayNameShort(dateStr)}</div>
                <div class="admin-day-date">${parseInt(dateStr.split('-')[2])}. ${parseInt(dateStr.split('-')[1])}.</div>
                ${dayMeals.map(meal => `
                    <div class="admin-meal-item">
                        <strong title="${escapeHtml(meal.name)}">${meal.slot}. ${escapeHtml(meal.name)}</strong>
                        <div class="admin-meal-actions">
                            <button onclick="editMeal('${meal.id}')" title="Upravit">✏️</button>
                            <button onclick="deleteMeal('${meal.id}')" title="Smazat">🗑️</button>
                        </div>
                    </div>
                `).join('')}
                <button class="admin-add-meal-btn" onclick="openMealModal('${dateStr}')">+ Přidat jídlo</button>
            </div>
        `;
    }

    calendar.innerHTML = html;
}

// ---- MEAL MODAL ----
function openMealModal(presetDate) {
    const modal = document.getElementById('mealModal');
    const form = document.getElementById('mealForm');
    const title = document.getElementById('mealModalTitle');

    form.reset();
    document.getElementById('mealId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    title.textContent = 'Přidat jídlo';

    if (presetDate) {
        document.getElementById('mealDate').value = presetDate;
    }

    // Set default price
    const pricing = getPricing();
    document.getElementById('mealPrice').value = pricing.defaultPrice;

    modal.style.display = 'flex';
}

function closeMealModal() {
    document.getElementById('mealModal').style.display = 'none';
}

function editMeal(mealId) {
    const meals = getMeals();
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    document.getElementById('mealModalTitle').textContent = 'Upravit jídlo';
    document.getElementById('mealId').value = meal.id;
    document.getElementById('mealDate').value = meal.date;
    document.getElementById('mealSlot').value = meal.slot;
    document.getElementById('mealName').value = meal.name;
    document.getElementById('mealDesc').value = meal.description || '';
    document.getElementById('mealWeight').value = meal.weight;
    document.getElementById('mealPrice').value = meal.price;
    document.getElementById('mealAllergens').value = meal.allergens || '';
    document.getElementById('mealImage').value = meal.image || '';

    if (meal.image) {
        document.getElementById('imagePreviewImg').src = meal.image;
        document.getElementById('imagePreview').style.display = 'block';
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }

    document.getElementById('mealModal').style.display = 'flex';
}

function saveMeal() {
    const meals = getMeals();
    const id = document.getElementById('mealId').value;

    // Handle image - URL or file
    let imageUrl = document.getElementById('mealImage').value;
    const fileInput = document.getElementById('mealImageFile');
    if (fileInput.files.length > 0) {
        const preview = document.getElementById('imagePreviewImg');
        if (preview.src && preview.src.startsWith('data:')) {
            imageUrl = preview.src;
        }
    }

    const mealData = {
        date: document.getElementById('mealDate').value,
        slot: parseInt(document.getElementById('mealSlot').value),
        name: document.getElementById('mealName').value,
        description: document.getElementById('mealDesc').value,
        weight: parseInt(document.getElementById('mealWeight').value),
        price: parseInt(document.getElementById('mealPrice').value),
        allergens: document.getElementById('mealAllergens').value,
        image: imageUrl,
    };

    if (id) {
        // Update
        const idx = meals.findIndex(m => m.id === id);
        if (idx !== -1) {
            meals[idx] = { ...meals[idx], ...mealData };
        }
    } else {
        // Create
        meals.push({ id: generateId(), ...mealData });
    }

    saveMeals(meals);
    closeMealModal();
    renderCalendar();
}

function deleteMeal(mealId) {
    if (!confirm('Opravdu chcete smazat toto jídlo?')) return;

    const meals = getMeals().filter(m => m.id !== mealId);
    saveMeals(meals);
    renderCalendar();
}

// ---- PRICING ----
function loadPricing() {
    const pricing = getPricing();
    const defaultPriceEl = document.getElementById('defaultPrice');
    const deliveryFeeEl = document.getElementById('deliveryFee');

    if (defaultPriceEl) defaultPriceEl.value = pricing.defaultPrice;
    if (deliveryFeeEl) deliveryFeeEl.value = pricing.deliveryFee;
}

function savePricing() {
    const pricing = {
        defaultPrice: parseInt(document.getElementById('defaultPrice').value) || 149,
        deliveryFee: parseInt(document.getElementById('deliveryFee').value) || 0,
    };
    savePricingData(pricing);
    alert('Ceník byl uložen.');
}

// ---- ORDERS ----
function loadOrders() {
    const list = document.getElementById('ordersList');
    const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (orders.length === 0) {
        list.innerHTML = '<p class="text-muted">Zatím nejsou žádné objednávky.</p>';
        return;
    }

    list.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-item-info">
                <h4>${escapeHtml(order.orderNumber)} – ${escapeHtml(order.customer.firstName)} ${escapeHtml(order.customer.lastName)}</h4>
                <p>Datum: ${getDayName(order.date)} ${formatDateCZ(order.date)}</p>
                <p>Jídla: ${order.meals.map(m => `${escapeHtml(m.name)} ×${m.qty}`).join(', ')}</p>
                <p>Kontakt: ${escapeHtml(order.customer.email)} | ${escapeHtml(order.customer.phone)}</p>
                <p>Platba: ${order.payment === 'cash' ? 'Hotově' : 'Převodem'}</p>
                ${order.customer.note ? `<p><em>${escapeHtml(order.customer.note)}</em></p>` : ''}
            </div>
            <div class="order-item-meta">
                <span class="order-status ${order.status}">${order.status === 'new' ? 'Nová' : 'Potvrzena'}</span>
                <p style="margin-top:8px;font-weight:700;color:var(--color-primary);">${order.total} Kč</p>
            </div>
        </div>
    `).join('');
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('mealModal');
    if (e.target === modal) {
        closeMealModal();
    }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMealModal();
    }
});
