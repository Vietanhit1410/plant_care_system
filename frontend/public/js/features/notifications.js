import { apiClient } from '../core/api_client.js';
import { formatDateTime, renderErrorState, renderEmptyState } from '../core/ui_helpers.js';

export async function loadNotifications() {
  try {
    return await apiClient.request('/api/notifications/list');
  } catch (error) {
    console.warn('Failed to load notifications, returning empty list:', error);
    return { items: [], _error: error.message };
  }
}

export function renderNotifications({ root, items = [], onClose = null }) {
  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = renderEmptyState(
      '🔔',
      'Không có thông báo',
      'Bạn đã xem hết tất cả thông báo. Quay lại sau để kiểm tra cập nhật mới.'
    );
    return;
  }

  // Group notifications by category
  const grouped = items.reduce((acc, notif) => {
    const category = notif?.category || notif?.type || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(notif);
    return acc;
  }, {});

  const categoryLabels = {
    warning: '⚠️ Cảnh báo',
    error: '❌ Lỗi',
    info: 'ℹ️ Thông tin',
    success: '✅ Thành công',
    water_needed: '💧 Cần tưới nước',
    plant_issue: '🌿 Vấn đề cây',
    general: '📢 Chung',
  };

  const html = Object.entries(grouped).map(([category, notifs]) => {
    const label = categoryLabels[category] || category;
    const items = notifs.map((notif) => `
      <div class="notification_item notification_item_variant_${category}" data_notification_id="${notif?.id || ''}">
        <div class="notification_item__header">
          <h4 class="notification_item__title">${notif?.title || 'Thông báo'}</h4>
          <span class="notification_item__time">${formatDateTime(notif?.timestamp || notif?.created_at)}</span>
        </div>
        <p class="notification_item__message">${notif?.message || notif?.description || ''}</p>
        ${notif?.details ? `<p class="notification_item__details">${notif.details}</p>` : ''}
        <div class="notification_item__actions">
          ${notif?.action_url ? `<a href="${notif.action_url}" class="notification_item__link">Xem chi tiết →</a>` : ''}
          <button class="notification_item__dismiss" type="button" data_dismiss_notification="${notif?.id || ''}">✕ Đóng</button>
        </div>
      </div>
    `).join('');

    return `
      <section class="notification_category">
        <h3 class="notification_category__title">${label}</h3>
        <div class="notification_list">
          ${items}
        </div>
      </section>
    `;
  }).join('');

  root.innerHTML = `
    <div class="notifications">
      ${html}
    </div>
  `;

  // Attach dismiss handlers
  root.querySelectorAll('[data_dismiss_notification]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const notificationId = btn.getAttribute('data_dismiss_notification');
      const item = root.querySelector(`[data_notification_id="${notificationId}"]`);
      if (item) {
        item.style.opacity = '0.5';
        btn.disabled = true;
        // In a real app, would call API to mark as read
        setTimeout(() => item.remove(), 200);
      }
    });
  });
}

export function renderNotificationsPreview({ root, items = [], onShowAll = null }) {
  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = `
      <article class="card notifications_preview">
        <div class="notifications_preview__header">
          <h3 class="card__title">Thông báo</h3>
        </div>
        <p class="card__meta">Chưa có thông báo nào.</p>
      </article>
    `;
    return;
  }

  const previewItems = items.slice(0, 3);
  const hasMore = items.length > 3;

  const html = previewItems.map((notif) => {
    const categoryClass = notif?.category || notif?.type || 'general';
    return `
      <div class="notification_preview_item notification_preview_item_variant_${categoryClass}">
        <div class="notification_preview_item__dot"></div>
        <div class="notification_preview_item__content">
          <p class="notification_preview_item__title">${notif?.title || 'Thông báo'}</p>
          <p class="notification_preview_item__time">${formatDateTime(notif?.timestamp || notif?.created_at)}</p>
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <article class="card notifications_preview">
      <div class="notifications_preview__header">
        <h3 class="card__title">Thông báo (${items.length})</h3>
        ${hasMore ? `<span class="notifications_preview__badge">${items.length}</span>` : ''}
      </div>
      <div class="notifications_preview_list">
        ${html}
      </div>
      ${onShowAll ? `<button class="notifications_preview__link" type="button" data_show_all_notifications>Xem tất cả →</button>` : ''}
    </article>
  `;

  if (onShowAll) {
    const btn = root.querySelector('[data_show_all_notifications]');
    if (btn) btn.addEventListener('click', onShowAll);
  }
}
