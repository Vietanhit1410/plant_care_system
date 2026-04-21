import { formatDateTime } from './ui_helpers.js';
import { apiClient } from './api_client.js';

function formatValue(format, value) {
  if (value === undefined || value === null || value === '') return '-';
  switch (format) {
    case 'datetime':
      return formatDateTime(value);
    case 'timestamp':
      return formatDateTime(typeof value === 'number' ? value * 1000 : value);
    case 'percent':
      return `${value}%`;
    case 'celsius':
      return `${value}°C`;
    case 'wind':
      return `${value} m/s`;
    case 'rain':
      return `${value} mm`;
    case 'source':
      return value === 'system' ? '🤖 Hệ thống' : '👤 Con người';
    default:
      return `${value}`;
  }
}

function getFieldValue(data, key) {
  if (!data) return undefined;
  if (Object.prototype.hasOwnProperty.call(data, key)) {
    return data[key];
  }
  return undefined;
}

function getFieldsByKeys(schema, fieldKeys) {
  const fields = schema?.fields || [];
  if (!Array.isArray(fieldKeys)) return fields;
  const fieldMap = new Map(fields.map(field => [field.key, field]));
  return fieldKeys.map(key => fieldMap.get(key)).filter(Boolean);
}

function normalizeMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('file:')) {
    return url;
  }
  if (url.startsWith('/media/')) {
    return `${apiClient.baseUrl}${url}`;
  }
  return url;
}

export function renderFieldRows({ schema, data, fieldKeys, showEmpty = false }) {
  const fields = getFieldsByKeys(schema, fieldKeys);
  const rows = fields
    .filter(field => field.format !== 'image')
    .map(field => {
      const value = getFieldValue(data, field.key);
      if (!showEmpty && (value === undefined || value === null || value === '')) return '';
      return `
        <div class="plant_status__detail_row">
          <span class="plant_status__detail_label">${field.label}</span>
          <span class="plant_status__detail_value">${formatValue(field.format, value)}</span>
        </div>
      `;
    })
    .join('');

  const imageField = fields.find(field => field.format === 'image');
  const imageUrl = imageField ? normalizeMediaUrl(getFieldValue(data, imageField.key)) : null;
  const imageRow = imageUrl ? `
    <div class="plant_status__detail_row">
      <span class="plant_status__detail_label">${imageField?.label || 'Ảnh'}</span>
      <span class="plant_status__detail_value">
        <img class="plant_status__detail_image" src="${imageUrl}" alt="Ảnh cây hiện tại">
      </span>
    </div>
  ` : '';

  return rows || imageRow ? `${rows}${imageRow}` : '';
}

export function renderSummaryMetrics({ schema, data, summaryFieldKeys }) {
  const hasExplicitKeys = Array.isArray(summaryFieldKeys);
  const baseFields = getFieldsByKeys(schema, summaryFieldKeys);
  const fields = hasExplicitKeys
    ? baseFields
    : baseFields.filter(field => field.summary);
  if (!fields.length) return '';

  return fields.map(field => {
    const value = getFieldValue(data, field.key);
    return `
      <div class="plant_status__metric">
        <div class="plant_status__metric_content">
          <div class="plant_status__metric_label">${field.label}</div>
          <div class="plant_status__metric_value">${formatValue(field.format, value)}</div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderSchemaCard({ title, subtitle, schema, data, summaryFieldKeys, detailFieldKeys, showEmptyDetails = false }) {
  const detailRows = renderFieldRows({ schema, data, fieldKeys: detailFieldKeys, showEmpty: showEmptyDetails });
  const summaryMetrics = renderSummaryMetrics({ schema, data, summaryFieldKeys });

  return `
    <article class="card plant_status">
      <div class="plant_status__header">
        <div>
          <h3 class="card__title">${title}</h3>
          <p class="card__meta">${subtitle}</p>
        </div>
      </div>

      ${summaryMetrics ? `<div class="plant_status__grid">${summaryMetrics}</div>` : ''}

      ${detailRows ? `
        <div class="plant_status__details">
          <h4 class="plant_status__details_title">Chi tiết</h4>
          <div class="plant_status__detail_list">
            ${detailRows}
          </div>
        </div>
      ` : ''}
    </article>
  `;
}

export function renderSchemaList({ schema, items, listFieldKeys }) {
  const listFields = Array.isArray(listFieldKeys)
    ? listFieldKeys
    : (schema?.list_fields || (schema?.fields || []).map(field => field.key));
  return (items || []).map((item, index) => {
    const detail = listFields
      .map(key => {
        const field = (schema?.fields || []).find(f => f.key === key);
        if (!field || field.format === 'image') return '';
        const value = getFieldValue(item, key);
        if (value === undefined || value === null || value === '') return '';
        return `<span class="timeline__desc"><strong>${field.label}:</strong> ${formatValue(field.format, value)}</span>`;
      })
      .join('');

    return `
      <div class="timeline__item plant_history__item" data_history_idx="${index}" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
        <div class="timeline__dot"></div>
        <div class="timeline__content">
          ${detail || '<p class="timeline__desc">Không có dữ liệu</p>'}
        </div>
      </div>
    `;
  }).join('');
}
