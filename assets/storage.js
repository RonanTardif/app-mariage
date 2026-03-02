export function loadJSONFromStorage(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function saveJSONToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
