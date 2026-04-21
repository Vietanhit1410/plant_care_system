import { apiClient } from '../core/api_client.js';
import { renderEmptyState } from '../core/ui_helpers.js';
import { renderFieldRows, renderSummaryMetrics } from '../core/schema_renderer.js';

const CURRENT_STATUS_SUMMARY_FIELDS = ['moisture', 'temperature', 'humidity'];
const CURRENT_STATUS_DETAIL_FIELDS = [
  'received_at',
  'moisture',
  'temperature',
  'humidity',
  'weather',
  'clouds',
  'wind_speed',
  'rain',
  'note',
  'source',
];

export async function loadCurrentStatus() {
  try {
    return await apiClient.request('/api/current_status');
  } catch (error) {
    console.warn('Failed to load current status:', error);
    return { _error: error.message };
  }
}

function getImageUrl(schema, data) {
  const imageField = schema?.fields?.find(field => field.format === 'image');
  if (!imageField) return null;
  const value = data?.[imageField.key];
  if (!value) return null;
  if (value.startsWith('/media/')) {
    return `${apiClient.baseUrl}${value}`;
  }
  return value;
}

export function renderCurrentStatus({ root, status, schemaOverride }) {
  const data = status?.data;
  const schema = schemaOverride || status?.schema;

  if (!data) {
    root.innerHTML = renderEmptyState(
      '🌿',
      'Chưa có dữ liệu trạng thái cây',
      'Không có ghi nhận trạng thái cây nào. Thực hiện kiểm tra để bắt đầu theo dõi.'
    );
    return;
  }

  const summaryMetrics = renderSummaryMetrics({ schema, data, summaryFieldKeys: CURRENT_STATUS_SUMMARY_FIELDS });
  const detailRows = renderFieldRows({
    schema,
    data,
    fieldKeys: CURRENT_STATUS_DETAIL_FIELDS,
    showEmpty: true,
  });
  const imageUrl = getImageUrl(schema, data);

  root.innerHTML = `
    <article class="card plant_status">
      <header class="plant_status__header">
        <div>
          <h3 class="card__title">Trạng thái Cây</h3>
          <p class="card__meta">Dữ liệu hiện tại của cây</p>
        </div>
      </header>

      <section class="plant_status__main">
        <div class="plant_status__left">
          ${summaryMetrics ? `<section class="plant_status__summary">${summaryMetrics}</section>` : ''}
          <div class="plant_status__media">
            ${imageUrl ? `
              <img class="plant_status__media_image" src="${imageUrl}" alt="Ảnh cây hiện tại">
            ` : '<p class="card__meta">Chưa có ảnh.</p>'}
          </div>
        </div>

        <div class="plant_status__detail_card">
          <h4 class="plant_status__details_title">Thông tin chi tiết</h4>
          <div class="plant_status__detail_list">
            ${detailRows || '<p class="card__meta">Chưa có dữ liệu chi tiết.</p>'}
          </div>
        </div>
      </section>
    </article>
  `;
}
