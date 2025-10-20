import type { Restaurant, Course, WeeklyResponse } from './api.js';

export function renderRestaurants(restaurants: Restaurant[], onSelect: (r: Restaurant) => void) {
  const list = document.getElementById('restaurantsList')!;
  list.innerHTML = '';

  restaurants.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'restaurant';
    div.innerHTML = `
      <h3>${r.name}</h3>
      <p>${r.city} · ${r.company}</p>
    `;
    div.addEventListener('click', () => onSelect(r));
    list.appendChild(div);
  });
}

export function renderDailyMenu(courses: Course[]) {
  const container = document.getElementById('menuContainer')!;
  container.innerHTML = courses
    .map(
      (c) => `
    <div class="menu-item">
      <strong>${c.name}</strong><br/>
      ${c.diets ?? ''} ${c.price ? `· ${c.price}` : ''}
    </div>
  `
    )
    .join('');
}

export function renderWeeklyMenu(days: WeeklyResponse['days']) {
  const container = document.getElementById('menuContainer')!;
  container.innerHTML = days
    .map(
      (d) => `
    <div class="menu-day">
      <h4>${d.date}</h4>
      ${d.courses
        .map(
          (c) => `
        <div class="menu-item">
          <strong>${c.name}</strong><br/>
          ${c.diets ?? ''} ${c.price ? `· ${c.price}` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('');
}
