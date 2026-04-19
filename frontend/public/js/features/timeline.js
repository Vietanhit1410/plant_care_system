import { formatDateTime, renderEmptyState } from '../core/ui-helpers.js';
import { renderPlantMoisture } from './plant_moisture.js';

function renderDetailRows(status) {
  const entries = Object.entries(status || {})
    .filter(([key, value]) => value !== undefined && value !== null && value !== '' && typeof value !== 'object')
    .map(([key, value]) => {
      return `<div class="detail-list__row"><span class="detail-list__label">${key}</span><span class="detail-list__value">${value}</span></div>`;
    });

  if (!entries.length) {
    return '<p class="card__meta">Chua co du lieu chi tiet.</p>';
  }

  return `<div class="detail-list">${entries.join('')}</div>`;
}

export function renderCurrentPlantInfoWidget({ root, status }) {
  if (!root) return;

  const hasStatus = Boolean(status && !status._error);
  const updatedAt = formatDateTime(status?.capturedAt || status?.timestamp || status?.time);
  const detailHtml = hasStatus
    ? renderDetailRows(status)
    : renderEmptyState('[]', 'Chua co du lieu', 'Khong tim thay thong tin trang thai hien tai.');

  root.innerHTML = `
    <article class="widget timeline-current-info">
      <div class="timeline-current-info__header">
        <div>
          <h3 class="card__title">Thu thap thong tin hien tai</h3>
          <p class="card__meta">Kiem tra nhanh du lieu cua cay trong.</p>
        </div>
        <button class="button button--primary" type="button" data-show-current>Xem thong tin cay hien tai</button>
      </div>
      <div class="timeline-current-info__summary">
        <p class="card__meta">Cap nhat: ${updatedAt}</p>
        ${status?._error ? `<p class="card__meta timeline-current-info__error">${status._error}</p>` : ''}
      </div>
      <div class="timeline-current-info__details is-hidden" data-current-details>
        ${detailHtml}
      </div>
    </article>
  `;

  const toggleButton = root.querySelector('[data-show-current]');
  const detailSection = root.querySelector('[data-current-details]');
  if (toggleButton && detailSection) {
    toggleButton.addEventListener('click', () => {
      detailSection.classList.toggle('is-hidden');
      const isHidden = detailSection.classList.contains('is-hidden');
      toggleButton.setAttribute('aria-expanded', (!isHidden).toString());
      toggleButton.textContent = isHidden ? 'Xem thong tin cay hien tai' : 'An thong tin chi tiet';
    });
  }
}

export function renderTimelineView({ root, moistureData, status, onShowHistory }) {
  if (!root) return;

  root.innerHTML = `
    <section class="timeline-view">
      <section class="timeline-view__block" data-current-info-root></section>
      <section class="timeline-view__block" data-moisture-root></section>
    </section>
  `;

  const infoRoot = root.querySelector('[data-current-info-root]');
  const moistureRoot = root.querySelector('[data-moisture-root]');

  renderCurrentPlantInfoWidget({ root: infoRoot, status });

  if (moistureRoot) {
    renderPlantMoisture({
      root: moistureRoot,
      ...moistureData,
      onShowHistory,
    });
  }
}
