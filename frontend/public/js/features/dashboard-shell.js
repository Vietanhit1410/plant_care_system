export function renderDashboardShell(root, widgets = []) {
  const widgetItems = Array.isArray(widgets) ? widgets : [];

  root.innerHTML = `
    <div class="shell">
      <header class="app-header">
        <div class="brand">
          <div class="brand__mark">PC</div>
          <div>
            <div class="brand__eyebrow">Hệ thống chăm sóc cây</div>
            <h1 class="brand__title">Dashboard Chăm Sóc Cây</h1>
            <p class="brand__subtitle">Theo dõi trạng thái cây và môi trường thời gian thực</p>
          </div>
        </div>
      </header>

      <nav class="navbar" aria-label="Điều hướng chính">
        <button class="navbar__tab is-active" type="button" data-tab="home" aria-current="page">📊 Trang chủ</button>
        <button class="navbar__tab" type="button" data-tab="timeline">📈 Timeline</button>
        <button class="navbar__tab" type="button" data-tab="history">📚 Lịch sử</button>
        <button class="navbar__tab" type="button" data-tab="camera">📷 Camera</button>
        <button class="navbar__tab" type="button" data-tab="notifications">🔔 Thông báo</button>
      </nav>

      <main class="dashboard-shell__views">
        <!-- Trang chủ: Hiển thị widget quan trọng -->
        <section id="view-home" class="dashboard-shell__view is-active" aria-label="Trang chủ">
          <section class="home-grid" aria-label="Widget chính">
            <section id="environment-root" class="dashboard__feature-root" aria-label="Thông tin thời tiết hiện tại"></section>
            <section id="current-status-root" class="dashboard__feature-root" aria-label="Trạng thái cây hiện tại"></section>
            <section id="plant-moisture-root" class="dashboard__feature-root" aria-label="Timeline độ ẩm đất gần nhất"></section>
          </section>
        </section>

        <!-- Timeline: Dòng thời gian tình trạng cây -->
        <section id="view-timeline" class="dashboard-shell__view" aria-label="Timeline">
          <div class="view-header">
            <h2>Dòng thời gian</h2>
            <p class="view-subtitle">Lịch sử trạng thái cây: quá khứ, hiện tại, dự đoán</p>
          </div>
          <section id="timeline-root" class="dashboard__feature-root"></section>
        </section>

        <!-- Lịch sử: Tất cả quan sát -->
        <section id="view-history" class="dashboard-shell__view" aria-label="Lịch sử">
          <div class="view-header">
            <h2>Lịch sử chăm sóc</h2>
            <p class="view-subtitle">Tra cứu toàn bộ ghi nhận, ảnh và dữ liệu môi trường</p>
          </div>
          <section id="plant-history-root" class="dashboard__feature-root"></section>
        </section>

        <!-- Camera: Điều khiển và snapshot -->
        <section id="view-camera" class="dashboard-shell__view" aria-label="Camera">
          <div class="view-header">
            <h2>Camera giám sát</h2>
            <p class="view-subtitle">Điều khiển camera và ghi lại ảnh chụp</p>
          </div>
          <section id="camera-snapshot-root" class="dashboard__feature-root"></section>
        </section>

        <!-- Thông báo: Danh sách thông báo -->
        <section id="view-notifications" class="dashboard-shell__view" aria-label="Thông báo">
          <div class="view-header">
            <h2>Trung tâm thông báo</h2>
            <p class="view-subtitle">Cảnh báo và thông tin về trạng thái cây</p>
          </div>
          <section id="notifications-root" class="dashboard__feature-root"></section>
        </section>
      </main>
    </div>
  `;

  // Tab switching logic
  const tabs = Array.from(root.querySelectorAll('[data-tab]'));
  const views = {
    home: root.querySelector('#view-home'),
    timeline: root.querySelector('#view-timeline'),
    history: root.querySelector('#view-history'),
    camera: root.querySelector('#view-camera'),
    notifications: root.querySelector('#view-notifications'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data-tab');

      // Update active tab
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-current', isActive ? 'page' : 'false');
      });

      // Update visible view
      Object.entries(views).forEach(([key, node]) => {
        node?.classList.toggle('is-active', key === selected);
      });

      // Scroll to top
      root.querySelector('.navbar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}
