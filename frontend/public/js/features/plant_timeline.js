import { apiClient } from '../core/api_client.js';
import { formatDateTime, renderEmptyState, showDetailPopup } from '../core/ui_helpers.js';

function formatMoistureValue(entry) {
  const value = entry?.value ?? entry?.moisture ?? entry?.humidity ?? '-';
  const unit = entry?.unit ?? '%';
  return `${value}${value === '-' ? '' : unit}`;
}

function formatTime(timestamp) {
  if (!timestamp) return '-';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleString('vi-VN');
  } catch {
    return timestamp?.toString?.() || '-';
  }
}

function renderTimelineItem(entry, label, modifier = '', indexStr = '') {
  if (!entry) {
    return `
      <div class="timeline__item ${modifier}" data-state="empty">
        <div class="timeline__dot"></div>
        <div class="timeline__content">
          <p class="timeline__title">${label}</p>
          <p class="timeline__desc">Không có dữ liệu</p>
        </div>
      </div>
    `;
  }

  const snapshot = entry?.snapshot || entry?.image || {};
  const snapshotSrc = snapshot?.url || snapshot?.imageUrl || snapshot?.src || '';
  const snapshotAlt = snapshot?.alt || label || 'Ảnh chụp của cây';

  return `
    <div class="timeline__item ${modifier}" data-state="${entry?.state || label}" data_timeline_idx="${indexStr}" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
      <div class="timeline__dot"></div>
      <div class="timeline__content">
        <p class="timeline__title">${label}</p>
        <p class="timeline__desc">${formatTime(entry?.capturedAt || entry?.time || entry?.timestamp)}</p>
        <p class="timeline__desc"><strong>Độ ẩm đất:</strong> ${formatMoistureValue(entry)}</p>
        ${entry?.note ? `<p class="timeline__desc plant_timeline__timeline_note">${entry.note}</p>` : ''}
        <figure class="plant_timeline__timeline_image_wrap">
          ${snapshotSrc ? `<img class="plant_timeline__timeline_image" src="${snapshotSrc}" alt="${snapshotAlt}">` : '<div class="plant_timeline__timeline_image placeholder">Chưa có ảnh</div>'}
          ${snapshot?.capturedAt || entry?.capturedAt ? `<figcaption class="timeline__desc">${formatTime(snapshot?.capturedAt || entry?.capturedAt)}</figcaption>` : ''}
        </figure>
      </div>
    </div>
  `;
}

export async function loadPlantTimeline() {
  return apiClient.request('/api/plant_timeline/current');
}

export function renderPlantTimeline({ root, moisture, timeline = [], onShowHistory }) {
  if (!moisture && timeline.length === 0) {
    root.innerHTML = `
      <article class="shell__error">
        <h2>Không có dữ liệu độ ẩm đất</h2>
        <p>Chưa có quan sát nào được ghi nhận.</p>
      </article>
    `;
    return;
  }

  const timelineItems = Array.isArray(timeline) ? timeline : [];
  const normalizedTimeline = timelineItems.length >= 5 ? timelineItems.slice(0, 5) : [
    ...timelineItems.slice(0, 3),
    timelineItems[3] || moisture,
    timelineItems[4] || moisture?.prediction || moisture?.forecast,
  ].filter(Boolean);

  const previousItems = normalizedTimeline.slice(0, 3);
  const currentItem = normalizedTimeline[3] || moisture;
  const predictedItem = normalizedTimeline[4] || moisture?.prediction || moisture?.forecast;

  const allItemsForClick = [...previousItems, currentItem, predictedItem];

  root.innerHTML = `
    <article class="plant_timeline">
      <div class="plant_timeline__header">
        <h3 class="card__title">Timeline Độ Ẩm Đất</h3>
      </div>
      <div class="plant_timeline__timeline">
        ${previousItems.map((entry, index) => renderTimelineItem(entry, `Trước đó ${3 - index}`, 'timeline__item_previous', index)).join('')}
        ${renderTimelineItem(currentItem, '⏱️ Hiện tại', 'timeline__item_current', 3)}
        ${renderTimelineItem(predictedItem, '🔮 Dự đoán', 'timeline__item_prediction', 4)}
      </div>
      <div class="plant_timeline__footer" style="display: flex; justify-content: flex-start;">
        <button class="plant_timeline__history_button" type="button" data_open_history>📚 Xem lịch sử</button>
      </div>
    </article>
  `;

  const historyButton = root.querySelector('[data_open_history]');
  if (historyButton && typeof onShowHistory === 'function') {
    historyButton.addEventListener('click', onShowHistory);
  }

  const timelineEls = root.querySelectorAll('[data_timeline_idx]');
  timelineEls.forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.getAttribute('data_timeline_idx');
      const itemData = allItemsForClick[idx];
      if (itemData) {
        showDetailPopup(itemData.label || 'Chi tiết Timeline', itemData, itemData.snapshot?.url || itemData.image?.url || null);
      }
    });
  });
}

