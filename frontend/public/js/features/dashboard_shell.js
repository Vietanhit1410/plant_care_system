export function renderDashboardShell(root, widgets = []) {
  const widgetItems = Array.isArray(widgets) ? widgets : [];

  root.innerHTML = `
    <div class="shell">
      <header class="app_header">
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
        <button class="navbar__tab is_active" type="button" data_tab="home" aria-current="page">📊 Trang chủ</button>
        <button class="navbar__tab" type="button" data_tab="timeline">📈 Timeline</button>
        <button class="navbar__tab" type="button" data_tab="history">📚 Lịch sử</button>
        <button class="navbar__tab" type="button" data_tab="camera">📷 Camera</button>
        <button class="navbar__tab" type="button" data_tab="notifications">🔔 Thông báo</button>
      </nav>

      <main class="dashboard_shell__views">
        <!-- Trang chủ: Hiển thị widget quan trọng -->
        <section id="view_home" class="dashboard_shell__view is_active" aria-label="Trang chủ">
          <section class="home_grid" aria-label="Widget chính">
            <section id="environment_root" class="dashboard__feature_root" aria-label="Thông tin thời tiết hiện tại"></section>
            <section id="current_status_root" class="dashboard__feature_root" aria-label="Trạng thái cây hiện tại"></section>
            <section id="plant_timeline_root" class="dashboard__feature_root" aria-label="Timeline độ ẩm đất gần nhất"></section>
          </section>
        </section>

        <!-- Timeline: Dòng thời gian tình trạng cây -->
        <section id="view_timeline" class="dashboard_shell__view" aria-label="Timeline">
          <div class="view_header">
            <h2>Dòng thời gian</h2>
            <p class="view_subtitle">Lịch sử trạng thái cây: quá khứ, hiện tại, dự đoán</p>
          </div>
          <section id="timeline_root" class="dashboard__feature_root"></section>
        </section>

        <!-- Lịch sử: Tất cả quan sát -->
        <section id="view_history" class="dashboard_shell__view" aria-label="Lịch sử">
          <div class="view_header">
            <h2>Lịch sử chăm sóc</h2>
            <p class="view_subtitle">Tra cứu toàn bộ ghi nhận, ảnh và dữ liệu môi trường</p>
          </div>
          <section id="plant_history_root" class="dashboard__feature_root"></section>
        </section>

        <!-- Camera: Điều khiển và snapshot -->
        <section id="view_camera" class="dashboard_shell__view" aria-label="Camera">
          <div class="view_header">
            <h2>Camera giám sát</h2>
            <p class="view_subtitle">Điều khiển camera và ghi lại ảnh chụp</p>
          </div>
          <section id="camera_snapshot_root" class="dashboard__feature_root"></section>
        </section>

        <!-- Thông báo: Danh sách thông báo -->
        <section id="view_notifications" class="dashboard_shell__view" aria-label="Thông báo">
          <div class="view_header">
            <h2>Trung tâm thông báo</h2>
            <p class="view_subtitle">Cảnh báo và thông tin về trạng thái cây</p>
          </div>
          <section id="notifications_root" class="dashboard__feature_root"></section>
        </section>
      </main>
    </div>
  `;

  // Tab switching logic
  const tabs = Array.from(root.querySelectorAll('[data_tab]'));
  const views = {
    home: root.querySelector('#view_home'),
    timeline: root.querySelector('#view_timeline'),
    history: root.querySelector('#view_history'),
    camera: root.querySelector('#view_camera'),
    notifications: root.querySelector('#view_notifications'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data_tab');

      // Update active tab
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is_active', isActive);
        item.setAttribute('aria-current', isActive ? 'page' : 'false');
      });

      // Update visible view
      Object.entries(views).forEach(([key, node]) => {
        node?.classList.toggle('is_active', key === selected);
      });

      // Scroll to top
      root.querySelector('.navbar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}
