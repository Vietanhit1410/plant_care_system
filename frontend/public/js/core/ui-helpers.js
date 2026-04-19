/**
 * Shared UI helper functions for all features
 */

export function renderLoadingState(message = 'Đang tải...') {
  return `<div class="shell__placeholder">${message}</div>`;
}

export function renderErrorState(title, message, onRetry = null) {
  const retryButton = onRetry ? `
    <div class="shell__error-retry">
      <button onclick="${onRetry}">Thử lại</button>
    </div>
  ` : '';

  return `
    <article class="shell__error">
      <h2>${title}</h2>
      <p>${message}</p>
      ${retryButton}
    </article>
  `;
}

export function renderEmptyState(icon, title, message) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <h3 class="empty-state__title">${title}</h3>
      <p class="empty-state__message">${message}</p>
    </div>
  `;
}

export function formatDateTime(timestamp, locale = 'vi-VN') {
  if (!timestamp) return '-';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleString(locale);
  } catch (e) {
    return timestamp?.toString?.() || '-';
  }
}

export function formatDate(timestamp, locale = 'vi-VN') {
  if (!timestamp) return '-';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleDateString(locale);
  } catch (e) {
    return timestamp?.toString?.() || '-';
  }
}

export function formatTime(timestamp, locale = 'vi-VN') {
  if (!timestamp) return '-';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleTimeString(locale);
  } catch (e) {
    return timestamp?.toString?.() || '-';
  }
}

let detailOverlayRoot = null;

export function showDetailPopup(title, dataObj, imageSrc = null) {
  if (!detailOverlayRoot) {
    detailOverlayRoot = document.createElement('div');
    detailOverlayRoot.className = 'modal';
    detailOverlayRoot.setAttribute('aria-hidden', 'true');
    detailOverlayRoot.innerHTML = '<div class="modal__panel" style="width: min(600px, 100%);"></div>';
    document.body.appendChild(detailOverlayRoot);

    detailOverlayRoot.addEventListener('click', (event) => {
      if (event.target === detailOverlayRoot) {
        hideDetailPopup();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideDetailPopup();
      }
    });
  }

  const panelRoot = detailOverlayRoot.querySelector('.modal__panel');
  const detailsHtml = Object.entries(dataObj)
      .filter(([k, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
         // handle nested objects like image or snapshot
         if (typeof v === 'object') return '';
         return `<p style="margin: 0 0 8px 0; color: var(--text);"><strong style="color: var(--text-muted);">${k}:</strong> ${v}</p>`;
      })
      .join('');

  panelRoot.innerHTML = `
    <section class="modal__panel-content" style="background:#fff; padding: var(--space-5); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);">
      <div class="modal__header" style="display:flex; justify-content:space-between; margin-bottom: var(--space-4); align-items:center;">
        <h3 class="card__title" style="margin:0; font-size: 1.2rem;">${title}</h3>
        <button class="modal__close" type="button" data-close-popup style="border:none; background:none; font-size:1.5rem; cursor:pointer; color: var(--text-muted);">&times;</button>
      </div>
      <div class="modal__body">
        ${imageSrc ? `<figure style="margin: 0 0 var(--space-4) 0;"><img src="${imageSrc}" style="width:100%; border-radius:var(--radius-md); border:1px solid var(--border); display:block;"/></figure>` : ''}
        ${detailsHtml}
      </div>
    </section>
  `;

  const closeBtn = panelRoot.querySelector('[data-close-popup]');
  closeBtn.addEventListener('click', hideDetailPopup);

  detailOverlayRoot.setAttribute('aria-hidden', 'false');
}

export function hideDetailPopup() {
  if (detailOverlayRoot) {
    detailOverlayRoot.setAttribute('aria-hidden', 'true');
  }
}

export function debounce(func, waitMs) {
  let timeoutId;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeoutId);
      func(...args);
    };
    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, waitMs);
  };
}

export function throttle(func, limitMs) {
  let inThrottle;
  return function throttledFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

export function getCacheKey(namespace, key) {
  return `plant_care_${namespace}_${key}`;
}

export function getFromCache(namespace, key, ttlMs = null) {
  try {
    const cacheKey = getCacheKey(namespace, key);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (ttlMs && Date.now() - timestamp > ttlMs) return null;

    return data;
  } catch (e) {
    console.warn(`Failed to retrieve cache (${namespace}/${key}):`, e);
    return null;
  }
}

export function setToCache(namespace, key, data) {
  try {
    const cacheKey = getCacheKey(namespace, key);
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn(`Failed to cache data (${namespace}/${key}):`, e);
  }
}

export function clearCache(namespace, key = null) {
  try {
    if (key) {
      const cacheKey = getCacheKey(namespace, key);
      localStorage.removeItem(cacheKey);
    } else {
      // Clear all keys for namespace
      const prefix = `plant_care_${namespace}_`;
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(prefix)) {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}
