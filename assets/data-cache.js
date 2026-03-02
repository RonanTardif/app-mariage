import { fetchJSONP } from "./jsonp.js";
import { PHOTOS_API, ROOMS_API } from "./config.js";
import { loadJSONFromStorage, saveJSONToStorage } from "./storage.js";

const CACHE_KEYS = {
  photos: "mariage_cache_photos_v1",
  rooms: "mariage_cache_rooms_v1",
};

function createEntry(storageKey) {
  return {
    storageKey,
    data: null,
    loadedFromStorage: false,
    fetchedAt: 0,
    inFlight: null,
  };
}

const entries = {
  photos: createEntry(CACHE_KEYS.photos),
  rooms: createEntry(CACHE_KEYS.rooms),
};

function readStorage(entry) {
  if (entry.loadedFromStorage) return;
  entry.loadedFromStorage = true;

  const raw = loadJSONFromStorage(entry.storageKey, null);
  if (!raw || typeof raw !== "object") return;
  if (!raw.data) return;

  entry.data = raw.data;
  entry.fetchedAt = Number(raw.fetchedAt) || 0;
}

function writeStorage(entry) {
  if (!entry.data) return;
  saveJSONToStorage(entry.storageKey, {
    fetchedAt: entry.fetchedAt,
    data: entry.data,
  });
}

function getCached(entry) {
  readStorage(entry);
  return entry.data;
}

async function fetchWithCache(entry, url, { forceRefresh = false } = {}) {
  const cached = getCached(entry);
  if (!forceRefresh && cached) return cached;
  if (entry.inFlight) return entry.inFlight;

  entry.inFlight = fetchJSONP(url)
    .then((data) => {
      entry.data = data;
      entry.fetchedAt = Date.now();
      writeStorage(entry);
      return data;
    })
    .finally(() => {
      entry.inFlight = null;
    });

  return entry.inFlight;
}

export function getCachedPhotosData() {
  return getCached(entries.photos);
}

export function getCachedRoomsData() {
  return getCached(entries.rooms);
}

export function fetchPhotosData(options) {
  return fetchWithCache(entries.photos, PHOTOS_API, options);
}

export function fetchRoomsData(options) {
  return fetchWithCache(entries.rooms, ROOMS_API, options);
}

export function warmupAppCaches() {
  const jobs = [
    fetchPhotosData().catch(() => null),
    fetchRoomsData().catch(() => null),
  ];

  return Promise.all(jobs);
}
