import { apiClient } from '../core/api-client.js';
import { formatDateTime, renderEmptyState } from '../core/ui-helpers.js';

export async function loadCurrentStatus() {
  try {
    return await apiClient.request('/api/current-status');
  } catch (error) {
    console.warn('Failed to load current status:', error);
    return { _error: error.message };
  }
}

function getHealthColor(score) {
  if (!score && score !== 0) return '#999';
  if (score >= 80) return '#2e9f6b';
  if (score >= 60) return '#f0b429';
  if (score >= 40) return '#f08c42';
  return '#d94c4c';
}

function getMoistureColor(moisture) {
  if (!moisture && moisture !== 0) return '#999';
  if (moisture >= 60 && moisture <= 80) return '#2e9f6b'; // Green - good
  if (moisture >= 40 && moisture < 60) return '#f0b429'; // Yellow - ok
  if (moisture < 40) return '#d94c4c'; // Red - too dry
  if (moisture > 80) return '#7fc8f8'; // Blue - too wet
  return '#5f7466';
}

export function renderCurrentStatus({ root, status }) {
  if (!status) {
    root.innerHTML = renderEmptyState(
      '🌿',
      'Chưa có dữ liệu trạng thái cây',
      'Không có ghi nhận trạng thái cây nào. Thực hiện kiểm tra để bắt đầu theo dõi.'
    );
    return;
  }

  const healthScore = status?.health_score ?? status?.score ?? '-';
  const healthColor = getHealthColor(healthScore);
  const moistureLevel = status?.soil_moisture ?? status?.moisture ?? '-';
  const moistureColor = getMoistureColor(moistureLevel);
  const lastUpdated = formatDateTime(status?.capturedAt || status?.timestamp || status?.time);
  const sourceLabel = status?.source === 'auto' ? '🤖 Tự động' : '👤 Thủ công';

  root.innerHTML = `
    <article class="card plant-status">
      <div class="plant-status__header">
        <div>
          <h3 class="card__title">Trạng thái Cây</h3>
          <p class="card__meta">Đánh giá sức khỏe hiện tại</p>
        </div>
        <div class="plant-status__health-badge" style="border-color: ${healthColor}; color: ${healthColor};">
          ${healthScore}${healthScore !== '-' ? '%' : ''}
        </div>
      </div>

      <div class="plant-status__grid">
        <div class="plant-status__metric">
          <div class="plant-status__metric-icon" style="background-color: rgba(127, 200, 248, 0.2); color: #1c5d82;">💧</div>
          <div class="plant-status__metric-content">
            <div class="plant-status__metric-label">Độ ẩm đất</div>
            <div class="plant-status__metric-value" style="color: ${moistureColor};">${moistureLevel}${moistureLevel !== '-' ? '%' : ''}</div>
          </div>
        </div>

        <div class="plant-status__metric">
          <div class="plant-status__metric-icon" style="background-color: rgba(46, 159, 107, 0.2); color: #1f6f34;">🌱</div>
          <div class="plant-status__metric-content">
            <div class="plant-status__metric-label">Tình trạng</div>
            <div class="plant-status__metric-value">${status?.condition || status?.status || 'Bình thường'}</div>
          </div>
        </div>

        <div class="plant-status__metric">
          <div class="plant-status__metric-icon" style="background-color: rgba(240, 180, 41, 0.2); color: #8a6b28;">📋</div>
          <div class="plant-status__metric-content">
            <div class="plant-status__metric-label">Nguồn</div>
            <div class="plant-status__metric-value">${sourceLabel}</div>
          </div>
        </div>
      </div>

      ${status?.note || status?.notes ? `
        <div class="plant-status__notes">
          <h4 class="plant-status__notes-title">Ghi chú</h4>
          <p class="plant-status__notes-content">${status.note || status.notes}</p>
        </div>
      ` : ''}

      <div class="plant-status__footer">
        <small>Cập nhật: ${lastUpdated}</small>
      </div>
    </article>
  `;
}
