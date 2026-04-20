import { apiClient } from '../core/api_client.js';
import { renderSchemaCard } from '../core/schema_renderer.js';

const CACHE_KEY = 'plant_care_environment_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ENVIRONMENT_SUMMARY_FIELDS = ['weather', 'temperature', 'humidity',, 'clouds', 'wind_speed', 'rain'];
// const ENVIRONMENT_DETAIL_FIELDS = ['timestamp', 'clouds', 'wind_speed', 'rain', 'source'];
const ENVIRONMENT_DETAIL_FIELDS = [];

function getCachedEnvironment() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function setCachedEnvironment(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to cache environment:', e);
  }
}

export async function loadEnvironment() {
  try {
    const data = await apiClient.request('/api/environment/current');
    setCachedEnvironment(data);
    return data;
  } catch (error) {
    const cached = getCachedEnvironment();
    if (cached) {
      console.warn('Using cached environment data due to error:', error);
      return { ...cached, _cached: true, _error: error.message };
    }
    throw error;
  }
}

export function renderEnvironment({ root, environment }) {
  const data = environment?.data;
  const schema = environment?.schema;

  if (!data) {
    root.innerHTML = `
      <article class="shell__error">
        <h2>Không có dữ liệu thời tiết</h2>
        <p>Không thể tải dữ liệu thời tiết từ server.</p>
      </article>
    `;
    return;
  }

  root.innerHTML = renderSchemaCard({
    title: 'Thông tin thời tiết',
    subtitle: 'Dữ liệu môi trường hiện tại',
    schema,
    data,
    summaryFieldKeys: ENVIRONMENT_SUMMARY_FIELDS,
    detailFieldKeys: ENVIRONMENT_DETAIL_FIELDS,
  });
}