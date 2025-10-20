import { fetchRestaurants, fetchDailyMenu, fetchWeeklyMenu } from "./api.js";

// =============== 🔐 LOGIN & SIGN UP ===============
const authSection = document.getElementById("authSection")!;
const signUpSection = document.getElementById("signUpSection")!;
const appContainer = document.getElementById("app")!;
const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passInput = document.getElementById("password") as HTMLInputElement;
const errorMsg = document.getElementById("loginError") as HTMLParagraphElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;

const signUpForm = document.getElementById("signUpForm") as HTMLFormElement;
const signUpEmail = document.getElementById("signUpEmail") as HTMLInputElement;
const signUpPass = document.getElementById("signUpPassword") as HTMLInputElement;
const signUpError = document.getElementById("signUpError") as HTMLParagraphElement;

const switchToSignUp = document.getElementById("switchToSignUp") as HTMLButtonElement;
const switchToLogin = document.getElementById("switchToLogin") as HTMLButtonElement;

const themeToggle = document.getElementById("themeToggle") as HTMLInputElement;

// Näkymä sivun latauksessa
const savedUser = localStorage.getItem("metropoliaUser");
if (savedUser) {
  authSection.style.display = "none";
  signUpSection.style.display = "none";
  appContainer.style.display = "block";
  init();
} else {
  authSection.style.display = "block";
  signUpSection.style.display = "none";
  appContainer.style.display = "none";
}

// Teema
(function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark", savedTheme === "dark");
  if (themeToggle) themeToggle.checked = savedTheme === "dark";
})();
themeToggle?.addEventListener("change", () => {
  const isDark = themeToggle.checked;
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Vaihto: Login <-> Sign Up
switchToSignUp?.addEventListener("click", () => {
  authSection.style.display = "none";
  signUpSection.style.display = "block";
});
switchToLogin?.addEventListener("click", () => {
  authSection.style.display = "block";
  signUpSection.style.display = "none";
});

// ====== Kirjautuminen (Sign In) ======
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  const password = passInput.value.trim();

  if (!email.endsWith("@metropolia.fi")) {
    errorMsg.textContent = "Vain Metropolian sähköpostilla voi kirjautua sisään!";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (!users[email]) {
    errorMsg.textContent = "Tätä tiliä ei ole vielä luotu. Luo tili ensin.";
    return;
  }
  if (users[email] !== password) {
    errorMsg.textContent = "Virheellinen salasana.";
    return;
  }

  localStorage.setItem("metropoliaUser", email);
  authSection.style.display = "none";
  signUpSection.style.display = "none";
  appContainer.style.display = "block";
  init();
});

// ====== Sign Up ======
signUpForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signUpEmail.value.trim().toLowerCase();
  const password = signUpPass.value.trim();

  if (!email.endsWith("@metropolia.fi")) {
    signUpError.textContent = "Vain Metropolian sähköpostilla voi rekisteröityä!";
    return;
  }
  if (password.length < 4) {
    signUpError.textContent = "Salasanan on oltava vähintään 4 merkkiä.";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users[email]) {
    signUpError.textContent = "Tämä tili on jo olemassa. Kirjaudu sisään.";
    return;
  }

  users[email] = password; // (Demo) ei oikeaa SSO:ta
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("metropoliaUser", email);

  signUpSection.style.display = "none";
  appContainer.style.display = "block";
  init();
});

// Uloskirjautuminen
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("metropoliaUser");
  location.reload();
});

// =============== 🍴 APP LOGIC ===============
let restaurants: any[] = [];
let filtered: any[] = [];
let currentRestaurant: any = null;

async function init() {
  restaurants = await fetchRestaurants();
  filtered = [...restaurants];
  setupFilters();
  renderRestaurants();
  initDialog();
}

// --- Favorites ---
function getUserKey(): string {
  const user = localStorage.getItem("metropoliaUser") || "guest";
  return `favorites:${user}`;
}
function loadFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(getUserKey()) || "[]"); }
  catch { return []; }
}
function saveFavorites(ids: string[]) { localStorage.setItem(getUserKey(), JSON.stringify(ids)); }
function isFavorite(id: string): boolean { return loadFavorites().includes(id); }
function toggleFavorite(id: string) {
  let favs = loadFavorites();
  if (favs.includes(id)) favs = favs.filter((x) => x !== id);
  else favs.push(id);
  saveFavorites(favs);
}

// --- Filters ---
function setupFilters() {
  const citySelect = document.getElementById("cityFilter") as HTMLSelectElement;
  const companySelect = document.getElementById("companyFilter") as HTMLSelectElement;
  const searchInput = document.getElementById("searchInput") as HTMLInputElement;
  const resetBtn = document.getElementById("resetFilters") as HTMLButtonElement;
  const onlyFavs = document.getElementById("onlyFavorites") as HTMLInputElement;

  const cities = [...new Set(restaurants.map((r) => r.city).filter(Boolean))];
  const companies = [...new Set(restaurants.map((r) => r.company).filter(Boolean))];

  cities.forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
  companies.forEach((comp) => {
    const opt = document.createElement("option");
    opt.value = comp;
    opt.textContent = comp;
    companySelect.appendChild(opt);
  });

  citySelect.addEventListener("change", applyFilters);
  companySelect.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);
  onlyFavs.addEventListener("change", applyFilters);
  resetBtn.addEventListener("click", () => {
    citySelect.value = "all";
    companySelect.value = "all";
    searchInput.value = "";
    onlyFavs.checked = false;
    applyFilters();
  });
}

