/* =========================================
   Lin's Happy Bowl – Data Store & Utilities
   ========================================= */

const STORAGE_KEYS = {
  meals: 'lhb_meals',
  orders: 'lhb_orders',
  pricing: 'lhb_pricing',
  imageLibrary: 'lhb_image_library',
};

export function getMeals() {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.meals);
  return data ? JSON.parse(data) : [];
}

export function saveMeals(meals) {
  localStorage.setItem(STORAGE_KEYS.meals, JSON.stringify(meals));
}

export function getOrders() {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.orders);
  return data ? JSON.parse(data) : [];
}

export function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export function getPricing() {
  if (typeof window === 'undefined') return { defaultPrice: 149, deliveryFee: 0, dailyOrderLimit: 0 };
  const data = localStorage.getItem(STORAGE_KEYS.pricing);
  const parsed = data ? JSON.parse(data) : {};
  return { defaultPrice: 149, deliveryFee: 0, dailyOrderLimit: 0, ...parsed };
}

export function savePricingData(pricing) {
  localStorage.setItem(STORAGE_KEYS.pricing, JSON.stringify(pricing));
}

export function getImageLibrary() {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.imageLibrary);
  return data ? JSON.parse(data) : [];
}

export function saveImageToLibrary(imageUrl, label) {
  if (!imageUrl) return;
  const library = getImageLibrary();
  const exists = library.some(img => img.url === imageUrl);
  if (exists) return;
  library.unshift({ id: 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5), url: imageUrl, label: label || '', addedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.imageLibrary, JSON.stringify(library));
}

export function removeImageFromLibrary(imageId) {
  const library = getImageLibrary().filter(img => img.id !== imageId);
  localStorage.setItem(STORAGE_KEYS.imageLibrary, JSON.stringify(library));
}

export function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateCZ(dateStr) {
  const parts = dateStr.split('-');
  return `${parseInt(parts[2])}. ${parseInt(parts[1])}. ${parts[0]}`;
}

const CZ_DAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const CZ_DAYS_SHORT = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

export function getDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return CZ_DAYS[d.getDay()];
}

export function getDayNameShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return CZ_DAYS_SHORT[d.getDay()];
}

export function getMealsForDate(dateStr) {
  return getMeals().filter(m => m.date === dateStr).sort((a, b) => a.slot - b.slot);
}

// Returns how many units of a specific meal have been ordered across all orders for its date
export function getOrderedQtyForMeal(mealId, dateStr) {
  if (typeof window === 'undefined') return 0;
  const orders = getOrders();
  let total = 0;
  for (const order of orders) {
    for (const m of order.meals || []) {
      if (m.mealId === mealId && m.date === dateStr) total += m.qty || 1;
    }
  }
  return total;
}

// Returns total number of meal portions ordered for a given date across all orders
export function getTotalOrderedForDate(dateStr) {
  if (typeof window === 'undefined') return 0;
  const orders = getOrders();
  let total = 0;
  for (const order of orders) {
    for (const m of order.meals || []) {
      if (m.date === dateStr) total += m.qty || 1;
    }
  }
  return total;
}

export function initDemoData() {
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
