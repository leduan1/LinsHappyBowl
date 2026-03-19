'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getMeals, getMealsForDate, getOrders, saveOrders,
  initDemoData, generateId, formatDateISO, formatDateCZ,
  getDayName,
} from '@/lib/store';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Order form state
  const [currentStep, setCurrentStep] = useState(1);
  const [availableDates, setAvailableDates] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  const [selectedMeals, setSelectedMeals] = useState({});
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', zip: '', note: '',
  });
  const [payment, setPayment] = useState('cash');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    initDemoData();
    setMounted(true);

    const today = new Date();

    // Build available dates with meals
    const dates = [];
    for (let i = 2; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateISO(date);
      const meals = getMealsForDate(dateStr);
      if (meals.length > 0) {
        dates.push({ dateStr, label: `${getDayName(dateStr)} – ${formatDateCZ(dateStr)}`, meals });
      }
    }
    setAvailableDates(dates);

    // Scroll handler
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDate = (dateStr) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const toggleMeal = (mealId) => {
    setSelectedMeals(prev => {
      const next = { ...prev };
      if (next[mealId]) {
        delete next[mealId];
      } else {
        next[mealId] = 1;
      }
      return next;
    });
  };

  const changeMealQty = (mealId, delta) => {
    setSelectedMeals(prev => {
      const next = { ...prev };
      const current = next[mealId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        delete next[mealId];
      } else {
        next[mealId] = newQty;
      }
      return next;
    });
  };

  const totalPrice = useCallback(() => {
    const allMeals = getMeals();
    let total = 0;
    for (const [mealId, qty] of Object.entries(selectedMeals)) {
      const meal = allMeals.find(m => m.id === mealId);
      if (meal) total += meal.price * qty;
    }
    return total;
  }, [selectedMeals]);

  const validateStep = (step) => {
    if (step === 1) {
      if (Object.keys(selectedMeals).length === 0) { alert('Prosím vyberte alespoň jedno jídlo.'); return false; }
      return true;
    }
    if (step === 2) {
      const errors = {};
      if (!formData.firstName.trim()) errors.firstName = true;
      if (!formData.lastName.trim()) errors.lastName = true;
      if (!formData.email.trim() || !formData.email.includes('@')) errors.email = true;
      if (!formData.phone.trim()) errors.phone = true;
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) { alert('Prosím vyplňte všechna povinná pole.'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = (step) => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(step);
    setTimeout(() => {
      document.getElementById('objednavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const prevStep = (step) => {
    setCurrentStep(step);
    setTimeout(() => {
      document.getElementById('objednavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const [submitting, setSubmitting] = useState(false);

  const submitOrder = async () => {
    if (!agreeTerms) { alert('Prosím potvrďte souhlas s obchodními podmínkami.'); return; }

    const allMeals = getMeals();
    let total = 0;
    const mealsArr = [];
    const datesSet = new Set();
    for (const [mealId, qty] of Object.entries(selectedMeals)) {
      const meal = allMeals.find(m => m.id === mealId);
      if (meal) {
        total += meal.price * qty;
        datesSet.add(meal.date);
        mealsArr.push({ name: meal.name, qty, price: meal.price, date: meal.date });
      }
    }

    const sortedDates = [...datesSet].sort();
    const datesFull = sortedDates.map(d => `${getDayName(d)} – ${formatDateCZ(d)}`).join(', ');

    const order = {
      id: generateId(),
      orderNumber: 'OBJ-' + Date.now().toString().slice(-6),
      dates: sortedDates,
      dateFull: datesFull,
      meals: mealsArr,
      total,
      customer: { ...formData },
      payment,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Send email via API
    setSubmitting(true);
    try {
      await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }
    setSubmitting(false);

    setOrderNumber(order.orderNumber);
    setCurrentStep(5);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* NAVIGATION */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <Link href="/" className="logo">
            <span className="logo-icon">🍜</span>
            <span className="logo-text">Lin&apos;s Happy Bowl</span>
          </Link>
          <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="#objednavka" className="btn btn-nav" onClick={() => setMobileMenuOpen(false)}>Objednat</a></li>
          </ul>
          <button className="mobile-toggle" aria-label="Menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* OBJEDNÁVKOVÝ FORMULÁŘ */}
      <section className="section section-order" id="objednavka">
        <div className="container">
          <h2 className="section-title">Objednat jídlo</h2>
          <p className="section-subtitle">Objednávky přijímáme s předstihem minimálně 2 dny</p>

          {/* PROGRESS BAR */}
          <div className="order-progress">
            {[
              { num: 1, label: 'Výběr jídla' },
              { num: 2, label: 'Vaše údaje' },
              { num: 3, label: 'Platba' },
              { num: 4, label: 'Shrnutí' },
            ].map((s, i, arr) => (
              <span key={s.num} style={{ display: 'contents' }}>
                <div className={`progress-step ${currentStep === s.num ? 'active' : ''} ${currentStep > s.num ? 'completed' : ''}`}>
                  <div className="progress-circle">{s.num}</div>
                  <span>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className="progress-line"></div>}
              </span>
            ))}
          </div>

          <form className="order-form" noValidate onSubmit={async (e) => { e.preventDefault(); await submitOrder(); }}>
            {/* STEP 1 */}
            <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
              <h3>Vyberte dny a jídla</h3>
              <p className="text-muted">Můžete vybírat jídla z více dnů najednou</p>

              <div className="step1-split">
                <div className="step1-left">
                  <div className="order-dates-list">
                    {availableDates.map(({ dateStr, label, meals }) => {
                      const mealsSelectedForDate = meals.filter(m => selectedMeals[m.id]);
                      const isExpanded = expandedDates[dateStr];
                      return (
                        <div key={dateStr} className={`order-date-group ${mealsSelectedForDate.length > 0 ? 'has-selection' : ''}`}>
                          <button type="button" className="order-date-header" onClick={() => toggleDate(dateStr)}>
                            <div className="order-date-info">
                              <span className="order-date-label">{label}</span>
                              <span className="order-date-count">{meals.length} jídel{mealsSelectedForDate.length > 0 ? ` · vybráno: ${mealsSelectedForDate.length}` : ''}</span>
                            </div>
                            <span className={`order-date-arrow ${isExpanded ? 'expanded' : ''}`}>&#9662;</span>
                          </button>
                          {isExpanded && (
                            <div className="order-meals-cards">
                              {meals.map(meal => (
                                <div
                                  key={meal.id}
                                  className={`order-meal-card ${selectedMeals[meal.id] ? 'selected' : ''}`}
                                  onClick={() => toggleMeal(meal.id)}
                                >
                                  {meal.image && <img className="order-meal-img" src={meal.image} alt={meal.name} />}
                                  <div className="order-meal-body">
                                    <h4 className="order-meal-name">{meal.name}</h4>
                                    <p className="order-meal-meta">{meal.weight}g {meal.allergens ? `| Alergeny: ${meal.allergens}` : ''}</p>
                                    <div className="order-meal-footer">
                                      <span className="order-meal-price">{meal.price} Kč</span>
                                      <div className="order-meal-qty" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" onClick={() => changeMealQty(meal.id, -1)}>−</button>
                                        <span>{selectedMeals[meal.id] || 0}</span>
                                        <button type="button" onClick={() => changeMealQty(meal.id, 1)}>+</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="step1-right">
                  <div className="step1-sidebar">
                    <h4 className="step1-sidebar-title">Vybraná jídla</h4>
                    <SelectedMealsSidebar selectedMeals={selectedMeals} changeMealQty={changeMealQty} />
                    <div className="live-price">
                      <span>Celkem:</span>
                      <strong>{totalPrice()} Kč</strong>
                    </div>
                    <button type="button" className="btn btn-primary btn-block" onClick={() => nextStep(2)} disabled={Object.keys(selectedMeals).length === 0}>Pokračovat</button>
                  </div>
                </div>
              </div>

              {/* Mobile fixed bottom bar */}
              {Object.keys(selectedMeals).length > 0 && (
                <div className="mobile-fixed-bar">
                  <div className="mobile-fixed-bar-inner">
                    <div className="mobile-fixed-bar-info">
                      <span className="mobile-fixed-bar-count">{Object.values(selectedMeals).reduce((a, b) => a + b, 0)} jídel</span>
                      <strong className="mobile-fixed-bar-price">{totalPrice()} Kč</strong>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => nextStep(2)}>Pokračovat</button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2 */}
            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
              <h3>Vaše kontaktní údaje</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Jméno *</label>
                  <input type="text" id="firstName" className={formErrors.firstName ? 'error' : ''} value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} placeholder="Jan" />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Příjmení *</label>
                  <input type="text" id="lastName" className={formErrors.lastName ? 'error' : ''} value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} placeholder="Novák" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">E-mail *</label>
                  <input type="email" id="email" className={formErrors.email ? 'error' : ''} value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="jan@email.cz" />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefon *</label>
                  <input type="tel" id="phone" className={formErrors.phone ? 'error' : ''} value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+420 123 456 789" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="street">Ulice a číslo popisné</label>
                <input type="text" id="street" value={formData.street} onChange={(e) => handleInputChange('street', e.target.value)} placeholder="Hlavní 123" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Město</label>
                  <input type="text" id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="Praha" />
                </div>
                <div className="form-group">
                  <label htmlFor="zip">PSČ</label>
                  <input type="text" id="zip" value={formData.zip} onChange={(e) => handleInputChange('zip', e.target.value)} placeholder="110 00" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="note">Poznámka k objednávce</label>
                <textarea id="note" rows="3" value={formData.note} onChange={(e) => handleInputChange('note', e.target.value)} placeholder="Např. alergie, preference, čas vyzvednutí..."></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => prevStep(1)}>Zpět</button>
                <button type="button" className="btn btn-primary" onClick={() => nextStep(3)}>Pokračovat</button>
              </div>
            </div>

            {/* STEP 3 */}
            <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
              <h3>Způsob platby</h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input type="radio" name="payment" value="cash" checked={payment === 'cash'} onChange={() => setPayment('cash')} />
                  <div className="payment-card">
                    <div className="payment-icon">💵</div>
                    <div>
                      <strong>Hotově při převzetí</strong>
                      <p>Zaplaťte v hotovosti při vyzvednutí objednávky.</p>
                    </div>
                  </div>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" value="bank_transfer" checked={payment === 'bank_transfer'} onChange={() => setPayment('bank_transfer')} />
                  <div className="payment-card">
                    <div className="payment-icon">🏦</div>
                    <div>
                      <strong>Bankovní převod</strong>
                      <p>Platební údaje vám zašleme e-mailem po potvrzení objednávky.</p>
                    </div>
                  </div>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => prevStep(2)}>Zpět</button>
                <button type="button" className="btn btn-primary" onClick={() => nextStep(4)}>Pokračovat ke shrnutí</button>
              </div>
            </div>

            {/* STEP 4 */}
            <div className={`form-step ${currentStep === 4 ? 'active' : ''}`}>
              <h3>Shrnutí objednávky</h3>
              <OrderSummary
                selectedMeals={selectedMeals}
                formData={formData}
                payment={payment}
              />
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                  Souhlasím s <a href="#" target="_blank">obchodními podmínkami</a> a <a href="#" target="_blank">zpracováním osobních údajů</a> *
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => prevStep(3)}>Zpět</button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>{submitting ? 'Odesílám...' : 'Odeslat objednávku'}</button>
              </div>
            </div>

            {/* STEP 5 */}
            <div className={`form-step ${currentStep === 5 ? 'active' : ''}`}>
              <div className="order-success">
                <div className="success-icon">✅</div>
                <h3>Objednávka byla odeslána!</h3>
                <p>Děkujeme za vaši objednávku. Brzy vám zašleme potvrzení na e-mail.</p>
                <p className="order-number">Číslo objednávky: <strong>{orderNumber}</strong></p>
                <Link href="/" className="btn btn-primary">Zpět na hlavní stránku</Link>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="logo-icon">🍜</span>
              <span className="logo-text">Lin&apos;s Happy Bowl</span>
              <p>Domácí jídla připravená s láskou, každý den čerstvě pro vás.</p>
            </div>
            <div className="footer-links">
              <h4>Navigace</h4>
              <ul>
                <li><a href="#objednavka">Objednat</a></li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Kontakt</h4>
              <p>📧 info@linshappybowl.cz</p>
              <p>📞 +420 123 456 789</p>
              <p>📍 Praha, Česká republika</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Lin&apos;s Happy Bowl. Všechna práva vyhrazena.</p>
            <Link href="/admin" className="admin-link">Administrace</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function SelectedMealsSidebar({ selectedMeals, changeMealQty }) {
  const allMeals = getMeals();
  const byDate = {};

  for (const [mealId, qty] of Object.entries(selectedMeals)) {
    const meal = allMeals.find(m => m.id === mealId);
    if (meal) {
      if (!byDate[meal.date]) byDate[meal.date] = [];
      byDate[meal.date].push({ ...meal, qty });
    }
  }

  const sortedDates = Object.keys(byDate).sort();

  if (sortedDates.length === 0) {
    return <p className="sidebar-empty">Zatím nemáte vybraná žádná jídla.</p>;
  }

  return (
    <div className="sidebar-meals-list">
      {sortedDates.map(dateStr => (
        <div key={dateStr} className="sidebar-date-group">
          <div className="sidebar-date-label">{getDayName(dateStr)} – {formatDateCZ(dateStr)}</div>
          {byDate[dateStr].map(meal => (
            <div key={meal.id} className="sidebar-meal-row">
              <div className="sidebar-meal-info">
                <span className="sidebar-meal-name">{meal.name}</span>
                <span className="sidebar-meal-price">{meal.price * meal.qty} Kč</span>
              </div>
              <div className="sidebar-meal-qty">
                <button type="button" onClick={() => changeMealQty(meal.id, -1)}>−</button>
                <span>{meal.qty}</span>
                <button type="button" onClick={() => changeMealQty(meal.id, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ selectedMeals, formData, payment }) {
  const allMeals = getMeals();
  let total = 0;
  const byDate = {};

  for (const [mealId, qty] of Object.entries(selectedMeals)) {
    const meal = allMeals.find(m => m.id === mealId);
    if (meal) {
      const subtotal = meal.price * qty;
      total += subtotal;
      if (!byDate[meal.date]) byDate[meal.date] = [];
      byDate[meal.date].push({ name: meal.name, qty, subtotal });
    }
  }

  const sortedDates = Object.keys(byDate).sort();

  return (
    <div className="order-summary">
      <div className="summary-section">
        <h4>Vybraná jídla</h4>
        {sortedDates.map(dateStr => (
          <div key={dateStr} style={{ marginBottom: '12px' }}>
            <strong>{getDayName(dateStr)} – {formatDateCZ(dateStr)}</strong>
            {byDate[dateStr].map((r, i) => (
              <div className="summary-row" key={i}>
                <span>{r.name} × {r.qty}</span>
                <span>{r.subtotal} Kč</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="summary-section">
        <h4>Kontaktní údaje</h4>
        <p>{formData.firstName} {formData.lastName}</p>
        <p>{formData.email}</p>
        <p>{formData.phone}</p>
        {formData.street && <p>{formData.street}, {formData.city} {formData.zip}</p>}
        {formData.note && <p><em>Poznámka: {formData.note}</em></p>}
      </div>
      <div className="summary-section">
        <h4>Způsob platby</h4>
        <p>{payment === 'cash' ? 'Hotově při převzetí' : 'Bankovní převod'}</p>
      </div>
      <div className="summary-section">
        <div className="summary-row summary-total">
          <span>Celkem k úhradě:</span>
          <span>{total} Kč</span>
        </div>
      </div>
    </div>
  );
}
