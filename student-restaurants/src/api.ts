// ✅ Metropolia API temporarily (works now immediately)
// ✅ Replace BACK later with Sodexo API when it works again

export interface Course {
  name: string;
  price?: string;
  diets?: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  company: string;
}

export interface WeeklyResponse {
  days: { date: string; courses: Course[] }[];
}

const BASE_URL = 'https://media1.edu.metropolia.fi/restaurant/api/v1';

// Fetch helper
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// 🏢 Restaurants
export async function fetchRestaurants(): Promise<Restaurant[]> {
  try {
    const data = await getJSON<{ restaurants: Restaurant[] }>(`${BASE_URL}/restaurants`);
    return data.restaurants ?? [];
  } catch (err) {
    console.error('❌ Failed to load restaurants:', err);
    return [];
  }
}

// 🍽️ Daily menu
export async function fetchDailyMenu(id: string, lang: 'fi' | 'en' = 'fi'): Promise<Course[]> {
  try {
    const data = await getJSON<{ courses: Course[] }>(
      `${BASE_URL}/restaurants/daily/${id}/${lang}`
    );
    return data.courses ?? [{ name: 'Ei ruokalistaa tälle päivälle.' }];
  } catch {
    return [{ name: 'Ei ruokalistaa tälle päivälle.' }];
  }
}

// 📅 Weekly menu (sorted ascending)
export async function fetchWeeklyMenu(id: string, lang: 'fi' | 'en' = 'fi') {
  try {
    const data = await getJSON<WeeklyResponse>(
      `${BASE_URL}/restaurants/weekly/${id}/${lang}`
    );
    return (data.days ?? []).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch {
    return [];
  }
}
