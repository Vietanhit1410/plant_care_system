import { apiClient } from '../core/api-client.js';
import { showDetailPopup } from '../core/ui-helpers.js';

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
    <div class="timeline__item ${modifier}" data-state="${entry?.state || label}" data-moisture-idx="${indexStr}" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
      <div class="timeline__dot"></div>
      <div class="timeline__content">
        <p class="timeline__title">${label}</p>
        <p class="timeline__desc">${formatTime(entry?.capturedAt || entry?.time || entry?.timestamp)}</p>
        <p class="timeline__desc"><strong>Độ ẩm đất:</strong> ${formatMoistureValue(entry)}</p>
        ${entry?.note ? `<p class="timeline__desc plant-moisture__timeline-note">${entry.note}</p>` : ''}
        <figure class="plant-moisture__timeline-image-wrap">
          ${snapshotSrc ? `<img class="plant-moisture__timeline-image" src="${snapshotSrc}" alt="${snapshotAlt}">` : '<div class="plant-moisture__timeline-image placeholder">Chưa có ảnh</div>'}
          ${snapshot?.capturedAt || entry?.capturedAt ? `<figcaption class="timeline__desc">${formatTime(snapshot?.capturedAt || entry?.capturedAt)}</figcaption>` : ''}
        </figure>
      </div>
    </div>
  `;
}

export async function loadPlantMoisture() {
  return apiClient.request('/api/plant-moisture/current');
}

export function renderPlantMoisture({ root, moisture, timeline = [], onShowHistory }) {
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
  const currentMoistureValue = formatMoistureValue(currentItem || moisture);

  const allItemsForClick = [...previousItems, currentItem, predictedItem];

  root.innerHTML = `
    <article class="plant-moisture">
      <div class="plant-moisture__header">
        <h3 class="card__title">Timeline Độ Ẩm Đất</h3>
      </div>
      <div class="plant-moisture__timeline">
        ${previousItems.map((entry, index) => renderTimelineItem(entry, `Trước đó ${3 - index}`, 'timeline__item--previous', index)).join('')}
        ${renderTimelineItem(currentItem, '⏱️ Hiện tại', 'timeline__item--current', 3)}
        ${renderTimelineItem(predictedItem, '🔮 Dự đoán', 'timeline__item--prediction', 4)}
      </div>
      <div class="plant-moisture__footer" style="display: flex; justify-content: flex-start;">
        <button class="plant-moisture__history-button" type="button" data-open-history>📚 Xem lịch sử</button>
      </div>
    </article>
  `;

  const historyButton = root.querySelector('[data-open-history]');
  if (historyButton && typeof onShowHistory === 'function') {
    historyButton.addEventListener('click', onShowHistory);
  }

  const timelineEls = root.querySelectorAll('[data-moisture-idx]');
  timelineEls.forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.getAttribute('data-moisture-idx');
      const itemData = allItemsForClick[idx];
      if (itemData) {
        showDetailPopup(itemData.label || 'Chi tiết Timeline', itemData, itemData.snapshot?.url || itemData.image?.url || null);
      }
    });
  });
}