function renderDetailRows(status) {
  const entries = Object.entries(status || {})
    .filter(([key, value]) => value !== undefined && value !== null && value !== '' && typeof value !== 'object')
    .map(([key, value]) => {
      return `<div class="detail_list__row"><span class="detail_list__label">${key}</span><span class="detail_list__value">${value}</span></div>`;
    });

  if (!entries.length) {
    return '<p class="card__meta">Chua co du lieu chi tiet.</p>';
  }

  return `<div class="detail_list">${entries.join('')}</div>`;
}

export function renderCurrentPlantInfoWidget({ root, status }) {
  if (!root) return;

  const hasStatus = Boolean(status && !status._error);
  const updatedAt = formatDateTime(status?.capturedAt || status?.timestamp || status?.time);
  const detailHtml = hasStatus
    ? renderDetailRows(status)
    : renderEmptyState('[]', 'Chua co du lieu', 'Khong tim thay thong tin trang thai hien tai.');

  root.innerHTML = `
    <article class="widget timeline_current_info">
      <div class="timeline_current_info__header">
        <div>
          <h3 class="card__title">Thu thap thong tin hien tai</h3>
          <p class="card__meta">Kiem tra nhanh du lieu cua cay trong.</p>
        </div>
        <button class="button button_primary" type="button" data_show_current>Xem thong tin cay hien tai</button>
      </div>
      <div class="timeline_current_info__summary">
        <p class="card__meta">Cap nhat: ${updatedAt}</p>
        ${status?._error ? `<p class="card__meta timeline_current_info__error">${status._error}</p>` : ''}
      </div>
      <div class="timeline_current_info__details is_hidden" data_current_details>
        ${detailHtml}
      </div>
    </article>
  `;

  const toggleButton = root.querySelector('[data_show_current]');
  const detailSection = root.querySelector('[data_current_details]');
  if (toggleButton && detailSection) {
    toggleButton.addEventListener('click', () => {
      detailSection.classList.toggle('is_hidden');
      const isHidden = detailSection.classList.contains('is_hidden');
      toggleButton.setAttribute('aria-expanded', (!isHidden).toString());
      toggleButton.textContent = isHidden ? 'Xem thong tin cay hien tai' : 'An thong tin chi tiet';
    });
  }
}

export function renderTimelineView({ root, timelineData, status, onShowHistory }) {
  if (!root) return;

  root.innerHTML = `
    <section class="timeline_view">
      <section class="timeline_view__block" data_current_info_root></section>
      <section class="timeline_view__block" data_timeline_root></section>
    </section>
  `;

  const infoRoot = root.querySelector('[data_current_info_root]');
  const timelineRoot = root.querySelector('[data_timeline_root]');

  renderCurrentPlantInfoWidget({ root: infoRoot, status });

  if (timelineRoot) {
    renderPlantTimeline({
      root: timelineRoot,
      ...timelineData,
      onShowHistory,
    });
  }
}
