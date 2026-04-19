import { apiClient } from '../core/api_client.js';
import { showDetailPopup } from '../core/ui_helpers.js';

export async function loadPlantHistory() {
  return apiClient.request('/api/plant_history');
}

export function renderPlantHistory({ root, items = [], onClose }) {
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
        ${historyItems.map((item, index) => `
          <div class="timeline__item plant_history__item" data_history_idx="${index}" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <div class="timeline__dot"></div>
            <div class="timeline__content">
              <p class="timeline__title">${item.title || '-'}</p>
              <p class="timeline__desc">${item.date || '-'} &mdash; ${item.details || ''}</p>
            </div>
          </div>
        `).join('')}
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
        showDetailPopup(itemData.title || 'Chi tiết lịch sử', itemData, itemData.snapshot?.url || itemData.image?.url || null);
      }
    });
  });
}
