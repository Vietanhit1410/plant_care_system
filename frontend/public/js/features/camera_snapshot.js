import { apiClient } from '../core/api_client.js';
import { formatDateTime, renderEmptyState } from '../core/ui_helpers.js';

export async function captureCameraSnapshot() {
  return apiClient.request('/api/camera_snapshot/capture');
}

export function renderCameraSnapshot({ root, snapshot, onCapture }) {
  const imageSrc = snapshot?.imageUrl || snapshot?.imagePath || '';
  const capturedAt = formatDateTime(snapshot?.capturedAt || snapshot?.timestamp);

  root.innerHTML = `
    <article class="card camera_shell">
      <div class="camera_shell__header">
        <div>
          <h3 class="card__title">Camera giam sat</h3>
          <p class="card__meta">Chup anh hien tai tu camera.</p>
        </div>
        <div class="camera_shell__actions">
          <button class="button button_primary" type="button" data_capture>Chup anh hien tai</button>
        </div>
      </div>

      <div class="camera_shell__grid">
        <div>
          <div class="camera_view" data_camera_view>
            ${imageSrc ? `<img src="${imageSrc}" alt="camera current">` : renderEmptyState('[]', 'Chua co anh', 'Hay bam nut chup anh.')}
          </div>
          <div class="camera_shell__status">Thoi gian: ${capturedAt}</div>
          <div class="camera_shell__status" data_control_status>San sang.</div>
        </div>
      </div>
    </article>
  `;

  const captureButton = root.querySelector('[data_capture]');
  if (captureButton && typeof onCapture === 'function') {
    captureButton.addEventListener('click', onCapture);
  }
}
