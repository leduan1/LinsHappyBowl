'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lhb_meal_tracker';
const TOTAL_MEALS = 100;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTotalConfirmed(data) {
  let count = 0;
  for (let i = 1; i <= TOTAL_MEALS; i++) {
    const row = data[i];
    if (row && row.linCheck && row.myCheck) {
      count += (row.meals || ['']).length;
    }
  }
  return count;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function MealRow({ index, row, onChange }) {
  const meals = row.meals || [''];
  const linChecked = row.linCheck;
  const myChecked = row.myCheck;
  const bothDone = linChecked && myChecked;
  const myLocked = !linChecked;

  const updateMealName = (mealIdx, value) => {
    const newMeals = [...meals];
    newMeals[mealIdx] = value;
    onChange(index, 'meals', newMeals);
  };

  const addMeal = () => {
    onChange(index, 'meals', [...meals, '']);
  };

  const removeMeal = () => {
    if (meals.length <= 1) return;
    onChange(index, 'meals', meals.slice(0, -1));
  };

  return (
    <div className={`tracker-row ${bothDone ? 'tracker-row--done' : ''} ${meals.length > 1 ? 'tracker-row--multi' : ''}`}>
      <div className="tracker-row__num">{index}</div>
      <div className="tracker-row__meals">
        {meals.map((name, mi) => (
          <div key={mi} className="tracker-meal-input-wrap">
            <input
              type="text"
              placeholder={meals.length > 1 ? `Jídlo ${mi + 1}...` : 'Název jídla...'}
              value={name}
              onChange={(e) => updateMealName(mi, e.target.value)}
            />
          </div>
        ))}
        <div className="tracker-meal-actions">
          <button className="tracker-meal-btn" onClick={addMeal} title="Přidat jídlo">+</button>
          <button className="tracker-meal-btn" onClick={removeMeal} disabled={meals.length <= 1} title="Odebrat jídlo">−</button>
          {meals.length > 1 && <span className="tracker-meal-count">{meals.length} jídel</span>}
        </div>
      </div>
      <div className="tracker-row__check">
        <label className={`tracker-checkbox tracker-checkbox--lin ${linChecked ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={linChecked}
            onChange={(e) => onChange(index, 'linCheck', e.target.checked)}
          />
          <span className="tracker-checkbox__box">
            {linChecked && <CheckIcon />}
          </span>
        </label>
      </div>
      <div className="tracker-row__check">
        {myLocked ? (
          <span className="tracker-checkbox tracker-checkbox--locked" title="Nejdříve musí potvrdit Lin">
            <span className="tracker-checkbox__box tracker-checkbox__box--locked">
              <LockIcon />
            </span>
          </span>
        ) : (
          <label className={`tracker-checkbox tracker-checkbox--me ${myChecked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={myChecked}
              onChange={(e) => onChange(index, 'myCheck', e.target.checked)}
            />
            <span className="tracker-checkbox__box">
              {myChecked && <CheckIcon />}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

export default function SledovaniJidelPage() {
  const [data, setData] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setData(loadData());
    setMounted(true);
  }, []);

  const handleChange = (index, field, value) => {
    setData(prev => {
      const next = { ...prev };
      if (!next[index]) next[index] = { meals: [''], linCheck: false, myCheck: false };
      next[index] = { ...next[index], [field]: value };
      if (field === 'linCheck' && !value) {
        next[index].myCheck = false;
      }
      saveData(next);
      return next;
    });
  };

  if (!mounted) return null;

  const totalConfirmed = getTotalConfirmed(data);
  const pct = Math.min(100, Math.round((totalConfirmed / TOTAL_MEALS) * 100));

  const rows = [];
  for (let i = 1; i <= TOTAL_MEALS; i++) {
    const row = data[i] || { meals: [''], linCheck: false, myCheck: false };
    rows.push(<MealRow key={i} index={i} row={row} onChange={handleChange} />);
  }

  return (
    <div className="tracker-page">
      <div className="tracker-hero">
        <div className="container">
          <h1>Sledování 100 jídel</h1>
          <p>Dohoda s Lin – 100 jídel za tento web</p>
          <div className="tracker-progress">
            <div className="tracker-progress__bar">
              <div className="tracker-progress__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="tracker-progress__label">
              <span className="tracker-progress__count">{totalConfirmed}</span>
              <span className="tracker-progress__sep">/</span>
              <span className="tracker-progress__total">{TOTAL_MEALS}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="tracker-card">
          <div className="tracker-legend">
            <div className="tracker-legend__item">
              <span className="tracker-legend__dot tracker-legend__dot--lin" />
              <span>Potvrzení od Lin</span>
            </div>
            <div className="tracker-legend__item">
              <span className="tracker-legend__dot tracker-legend__dot--me" />
              <span>Potvrzení od Duy (odemkne se po Lin)</span>
            </div>
          </div>

          <div className="tracker-header-row">
            <div className="tracker-row__num">#</div>
            <div className="tracker-row__meals">Jídla</div>
            <div className="tracker-row__check">Lin</div>
            <div className="tracker-row__check">Duy</div>
          </div>

          <div className="tracker-list">
            {rows}
          </div>
        </div>

        <p className="tracker-footer-note">Data se ukládají automaticky v prohlížeči.</p>
      </div>
    </div>
  );
}
