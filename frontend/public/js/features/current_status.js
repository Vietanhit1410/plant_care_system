import { apiClient } from '../core/api_client.js';
import { renderEmptyState } from '../core/ui_helpers.js';
import { renderSchemaCard } from '../core/schema_renderer.js';

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
  'image_url',
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

  root.innerHTML = renderSchemaCard({
    title: 'Trạng thái Cây',
    subtitle: 'Dữ liệu hiện tại của cây',
    schema,
    data,
    summaryFieldKeys: CURRENT_STATUS_SUMMARY_FIELDS,
    detailFieldKeys: CURRENT_STATUS_DETAIL_FIELDS,
  });
}
