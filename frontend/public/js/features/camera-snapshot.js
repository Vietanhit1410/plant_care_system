import { apiClient } from '../core/api-client.js';
import { formatDateTime, renderEmptyState } from '../core/ui-helpers.js';

export async function captureCameraSnapshot() {
  return apiClient.request('/api/camera-snapshot/capture');
}

export function renderCameraSnapshot({ root, snapshot, onCapture }) {
  const imageSrc = snapshot?.imageUrl || snapshot?.imagePath || '';
  const capturedAt = formatDateTime(snapshot?.capturedAt || snapshot?.timestamp);

  root.innerHTML = `
    <article class="card camera-shell">
      <div class="camera-shell__header">
        <div>
          <h3 class="card__title">Camera giam sat</h3>
          <p class="card__meta">Chup anh hien tai tu camera.</p>
        </div>
        <div class="camera-shell__actions">
          <button class="button button--primary" type="button" data-capture>Chup anh hien tai</button>
        </div>
      </div>

      <div class="camera-shell__grid">
        <div>
          <div class="camera-view" data-camera-view>
            ${imageSrc ? `<img src="${imageSrc}" alt="camera current">` : renderEmptyState('[]', 'Chua co anh', 'Hay bam nut chup anh.')}
          </div>
          <div class="camera-shell__status">Thoi gian: ${capturedAt}</div>
          <div class="camera-shell__status" data-control-status>San sang.</div>
        </div>
      </div>
    </article>
  `;

  const captureButton = root.querySelector('[data-capture]');
  if (captureButton && typeof onCapture === 'function') {
    captureButton.addEventListener('click', onCapture);
  }
}
