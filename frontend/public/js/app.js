import { renderDashboardShell } from './features/dashboard_shell.js';
import { loadEnvironment, renderEnvironment } from './features/environment.js';
import { loadPlantHistory, renderPlantHistory } from './features/plant_history.js';
import { loadPlantTimeline, renderPlantTimeline, renderTimelineView } from './features/plant_timeline.js';
import { loadCurrentStatus, renderCurrentStatus } from './features/current_status.js';
import { loadNotifications, renderNotifications, renderNotificationsPreview } from './features/notifications.js';
import { captureCameraSnapshot, renderCameraSnapshot } from './features/camera_snapshot.js';

const dashboardWidgets = [
  { id: 'environment', label: '🌡️ Thời tiết', target: '#environment_root' },
  { id: 'current_status', label: '🌿 Trạng thái cây', target: '#current_status_root' },
  { id: 'plant_timeline', label: '💧 Độ ẩm đất', target: '#plant_timeline_root' },
  { id: 'notifications', label: '🔔 Thông báo', target: '#notifications_preview_root' },
];

let historyOverlayRoot = null;

function renderLoadingState(message = 'Đang tải...') {
  return `<div class="shell__placeholder">${message}</div>`;
}

async function mountEnvironment(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải dữ liệu thời tiết...');

  try {
    const environmentData = await loadEnvironment();
    renderEnvironment({ root: featureRoot, environment: environmentData });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Không tải được dữ liệu thời tiết</h2>
        <p>${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </article>
    `;
  }
}

async function mountCurrentStatus(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải trạng thái cây...');

  try {
    const statusData = await loadCurrentStatus();
    renderCurrentStatus({ root: featureRoot, status: statusData });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Không tải được trạng thái cây</h2>
        <p>${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </article>
    `;
  }
}

function ensureHistoryOverlay(root) {
  if (historyOverlayRoot) return historyOverlayRoot;

  historyOverlayRoot = document.createElement('div');
  historyOverlayRoot.className = 'modal';
  historyOverlayRoot.setAttribute('aria-hidden', 'true');
  historyOverlayRoot.innerHTML = '<div class="modal__panel"></div>';
  root.appendChild(historyOverlayRoot);

  historyOverlayRoot.addEventListener('click', (event) => {
    if (event.target === historyOverlayRoot) {
      hidePlantHistory();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hidePlantHistory();
    }
  });

  return historyOverlayRoot;
}

function hidePlantHistory() {
  if (!historyOverlayRoot) return;
  historyOverlayRoot.setAttribute('aria-hidden', 'true');
}

async function showPlantHistory(root) {
  const overlay = ensureHistoryOverlay(root);
  const panelRoot = overlay.querySelector('.modal__panel');
  panelRoot.innerHTML = renderLoadingState('Đang tải lịch sử cây trồng...');
  overlay.setAttribute('aria-hidden', 'false');

  try {
    const historyData = await loadPlantHistory();
    renderPlantHistory({
      root: panelRoot,
      items: historyData?.items || [],
      onClose: hidePlantHistory,
    });
  } catch (error) {
    panelRoot.innerHTML = `
      <section class="modal__panel plant_history">
        <div class="modal__header plant_history__header">
          <div>
            <h3 class="card__title">Lịch sử cây trồng</h3>
            <p class="card__meta">Không tải được dữ liệu lịch sử.</p>
          </div>
          <button class="modal__close" type="button" data_close_history aria-label="Đóng lịch sử">×</button>
        </div>
        <p class="shell__error">${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </section>
    `;
    const closeButton = panelRoot.querySelector('[data_close_history]');
    if (closeButton) closeButton.addEventListener('click', hidePlantHistory);
  }
}

async function mountPlantTimeline(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải dữ liệu độ ẩm đất...');

  try {
    const plantTimelineData = await loadPlantTimeline();
    renderPlantTimeline({
      root: featureRoot,
      ...plantTimelineData,
      onShowHistory: () => showPlantHistory(featureRoot.closest('#app') || document.body),
    });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Không tải được dữ liệu độ ẩm đất</h2>
        <p>${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </article>
    `;
  }
}

async function mountNotificationsPreview(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải thông báo...');

  try {
    const notificationsData = await loadNotifications();
    renderNotificationsPreview({
      root: featureRoot,
      items: notificationsData?.items || [],
      onShowAll: () => {
        const notifTab = document.querySelector('[data_tab="notifications"]');
        if (notifTab) notifTab.click();
      },
    });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="card notifications_preview">
        <div class="notifications_preview__header">
          <h3 class="card__title">Thông báo</h3>
        </div>
        <p class="card__meta">Không thể tải thông báo.</p>
      </article>
    `;
  }
}

async function mountNotificationsFullPage(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải thông báo...');

  try {
    const notificationsData = await loadNotifications();
    renderNotifications({
      root: featureRoot,
      items: notificationsData?.items || [],
    });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Không tải được danh sách thông báo</h2>
        <p>${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </article>
    `;
  }
}

async function mountCameraSnapshot(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Dang tai camera...');

  try {
    let currentSnapshot = null;

    const renderView = (snapshotToRender) => {
      renderCameraSnapshot({
        root: featureRoot,
        snapshot: snapshotToRender,
        onCapture: handleCapture,
      });
    };

    const handleCapture = async () => {
      const statusEl = featureRoot.querySelector('[data_control_status]');
      if (statusEl) {
        statusEl.textContent = 'Dang chup anh hien tai...';
      }
      try {
        currentSnapshot = await captureCameraSnapshot();
        renderView(currentSnapshot);
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error?.message || 'Khong the chup anh hien tai.';
        }
      }
    };

    renderView(currentSnapshot);
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Khong tai duoc camera</h2>
        <p>${error?.message || 'Da xay ra loi khong xac dinh.'}</p>
      </article>
    `;
  }
}

async function mountPlantHistory(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải lịch sử...');

  try {
    const historyData = await loadPlantHistory();
    renderPlantHistory({
      root: featureRoot,
      items: historyData?.items || [],
    });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Không tải được lịch sử</h2>
        <p>${error?.message || 'Đã xảy ra lỗi không xác định.'}</p>
      </article>
    `;
  }
}

async function mountTimeline(featureRoot) {
  featureRoot.innerHTML = renderLoadingState('Đang tải dòng thời gian...');

  try {
    const [plantTimelineData, currentStatusData] = await Promise.all([
      loadPlantTimeline(),
      loadCurrentStatus(),
    ]);
    renderTimelineView({
      root: featureRoot,
      timelineData: plantTimelineData,
      status: currentStatusData,
      onShowHistory: () => showPlantHistory(featureRoot.closest('#app') || document.body),
    });
  } catch (error) {
    featureRoot.innerHTML = `
      <article class="shell__error">
        <h2>Khong tai duoc dong thoi gian</h2>
        <p>${error?.message || 'Da xay ra loi khong xac dinh.'}</p>
      </article>
    `;
  }
}

export async function bootstrapApp(root) {
  renderDashboardShell(root, dashboardWidgets);

  const environmentRoot = root.querySelector('#environment_root');
  const currentStatusRoot = root.querySelector('#current_status_root');
  const plantTimelineRoot = root.querySelector('#plant_timeline_root');
  const notificationsPreviewRoot = root.querySelector('#notifications_preview_root');
  const timelineRoot = root.querySelector('#timeline_root');
  const historyRoot = root.querySelector('#plant_history_root');
  const cameraRoot = root.querySelector('#camera_snapshot_root');
  const notificationsRoot = root.querySelector('#notifications_root');

  if (
    !environmentRoot ||
    !plantTimelineRoot
  ) {
    root.innerHTML = '<div class="shell__error">Khng tm thy vng hiƒn th‹ feature.</div>';
    return;
  }

  // Load home page features
  await Promise.all([
    mountEnvironment(environmentRoot),
    mountCurrentStatus(currentStatusRoot),
    mountPlantTimeline(plantTimelineRoot)
  ]);

  // Setup tab view loaders
  let viewStates = {
    timeline: false,
    history: false,
    camera: false,
    notifications: false,
  };

  const tabs = root.querySelectorAll('[data_tab]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', async () => {
      const viewName = tab.getAttribute('data_tab');

      if (viewName === 'timeline' && !viewStates.timeline) {
        viewStates.timeline = true;
        await mountTimeline(timelineRoot);
      } else if (viewName === 'history' && !viewStates.history) {
        viewStates.history = true;
        await mountPlantHistory(historyRoot);
      } else if (viewName === 'camera' && !viewStates.camera) {
        viewStates.camera = true;
        await mountCameraSnapshot(cameraRoot);
      } else if (viewName === 'notifications' && !viewStates.notifications) {
        viewStates.notifications = true;
        await mountNotificationsFullPage(notificationsRoot);
      }
    });
  });
}