function applyFilters() {
  const cityVal = (document.getElementById("cityFilter") as HTMLSelectElement).value;
  const compVal = (document.getElementById("companyFilter") as HTMLSelectElement).value;
  const searchVal = (document.getElementById("searchInput") as HTMLInputElement).value.toLowerCase();
  const onlyFavs = (document.getElementById("onlyFavorites") as HTMLInputElement).checked;

  filtered = restaurants.filter((r) => {
    const cityMatch = cityVal === "all" || r.city === cityVal;
    const compMatch = compVal === "all" || r.company === compVal;
    const searchMatch = r.name.toLowerCase().includes(searchVal);
    const favMatch = !onlyFavs || isFavorite(r._id);
    return cityMatch && compMatch && searchMatch && favMatch;
  });

  renderRestaurants();
}

// --- Render ---
function renderRestaurants() {
  const list = document.getElementById("restaurantsList")!;
  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<p>Ei ravintoloita valituilla suodattimilla.</p>`;
    return;
  }

  filtered.forEach((r) => {
    const card = document.createElement("div");
    card.className = "restaurant-card";
    if (isFavorite(r._id)) card.classList.add("favorite");

    const starBtn = document.createElement("button");
    starBtn.className = "fav-btn" + (isFavorite(r._id) ? " fav-active" : "");
    starBtn.textContent = isFavorite(r._id) ? "★" : "☆";

    starBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleFavorite(r._id);
      renderRestaurants();
    });

    const inner = document.createElement("div");
    inner.innerHTML = `<h3>${r.name}</h3><p>${r.city ?? "-"} · ${r.company ?? "-"}</p>`;

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.appendChild(starBtn);

    card.appendChild(inner);
    card.appendChild(actions);
    card.addEventListener("click", () => openDialog(r));

    list.appendChild(card);
  });
}

// --- Dialog ---
function initDialog() {
  const dialog = document.getElementById("restaurantDialog") as HTMLDialogElement;
  const closeBtn = document.getElementById("closeDialog") as HTMLButtonElement;
  const dailyBtn = document.getElementById("dailyBtn") as HTMLButtonElement;
  const weeklyBtn = document.getElementById("weeklyBtn") as HTMLButtonElement;
  const favToggle = document.getElementById("favToggleDialog") as HTMLButtonElement;

  closeBtn.addEventListener("click", () => dialog.close());

  dailyBtn.addEventListener("click", async () => {
    if (!currentRestaurant) return;
    setActive(dailyBtn, weeklyBtn);
    const daily = await fetchDailyMenu(currentRestaurant._id, "fi");
    renderMenu(daily, "daily");
  });

  weeklyBtn.addEventListener("click", async () => {
    if (!currentRestaurant) return;
    setActive(weeklyBtn, dailyBtn);
    const weekly = await fetchWeeklyMenu(currentRestaurant._id, "fi");
    renderMenu(weekly, "weekly");
  });

  favToggle.addEventListener("click", () => {
    if (!currentRestaurant) return;
    toggleFavorite(currentRestaurant._id);
    renderRestaurants();
    updateFavButton(favToggle);
  });
}

async function openDialog(r: any) {
  currentRestaurant = r;
  const dialog = document.getElementById("restaurantDialog") as HTMLDialogElement;
  const title = document.getElementById("dialogTitle")!;
  const info = document.getElementById("dialogInfo")!;
  const favBtn = document.getElementById("favToggleDialog") as HTMLButtonElement;

  title.textContent = r.name;
  info.textContent = `${r.address ?? ""} – ${r.city ?? ""} (${r.company ?? ""})`;
  updateFavButton(favBtn);

  dialog.showModal();

  const daily = await fetchDailyMenu(r._id, "fi");
  renderMenu(daily, "daily");
}

function updateFavButton(btn: HTMLButtonElement) {
  if (!currentRestaurant) return;
  const fav = isFavorite(currentRestaurant._id);
  btn.textContent = fav ? "★" : "☆";
  btn.classList.toggle("fav-active", fav);
}

function setActive(active: HTMLElement, inactive: HTMLElement) {
  active.classList.add("active");
  inactive.classList.remove("active");
}

function renderMenu(data: any, type: "daily" | "weekly") {
  const menu = document.getElementById("dialogMenu")!;
  if (type === "daily") {
    menu.innerHTML = data
      .map(
        (c: any) => `
        <div class="menu-item">
          <strong>${c.name}</strong><br/>
          ${c.diets ?? ""} ${c.price ? `· ${c.price}` : ""}
        </div>`
      )
      .join("");
  } else {
    menu.innerHTML = data
      .map(
        (d: any) => `
        <div class="menu-day">
          <h4>${d.date}</h4>
          ${d.courses
            .map(
              (c: any) => `
              <div class="menu-item">
                <strong>${c.name}</strong><br/>
                ${c.diets ?? ""} ${c.price ? `· ${c.price}` : ""}
              </div>`
            )
            .join("")}
        </div>`
      )
      .join("");
  }
}
