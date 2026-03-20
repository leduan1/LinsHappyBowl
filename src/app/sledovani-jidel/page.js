'use client';

import { useState, useEffect, useRef } from 'react';

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

function getCompleted(data) {
  let count = 0;
  for (let i = 1; i <= TOTAL_MEALS; i++) {
    const meal = data[i];
    if (meal && meal.linCheck && meal.myCheck) count++;
  }
  return count;
}

function MealRow({ index, meal, onChange }) {
  return (
    <div className={`tracker-row ${meal.linCheck && meal.myCheck ? 'tracker-row--done' : ''}`}>
      <div className="tracker-row__num">{index}</div>
      <div className="tracker-row__name">
        <input
          type="text"
          placeholder="Název jídla..."
          value={meal.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
        />
      </div>
      <div className="tracker-row__check">
        <label className={`tracker-checkbox tracker-checkbox--lin ${meal.linCheck ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={meal.linCheck}
            onChange={(e) => onChange(index, 'linCheck', e.target.checked)}
          />
          <span className="tracker-checkbox__box">
            {meal.linCheck && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </span>
        </label>
      </div>
      <div className="tracker-row__check">
        <label className={`tracker-checkbox tracker-checkbox--me ${meal.myCheck ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={meal.myCheck}
            onChange={(e) => onChange(index, 'myCheck', e.target.checked)}
          />
          <span className="tracker-checkbox__box">
            {meal.myCheck && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </span>
        </label>
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
      if (!next[index]) next[index] = { name: '', linCheck: false, myCheck: false };
      next[index] = { ...next[index], [field]: value };
      saveData(next);
      return next;
    });
  };

  if (!mounted) return null;

  const completed = getCompleted(data);
  const pct = Math.round((completed / TOTAL_MEALS) * 100);

  const rows = [];
  for (let i = 1; i <= TOTAL_MEALS; i++) {
    const meal = data[i] || { name: '', linCheck: false, myCheck: false };
    rows.push(<MealRow key={i} index={i} meal={meal} onChange={handleChange} />);
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
              <span className="tracker-progress__count">{completed}</span>
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
              <span>Moje potvrzení</span>
            </div>
          </div>

          <div className="tracker-header-row">
            <div className="tracker-row__num">#</div>
            <div className="tracker-row__name">Jídlo</div>
            <div className="tracker-row__check">Lin</div>
            <div className="tracker-row__check">Já</div>
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
