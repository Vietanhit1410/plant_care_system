import { apiClient } from '../core/api_client.js';
import { showDetailPopup } from '../core/ui_helpers.js';
import { renderSchemaList } from '../core/schema_renderer.js';

const PLANT_HISTORY_LIST_FIELDS = ['received_at', 'moisture', 'note', 'source'];

export async function loadPlantHistory() {
  return apiClient.request('/api/plant_history');
}

export function renderPlantHistory({ root, items = [], onClose, schema }) {
  const historyItems = Array.isArray(items) ? items : [];

  root.innerHTML = `
    <section class="modal__panel plant_history">
      <div class="modal__header plant_history__header">
        <div>
          <h3 class="card__title">Lịch sử cây trồng</h3>
          <p class="card__meta">Toàn bộ các mốc lịch sử được hiển thị sau khi bấm nút trong độ ẩm đất.</p>
        </div>
        <button class="modal__close" type="button" data_close_history aria-label="Đóng lịch sử">&times;</button>
      </div>
      <div class="timeline plant_history__timeline">
        ${renderSchemaList({ schema, items: historyItems, listFieldKeys: PLANT_HISTORY_LIST_FIELDS })}
      </div>
    </section>
  `;

  const closeButton = root.querySelector('[data_close_history]');
  if (closeButton && typeof onClose === 'function') {
    closeButton.addEventListener('click', onClose);
  }

  const timelineEls = root.querySelectorAll('[data_history_idx]');
  timelineEls.forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.getAttribute('data_history_idx');
      const itemData = historyItems[idx];
      if (itemData) {
        showDetailPopup(itemData.source || 'Chi tiết lịch sử', itemData, itemData.image_url || null);
      }
    });
  });
}
