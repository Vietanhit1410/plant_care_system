import { apiClient } from '../core/api-client.js';

const CACHE_KEY = 'plant_care_environment_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  if (!environment) {
    root.innerHTML = `
      <article class="shell__error">
        <h2>Không có dữ liệu thời tiết</h2>
        <p>Không thể tải dữ liệu thời tiết từ server.</p>
      </article>
    `;
    return;
  }

  const isCached = environment._cached ? '(từ cache)' : '';
  const cachedBadge = environment._cached ? '<span class="data-cache-badge">📦 Dữ liệu từ cache</span>' : '';

  root.innerHTML = `
    <article class="environment-card">
      <div class="environment-card__header">
        <div>
          <h3 class="environment-card__title">Thông tin thời tiết</h3>
          <p class="environment-card__meta">Dữ liệu môi trường hiện tại ${isCached}</p>
        </div>
        ${cachedBadge}
      </div>

      <div class="environment-grid">
        <div class="environment-metric">
          <div class="environment-metric__body">
            <div class="environment-metric__label">Thời tiết</div>
            <div class="environment-metric__value">${environment?.weather || '-'}</div>
          </div>
          <span class="environment-metric__icon">☀️</span>
        </div>

        <div class="environment-metric">
          <div class="environment-metric__body">
            <div class="environment-metric__label">Độ ẩm không khí</div>
            <div class="environment-metric__value">${environment?.humidity ?? '-'}%</div>
          </div>
          <span class="environment-metric__icon">💧</span>
        </div>

        <div class="environment-metric">
          <div class="environment-metric__body">
            <div class="environment-metric__label">Nhiệt độ</div>
            <div class="environment-metric__value">${environment?.temperature ?? '-'}°C</div>
          </div>
          <span class="environment-metric__icon">🌡️</span>
        </div>

        <div class="environment-metric">
          <div class="environment-metric__body">
            <div class="environment-metric__label">Mây</div>
            <div class="environment-metric__value">${environment?.clouds ?? '-'}%</div>
          </div>
          <span class="environment-metric__icon">☁️</span>
        </div>

        <div class="environment-metric">
          <div class="environment-metric__body">
            <div class="environment-metric__label">Tốc độ gió</div>
            <div class="environment-metric__value">${environment?.wind_speed ?? '-'} m/s</div>
          </div>
          <span class="environment-metric__icon">🍃</span>
        </div>

        <div class="environment-metric">
          <div class="environment-metric__body">
            <div class="environment-metric__label">Lượng mưa</div>
            <div class="environment-metric__value">${environment?.rain ?? environment?.precipitation ?? '-'} mm</div>
          </div>
          <span class="environment-metric__icon">🌧️</span>
        </div>
      </div>

      <div class="environment-timestamp">
        Cập nhật: ${environment?.timestamp ? new Date(environment.timestamp * 1000).toLocaleString('vi-VN') : '-'}
        ${environment?._error ? `<br><span style="color: var(--warning); font-size: 0.85rem;">${environment._error}</span>` : ''}
      </div>
    </article>
  `;
}