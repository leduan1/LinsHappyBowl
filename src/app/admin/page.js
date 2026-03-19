'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  getMeals, saveMeals, getOrders, getPricing, savePricingData,
  initDemoData, generateId, formatDateISO, formatDateCZ,
  getDayName, getDayNameShort, getMealsForDate,
} from '@/lib/store';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initDemoData();
    setMounted(true);
    if (typeof window !== 'undefined' && sessionStorage.getItem('lhb_admin') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (email, pass) => {
    const accounts = [
      { email: 'jirka.leanh@gmail.com', password: 'Jirka607' },
      { email: 'dinhthuylinhsm@gmail.com', password: 'LinUmiVarit2026!' },
    ];
    const match = accounts.find(a => a.email === email && a.password === pass);
    if (match) {
      sessionStorage.setItem('lhb_admin', 'true');
      setIsLoggedIn(true);
    } else {
      alert('Nesprávné přihlašovací údaje.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lhb_admin');
    setIsLoggedIn(false);
  };

  if (!mounted) return null;

  return (
    <div className="admin-body">
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(user, pass);
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>🍜 Lin&apos;s Happy Bowl</h1>
        <h2>Administrace</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="adminUser">E-mail</label>
            <input type="email" id="adminUser" required placeholder="vas@email.cz" value={user} onChange={(e) => setUser(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="adminPass">Heslo</label>
            <input type="password" id="adminPass" required placeholder="••••••" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Přihlásit se</button>
          <p className="login-hint">Přihlaste se pomocí e-mailu a hesla</p>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('meals');
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState('');
  const [mealForm, setMealForm] = useState({
    date: '', slot: '1', name: '', description: '',
    weight: '', price: '', allergens: '', image: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Pricing state
  const [pricingForm, setPricingForm] = useState({ defaultPrice: 149, deliveryFee: 0 });

  useEffect(() => {
    const pricing = getPricing();
    setPricingForm({ defaultPrice: pricing.defaultPrice, deliveryFee: pricing.deliveryFee });
  }, []);

  const refresh = () => setRefreshKey(k => k + 1);

  // Calendar logic
  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = monday.getDay() || 7;
    monday.setDate(monday.getDate() - dayOfWeek + 1 + (weekOffset * 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      dates.push(formatDateISO(d));
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const todayStr = formatDateISO(new Date());
  const allMeals = getMeals();
  const weekLabel = `${formatDateCZ(weekDates[0])} – ${formatDateCZ(weekDates[6])}`;

  const openMealModal = (presetDate) => {
    const pricing = getPricing();
    setEditingMealId('');
    setMealForm({
      date: presetDate || '', slot: '1', name: '', description: '',
      weight: '', price: String(pricing.defaultPrice), allergens: '', image: '',
    });
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const editMeal = (mealId) => {
    const meal = allMeals.find(m => m.id === mealId);
    if (!meal) return;
    setEditingMealId(meal.id);
    setMealForm({
      date: meal.date, slot: String(meal.slot), name: meal.name,
      description: meal.description || '', weight: String(meal.weight),
      price: String(meal.price), allergens: meal.allergens || '',
      image: meal.image || '',
    });
    setImagePreview(meal.image || '');
    setModalOpen(true);
  };

  const closeMealModal = () => {
    setModalOpen(false);
    setEditingMealId('');
  };

  const saveMeal = () => {
    let imageUrl = mealForm.image;
    if (imagePreview && imagePreview.startsWith('data:')) {
      imageUrl = imagePreview;
    }

    const mealData = {
      date: mealForm.date,
      slot: parseInt(mealForm.slot),
      name: mealForm.name,
      description: mealForm.description,
      weight: parseInt(mealForm.weight),
      price: parseInt(mealForm.price),
      allergens: mealForm.allergens,
      image: imageUrl,
    };

    const meals = getMeals();
    if (editingMealId) {
      const idx = meals.findIndex(m => m.id === editingMealId);
      if (idx !== -1) meals[idx] = { ...meals[idx], ...mealData };
    } else {
      meals.push({ id: generateId(), ...mealData });
    }

    saveMeals(meals);
    closeMealModal();
    refresh();
  };

  const deleteMeal = (mealId) => {
    if (!confirm('Opravdu chcete smazat toto jídlo?')) return;
    const meals = getMeals().filter(m => m.id !== mealId);
    saveMeals(meals);
    refresh();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const savePricing = () => {
    savePricingData({
      defaultPrice: parseInt(pricingForm.defaultPrice) || 149,
      deliveryFee: parseInt(pricingForm.deliveryFee) || 0,
    });
    alert('Ceník byl uložen.');
  };

  // Orders
  const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <nav className="admin-nav">
        <div className="container admin-nav-inner">
          <Link href="/" className="logo">
            <span className="logo-icon">🍜</span>
            <span className="logo-text">Lin&apos;s Happy Bowl</span>
            <span className="admin-badge">Admin</span>
          </Link>
          <div className="admin-nav-actions">
            <Link href="/" className="btn btn-outline btn-sm">Zobrazit web</Link>
            <button className="btn btn-outline btn-sm" onClick={onLogout}>Odhlásit</button>
          </div>
        </div>
      </nav>

      <div className="container admin-content">
        {/* TABS */}
        <div className="admin-tabs">
          {['meals', 'pricing', 'orders'].map(tab => (
            <button
              key={tab}
              className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'meals' ? 'Správa jídel' : tab === 'pricing' ? 'Ceník' : 'Objednávky'}
            </button>
          ))}
        </div>

        {/* TAB: MEALS */}
        {activeTab === 'meals' && (
          <div>
            <div className="admin-header">
              <h2>Správa denního menu</h2>
              <button className="btn btn-primary" onClick={() => openMealModal()}>+ Přidat jídlo</button>
            </div>

            <div className="admin-date-nav">
              <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(w => w - 1)}>&larr; Předchozí týden</button>
              <span className="admin-current-week">{weekLabel}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Další týden &rarr;</button>
            </div>

            <div className="admin-calendar" key={refreshKey}>
              {weekDates.map(dateStr => {
                const dayMeals = allMeals.filter(m => m.date === dateStr).sort((a, b) => a.slot - b.slot);
                return (
                  <div className={`admin-day ${dateStr === todayStr ? 'today' : ''}`} key={dateStr}>
                    <div className="admin-day-header">{getDayNameShort(dateStr)}</div>
                    <div className="admin-day-date">{parseInt(dateStr.split('-')[2])}. {parseInt(dateStr.split('-')[1])}.</div>
                    {dayMeals.map(meal => (
                      <div className="admin-meal-item" key={meal.id}>
                        <strong title={meal.name}>{meal.slot}. {meal.name}</strong>
                        <div className="admin-meal-actions">
                          <button onClick={() => editMeal(meal.id)} title="Upravit">✏️</button>
                          <button onClick={() => deleteMeal(meal.id)} title="Smazat">🗑️</button>
                        </div>
                      </div>
                    ))}
                    <button className="admin-add-meal-btn" onClick={() => openMealModal(dateStr)}>+ Přidat jídlo</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: PRICING */}
        {activeTab === 'pricing' && (
          <div>
            <div className="admin-header">
              <h2>Nastavení cen</h2>
            </div>
            <div className="pricing-form">
              <p className="text-muted">Ceny jsou nastaveny individuálně u každého jídla. Zde můžete nastavit výchozí ceny pro nová jídla.</p>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="defaultPrice">Výchozí cena za porci (Kč)</label>
                  <input type="number" id="defaultPrice" value={pricingForm.defaultPrice} min="0" step="1" onChange={(e) => setPricingForm(p => ({ ...p, defaultPrice: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label htmlFor="deliveryFee">Příplatek za doručení (Kč)</label>
                  <input type="number" id="deliveryFee" value={pricingForm.deliveryFee} min="0" step="1" onChange={(e) => setPricingForm(p => ({ ...p, deliveryFee: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={savePricing}>Uložit ceník</button>
            </div>
          </div>
        )}

        {/* TAB: ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <div className="admin-header">
              <h2>Přijaté objednávky</h2>
            </div>
            <div className="orders-list">
              {orders.length === 0 ? (
                <p className="text-muted">Zatím nejsou žádné objednávky.</p>
              ) : (
                orders.map(order => (
                  <div className="order-item" key={order.id}>
                    <div className="order-item-info">
                      <h4>{order.orderNumber} – {order.customer.firstName} {order.customer.lastName}</h4>
                      <p>Datum: {getDayName(order.date)} {formatDateCZ(order.date)}</p>
                      <p>Jídla: {order.meals.map(m => `${m.name} ×${m.qty}`).join(', ')}</p>
                      <p>Kontakt: {order.customer.email} | {order.customer.phone}</p>
                      <p>Platba: {order.payment === 'cash' ? 'Hotově' : 'Převodem'}</p>
                      {order.customer.note && <p><em>{order.customer.note}</em></p>}
                    </div>
                    <div className="order-item-meta">
                      <span className={`order-status ${order.status}`}>{order.status === 'new' ? 'Nová' : 'Potvrzena'}</span>
                      <p style={{ marginTop: '8px', fontWeight: 700, color: 'var(--color-primary)' }}>{order.total} Kč</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MEAL MODAL */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeMealModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingMealId ? 'Upravit jídlo' : 'Přidat jídlo'}</h3>
              <button className="modal-close" onClick={closeMealModal}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveMeal(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mealDate">Datum *</label>
                  <input type="date" id="mealDate" required value={mealForm.date} onChange={(e) => setMealForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label htmlFor="mealSlot">Pozice (1–4) *</label>
                  <select id="mealSlot" required value={mealForm.slot} onChange={(e) => setMealForm(f => ({ ...f, slot: e.target.value }))}>
                    <option value="1">Jídlo 1</option>
                    <option value="2">Jídlo 2</option>
                    <option value="3">Jídlo 3</option>
                    <option value="4">Jídlo 4</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="mealName">Název jídla *</label>
                <input type="text" id="mealName" required placeholder="Např. Kuřecí steak s rýží" value={mealForm.name} onChange={(e) => setMealForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label htmlFor="mealDesc">Popis</label>
                <textarea id="mealDesc" rows="2" placeholder="Krátký popis jídla..." value={mealForm.description} onChange={(e) => setMealForm(f => ({ ...f, description: e.target.value }))}></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mealWeight">Gramáž (g) *</label>
                  <input type="number" id="mealWeight" required min="0" placeholder="350" value={mealForm.weight} onChange={(e) => setMealForm(f => ({ ...f, weight: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label htmlFor="mealPrice">Cena (Kč) *</label>
                  <input type="number" id="mealPrice" required min="0" placeholder="149" value={mealForm.price} onChange={(e) => setMealForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="mealAllergens">Alergeny</label>
                <input type="text" id="mealAllergens" placeholder="Např. 1, 3, 7 (čísla alergenů oddělená čárkou)" value={mealForm.allergens} onChange={(e) => setMealForm(f => ({ ...f, allergens: e.target.value }))} />
                <small className="form-help">1-Lepek, 2-Korýši, 3-Vejce, 4-Ryby, 5-Arašídy, 6-Sója, 7-Mléko, 8-Skořápkové plody, 9-Celer, 10-Hořčice, 11-Sezam, 12-Oxid siřičitý, 13-Vlčí bob, 14-Měkkýši</small>
              </div>
              <div className="form-group">
                <label htmlFor="mealImage">URL obrázku</label>
                <input type="url" id="mealImage" placeholder="https://example.com/image.jpg" value={mealForm.image} onChange={(e) => { setMealForm(f => ({ ...f, image: e.target.value })); setImagePreview(e.target.value); }} />
                <small className="form-help">Zadejte URL obrázku jídla nebo nahrajte obrázek</small>
              </div>
              <div className="form-group">
                <label htmlFor="mealImageFile">Nebo nahrajte obrázek</label>
                <input type="file" id="mealImageFile" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                {imagePreview && (
                  <div className="image-preview" style={{ display: 'block' }}>
                    <img src={imagePreview} alt="Náhled" />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={closeMealModal}>Zrušit</button>
                <button type="submit" className="btn btn-primary">Uložit jídlo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
