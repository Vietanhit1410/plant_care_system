import { apiClient } from '../core/api-client.js';

export async function load_plant_history() {
  return apiClient.request('/api/plant-history');
}

function render_history_panel(items = []) {
  return `
    <section class="modal__panel plant_history">
      <div class="modal__header plant_history__header">
        <div>
          <h3 class="card__title">Lịch sử cây trồng</h3>
          <p class="card__meta">Các mốc dữ liệu dùng chung từ bảng plant_observations.</p>
        </div>
        <button class="modal__close" type="button" data_close_history aria-label="Đóng lịch sử">×</button>
      </div>
      <div class="timeline plant_history__timeline">
        ${(Array.isArray(items) ? items : []).map((item) => `
          <div class="timeline__item plant_history__item">
            <div class="timeline__dot"></div>
            <div class="timeline__content">
              <p class="timeline__title">${item.title || item.source || '-'}</p>
              <p class="timeline__desc">${item.date || '-'}</p>
              <p class="timeline__desc">Độ ẩm: ${item.moistureValue ?? '-'}</p>
              ${item.imagePath ? `<p class="timeline__desc">Ảnh: ${item.imagePath}</p>` : ''}
              ${item.details ? `<p class="timeline__desc">${item.details}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

export async function open_plant_history_modal({ overlay_root, on_close }) {
  overlay_root.innerHTML = '<div class="modal__panel"><div class="shell__placeholder">Đang tải lịch sử cây trồng...</div></div>';
  overlay_root.setAttribute('aria-hidden', 'false');

  try {
    const historyData = await load_plant_history();
    overlay_root.innerHTML = render_history_panel(historyData?.items || []);
    const closeButton = overlay_root.querySelector('[data_close_history]');
    if (closeButton && typeof on_close === 'function') {
      closeButton.addEventListener('click', on_close);
    }
  } catch (error) {
    overlay_root.innerHTML = `
      <div class="modal__panel plant_history">
        <div class="modal__header plant_history__header">
          <div>
            <h3 class="card__title">Lịch sử cây trồng</h3>
            <p class="card__meta">Không tải được dữ liệu lịch sử.</p>
          </div>
          <button class="modal__close" type="button" data_close_history aria-label="Đóng lịch sử">×</button>
        </div>
        <p class="shell__error">${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </div>
    `;
    const closeButton = overlay_root.querySelector('[data_close_history]');
    if (closeButton && typeof on_close === 'function') {
      closeButton.addEventListener('click', on_close);
    }
  }
}
