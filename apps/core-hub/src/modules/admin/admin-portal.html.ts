export const getAdminPortalHtml = (apiBaseUrl: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة تحكم منصة Madinty AI</title>
  
  <!-- Modern Fonts (Arabic Optimized Cairo + Outfit) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- ChartJS -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- Leaflet Map CSS/JS CDN -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <style>
    :root {
      --bg-dark: #f8fafc; /* Slate 50 - خلفية بيضاء مريحة */
      --bg-glass: rgba(255, 255, 255, 0.9); /* زجاج أبيض ناصع */
      --border-glass: rgba(15, 23, 42, 0.08); /* حدود رمادية ناعمة */
      --text-main: #0f172a; /* Slate 900 */
      --text-muted: #475569; /* Slate 600 */
      --primary: #4f46e5; /* بنفسجي نيلي */
      --primary-hover: #4338ca;
      --accent-cyan: #0891b2; /* سماوي */
      --accent-emerald: #059669; /* زمردي */
      --accent-rose: #e11d48; /* وردي */
      --accent-amber: #d97706; /* ذهبي */
      --glow-color: rgba(79, 70, 229, 0.08);
      --font-cairo: 'Cairo', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-cairo);
      min-height: 100vh;
      overflow-x: hidden;
      direction: rtl;
      text-align: right;
      background-image: 
        radial-gradient(circle at 90% 20%, rgba(79, 70, 229, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 10% 80%, rgba(8, 145, 178, 0.05) 0%, transparent 40%);
      background-attachment: fixed;
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.25);
    }

    /* Auth Screen with blurred Madinaty background */
    #auth-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-image: url('/api/v1/uploads/madinty-bg.jpg');
      background-size: cover;
      background-position: center;
      position: relative;
    }

    #auth-screen::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(248, 250, 252, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1;
    }

    .auth-card {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
      text-align: center;
    }

    .logo-container {
      margin-bottom: 30px;
    }

    .logo-icon {
      font-size: 3rem;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }

    .auth-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .auth-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
      text-align: right;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .input-field {
      width: 100%;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 12px;
      padding: 14px 16px;
      color: var(--text-main);
      font-family: var(--font-cairo);
      font-size: 0.95rem;
      transition: all 0.3s ease;
      direction: ltr;
    }

    .input-field.rtl-support {
      direction: rtl;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(79, 70, 229, 0.15);
      background: #ffffff;
    }

    .auth-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      border: none;
      border-radius: 12px;
      padding: 14px;
      color: white;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      font-family: var(--font-cairo);
      transition: all 0.3s ease;
      margin-top: 10px;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.25);
    }

    .auth-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
    }

    .auth-btn:active {
      transform: translateY(0);
    }

    .error-msg {
      color: var(--accent-rose);
      font-size: 0.9rem;
      margin-top: 12px;
      display: none;
    }

    /* Main Dashboard Layout */
    #dashboard-layout {
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar - docked right for RTL */
    .sidebar {
      width: 260px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-left: 1px solid var(--border-glass);
      border-right: none;
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      flex-shrink: 0;
      z-index: 100;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 25px;
      padding-right: 8px;
    }

    .brand-icon {
      font-size: 1.8rem;
      color: var(--primary);
    }

    .brand-name {
      font-weight: 800;
      font-size: 1.3rem;
      color: var(--text-main);
    }

    .sidebar-menu {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 12px;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .menu-item:hover, .menu-item.active {
      color: var(--text-main);
      background: rgba(0, 0, 0, 0.02);
    }

    .menu-item.active {
      background: rgba(79, 70, 229, 0.06);
      border: 1px solid rgba(79, 70, 229, 0.12);
      color: var(--primary);
    }

    .menu-item i {
      font-size: 1rem;
      width: 18px;
      text-align: center;
    }

    .user-profile-section {
      border-top: 1px solid rgba(15, 23, 42, 0.08);
      padding-top: 15px;
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
    }

    .user-details {
      flex-grow: 1;
      overflow: hidden;
    }

    .user-role {
      font-size: 0.8rem;
      color: var(--primary);
      font-weight: 700;
    }

    .user-phone {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      direction: ltr;
      text-align: right;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      transition: color 0.3s ease;
    }

    .logout-btn:hover {
      color: var(--accent-rose);
    }

    /* Workspace Grouping & Transitions */
    .workspace-group {
      border: 1px solid transparent;
      border-radius: 16px;
      padding: 8px;
      transition: all 0.3s ease;
      margin-bottom: 12px;
    }

    .workspace-header {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--text-muted);
      margin-bottom: 8px;
      padding: 6px 12px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .workspace-header.active-workspace {
      color: var(--primary);
      background: var(--glow-color);
      font-weight: 800;
    }
    
    .workspace-group:has(.active-workspace) {
      border-color: var(--border-glass);
      background: rgba(255, 255, 255, 0.45);
      box-shadow: 0 4px 15px rgba(15, 23, 42, 0.01);
    }

    /* Madinty Interactive Map Styles */
    .madinty-map-wrapper {
      position: relative;
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--border-glass);
      background: rgba(255, 255, 255, 0.4);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }
    
    .madinty-map-container {
      position: relative;
      width: 100%;
      height: 600px;
      border-radius: 20px;
      z-index: 1;
    }
    
    .map-marker-leaflet {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-weight: 800;
      font-size: 0.78rem;
      font-family: 'Outfit', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.8), 0 4px 10px rgba(0, 0, 0, 0.3), 0 0 12px var(--primary);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .custom-leaflet-icon-wrap.active .map-marker-leaflet {
      background: var(--accent-emerald, #10b981);
      box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.95), 0 6px 15px rgba(0, 0, 0, 0.4), 0 0 20px var(--accent-emerald);
      animation: pulse-marker 2s infinite;
    }

    .custom-leaflet-icon-wrap {
      border: none !important;
      background: none !important;
    }
    .custom-leaflet-icon-wrap:hover {
      z-index: 1000 !important;
    }
    .custom-leaflet-icon-wrap:hover .map-marker-leaflet {
      transform: scale(1.2);
    }
    
    @keyframes pulse-marker {
      0% {
        box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.7), 0 0 0 6px rgba(255, 255, 255, 0.95), 0 6px 15px rgba(0, 0, 0, 0.4);
      }
      70% {
        box-shadow: 0 0 0 12px rgba(16, 185, 129, 05), 0 0 0 6px rgba(255, 255, 255, 0.95), 0 6px 15px rgba(0, 0, 0, 0.4);
      }
      100% {
        box-shadow: 0 0 0 0px rgba(16, 185, 129, 0), 0 0 0 6px rgba(255, 255, 255, 0.95), 0 6px 15px rgba(0, 0, 0, 0.4);
      }
    }
    
    .zone-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: 12px;
      border: 1px solid rgba(15, 23, 42, 0.04);
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .zone-list-item:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }
    
    .zone-list-item.selected {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
      box-shadow: 0 4px 12px var(--glow-color);
    }
    
    .zone-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.05);
      color: var(--text-main);
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
    }
    
    .zone-list-item.selected .zone-badge {
      background: white;
      color: var(--primary);
    }

    /* Main Content Area - RTL responsive fix */
    .main-content {
      flex-grow: 1;
      padding: 40px;
      max-width: 1400px;
      min-width: 0; /* Prevents viewport overflow in flexbox */
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .header-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    /* Section Subtitle Title */
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 25px 0 15px 0;
      border-right: 4px solid var(--primary);
      border-left: none;
      padding-right: 10px;
      padding-left: 0;
      color: var(--text-main);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid var(--border-glass);
      border-radius: 18px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      border-color: rgba(15, 23, 42, 0.15);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }

    .stat-icon.primary {
      background: rgba(79, 70, 229, 0.08);
      color: var(--primary);
    }
    .stat-icon.cyan {
      background: rgba(8, 145, 178, 0.08);
      color: var(--accent-cyan);
    }
    .stat-icon.emerald {
      background: rgba(5, 150, 105, 0.08);
      color: var(--accent-emerald);
    }
    .stat-icon.rose {
      background: rgba(225, 29, 72, 0.08);
      color: var(--accent-rose);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.2;
      color: var(--text-main);
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
    }

    /* Charts & Details Panel */
    .dashboard-panel-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    @media (max-width: 1100px) {
      .dashboard-panel-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 768px) {
      .dashboard-panel-grid {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: #ffffff;
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02);
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-main);
    }

    /* Tables & Datagrids */
    .table-container {
      overflow-x: auto;
      margin-top: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
    }

    th {
      padding: 14px 16px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid rgba(15, 23, 42, 0.1);
      background: rgba(0, 0, 0, 0.01);
    }

    td {
      padding: 16px;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      color: var(--text-main);
    }

    tr:hover td {
      background: rgba(0, 0, 0, 0.015);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge.active { background: rgba(5, 150, 105, 0.1); color: var(--accent-emerald); }
    .badge.inactive { background: rgba(225, 29, 72, 0.1); color: var(--accent-rose); }
    .badge.sold { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
    .badge.removed { background: rgba(225, 29, 72, 0.1); color: var(--accent-rose); }
    .badge.reserved { background: rgba(217, 119, 6, 0.1); color: var(--accent-amber); }
    .badge.pending { background: rgba(217, 119, 6, 0.1); color: var(--accent-amber); }
    .badge.open { background: rgba(225, 29, 72, 0.1); color: var(--accent-rose); }
    .badge.resolved { background: rgba(5, 150, 105, 0.1); color: var(--accent-emerald); }

    /* Life types badges */
    .badge.city { background: rgba(79, 70, 229, 0.1); color: var(--primary); }
    .badge.district { background: rgba(8, 145, 178, 0.1); color: var(--accent-cyan); }
    .badge.block { background: rgba(217, 119, 6, 0.1); color: var(--accent-amber); }
    .badge.group { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .badge.park { background: rgba(5, 150, 105, 0.1); color: var(--accent-emerald); }
    .badge.mall { background: rgba(236, 72, 153, 0.1); color: #db2777; }
    .badge.store { background: rgba(20, 184, 166, 0.1); color: #0d9488; }
    .badge.service_area { background: rgba(234, 179, 8, 0.1); color: #ca8a04; }
    .badge.street { background: rgba(107, 114, 128, 0.1); color: #4b5563; }

    .trust-pill {
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .trust-pill.high { background: rgba(5, 150, 105, 0.1); color: var(--accent-emerald); }
    .trust-pill.medium { background: rgba(217, 119, 6, 0.1); color: var(--accent-amber); }
    .trust-pill.low { background: rgba(225, 29, 72, 0.1); color: var(--accent-rose); }

    /* Filters Section */
    .filter-bar {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .filter-select, .search-bar {
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 10px;
      padding: 10px 16px;
      color: var(--text-main);
      font-family: var(--font-cairo);
      font-size: 0.9rem;
    }

    .search-bar {
      flex-grow: 1;
      min-width: 200px;
    }

    .filter-select:focus, .search-bar:focus {
      outline: none;
      border-color: var(--primary);
      background: #ffffff;
    }

    /* Actions buttons */
    .action-btn {
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 8px;
      color: var(--text-main);
      cursor: pointer;
      padding: 6px 12px;
      font-family: var(--font-cairo);
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.danger:hover {
      background: var(--accent-rose);
      border-color: var(--accent-rose);
      color: white;
    }

    /* Toggle Switch (Datagrid inline) */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 22px;
    }

    .switch input { 
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.05);
      transition: .4s;
      border-radius: 34px;
      border: 1px solid rgba(15, 23, 42, 0.12);
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: auto;
      right: 3px; /* RTL switch */
      bottom: 3px;
      background-color: var(--text-muted);
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--accent-emerald);
      border-color: var(--accent-emerald);
    }

    input:checked + .slider:before {
      transform: translateX(-22px);
      background-color: white;
    }

    /* Tree View Styling (Madinty Life) - RTL adjusted */
    .tree-container {
      margin-top: 15px;
    }

    .tree-node {
      margin-right: 24px;
      margin-left: 0;
      position: relative;
      border-right: 1px dashed rgba(15, 23, 42, 0.1);
      border-left: none;
      padding-right: 16px;
      padding-left: 0;
      margin-top: 8px;
    }

    .tree-node-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.01);
      border: 1px solid rgba(0, 0, 0, 0.03);
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .tree-node-content:hover, .tree-node-content.selected {
      background: rgba(0, 0, 0, 0.03);
      border-color: var(--primary);
    }

    .tree-node-info {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      flex-grow: 1;
    }

    .tree-toggle-icon {
      cursor: pointer;
      color: var(--text-muted);
      transition: transform 0.2s ease;
      width: 16px;
      text-align: center;
    }

    .tree-toggle-icon.expanded {
      transform: rotate(90deg);
    }

    .tree-node-actions {
      display: flex;
      gap: 8px;
    }

    .tree-node-gps {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: monospace;
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      direction: ltr;
    }

    /* Storefront Details Sub-tab layouts */
    .sf-card {
      background: rgba(0, 0, 0, 0.01);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 25px;
    }

    .page-info {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .page-btns {
      display: flex;
      gap: 8px;
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: none;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .modal {
      background: #ffffff;
      border: 1px solid var(--border-glass);
      border-radius: 24px;
      width: 100%;
      max-width: 540px;
      padding: 30px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .close-modal-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      margin-bottom: 25px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .switch-group {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 15px;
    }

    .switch-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }

  </style>
</head>
<body>

  <!-- 1. AUTH SCREEN -->
  <div id="auth-screen">
    <div class="auth-card">
      <div class="logo-container">
        <i class="fa-solid fa-circle-nodes logo-icon"></i>
        <h1 class="auth-title">بوابة إدارة Madinty AI</h1>
        <p class="auth-subtitle">لوحة التحكم الموحدة لنظام Madinty AI</p>
      </div>

      <!-- Phone Number Input Step -->
      <div id="step-phone">
        <div class="form-group">
          <label class="form-label">رقم هاتف المسؤول</label>
          <input type="text" id="phone-input" class="input-field" placeholder="+201000000000 أو 01000000000" value="01000000000">

        </div>
        <button type="button" id="send-otp-btn" class="auth-btn" onclick="sendOtp(event)">إرسال رمز التحقق OTP</button>
      </div>

      <!-- OTP Code Input Step -->
      <div id="step-otp" style="display: none;">
        <div class="form-group">
          <label class="form-label">رمز التحقق (OTP)</label>
          <input type="text" id="otp-input" class="input-field" placeholder="أدخل الرمز المكون من 6 أرقام" value="000000">
          <p style="font-size: 0.8rem; color: var(--accent-cyan); margin-top: 6px; text-align: right; font-weight: 600;">
            * في بيئة التطوير، استخدم الرمز 000000 للتأكيد تلقائياً.
          </p>
        </div>
        <button type="button" id="verify-otp-btn" class="auth-btn" onclick="verifyOtp(event)">التحقق وتسجيل الدخول</button>
      </div>

      <div id="auth-error" class="error-msg">فشل التحقق من الهوية.</div>
    </div>
  </div>

  <!-- 2. MAIN DASHBOARD LAYOUT -->
  <div id="dashboard-layout" style="display: none;">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <i class="fa-solid fa-circle-nodes brand-icon"></i>
        <div class="brand-name">Madinty AI</div>
      </div>

      <!-- Workspace Switcher Dropdown -->
      <div style="margin-bottom: 20px; padding: 0 4px;">
        <label class="form-label" style="font-size: 0.72rem; margin-bottom: 6px; color: var(--text-muted); font-weight: 700;">مساحة العمل النشطة</label>
        <div style="position: relative;">
          <select id="workspace-switcher" class="input-field rtl-support" style="padding: 10px 12px 10px 32px; font-weight: 700; font-size: 0.88rem; background-color: rgba(0, 0, 0, 0.03); border-color: rgba(15, 23, 42, 0.1); cursor: pointer; width: 100%; appearance: none; -webkit-appearance: none; border-radius: 10px;">
            <option value="souq" selected>💼 سوق الكانتو</option>
            <option value="life">🗺️ مدينتي لايف</option>
            <option value="kitchen">🍳 مدينتي كيتشن</option>
            <option value="express">⚡ مدينتي Express</option>
          </select>
          <i class="fa-solid fa-chevron-down" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted); font-size: 0.8rem;"></i>
        </div>
      </div>

      <div class="sidebar-menu-wrapper" style="display: flex; flex-direction: column; gap: 15px; flex-grow: 1; overflow-y: auto;">
        
        <!-- Workspace 1: سوق الكانتو -->
        <div class="workspace-group" id="menu-group-souq">
          <ul class="sidebar-menu">
            <li>
              <a class="menu-item active" data-tab="overview-souq">
                <i class="fa-solid fa-chart-line"></i>
                إحصائيات وتقارير السوق
              </a>
            </li>
            <li>
              <a class="menu-item" data-tab="listings">
                <i class="fa-solid fa-basket-shopping"></i>
                إعلانات ومعروضات السوق
              </a>
            </li>
            <li>
              <a class="menu-item" data-tab="disputes">
                <i class="fa-solid fa-handshake-simple-slash"></i>
                الشكاوى والنزاعات المعلقة
              </a>
            </li>
          </ul>
        </div>

        <!-- Workspace 2: مدينتي لايف -->
        <div class="workspace-group" id="menu-group-life" style="display: none;">
          <ul class="sidebar-menu">
            <li>
              <a class="menu-item" data-tab="life">
                <i class="fa-solid fa-sitemap"></i>
                المخطط الهيكلي ودليل Life
              </a>
            </li>
            <li>
              <a class="menu-item" data-tab="life-map">
                <i class="fa-solid fa-map-location-dot"></i>
                خريطة مدينتي التفاعلية
              </a>
            </li>
          </ul>
        </div>

        <!-- Workspace 3: مدينتي كيتشن -->
        <div class="workspace-group" id="menu-group-kitchen" style="display: none;">
          <ul class="sidebar-menu">
            <li>
              <a class="menu-item" data-tab="kitchens">
                <i class="fa-solid fa-store"></i>
                إدارة مشاريع الكيتشن
              </a>
            </li>
          </ul>
        </div>

        <!-- Workspace 4: مدينتي Express -->
        <div class="workspace-group" id="menu-group-express" style="display: none;">
          <ul class="sidebar-menu">
            <li>
              <a class="menu-item" data-tab="express-couriers">
                <i class="fa-solid fa-users-gear"></i>
                إدارة كباتن التوصيل
              </a>
            </li>
            <li>
              <a class="menu-item" data-tab="express-deliveries">
                <i class="fa-solid fa-truck-fast"></i>
                مراقبة طلبات التوصيل
              </a>
            </li>
          </ul>
        </div>

        <!-- Shared Global Admin Section (Outside workspaces, always visible) -->
        <div id="menu-group-global" style="margin-top: auto; border-top: 1px solid rgba(15, 23, 42, 0.08); padding-top: 15px;">
          <div class="workspace-header" style="font-size: 0.72rem; color: var(--text-muted); padding: 0 12px 6px 12px; margin-bottom: 4px; pointer-events: none; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-gears"></i>
            <span>الإدارة العامة والنظام</span>
          </div>
          <ul class="sidebar-menu">
            <li>
              <a class="menu-item" data-tab="users">
                <i class="fa-solid fa-users"></i>
                حسابات العملاء والمستخدمين
              </a>
            </li>
            <li>
              <a class="menu-item" data-tab="tokens">
                <i class="fa-solid fa-coins"></i>
                نظام الـ Tokens والتمويل
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div class="user-profile-section">
        <div class="user-avatar" id="avatar-letters">مد</div>
        <div class="user-details">
          <div class="user-role">مدير المنصة</div>
          <div class="user-phone" id="admin-display-phone">+20 1000000</div>
        </div>
        <button class="logout-btn" id="logout-btn" title="تسجيل الخروج">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="header-section">
        <div>
          <span id="workspace-badge-indicator" class="badge active" style="margin-bottom: 10px; font-weight: 700; font-size: 0.8rem;">مساحة عمل: سوق الكانتو</span>
          <h2 class="header-title" id="page-title">مؤشرات الأداء العامة</h2>
          <p class="header-subtitle" id="page-subtitle">إحصائيات فورية ومتابعة حية للمنصة</p>
        </div>
      </div>

      <!-- SOUQ OVERVIEW TAB CONTENT -->
      <div id="tab-overview-souq" class="tab-content">
        <!-- Souq Stats Cards -->
        <h3 class="section-title">مؤشرات أداء سوق الكانتو</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon primary">
              <i class="fa-solid fa-tags"></i>
            </div>
            <div>
              <div class="stat-value" id="souq-stat-active-listings">0</div>
              <div class="stat-label">الإعلانات النشطة</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cyan">
              <i class="fa-solid fa-coins"></i>
            </div>
            <div>
              <div class="stat-value" id="souq-stat-volume">0 ج.م</div>
              <div class="stat-label">حجم المعاملات المعروضة</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon emerald">
              <i class="fa-solid fa-users"></i>
            </div>
            <div>
              <div class="stat-value" id="souq-stat-active-users">0</div>
              <div class="stat-label">العملاء النشطين</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon rose">
              <i class="fa-solid fa-circle-exclamation"></i>
            </div>
            <div>
              <div class="stat-value" id="souq-stat-open-disputes">0</div>
              <div class="stat-label">الشكاوى المفتوحة</div>
            </div>
          </div>
        </div>

        <div class="panel" style="margin-top: 25px;">
          <h3 class="panel-title">
            <i class="fa-solid fa-chart-column"></i>
            توزيع فئات سوق الكانتو
          </h3>
          <div style="height: 300px; position: relative;">
            <canvas id="category-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- LIFE MAP TAB CONTENT -->
      <div id="tab-life-map" class="tab-content" style="display: none;">
        <!-- Header Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">خريطة مدينتي التفاعلية</h2>
            <p style="color: var(--text-muted); font-size: 0.88rem;">المخطط العام لمدينة مدينتي - ربط المنشآت والخدمات جغرافياً بالمناطق الخدمية والحدائق والأحياء</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="map-edit-toggle-btn" class="action-btn" onclick="toggleMapEditMode()" style="background: rgba(0,0,0,0.03); border-color: rgba(15,23,42,0.1); color: var(--text-main); font-weight: 700;">
              <i class="fa-solid fa-arrows-to-dot"></i> تعديل مواقع المؤشرات
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.1fr 2fr; gap: 20px; align-items: start;">
          
          <!-- Right Sidebar: Places Directory -->
          <div class="panel" style="max-height: 80vh; display: flex; flex-direction: column;">
            <h3 class="panel-title" style="margin-bottom: 15px;">
              <i class="fa-solid fa-map-location-dot"></i>
              دليل مواقع الخريطة
            </h3>
            
            <div style="display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px;">
              <button id="btn-map-tab-mapped" class="action-btn active" onclick="switchMapSidebarTab('mapped')" style="flex: 1; font-size: 0.8rem; font-weight: 700; padding: 6px 12px;">المواقع المحددة</button>
              <button id="btn-map-tab-unmapped" class="action-btn" onclick="switchMapSidebarTab('unmapped')" style="flex: 1; font-size: 0.8rem; font-weight: 700; padding: 6px 12px;">غير محددة جغرافياً</button>
            </div>

            <input type="text" id="map-location-search" class="search-bar rtl-support" oninput="filterMapLocations()" placeholder="البحث باسم الموقع..." style="width: 100%; margin-bottom: 15px;">
            
            <div id="map-locations-list" style="flex-grow: 1; overflow-y: auto; max-height: 60vh; padding-left: 5px;">
              <!-- Loaded Dynamically -->
            </div>
          </div>

          <!-- Left/Center Workspace: Leaflet Map & Alerts -->
          <div style="display: flex; flex-direction: column; gap: 20px; position: relative;">
            <div class="madinty-map-wrapper" style="position: relative;">
              <div class="madinty-map-container" id="madinty-map-interactive-container"></div>
              
              <!-- Map Mapping Alert Banner -->
              <div id="map-mapping-alert" style="display: none; position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: var(--accent-emerald, #10b981); color: white; padding: 10px 20px; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.15); z-index: 1000; align-items: center; gap: 10px;">
                <span>انقر على الخريطة لتحديد موقع: <strong id="mapping-loc-name">...</strong></span>
                <button class="action-btn" onclick="cancelMappingLocation()" style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 4px 8px; font-size: 0.75rem; border-radius: 6px;">إلغاء</button>
              </div>

              <!-- Map Polygon Drawing Alert Banner -->
              <div id="map-polygon-alert" style="display: none; position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 10px 20px; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,0,0,0.15); z-index: 1000; align-items: center; gap: 12px;">
                <span>جاري رسم أبعاد: <strong id="polygon-loc-name">...</strong> (انقر لتحديد زوايا المضلع)</span>
                <button class="action-btn" onclick="savePolygonDimensions()" style="background: var(--accent-emerald, #10b981); border: none; color: white; padding: 6px 12px; font-size: 0.78rem; border-radius: 6px; font-weight: 700;">حفظ الأبعاد</button>
                <button class="action-btn" onclick="resetPolygonDrawing()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; font-size: 0.78rem; border-radius: 6px;">إعادة</button>
                <button class="action-btn" onclick="cancelPolygonDrawing()" style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 6px 12px; font-size: 0.78rem; border-radius: 6px;">إلغاء</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- LISTINGS TAB CONTENT -->
      <div id="tab-listings" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <input type="text" id="listing-search" class="search-bar rtl-support" placeholder="البحث باسم المنتج...">
            <select id="listing-filter-status" class="filter-select">
              <option value="">كل الحالات</option>
              <option value="ACTIVE" selected>نشط</option>
              <option value="SOLD">مباع</option>
              <option value="RESERVED">محجوز</option>
              <option value="REMOVED">محذوف</option>
            </select>
            <select id="listing-filter-category" class="filter-select">
              <option value="">كل الفئات الرئيسية</option>
            </select>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الفئة</th>
                  <th>السعر المطلوب</th>
                  <th>رقم البائع</th>
                  <th>موثوقية البائع</th>
                  <th>الحالة</th>
                  <th>تاريخ النشر</th>
                </tr>
              </thead>
              <tbody id="listings-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="listings-page-info">يتم عرض 0 من 0 إعلان</div>
            <div class="page-btns">
              <button class="action-btn" id="listings-prev-btn"><i class="fa-solid fa-chevron-right"></i> السابق</button>
              <button class="action-btn" id="listings-next-btn">التالي <i class="fa-solid fa-chevron-left"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- KITCHENS TAB CONTENT -->
      <div id="tab-kitchens" class="tab-content" style="display: none;">
        <!-- Kitchens Stats Row -->
        <div class="stats-grid" style="margin-bottom: 25px;">
          <div class="stat-card">
            <div class="stat-icon primary">
              <i class="fa-solid fa-store"></i>
            </div>
            <div>
              <div class="stat-value" id="kitchen-stat-active">0</div>
              <div class="stat-label">مشاريع كيتشن النشطة</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cyan">
              <i class="fa-solid fa-cookie"></i>
            </div>
            <div>
              <div class="stat-value" id="kitchen-stat-menu-items">0</div>
              <div class="stat-label">إجمالي وجبات القوائم</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon emerald">
              <i class="fa-solid fa-utensils"></i>
            </div>
            <div>
              <div class="stat-value" id="kitchen-stat-total">0</div>
              <div class="stat-label">إجمالي مشاريع كيتشن المسجلة</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; align-items: start; margin-bottom: 25px;">
          <div class="panel">
            <h3 class="panel-title">
              <i class="fa-solid fa-pizza-slice"></i>
              تصنيفات كيتشن الطعام
            </h3>
            <div style="height: 200px; position: relative;">
              <canvas id="cuisine-chart"></canvas>
            </div>
          </div>
          
          <div class="panel">
            <h3 class="panel-title">
              <i class="fa-solid fa-sliders"></i>
              تصفية وبحث الكيتشنز
            </h3>
            <div class="filter-bar" style="margin-bottom: 0;">
              <input type="text" id="kitchens-search" class="search-bar rtl-support" placeholder="البحث باسم المتجر أو المعرّف أو المطبخ...">
              <select id="kitchens-filter-status" class="filter-select">
                <option value="">كل الحالات</option>
                <option value="PENDING">قيد المراجعة</option>
                <option value="APPROVED">مقبول/نشط</option>
                <option value="REJECTED">مرفوض</option>
              </select>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>المتجر / المشروع</th>
                  <th>المعرف الفريد (Slug)</th>
                  <th>تصنيف الكيتشن</th>
                  <th>عدد الوجبات بالمنيو</th>
                  <th>هاتف مالك المشروع</th>
                  <th>الموثوقية</th>
                  <th>الحالة</th>
                  <th>التحكم بالحالة</th>
                </tr>
              </thead>
              <tbody id="kitchens-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="kitchens-page-info">يتم عرض 0 من 0 مشروع</div>
            <div class="page-btns">
              <button class="action-btn" id="kitchens-prev-btn"><i class="fa-solid fa-chevron-right"></i> السابق</button>
              <button class="action-btn" id="kitchens-next-btn">التالي <i class="fa-solid fa-chevron-left"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- LIFE (MAP LOCATIONS) TAB CONTENT -->
      <div id="tab-life" class="tab-content" style="display: none;">
        <!-- Life Stats Row -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; align-items: start; margin-bottom: 25px;">
          <div class="stat-card" style="height: 100%;">
            <div class="stat-icon primary">
              <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <div>
              <div class="stat-value" id="life-stat-total-locations">0</div>
              <div class="stat-label">إجمالي الأماكن المسجلة جغرافياً</div>
            </div>
          </div>
          <div class="panel" style="padding: 15px 24px;">
            <h3 class="panel-title" style="margin-bottom: 10px; font-size: 0.95rem;">
              <i class="fa-solid fa-map"></i>
              توزيع تصنيفات دليل الأماكن جغرافياً
            </h3>
            <div style="height: 100px; position: relative;">
              <canvas id="location-chart"></canvas>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; align-items: start;">
          <!-- Left Panel: Tree View -->
          <div class="panel">
            <div class="filter-bar" style="justify-content: space-between; align-items: center;">
              <input type="text" id="life-search" class="search-bar rtl-support" placeholder="البحث عن أماكن في الشجرة..." style="width: auto; flex-grow: 1;">
              <button class="action-btn" style="background: var(--primary); color: white; margin-right: 10px;" onclick="openAddLocationModal()">
                <i class="fa-solid fa-plus"></i> إضافة مكان
              </button>
            </div>

            <div id="life-tree-root" class="tree-container" style="max-height: 70vh; overflow-y: auto;">
              <!-- Loaded as interactive tree hierarchy -->
            </div>
          </div>

          <!-- Right Panel: Storefront Details (Dynamic) -->
          <div class="panel" id="life-storefront-panel" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; margin-bottom: 15px;">
              <div>
                <h3 id="storefront-title" style="font-weight: 700; color:var(--text-main);">اسم المتجر</h3>
                <p id="storefront-subtitle" style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">الوصف الفرعي هنا</p>
              </div>
              <span class="badge store" id="storefront-badge">STORE</span>
            </div>

            <!-- Sub-tabs Menu -->
            <div style="display: flex; gap: 10px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 8px; margin-bottom: 15px; overflow-x: auto;">
              <button class="action-btn" onclick="selectStorefrontTab('items')" id="sf-tab-items-btn" style="background: var(--primary); color: white;">دليل المنتجات والخدمات</button>
              <button class="action-btn" onclick="selectStorefrontTab('bookings')" id="sf-tab-bookings-btn">طلبات الحجوزات والطلبات</button>
              <button class="action-btn" onclick="selectStorefrontTab('posts')" id="sf-tab-posts-btn">الأخبار والعروض الترويجية</button>
              <button class="action-btn" onclick="selectStorefrontTab('photos')" id="sf-tab-photos-btn">معرض الصور</button>
            </div>

            <!-- Sub-tab 1: Items -->
            <div id="sf-content-items" class="sf-tab-content">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">المنتجات والخدمات المعروضة</h4>
                <button class="action-btn" onclick="openAddItemModal()" style="background: var(--accent-emerald); border-color: var(--accent-emerald); color: white; font-size: 0.8rem; padding: 4px 10px;"><i class="fa-solid fa-plus"></i> إضافة صنف</button>
              </div>
              <div id="sf-items-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 50vh; overflow-y: auto; padding-left: 5px;"></div>
            </div>

            <!-- Sub-tab 2: Bookings -->
            <div id="sf-content-bookings" class="sf-tab-content" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">طلبات الحجز والطلبات الواردة</h4>
                <button class="action-btn" onclick="generateMockBooking()" style="background: var(--primary); border-color: var(--primary); color: white; font-size: 0.8rem; padding: 4px 10px;"><i class="fa-solid fa-wand-magic-sparkles"></i> توليد حجز تجريبي</button>
              </div>
              <div id="sf-bookings-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 50vh; overflow-y: auto; padding-left: 5px;"></div>
            </div>

            <!-- Sub-tab 3: Posts -->
            <div id="sf-content-posts" class="sf-tab-content" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">الأخبار ومنشورات المكان</h4>
                <button class="action-btn" onclick="openAddPostModal()" style="background: var(--primary); border-color: var(--primary); color: white; font-size: 0.8rem; padding: 4px 10px;"><i class="fa-solid fa-bullhorn"></i> منشور جديد</button>
              </div>
              <div id="sf-posts-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 50vh; overflow-y: auto; padding-left: 5px;"></div>
            </div>

            <!-- Sub-tab 4: Photos -->
            <div id="sf-content-photos" class="sf-tab-content" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">ألبوم صور المنشأة</h4>
                <button class="action-btn" onclick="openAddPhotoModal()" style="background: var(--primary); border-color: var(--primary); color: white; font-size: 0.8rem; padding: 4px 10px;"><i class="fa-solid fa-camera"></i> إضافة صورة</button>
              </div>
              <div id="sf-photos-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 50vh; overflow-y: auto; padding-left: 5px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- USERS TAB CONTENT -->
      <div id="tab-users" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <input type="text" id="users-search" class="search-bar rtl-support" placeholder="البحث برقم الهاتف...">
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>معرف الحساب</th>
                  <th>رقم الهاتف</th>
                  <th>مستوى الموثوقية</th>
                  <th>الصلاحية</th>
                  <th>الإعلانات بسوق الكانتو</th>
                  <th>العروض المقدمة</th>
                  <th>مطابخ مدينتي</th>
                  <th>الشكاوى النشطة</th>
                  <th>تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody id="users-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="users-page-info">يتم عرض 0 من 0 حساب</div>
            <div class="page-btns">
              <button class="action-btn" id="users-prev-btn"><i class="fa-solid fa-chevron-right"></i> السابق</button>
              <button class="action-btn" id="users-next-btn">التالي <i class="fa-solid fa-chevron-left"></i></button>
            </div>
          </div>
      </div>

      <!-- TOKENS TAB CONTENT -->
      <div id="tab-tokens" class="tab-content" style="display: none;">
        <!-- Tokens overview stats -->
        <div class="overview-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 25px;">
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 15px;">
            <div style="background: rgba(245,158,11,0.1); color: #d97706; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              <i class="fa-solid fa-coins"></i>
            </div>
            <div>
              <div id="tokens-stat-total" style="font-size: 1.4rem; font-weight: 700; color: var(--text-main);">0</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">إجمالي الـ Tokens النشطة بالمنصة</div>
            </div>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 15px;">
            <div style="background: rgba(16,185,129,0.1); color: #059669; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              <i class="fa-solid fa-store"></i>
            </div>
            <div>
              <div id="tokens-stat-active-kitchens" style="font-size: 1.4rem; font-weight: 700; color: var(--text-main);">0</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">المطابخ الممولة بنقاط التوكنز</div>
            </div>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 15px;">
            <div style="background: rgba(59,130,246,0.1); color: #2563eb; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
            </div>
            <div>
              <div id="tokens-stat-transactions-count" style="font-size: 1.4rem; font-weight: 700; color: var(--text-main);">0</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">إجمالي الحركات والعمليات</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 30px; align-items: start;">
          <!-- Kitchens list with Tokens -->
          <div class="panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="font-weight: 700; margin: 0; font-size: 1.1rem;"><i class="fa-solid fa-store" style="color: var(--primary); margin-left: 6px;"></i> أرصدة تمويل المطابخ المنزلية</h3>
              <input type="text" id="tokens-kitchens-search" oninput="filterTokensKitchens()" class="search-bar rtl-support" placeholder="بحث باسم المطبخ..." style="max-width: 250px; margin: 0; height: 38px;">
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>المطبخ المنزلي</th>
                    <th>مالك المشروع</th>
                    <th>رصيد التوكنز (Tokens)</th>
                    <th>تحديث الرصيد</th>
                  </tr>
                </thead>
                <tbody id="tokens-kitchens-table-body">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payout / Funding Actions -->
          <div class="panel">
            <h3 style="font-weight: 700; margin-bottom: 15px; font-size: 1.1rem;"><i class="fa-solid fa-hand-holding-dollar" style="color: var(--primary); margin-left: 6px;"></i> تمويل وشحن حساب مطبخ</h3>
            
            <div class="form-group" style="margin-top: 15px;">
              <label class="form-label">المطبخ المستهدف</label>
              <select id="token-target-kitchen" class="filter-select" style="width: 100%; height: 42px; font-family: var(--font-cairo);">
                <!-- Populated dynamically -->
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">نوع العملية</label>
              <select id="token-action-type" class="filter-select" style="width: 100%; height: 42px; font-family: var(--font-cairo);">
                <option value="credit">شحن وإيداع (Credit / تمويل)</option>
                <option value="deduct">سحب وخصم (Deduct / خصم)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">قيمة العملية بالتوكنز (Tokens)</label>
              <input type="number" id="token-amount" class="search-bar rtl-support" placeholder="100" style="width: 100%; height: 42px; direction: ltr; text-align: left;">
            </div>

            <div class="form-group">
              <label class="form-label">سبب الشحن أو الخصم</label>
              <input type="text" id="token-reason" class="search-bar rtl-support" placeholder="مثال: شحن تمويل حكومي للمشروعات المنزلية..." style="width: 100%; height: 42px;">
            </div>

            <button class="action-btn" onclick="executeAdminTokenAction()" style="background: var(--primary); color: white; width: 100%; padding: 12px; margin-top: 15px; font-weight: 700; font-family: var(--font-cairo); border-radius: 8px; border: none; cursor: pointer;">
              <i class="fa-solid fa-paper-plane" style="margin-left: 6px;"></i> تنفيذ عملية التمويل
            </button>
          </div>
        </div>

        <!-- Global token transaction logs -->
        <div class="panel" style="margin-top: 25px;">
          <h3 style="font-weight: 700; margin-bottom: 15px; font-size: 1.1rem;"><i class="fa-solid fa-list-check" style="color: var(--primary); margin-left: 6px;"></i> سجل عمليات التمويل والتوكنز العام بالمنصة</h3>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>رقم المعاملة</th>
                  <th>التاريخ والوقت</th>
                  <th>المطبخ المستفيد</th>
                  <th>نوع العملية</th>
                  <th>القيمة</th>
                  <th>السبب والتفاصيل</th>
                </tr>
              </thead>
              <tbody id="tokens-global-logs-table-body">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- DISPUTES TAB CONTENT -->
      <div id="tab-disputes" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <select id="disputes-filter-status" class="filter-select">
              <option value="">كل النزاعات والشكاوى</option>
              <option value="OPEN" selected>المفتوحة والنشطة</option>
              <option value="RESOLVED">تمت تسويتها</option>
              <option value="REJECTED">مرفوضة</option>
            </select>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>الشاكي (رقم الهاتف)</th>
                  <th>المشتكى عليه (رقم الهاتف)</th>
                  <th>السلعة المعنية</th>
                  <th>قيمة العرض المالي</th>
                  <th>سبب النزاع</th>
                  <th>تاريخ الإبلاغ</th>
                  <th>الحالة</th>
                  <th>إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody id="disputes-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="disputes-page-info">يتم عرض 0 من 0 شكوى</div>
            <div class="page-btns">
              <button class="action-btn" id="disputes-prev-btn"><i class="fa-solid fa-chevron-right"></i> السابق</button>
              <button class="action-btn" id="disputes-next-btn">التالي <i class="fa-solid fa-chevron-left"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- EXPRESS COURIERS TAB CONTENT -->
      <div id="tab-express-couriers" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <select id="express-couriers-filter-status" class="filter-select" onchange="fetchExpressCouriers()">
              <option value="">كل الكباتن</option>
              <option value="PENDING" selected>طلبات التفعيل المعلقة</option>
              <option value="APPROVED">الكباتن النشطة والمفعلة</option>
              <option value="REJECTED">الطلبات المرفوضة</option>
            </select>
            <input type="text" id="express-couriers-search" class="input-field rtl-support" style="max-width: 250px;" placeholder="بحث عن كابتن (الاسم، الهاتف، الرقم القومي)..." onkeyup="fetchExpressCouriers()">
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>اسم الكابتن</th>
                  <th>رقم الهاتف</th>
                  <th>الرقم القومي</th>
                  <th>وسيلة التوصيل</th>
                  <th>حالة الحساب</th>
                  <th>حالة الاتصال</th>
                  <th>تاريخ التسجيل</th>
                  <th>إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody id="express-couriers-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="express-couriers-page-info">يتم عرض 0 من 0 كابتن</div>
            <div class="page-btns">
              <button class="action-btn" id="express-couriers-prev-btn" onclick="changeExpressCouriersPage(-1)"><i class="fa-solid fa-chevron-right"></i> السابق</button>
              <button class="action-btn" id="express-couriers-next-btn" onclick="changeExpressCouriersPage(1)">التالي <i class="fa-solid fa-chevron-left"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- EXPRESS DELIVERIES TAB CONTENT -->
      <div id="tab-express-deliveries" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <select id="express-deliveries-filter-status" class="filter-select" onchange="fetchExpressDeliveries()">
              <option value="">كل الطلبات</option>
              <option value="PENDING">جاري البحث عن كابتن (معلق)</option>
              <option value="ACCEPTED">تم قبول الطلب</option>
              <option value="PICKED_UP">تم الاستلام (جاري التوصيل)</option>
              <option value="DELIVERED">تم التوصيل بنجاح</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>المطبخ المرسل</th>
                  <th>نقطة التسليم في مدينتي</th>
                  <th>العميل المستلم</th>
                  <th>الكابتن المسؤول</th>
                  <th>حالة التوصيل</th>
                  <th>تاريخ الطلب</th>
                </tr>
              </thead>
              <tbody id="express-deliveries-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="express-deliveries-page-info">يتم عرض 0 من 0 طلب</div>
            <div class="page-btns">
              <button class="action-btn" id="express-deliveries-prev-btn" onclick="changeExpressDeliveriesPage(-1)"><i class="fa-solid fa-chevron-right"></i> السابق</button>
              <button class="action-btn" id="express-deliveries-next-btn" onclick="changeExpressDeliveriesPage(1)">التالي <i class="fa-solid fa-chevron-left"></i></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- DISPUTE RESOLUTION MODAL -->
  <div id="resolve-modal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h4 class="modal-title">تسوية وحل النزاع</h4>
        <button class="close-modal-btn" onclick="closeResolveModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="modal-dispute-id">
        <div class="form-group">
          <label class="form-label" for="resolution-text">تفاصيل قرار التسوية والحل</label>
          <textarea id="resolution-text" class="input-field rtl-support" style="height: 100px; resize: none;" placeholder="أدخل تفاصيل القرار والصلح..."></textarea>
        </div>
        <div class="switch-group">
          <input type="checkbox" id="file-report-check" class="filter-select" style="width: auto; cursor: pointer;">
          <label class="switch-label" for="file-report-check">تسجيل مخالفة رسمية على الحساب وتقليل مستوى الموثوقية</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="closeResolveModal()">إلغاء</button>
        <button class="action-btn" style="background: var(--accent-emerald); border-color: var(--accent-emerald); color: white;" onclick="submitResolveDispute()">اعتماد وتأكيد التسوية</button>
      </div>
    </div>
  </div>

  <!-- LOCATION ADD/EDIT MODAL -->
  <div id="location-modal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h4 class="modal-title" id="location-modal-title">إضافة مكان جديد في مدينتي</h4>
        <button class="close-modal-btn" onclick="closeLocationModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="location-form" onsubmit="submitLocationForm(event)">
        <div class="modal-body">
          <input type="hidden" id="modal-location-id">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">الاسم بالإنجليزية</label>
              <input type="text" id="loc-name" class="input-field rtl-support" required placeholder="مثال: Open Air Mall">
            </div>
            <div class="form-group">
              <label class="form-label">الاسم بالعربية</label>
              <input type="text" id="loc-name-ar" class="input-field rtl-support" required placeholder="مثال: أوبن إير مول">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">الوصف بالإنجليزية</label>
              <textarea id="loc-desc" class="input-field rtl-support" style="height: 60px; resize: none;" placeholder="Description in English..."></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">الوصف بالعربية</label>
              <textarea id="loc-desc-ar" class="input-field rtl-support" style="height: 60px; resize: none;" placeholder="الوصف باللغة العربية..."></textarea>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">نوع المنشأة</label>
              <select id="loc-type" class="input-field rtl-support" required>
                <option value="CITY">مدينة (City)</option>
                <option value="DISTRICT">حي سكني (District)</option>
                <option value="BLOCK">بلوك (Block)</option>
                <option value="GROUP">مجموعة (Group)</option>
                <option value="PARK">بارك/حديقة (Park)</option>
                <option value="BUILDING">عمارة (Building)</option>
                <option value="MALL">مول تجاري (Mall)</option>
                <option value="STORE">متجر / مقهى / عيادة (Store)</option>
                <option value="SERVICE_AREA">منطقة خدمات (Service Area)</option>
                <option value="STREET">شارع (Street)</option>
                <option value="PARKING">باركينج (Parking)</option>
                <option value="OTHER">آخر (Other)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">الموقع الأب (يتبع لـ)</label>
              <select id="loc-parent" class="input-field rtl-support">
                <option value="">بدون (مكان جذري رئيسي)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">إحداثيات العرض (Lat)</label>
              <input type="number" step="any" id="loc-lat" class="input-field" placeholder="مثال: 30.0963">
            </div>
            <div class="form-group">
              <label class="form-label">إحداثيات الطول (Lng)</label>
              <input type="number" step="any" id="loc-lng" class="input-field" placeholder="مثال: 31.6288">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="action-btn" onclick="closeLocationModal()">إلغاء</button>
          <button type="submit" class="action-btn" style="background: var(--primary); border-color: var(--primary); color: white;" id="location-submit-btn">حفظ المكان</button>
        </div>
      </form>
    </div>
  </div>

  <!-- STOREFRONT ITEM ADD/EDIT MODAL -->
  <div id="item-modal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h4 class="modal-title" id="item-modal-title">إضافة صنف للكتالوج</h4>
        <button class="close-modal-btn" onclick="closeItemModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="item-form" onsubmit="submitItemForm(event)">
        <div class="modal-body">
          <input type="hidden" id="modal-item-id">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">العنوان بالإنجليزية</label>
              <input type="text" id="item-title" class="input-field rtl-support" required placeholder="مثال: Spanish Latte Cold">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">العنوان بالعربية</label>
              <input type="text" id="item-title-ar" class="input-field rtl-support" required placeholder="مثال: سبانش لاتيه بارد">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">الوصف بالإنجليزية</label>
              <textarea id="item-desc" class="input-field rtl-support" style="height: 60px; resize: none;" placeholder="Description in English..."></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">الوصف بالعربية</label>
              <textarea id="item-desc-ar" class="input-field rtl-support" style="height: 60px; resize: none;" placeholder="الوصف باللغة العربية..."></textarea>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">السعر (جنيه مصري)</label>
              <input type="number" step="any" id="item-price" class="input-field" placeholder="مثال: 85">
            </div>
            <div class="form-group">
              <label class="form-label">التصنيف الفرعي</label>
              <input type="text" id="item-category" class="input-field rtl-support" placeholder="مثال: مشروبات باردة / أطباق رئيسية">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">نوع المعروض</label>
              <select id="item-type" class="input-field rtl-support" required>
                <option value="MENU_ITEM">وجبة طعام / مشروب (مطعم/مقهى)</option>
                <option value="PRODUCT">سلعة ومنتج تجاري (محل بيع بالتجزئة)</option>
                <option value="EXHIBIT">قطعة معروضة (معرض سيارات أو فني)</option>
                <option value="MEDICAL_SERVICE">خدمة علاجية/استشارة (عيادة طبية)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">رابط صورة المنتج</label>
              <input type="text" id="item-image" class="input-field" placeholder="مثال: https://images.com/latte.jpg">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="action-btn" onclick="closeItemModal()">إلغاء</button>
          <button type="submit" class="action-btn" style="background: var(--accent-emerald); border-color: var(--accent-emerald); color: white;">حفظ العنصر</button>
        </div>
      </form>
    </div>
  </div>

  <!-- STOREFRONT POST ADD MODAL -->
  <div id="post-modal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h4 class="modal-title">نشر إعلان أو عرض جديد</h4>
        <button class="close-modal-btn" onclick="closePostModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="post-form" onsubmit="submitPostForm(event)">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">عنوان الإعلان / العرض</label>
            <input type="text" id="post-title" class="input-field rtl-support" required placeholder="مثال: خصم 50% بمناسبة نهاية الأسبوع!">
          </div>
          <div class="form-group">
            <label class="form-label">محتوى المنشور</label>
            <textarea id="post-content" class="input-field rtl-support" style="height: 100px; resize: none;" required placeholder="اكتب تفاصيل العرض والإعلان هنا..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">رابط صورة الإعلان (اختياري)</label>
            <input type="text" id="post-image" class="input-field" placeholder="مثال: https://images.com/offer.jpg">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="action-btn" onclick="closePostModal()">إلغاء</button>
          <button type="submit" class="action-btn" style="background: var(--primary); border-color: var(--primary); color: white;">نشر الآن</button>
        </div>
      </form>
    </div>
  </div>

  <!-- STOREFRONT PHOTO ADD MODAL -->
  <div id="photo-modal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h4 class="modal-title">إضافة صورة لمعرض المنشأة</h4>
        <button class="close-modal-btn" onclick="closePhotoModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="photo-form" onsubmit="submitPhotoForm(event)">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">رابط الصورة</label>
            <input type="text" id="photo-url" class="input-field" required placeholder="مثال: https://images.com/interior.jpg">
          </div>
          <div class="form-group">
            <label class="form-label">تعليق توضيحي</label>
            <input type="text" id="photo-caption" class="input-field rtl-support" placeholder="مثال: الجلسات الداخلية الدافئة للمقهى">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="action-btn" onclick="closePhotoModal()">إلغاء</button>
          <button type="submit" class="action-btn" style="background: var(--primary); border-color: var(--primary); color: white;">إضافة الصورة المعرض</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const API_URL = '${apiBaseUrl}';
    
    // Global Debug Error Banner for Visual UI Diagnostics
    window.addEventListener('error', function(e) {
      const errDiv = document.createElement('div');
      errDiv.style.position = 'fixed';
      errDiv.style.top = '0';
      errDiv.style.left = '0';
      errDiv.style.width = '100%';
      errDiv.style.background = '#ef4444';
      errDiv.style.color = 'white';
      errDiv.style.padding = '15px';
      errDiv.style.zIndex = '99999';
      errDiv.style.fontFamily = 'monospace';
      errDiv.style.whiteSpace = 'pre-wrap';
      errDiv.innerHTML = '<strong>Uncaught Error:</strong> ' + e.message + ' at ' + e.filename + ':' + e.lineno + '\\nStack: ' + (e.error ? e.error.stack : 'N/A');
      document.body.appendChild(errDiv);
    });

    window.showDebugError = function(msg, err) {
      const errDiv = document.createElement('div');
      errDiv.style.position = 'fixed';
      errDiv.style.top = '0';
      errDiv.style.left = '0';
      errDiv.style.width = '100%';
      errDiv.style.background = '#f97316';
      errDiv.style.color = 'white';
      errDiv.style.padding = '15px';
      errDiv.style.zIndex = '99999';
      errDiv.style.fontFamily = 'monospace';
      errDiv.style.whiteSpace = 'pre-wrap';
      errDiv.innerHTML = '<strong>Debug Error:</strong> ' + msg + '\\nDetails: ' + (err ? (err.message + '\\nStack: ' + err.stack) : 'N/A');
      document.body.appendChild(errDiv);
    };
    let token = localStorage.getItem('admin_token') || '';
    let currentTab = 'overview-souq';
    
    let selectedLocationId = null;
    let selectedStorefrontTab = 'items';
    let currentStorefrontItems = [];

    // Map states
    let allLifeLocations = [];
    let selectedMapLocationId = null;
    let mapEditMode = false;
    let customZoneCoords = {};
    let leafletMap = null;
    let leafletMarkers = {};
    let leafletPolygons = {};

    let categoryChartInstance = null;
    let cuisineChartInstance = null;
    let locationChartInstance = null;

    // Pagination states
    let listingsPage = 1;
    let kitchensPage = 1;
    let usersPage = 1;
    let disputesPage = 1;

    // Collapsed state tracking for Tree View
    const collapsedNodes = new Set();

    function runInit() {
      console.log('runInit executing...');
      initAuth();
      setupMenu();
      setupFilters();
      initWorkspaceSwitcher();
      console.log('runInit completed.');
    }

    if (document.readyState === 'loading') {
      console.log('Document loading, setting up DOMContentLoaded listener...');
      document.addEventListener('DOMContentLoaded', runInit);
    } else {
      console.log('Document already loaded, running runInit directly...');
      runInit();
    }

    // ────────────────────── AUTHENTICATION ──────────────────────

    function initAuth() {
      console.log('initAuth executing. current token:', token);
      if (token) {
        verifyTokenAndLoad();
      } else {
        showAuthScreen();
      }

      const sendBtn = document.getElementById('send-otp-btn');
      const verifyBtn = document.getElementById('verify-otp-btn');
      console.log('send-otp-btn element:', sendBtn);
      console.log('verify-otp-btn element:', verifyBtn);

      // sendOtp is also wired inline on the button so it survives partial init failures.
      if (verifyBtn) {
        verifyBtn.addEventListener('click', (e) => {
          console.log('verify-otp-btn clicked!');
          verifyOtp();
        });
      }
      
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
      }
    }

    function showAuthScreen() {
      console.log('Showing auth screen...');
      document.getElementById('auth-screen').style.display = 'flex';
      document.getElementById('dashboard-layout').style.display = 'none';
      document.getElementById('step-phone').style.display = 'block';
      document.getElementById('step-otp').style.display = 'none';
    }
    function unwrapApiData(payload) {
      return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    }

    function getApiMessage(payload, fallback) {
      const message = payload && (payload.message || payload.error || (payload.data && payload.data.message));
      if (Array.isArray(message)) return message.join(' - ');
      return message || fallback;
    }

    async function sendOtp(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      const phoneInput = document.getElementById('phone-input');
      const sendBtn = document.getElementById('send-otp-btn');
      const originalText = sendBtn ? sendBtn.textContent : '';
      let phone = phoneInput ? phoneInput.value.trim() : '';
      if (!phone) {
        showError('Please enter the phone number first.');
        return;
      }
      hideError();

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending OTP...';
      }

      try {
        const res = await fetch(API_URL + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone })
        });
        const data = await res.json().catch(() => ({}));
        
        if (res.ok) {
          document.getElementById('step-phone').style.display = 'none';
          document.getElementById('step-otp').style.display = 'block';
          const otpInput = document.getElementById('otp-input');
          if (otpInput && !otpInput.value) otpInput.value = '000000';
        } else {
          showError(getApiMessage(data, 'Failed to send OTP. Check the phone number.'));
        }
      } catch (err) {
        showError('Cannot connect to the server. Make sure localhost:3000 is running.');
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = originalText || 'Send OTP';
        }
      }
    }

    async function verifyOtp(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      const verifyBtn = document.getElementById('verify-otp-btn');
      if (verifyBtn && verifyBtn.disabled) return;

      let phone = document.getElementById('phone-input').value.trim();
      
      const code = document.getElementById('otp-input').value.trim();
      if (!code) return;
      hideError();

      if (verifyBtn) {
        verifyBtn.disabled = true;
      }

      try {
        const res = await fetch(API_URL + '/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone, code })
        });
        const data = await res.json().catch(() => ({}));
        
        if (res.ok) {
          const authData = unwrapApiData(data);
          token = authData && authData.token;
          if (!token) {
            showError('OTP verified, but the server did not return a login token.');
            return;
          }
          localStorage.setItem('admin_token', token);
          verifyTokenAndLoad();
        } else {
          showError(getApiMessage(data, 'Incorrect OTP.'));
        }
      } catch (err) {
        showError('OTP verification failed.');
      } finally {
        if (verifyBtn) {
          verifyBtn.disabled = false;
        }
      }
    }

    async function verifyTokenAndLoad() {
      try {
        const res = await fetch(\`\${API_URL}/auth/me\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json().catch(() => ({}));
        const me = unwrapApiData(envelope);

        if (res.ok && me && (me.role === 'PLATFORM_ADMIN' || me.role === 'TENANT_ADMIN')) {
          document.getElementById('auth-screen').style.display = 'none';
          document.getElementById('dashboard-layout').style.display = 'flex';
          
          // Render Admin Display Info
          document.getElementById('admin-display-phone').textContent = me.phoneNumber;
          document.getElementById('avatar-letters').textContent = me.phoneNumber.slice(-2);
          
          loadTab(currentTab);
        } else {
          localStorage.removeItem('admin_token');
          token = '';
          showAuthScreen();
          showError('غير مصرح: الحساب لا يملك صلاحيات الإدارة.');
        }
      } catch (err) {
        localStorage.removeItem('admin_token');
        token = '';
        showAuthScreen();
        showError('انتهت الجلسة، الرجاء تسجيل الدخول مجدداً.');
      }
    }

    async function logout() {
      try {
        await fetch(\`\${API_URL}/auth/logout\`, {
          method: 'POST',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
      } catch {}
      localStorage.removeItem('admin_token');
      token = '';
      showAuthScreen();
    }

    function showError(msg) {
      const err = document.getElementById('auth-error');
      err.textContent = msg;
      err.style.display = 'block';
    }

    function hideError() {
      document.getElementById('auth-error').style.display = 'none';
    }

    // ────────────────────── NAVIGATION ──────────────────────

    function setupMenu() {
      document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
          item.classList.add('active');
          const tab = item.getAttribute('data-tab');
          loadTab(tab);
        });
      });
    }

    function initWorkspaceSwitcher() {
      const switcher = document.getElementById('workspace-switcher');
      if (!switcher) return;

      switcher.addEventListener('change', (e) => {
        const workspace = e.target.value;
        switchWorkspace(workspace);
      });
    }

    function switchWorkspace(workspace) {
      // Hide all workspace menu groups
      document.getElementById('menu-group-souq').style.display = 'none';
      document.getElementById('menu-group-life').style.display = 'none';
      document.getElementById('menu-group-kitchen').style.display = 'none';
      document.getElementById('menu-group-express').style.display = 'none';

      // Show the selected workspace menu group
      if (workspace === 'souq') {
        document.getElementById('menu-group-souq').style.display = 'block';
        loadTab('overview-souq');
      } else if (workspace === 'life') {
        document.getElementById('menu-group-life').style.display = 'block';
        loadTab('life');
      } else if (workspace === 'kitchen') {
        document.getElementById('menu-group-kitchen').style.display = 'block';
        loadTab('kitchens');
      } else if (workspace === 'express') {
        document.getElementById('menu-group-express').style.display = 'block';
        loadTab('express-couriers');
      }
    }

    function loadTab(tab) {
      currentTab = tab;
      
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById(\`tab-\${tab}\`).style.display = 'block';

      const title = document.getElementById('page-title');
      const subtitle = document.getElementById('page-subtitle');
      const badge = document.getElementById('workspace-badge-indicator');

      // Update active menu active class
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      const activeMenu = document.querySelector(\`.menu-item[data-tab="\${tab}"]\`);
      if (activeMenu) activeMenu.classList.add('active');

      // Update active workspace theme colors
      updateWorkspaceTheme(tab);

      if (tab === 'overview-souq') {
        title.textContent = 'سوق الكانتو — إحصائيات الأداء';
        subtitle.textContent = 'لوحة متابعة مؤشرات أداء سوق الكانتو الموحدة';
        if (badge) {
          badge.textContent = 'مساحة عمل: سوق الكانتو';
          badge.className = 'badge active';
        }
        fetchOverviewStats();
      } else if (tab === 'listings') {
        title.textContent = 'سوق الكانتو — إدارة المعروضات';
        subtitle.textContent = 'مراجعة وتصفية سلع البيع والشراء P2P في مدينتي';
        if (badge) {
          badge.textContent = 'مساحة عمل: سوق الكانتو';
          badge.className = 'badge active';
        }
        fetchListings();
      } else if (tab === 'disputes') {
        title.textContent = 'سوق الكانتو — النزاعات والشكاوى';
        subtitle.textContent = 'تسوية النزاعات المعلقة بين بائعي ومشتري سوق الكانتو';
        if (badge) {
          badge.textContent = 'مساحة عمل: سوق الكانتو';
          badge.className = 'badge active';
        }
        fetchDisputes();
      } else if (tab === 'life' || tab === 'life-map') {
        title.textContent = tab === 'life' ? 'مدينتي لايف — دليل الأماكن' : 'مدينتي لايف — خريطة مدينتي التفاعلية';
        subtitle.textContent = tab === 'life' ? 'إدارة دليل الأماكن والمنشآت وتفعيل المتاجر جغرافياً في مدينتي' : 'المخطط الهيكلي وتوزيع المنشآت والخدمات جغرافياً على خريطة مدينتي';
        if (badge) {
          badge.textContent = 'مساحة عمل: مدينتي لايف';
          badge.className = 'badge district';
        }
        fetchOverviewStats();
        if (tab === 'life') {
          fetchLifeTree();
        } else {
          initInteractiveMap();
        }
      } else if (tab === 'kitchens') {
        title.textContent = 'مدينتي كيتشن — إدارة المشاريع';
        subtitle.textContent = 'إدارة وتنشيط مشاريع الكيتشن المنزلية وقوائم الطعام في مدينتي';
        if (badge) {
          badge.textContent = 'مساحة عمل: مدينتي كيتشن';
          badge.className = 'badge park';
        }
        fetchOverviewStats();
        fetchKitchens();
      } else if (tab === 'users') {
        title.textContent = 'الإدارة العامة — الحسابات';
        subtitle.textContent = 'تتبع مستوى موثوقية وتفاعلات مستخدمي المنصة الموحدة';
        if (badge) {
          badge.textContent = 'نطاق إدارة النظام الموحد';
          badge.className = 'badge city';
        }
        fetchUsers();
      } else if (tab === 'tokens') {
        title.textContent = 'الإدارة العامة — نظام الـ Tokens والتمويل';
        subtitle.textContent = 'شحن وإدارة أرصدة تمويل المطابخ المنزلية ونظام الدفع الداخلي';
        if (badge) {
          badge.textContent = 'نطاق إدارة النظام الموحد';
          badge.className = 'badge city';
        }
        fetchTokensDashboard();
      } else if (tab === 'express-couriers' || tab === 'express-deliveries') {
        title.textContent = tab === 'express-couriers' ? 'مدينتي Express — إدارة الكباتن' : 'مدينتي Express — مراقبة التوصيل';
        subtitle.textContent = tab === 'express-couriers' ? 'مراجعة وتفعيل وتجميد حسابات كباتن التوصيل Express' : 'مراقبة حركة وحالات طلبات توصيل مطابخ مدينتي في الوقت الفعلي';
        if (badge) {
          badge.textContent = 'مساحة عمل: مدينتي Express';
          badge.className = 'badge active';
        }
        if (tab === 'express-couriers') {
          fetchExpressCouriers();
        } else {
          fetchExpressDeliveries();
        }
      }
    }

    function updateWorkspaceTheme(tab) {
      const root = document.documentElement;

      if (tab === 'overview-souq' || tab === 'listings' || tab === 'disputes') {
        // Souq ElKanto Theme (Indigo)
        root.style.setProperty('--primary', '#4f46e5');
        root.style.setProperty('--primary-hover', '#4338ca');
        root.style.setProperty('--glow-color', 'rgba(79, 70, 229, 0.08)');
      } else if (tab === 'life' || tab === 'life-map') {
        // Madinty Life Theme (Cyan)
        root.style.setProperty('--primary', '#0891b2');
        root.style.setProperty('--primary-hover', '#0e7490');
        root.style.setProperty('--glow-color', 'rgba(8, 145, 178, 0.08)');
      } else if (tab === 'kitchens') {
        // Madinty Kitchen Theme (Emerald)
        root.style.setProperty('--primary', '#059669');
        root.style.setProperty('--primary-hover', '#047857');
        root.style.setProperty('--glow-color', 'rgba(5, 150, 105, 0.08)');
      } else if (tab === 'users' || tab === 'tokens') {
        // Global System Admin Theme (Slate/Dark Gray)
        root.style.setProperty('--primary', '#334155');
        root.style.setProperty('--primary-hover', '#1e293b');
        root.style.setProperty('--glow-color', 'rgba(51, 65, 85, 0.08)');
      } else if (tab === 'express-couriers' || tab === 'express-deliveries') {
        // Madinty Express Theme (Amber)
        root.style.setProperty('--primary', '#f59e0b');
        root.style.setProperty('--primary-hover', '#d97706');
        root.style.setProperty('--glow-color', 'rgba(245, 158, 11, 0.08)');
      }
    }

    // ────────────────────── OVERVIEW STATS ──────────────────────

    async function fetchOverviewStats() {
      try {
        const res = await fetch(\`\${API_URL}/admin-api/stats\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const stats = envelope.data;

        if (res.ok) {
          // Render Souq Stats
          const activeListings = document.getElementById('souq-stat-active-listings');
          if (activeListings) activeListings.textContent = stats.souq.listings.ACTIVE;
          
          const volume = document.getElementById('souq-stat-volume');
          if (volume) volume.textContent = \`\${stats.souq.totalVolume.toLocaleString()} ج.م\`;

          const activeUsers = document.getElementById('souq-stat-active-users');
          if (activeUsers) activeUsers.textContent = stats.souq.activeUsersCount;

          const openDisputes = document.getElementById('souq-stat-open-disputes');
          if (openDisputes) openDisputes.textContent = stats.souq.disputes.OPEN;

          // Render Kitchens Stats
          const kitchenActive = document.getElementById('kitchen-stat-active');
          if (kitchenActive) kitchenActive.textContent = stats.kitchens.stats.active;

          const kitchenMenuItems = document.getElementById('kitchen-stat-menu-items');
          if (kitchenMenuItems) kitchenMenuItems.textContent = stats.kitchens.totalMenuItems;

          const kitchenTotal = document.getElementById('kitchen-stat-total');
          if (kitchenTotal) kitchenTotal.textContent = stats.kitchens.stats.total;

          // Render Life Stats
          const lifeTotal = document.getElementById('life-stat-total-locations');
          if (lifeTotal) lifeTotal.textContent = stats.life.locations.total;

          // Charts
          if (currentTab === 'overview-souq') {
            renderCategoryChart(stats.souq.categories);
          } else if (currentTab === 'kitchens') {
            renderCuisineChart(stats.kitchens.cuisines);
          } else if (currentTab === 'life') {
            renderLocationChart(stats.life.locations.types);
          }
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    }

    function renderCategoryChart(data) {
      const ctx = document.getElementById('category-chart').getContext('2d');
      if (categoryChartInstance) categoryChartInstance.destroy();

      const labels = data.map(item => item.category);
      const counts = data.map(item => item.count);

      categoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'الإعلانات المعروضة',
            data: counts,
            backgroundColor: '#4f46e5',
            borderColor: '#06b6d4',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#475569', font: { family: 'Cairo' } } },
            y: { grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#475569', stepSize: 1, font: { family: 'Cairo' } } }
          }
        }
      });
    }

    function renderCuisineChart(data) {
      const ctx = document.getElementById('cuisine-chart').getContext('2d');
      if (cuisineChartInstance) cuisineChartInstance.destroy();

      const labels = data.map(item => item.cuisine);
      const counts = data.map(item => item.count);

      cuisineChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'],
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#475569', font: { family: 'Cairo', size: 10 } }
            }
          }
        }
      });
    }

    function renderLocationChart(typesObj) {
      const ctx = document.getElementById('location-chart').getContext('2d');
      if (locationChartInstance) locationChartInstance.destroy();

      const labels = Object.keys(typesObj);
      const counts = Object.values(typesObj);

      locationChartInstance = new Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: labels,
          datasets: [{
            data: counts,
            backgroundColor: [
              'rgba(79, 70, 229, 0.6)',
              'rgba(6, 182, 212, 0.6)',
              'rgba(245, 158, 11, 0.6)',
              'rgba(139, 92, 246, 0.6)',
              'rgba(16, 185, 129, 0.6)',
              'rgba(236, 72, 153, 0.6)',
              'rgba(20, 184, 166, 0.6)'
            ],
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#475569', font: { family: 'Cairo', size: 10 } }
            }
          },
          scales: {
            r: {
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              angleLines: { color: 'rgba(0, 0, 0, 0.05)' }
            }
          }
        }
      });
    }

    // ────────────────────── LISTINGS TAB ──────────────────────

    async function fetchListings() {
      const search = document.getElementById('listing-search').value;
      const status = document.getElementById('listing-filter-status').value;
      const category = document.getElementById('listing-filter-category').value;

      try {
        const res = await fetch(\`\${API_URL}/admin-api/souq/listings?page=\${listingsPage}&limit=10&status=\${status}&category=\${category}&q=\${search}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderListingsTable(result.data);
          document.getElementById('listings-page-info').textContent = \`صفحة \${result.page} من \${result.totalPages || 1} (إجمالي السلع: \${result.total})\`;
          
          document.getElementById('listings-prev-btn').disabled = result.page <= 1;
          document.getElementById('listings-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderListingsTable(listings) {
      const tbody = document.getElementById('listings-table-body');
      if (listings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">لا توجد سلع معروضة حالياً.</td></tr>';
        return;
      }

      tbody.innerHTML = listings.map(l => {
        let trustClass = 'high';
        const score = l.seller?.trustScore ?? 100;
        if (score < 40) trustClass = 'low';
        else if (score < 80) trustClass = 'medium';

        let statusText = l.status;
        if (l.status === 'ACTIVE') statusText = 'نشط';
        else if (l.status === 'SOLD') statusText = 'مباع';
        else if (l.status === 'RESERVED') statusText = 'محجوز';
        else if (l.status === 'REMOVED') statusText = 'محذوف';

        return \`
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 12px;">
                \${l.photos[0] ? \`<img src="\${l.photos[0].url}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">\` : '<div style="width: 40px; height: 40px; border-radius: 6px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-image" style="color:#94a3b8;"></i></div>'}
                <div>
                  <div style="font-weight: 600; color:var(--text-main);">\${l.title}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); direction: ltr; text-align: right;">ID: \${l.id.slice(0, 8)}</div>
                </div>
              </div>
            </td>
            <td>\${l.category}</td>
            <td>\${l.askingPrice} \${l.currency === 'EGP' ? 'ج.م' : l.currency}</td>
            <td style="direction: ltr; text-align: right;">\${l.seller?.phoneNumber || 'غير معروف'}</td>
            <td><span class="trust-pill \${trustClass}">\${score} %</span></td>
            <td><span class="badge \${l.status.toLowerCase()}">\${statusText}</span></td>
            <td>\${new Date(l.createdAt).toLocaleDateString('ar-EG')}</td>
          </tr>
        \`;
      }).join('');
    }

    // ────────────────────── KITCHENS TAB ──────────────────────

    async function fetchKitchens() {
      const search = document.getElementById('kitchens-search').value;
      const status = document.getElementById('kitchens-filter-status').value;

      try {
        const res = await fetch(\`\${API_URL}/admin-api/kitchens?page=\${kitchensPage}&limit=10&status=\${status}&q=\${search}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderKitchensTable(result.data);
          document.getElementById('kitchens-page-info').textContent = \`صفحة \${result.page} من \${result.totalPages || 1} (إجمالي الكيتشنز: \${result.total})\`;
          
          document.getElementById('kitchens-prev-btn').disabled = result.page <= 1;
          document.getElementById('kitchens-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderKitchensTable(businesses) {
      const tbody = document.getElementById('kitchens-table-body');
      if (businesses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">لا توجد مشاريع كيتشن مسجلة بعد.</td></tr>';
        return;
      }

      tbody.innerHTML = businesses.map(b => {
        let trustClass = 'high';
        const score = b.owner?.trustScore ?? 100;
        if (score < 40) trustClass = 'low';
        else if (score < 80) trustClass = 'medium';

        return \`
          <tr>
            <td>
              <div style="font-weight: 600; color:var(--text-main);">\${b.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); direction: ltr; text-align: right;">ID: \${b.id.slice(0, 8)}</div>
            </td>
            <td><code style="background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px; direction: ltr; display: inline-block;">\${b.slug}</code></td>
            <td>\${b.cuisineType || 'غير محدد'}</td>
            <td>\${b.menuItemsCount} صنف</td>
            <td style="direction: ltr; text-align: right;">\${b.owner?.phoneNumber || 'غير معروف'}</td>
            <td><span class="trust-pill \${trustClass}">\${score} %</span></td>
            <td>
              <span class="badge \${b.isActive ? 'active' : 'inactive'}">\text-muted \${b.isActive ? 'نشط' : 'غير نشط'}</span>
            </td>
            <td>
              <label class="switch">
                <input type="checkbox" \${b.isActive ? 'checked' : ''} onchange="toggleKitchenActive('\${b.id}')">
                <span class="slider"></span>
              </label>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function toggleKitchenActive(id) {
      try {
        const res = await fetch(\`\${API_URL}/admin-api/kitchens/\${id}/toggle-active\`, {
          method: 'PATCH',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (res.ok) {
          fetchKitchens();
        } else {
          alert('فشل في تعديل حالة الكيتشن.');
        }
      } catch (err) {
        alert('حدث خطأ في الاتصال.');
      }
    }

    // ────────────────────── MADINTY LIFE (LOCATIONS) ──────────────────────

    async function fetchLifeTree() {
      const q = document.getElementById('life-search').value;
      const container = document.getElementById('life-tree-root');

      try {
        if (q) {
          const res = await fetch(\`\${API_URL}/life/locations?q=\${q}\`, {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          const envelope = await res.json();
          renderFlatLocationsList(envelope.data);
          return;
        }

        const res = await fetch(\`\${API_URL}/life/locations/tree\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const tree = envelope.data;

        if (res.ok) {
          container.innerHTML = renderTreeNodes(tree);
          updateParentDropdownOptions(tree);
        }
      } catch (err) {
        console.error('Error loading locations:', err);
      }
    }

    function renderTreeNodes(nodes) {
      if (!nodes || nodes.length === 0) return '';

      return nodes.map(n => {
        const isCollapsed = collapsedNodes.has(n.id);
        const hasChildren = n.children && n.children.length > 0;
        const toggleIconClass = hasChildren ? \`fa-solid fa-chevron-left tree-toggle-icon \${!isCollapsed ? 'expanded' : ''}\` : 'fa-solid fa-circle-dot tree-toggle-icon';
        const childrenDisplay = isCollapsed ? 'none' : 'block';
        const isSelected = selectedLocationId === n.id ? 'selected' : '';

        let typeText = n.type;
        if (n.type === 'CITY') typeText = 'مدينة';
        else if (n.type === 'DISTRICT') typeText = 'حي';
        else if (n.type === 'BLOCK') typeText = 'بلوك';
        else if (n.type === 'GROUP') typeText = 'مجموعة';
        else if (n.type === 'PARK') typeText = 'بارك';
        else if (n.type === 'BUILDING') typeText = 'عمارة';
        else if (n.type === 'MALL') typeText = 'مول';
        else if (n.type === 'STORE') typeText = 'متجر';
        else if (n.type === 'SERVICE_AREA') typeText = 'خدمات';
        else if (n.type === 'STREET') typeText = 'شارع';

        return \`
          <div class="tree-node" id="node-\${n.id}">
            <div class="tree-node-content \${isSelected}">
              <div class="tree-node-info" onclick="selectStorefrontLocation('\${n.id}')">
                <i class="\${toggleIconClass}" onclick="event.stopPropagation(); toggleNodeExpansion('\${n.id}')"></i>
                <span class="badge \${n.type.toLowerCase()}">\${typeText}</span>
                <span style="font-weight:700; color:var(--text-main);">\${n.nameAr}</span>
                <span style="color:var(--text-muted); font-size:0.85rem; font-family: 'Outfit';">(\${n.name})</span>
                \${n.latitude && n.longitude ? \`<span class="tree-node-gps"><i class="fa-solid fa-location-crosshairs"></i> \${n.latitude.toFixed(4)}, \${n.longitude.toFixed(4)}</span>\` : ''}
              </div>
              <div class="tree-node-actions">
                <button class="action-btn" onclick="openAddLocationModal('\${n.id}', '\${n.type}')" title="إضافة فرعي">
                  <i class="fa-solid fa-plus"></i>
                </button>
                <button class="action-btn" onclick="editLocation('\${n.id}')" title="تعديل">
                  <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="action-btn danger" onclick="deleteLocation('\${n.id}')" title="حذف">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
            <div class="tree-node-children" id="children-\${n.id}" style="display:\${childrenDisplay}">
              \${renderTreeNodes(n.children)}
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderFlatLocationsList(locations) {
      const container = document.getElementById('life-tree-root');
      if (locations.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:30px;">لم يتم العثور على نتائج مطابقة.</p>';
        return;
      }

      container.innerHTML = locations.map(n => {
        let typeText = n.type;
        if (n.type === 'CITY') typeText = 'مدينة';
        else if (n.type === 'DISTRICT') typeText = 'حي';
        else if (n.type === 'BLOCK') typeText = 'بلوك';
        else if (n.type === 'GROUP') typeText = 'مجموعة';
        else if (n.type === 'PARK') typeText = 'بارك';
        else if (n.type === 'BUILDING') typeText = 'عمارة';
        else if (n.type === 'MALL') typeText = 'مول';
        else if (n.type === 'STORE') typeText = 'متجر';
        else if (n.type === 'SERVICE_AREA') typeText = 'خدمات';

        return \`
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 18px; margin-bottom:8px; background:rgba(0,0,0,0.01); border:1px solid var(--border-glass); border-radius:12px;">
            <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="selectStorefrontLocation('\${n.id}')">
              <span class="badge \${n.type.toLowerCase()}">\${typeText}</span>
              <span style="font-weight:700; color:var(--text-main);">\${n.nameAr}</span>
              <span style="color:var(--text-muted); font-family:'Outfit';">(\${n.name})</span>
              \${n.latitude && n.longitude ? \`<span class="tree-node-gps"><i class="fa-solid fa-location-crosshairs"></i> \${n.latitude.toFixed(4)}, \${n.longitude.toFixed(4)}</span>\` : ''}
            </div>
            <div class="tree-node-actions">
              <button class="action-btn" onclick="editLocation('\${n.id}')">تعديل</button>
              <button class="action-btn danger" onclick="deleteLocation('\${n.id}')">حذف</button>
            </div>
          </div>
        \`;
      }).join('');
    }

    function toggleNodeExpansion(nodeId) {
      const childrenDiv = document.getElementById(\`children-\${nodeId}\`);
      const icon = document.querySelector(\`#node-\${nodeId} > .tree-node-content .tree-toggle-icon\`);
      
      if (!childrenDiv || !icon) return;

      if (childrenDiv.style.display === 'none') {
        childrenDiv.style.display = 'block';
        icon.classList.add('expanded');
        collapsedNodes.delete(nodeId);
      } else {
        childrenDiv.style.display = 'none';
        icon.classList.remove('expanded');
        collapsedNodes.add(nodeId);
      }
    }

    function updateParentDropdownOptions(tree) {
      const select = document.getElementById('loc-parent');
      const currentVal = select.value;
      select.innerHTML = '<option value="">بدون (مكان جذري رئيسي)</option>';
      
      function appendLocs(nodes, depth = 0) {
        nodes.forEach(n => {
          const opt = document.createElement('option');
          opt.value = n.id;
          opt.textContent = \`\${'— '.repeat(depth)}\${n.nameAr} (\${n.name})\`;
          select.appendChild(opt);
          if (n.children && n.children.length > 0) {
            appendLocs(n.children, depth + 1);
          }
        });
      }
      appendLocs(tree);
      select.value = currentVal;
    }

    function openAddLocationModal(parentId = '', parentType = '') {
      document.getElementById('location-modal-title').textContent = parentId ? 'إضافة مكان فرعي جديد' : 'إضافة مكان جذري جديد';
      document.getElementById('modal-location-id').value = '';
      document.getElementById('loc-name').value = '';
      document.getElementById('loc-name-ar').value = '';
      document.getElementById('loc-desc').value = '';
      document.getElementById('loc-desc-ar').value = '';
      document.getElementById('loc-parent').value = parentId;
      document.getElementById('loc-lat').value = '';
      document.getElementById('loc-lng').value = '';
      
      let suggestedType = 'STORE';
      if (parentType === 'CITY') suggestedType = 'DISTRICT';
      else if (parentType === 'DISTRICT') suggestedType = 'BLOCK';
      else if (parentType === 'BLOCK') suggestedType = 'SERVICE_AREA';
      else if (parentType === 'SERVICE_AREA') suggestedType = 'STORE';
      else if (parentType === 'MALL') suggestedType = 'STORE';
      else if (parentType === 'GROUP') suggestedType = 'BUILDING';
      
      document.getElementById('loc-type').value = suggestedType;
      document.getElementById('location-modal').style.display = 'flex';
    }

    function closeLocationModal() {
      document.getElementById('location-modal').style.display = 'none';
    }

    async function editLocation(id) {
      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${id}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const loc = envelope.data;

        if (res.ok) {
          document.getElementById('location-modal-title').textContent = 'تعديل تفاصيل الموقع';
          document.getElementById('modal-location-id').value = loc.id;
          document.getElementById('loc-name').value = loc.name;
          document.getElementById('loc-name-ar').value = loc.nameAr;
          document.getElementById('loc-desc').value = loc.description || '';
          document.getElementById('loc-desc-ar').value = loc.descriptionAr || '';
          document.getElementById('loc-type').value = loc.type;
          document.getElementById('loc-parent').value = loc.parentId || '';
          document.getElementById('loc-lat').value = loc.latitude || '';
          document.getElementById('loc-lng').value = loc.longitude || '';
          
          document.getElementById('location-modal').style.display = 'flex';
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function submitLocationForm(event) {
      event.preventDefault();
      
      const id = document.getElementById('modal-location-id').value;
      const name = document.getElementById('loc-name').value.trim();
      const nameAr = document.getElementById('loc-name-ar').value.trim();
      const description = document.getElementById('loc-desc').value.trim();
      const descriptionAr = document.getElementById('loc-desc-ar').value.trim();
      const type = document.getElementById('loc-type').value;
      const parentId = document.getElementById('loc-parent').value || null;
      const lat = document.getElementById('loc-lat').value;
      const lng = document.getElementById('loc-lng').value;

      const body = {
        name,
        nameAr,
        description: description || undefined,
        descriptionAr: descriptionAr || undefined,
        type,
        parentId,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined
      };

      const url = id ? \`\${API_URL}/life/locations/\${id}\` : \`\${API_URL}/life/locations\`;
      const method = id ? 'PATCH' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          closeLocationModal();
          fetchLifeTree();
          if (leafletMap) {
            initInteractiveMap();
          }
        } else {
          const errData = await res.json();
          alert(errData.message || 'خطأ أثناء حفظ معلومات الموقع.');
        }
      } catch (err) {
        alert('حدث خطأ بالشبكة.');
      }
    }

    async function deleteLocation(id) {
      if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المكان؟ سيؤدي ذلك لحذف جميع الفروع والأماكن المدرجة تحته تلقائياً!')) return;

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${id}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (res.ok) {
          if (selectedLocationId === id) {
            document.getElementById('life-storefront-panel').style.display = 'none';
            selectedLocationId = null;
          }
          fetchLifeTree();
        } else {
          alert('فشل في حذف الموقع.');
        }
      } catch (err) {
        alert('خطأ في الاتصال.');
      }
    }

    // ────────────────────── STOREFRONT OPERATIONS ──────────────────────

    async function selectStorefrontLocation(id, name, type, nameAr) {
      selectedLocationId = id;
      
      document.querySelectorAll('.tree-node-content').forEach(el => el.classList.remove('selected'));
      const activeNode = document.querySelector(\`#node-\${id} > .tree-node-content\`);
      if (activeNode) activeNode.classList.add('selected');

      document.getElementById('storefront-title').textContent = nameAr;
      document.getElementById('storefront-subtitle').innerHTML = \`
        <div style="font-family: 'Outfit'; margin-bottom: 2px;">\${name} — \${type}</div>
      \`;
      document.getElementById('storefront-badge').textContent = type;
      document.getElementById('storefront-badge').className = \`badge \${type.toLowerCase()}\`;

      document.getElementById('life-storefront-panel').style.display = 'block';

      loadStorefrontData();

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${id}\`);
        const envelope = await res.json();
        const loc = envelope.data;
        if (res.ok && loc) {
          const descAr = loc.descriptionAr || '';
          const descEn = loc.description || '';
          document.getElementById('storefront-subtitle').innerHTML = \`
            <div style="font-family: 'Outfit'; margin-bottom: 2px;">\${loc.name} — \${loc.type}</div>
            \${descAr ? \`<div style="font-size:0.85rem; color:var(--text-main); font-weight:500; margin-top:4px;">\${descAr}</div>\` : ''}
            \${descEn ? \`<div style="font-size:0.8rem; color:var(--text-muted); font-family:'Outfit';">\${descEn}</div>\` : ''}
          \`;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function selectStorefrontTab(tab) {
      selectedStorefrontTab = tab;
      
      document.querySelectorAll('[id^="sf-tab-"]').forEach(btn => {
        btn.style.background = 'rgba(0,0,0,0.02)';
        btn.style.color = 'var(--text-main)';
      });
      const activeBtn = document.getElementById(\`sf-tab-\${tab}-btn\`);
      activeBtn.style.background = 'var(--primary)';
      activeBtn.style.color = 'white';

      document.querySelectorAll('.sf-tab-content').forEach(panel => panel.style.display = 'none');
      document.getElementById(\`sf-content-\${tab}\`).style.display = 'block';

      loadStorefrontData();
    }

    function loadStorefrontData() {
      if (!selectedLocationId) return;

      if (selectedStorefrontTab === 'items') {
        loadStorefrontItems();
      } else if (selectedStorefrontTab === 'bookings') {
        loadStorefrontBookings();
      } else if (selectedStorefrontTab === 'posts') {
        loadStorefrontPosts();
      } else if (selectedStorefrontTab === 'photos') {
        loadStorefrontPhotos();
      }
    }

    async function loadStorefrontItems() {
      const container = document.getElementById('sf-items-list');
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">جاري تحميل العناصر...</p>';

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/items\`);
        const envelope = await res.json();
        const items = envelope.data;

        if (items.length === 0) {
          container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px;">لم يتم إضافة عناصر للكتالوج بعد. اضغط على إضافة صنف للبدء.</p>';
          return;
        }

        container.innerHTML = items.map(item => \`
          <div class="sf-card">
            <div style="display:flex; align-items:center; gap:12px;">
              \${item.imageUrl ? \`<img src="\${item.imageUrl}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;">\` : '<div style="width:45px; height:45px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-cookie-bite" style="color:#94a3b8;"></i></div>'}
              <div>
                <div style="font-weight:700; color:var(--text-main);">\${item.title}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">\${item.description || 'لا يوجد وصف تفصيلي'}</div>
                <div style="font-size:0.85rem; color:var(--primary); margin-top:2px; font-weight: 700;">
                  \${item.price ? \`\${item.price} جنيه مصري\` : 'السعر عند الطلب'} | الفئة: \${item.category || 'عام'}
                </div>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="action-btn" onclick="editStorefrontItem('\${item.id}', '\${item.title}', '\${item.description || ""}', '\${item.price || ""}', '\${item.category || ""}', '\${item.type}', '\${item.imageUrl || ""}')"><i class="fa-solid fa-pencil"></i></button>
              <button class="action-btn danger" onclick="deleteStorefrontItem('\${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        container.innerHTML = '<p style="color:var(--accent-rose); text-align:center;">خطأ أثناء تحميل المنتجات.</p>';
      }
    }

     function openAddItemModal() {
      document.getElementById('item-modal-title').textContent = 'إضافة صنف للكتالوج المعروض';
      document.getElementById('modal-item-id').value = '';
      document.getElementById('item-title').value = '';
      document.getElementById('item-title-ar').value = '';
      document.getElementById('item-desc').value = '';
      document.getElementById('item-desc-ar').value = '';
      document.getElementById('item-price').value = '';
      document.getElementById('item-category').value = '';
      document.getElementById('item-image').value = '';
      
      const badgeText = document.getElementById('storefront-badge').textContent;
      let defaultItemType = 'PRODUCT';
      if (badgeText === 'STORE' || badgeText === 'MALL') defaultItemType = 'MENU_ITEM';
      if (badgeText === 'CLINIC') defaultItemType = 'MEDICAL_SERVICE';
      
      document.getElementById('item-type').value = defaultItemType;
      document.getElementById('item-modal').style.display = 'flex';
    }

    function editStorefrontItem(id) {
      const item = currentStorefrontItems.find(i => i.id === id);
      if (!item) return;

      document.getElementById('item-modal-title').textContent = 'تعديل عنصر الكتالوج المعروض';
      document.getElementById('modal-item-id').value = item.id;
      document.getElementById('item-title').value = item.title;
      document.getElementById('item-title-ar').value = item.titleAr || '';
      document.getElementById('item-desc').value = item.description || '';
      document.getElementById('item-desc-ar').value = item.descriptionAr || '';
      document.getElementById('item-price').value = item.price || '';
      document.getElementById('item-category').value = item.category || '';
      document.getElementById('item-type').value = item.type;
      document.getElementById('item-image').value = item.imageUrl || '';
      document.getElementById('item-modal').style.display = 'flex';
    }

    function closeItemModal() {
      document.getElementById('item-modal').style.display = 'none';
    }

    async function submitItemForm(event) {
      event.preventDefault();
      const id = document.getElementById('modal-item-id').value;
      const title = document.getElementById('item-title').value.trim();
      const titleAr = document.getElementById('item-title-ar').value.trim();
      const description = document.getElementById('item-desc').value.trim();
      const descriptionAr = document.getElementById('item-desc-ar').value.trim();
      const price = document.getElementById('item-price').value;
      const category = document.getElementById('item-category').value.trim();
      const type = document.getElementById('item-type').value;
      const imageUrl = document.getElementById('item-image').value.trim();

      const body = {
        title,
        titleAr: titleAr || undefined,
        description: description || undefined,
        descriptionAr: descriptionAr || undefined,
        price: price ? parseFloat(price) : undefined,
        category: category || undefined,
        type,
        imageUrl: imageUrl || undefined
      };

      const url = id ? \`\${API_URL}/life/locations/items/\${id}\` : \`\${API_URL}/life/locations/\${selectedLocationId}/items\`;
      const method = id ? 'PATCH' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          closeItemModal();
          loadStorefrontItems();
        } else {
          alert('خطأ أثناء حفظ العنصر المعروض.');
        }
      } catch (err) {
        alert('خطأ بالشبكة.');
      }
    }

    async function deleteStorefrontItem(itemId) {
      if (!confirm('هل تود حذف هذا الصنف من الكتالوج؟')) return;
      try {
        const res = await fetch(\`\${API_URL}/life/locations/items/\${itemId}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (res.ok) {
          loadStorefrontItems();
        }
      } catch (err) {
        alert('خطأ.');
      }
    }

    async function loadStorefrontBookings() {
      const container = document.getElementById('sf-bookings-list');
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">جاري تحميل طلبات الحجز...</p>';

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/bookings\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const bookings = envelope.data;

        if (bookings.length === 0) {
          container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px;">لا توجد طلبات حجز أو طلبات معروضة حالياً.</p>';
          return;
        }

        container.innerHTML = bookings.map(b => {
          let statusColor = 'pending';
          let statusAr = 'معلق';
          if (b.status === 'CONFIRMED') { statusColor = 'active'; statusAr = 'مؤكد'; }
          if (b.status === 'CANCELLED') { statusColor = 'inactive'; statusAr = 'ملغى'; }
          if (b.status === 'COMPLETED') { statusColor = 'sold'; statusAr = 'مكتمل'; }

          let typeAr = b.type;
          if (b.type === 'TABLE_RESERVATION') typeAr = 'حجز طاولة';
          else if (b.type === 'CLINIC_APPOINTMENT') typeAr = 'موعد عيادة';
          else if (b.type === 'PRODUCT_ORDER') typeAr = 'طلب شراء';

          return \`
            <div class="sf-card" style="flex-direction:column; align-items:stretch; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <span class="badge" style="background:rgba(0,0,0,0.05); font-size:0.75rem;">\${typeAr}</span>
                  <span style="font-weight:700; margin-right:8px; color:var(--text-main);">\${b.customerName} (\${b.customerPhone})</span>
                </div>
                <span class="badge \${statusColor}">\${statusAr}</span>
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                \${b.dateTime ? \`<strong>تاريخ الموعد:</strong> \${new Date(b.dateTime).toLocaleString('ar-EG')}<br>\` : ''}
                \${b.notes ? \`<strong>ملاحظات العميل:</strong> \${b.notes}<br>\` : ''}
                \${Object.keys(b.metadata).length > 0 ? \`<strong>تفاصيل إضافية:</strong> \${JSON.stringify(b.metadata)}\` : ''}
              </div>
              \${b.status === 'PENDING' ? \`
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:5px;">
                  <button class="action-btn" style="background:rgba(5, 150, 105, 0.1); color:var(--accent-emerald); border-color:rgba(5, 150, 105, 0.15);" onclick="updateBookingStatus('\${b.id}', 'CONFIRMED')">
                    <i class="fa-solid fa-circle-check"></i> تأكيد الحجز
                  </button>
                  <button class="action-btn danger" style="background:rgba(225, 29, 72, 0.1); color:var(--accent-rose); border-color:rgba(225, 29, 72, 0.15);" onclick="updateBookingStatus('\${b.id}', 'CANCELLED')">
                    <i class="fa-solid fa-ban"></i> إلغاء الحجز
                  </button>
                </div>
              \` : ''}
              \${b.status === 'CONFIRMED' ? \`
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:5px;">
                  <button class="action-btn" style="background:var(--primary); color: white;" onclick="updateBookingStatus('\${b.id}', 'COMPLETED')">
                    <i class="fa-solid fa-clipboard-check"></i> إكمال الخدمة
                  </button>
                </div>
              \` : ''}
            </div>
          \`;
        }).join('');
      } catch (err) {
        container.innerHTML = '<p style="color:var(--accent-rose); text-align:center;">خطأ أثناء تحميل طلبات الحجز.</p>';
      }
    }

    async function updateBookingStatus(bookingId, status) {
      try {
        const res = await fetch(\`\${API_URL}/life/locations/bookings/\${bookingId}/status\`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          loadStorefrontBookings();
        }
      } catch (err) {
        alert('حدث خطأ بالاتصال.');
      }
    }

    async function generateMockBooking() {
      const badgeText = document.getElementById('storefront-badge').textContent;
      let mockType = 'PRODUCT_ORDER';
      let mockNotes = 'عدد 1 وجبة برجر كومبو، 1 كولا';
      let mockMeta = { itemsCount: 2 };

      if (badgeText === 'STORE' || badgeText === 'MALL') {
        mockType = 'TABLE_RESERVATION';
        mockNotes = 'حجز طاولة لعدد 4 أفراد بالقرب من النافذة';
        mockMeta = { tableNumber: 12, guests: 4 };
      } else if (badgeText === 'CLINIC') {
        mockType = 'CLINIC_APPOINTMENT';
        mockNotes = 'كشف عام - طب أسنان';
        mockMeta = { serviceType: 'تقويم أسنان' };
      }

      const body = {
        customerName: "محمد علي",
        customerPhone: "+20123456789",
        dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        type: mockType,
        notes: mockNotes,
        metadata: mockMeta
      };

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/bookings\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          loadStorefrontBookings();
        }
      } catch (err) {
        alert('خطأ في توليد حجز تجريبي.');
      }
    }

    async function loadStorefrontPosts() {
      const container = document.getElementById('sf-posts-list');
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">جاري تحميل الأخبار...</p>';

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/posts\`);
        const envelope = await res.json();
        const posts = envelope.data;

        if (posts.length === 0) {
          container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px;">لا توجد منشورات أو عروض معلنة حالياً. اضغط على منشور جديد للبدء.</p>';
          return;
        }

        container.innerHTML = posts.map(p => \`
          <div class="sf-card" style="flex-direction:column; align-items:stretch; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h5 style="font-weight:700; font-size:0.95rem; color:var(--text-main);">\${p.title}</h5>
              <button class="action-btn danger" style="padding:4px 8px;" onclick="deleteStorefrontPost('\${p.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); white-space:pre-wrap; line-height:1.6;">\${p.content}</p>
            \${p.imageUrl ? \`<img src="\${p.imageUrl}" style="width:100%; max-height:200px; border-radius:10px; object-fit:cover; margin-top:5px;">\` : ''}
            <div style="font-size:0.75rem; color:var(--text-muted); text-align:left;">تاريخ النشر: \${new Date(p.createdAt).toLocaleDateString('ar-EG')}</div>
          </div>
        \`).join('');
      } catch (err) {
        container.innerHTML = '<p style="color:var(--accent-rose); text-align:center;">خطأ أثناء تحميل الأخبار.</p>';
      }
    }

    function openAddPostModal() {
      document.getElementById('post-title').value = '';
      document.getElementById('post-content').value = '';
      document.getElementById('post-image').value = '';
      document.getElementById('post-modal').style.display = 'flex';
    }

    function closePostModal() {
      document.getElementById('post-modal').style.display = 'none';
    }

    async function submitPostForm(event) {
      event.preventDefault();
      const title = document.getElementById('post-title').value.trim();
      const content = document.getElementById('post-content').value.trim();
      const imageUrl = document.getElementById('post-image').value.trim();

      const body = {
        title,
        content,
        imageUrl: imageUrl || undefined
      };

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/posts\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          closePostModal();
          loadStorefrontPosts();
        } else {
          alert('خطأ أثناء نشر الإعلان الترويجي.');
        }
      } catch (err) {
        alert('حدث خطأ بالشبكة.');
      }
    }

    async function deleteStorefrontPost(postId) {
      if (!confirm('هل ترغب بحذف هذا المنشور؟')) return;
      try {
        const res = await fetch(\`\${API_URL}/life/locations/posts/\${postId}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (res.ok) {
          loadStorefrontPosts();
        }
      } catch (err) {
        alert('خطأ.');
      }
    }

    async function loadStorefrontPhotos() {
      const container = document.getElementById('sf-photos-list');
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column:span 2;">جاري تحميل الصور...</p>';

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/photos\`);
        const envelope = await res.json();
        const photos = envelope.data;

        if (photos.length === 0) {
          container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px; grid-column:span 2;">لم يتم إضافة صور للمعرض بعد.</p>';
          return;
        }

        container.innerHTML = photos.map(p => \`
          <div style="position:relative; border-radius:12px; overflow:hidden; border:1px solid var(--border-glass); aspect-ratio:4/3;">
            <img src="\${p.url}" style="width:100%; height:100%; object-fit:cover;">
            <div style="position:absolute; bottom:0; left:0; width:100%; background:rgba(0,0,0,0.6); padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.8rem; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${p.caption || ''}</span>
              <button class="action-btn danger" style="padding:4px 8px; font-size:0.75rem; background:rgba(225,29,72,0.3); border-color:transparent; color:white;" onclick="deleteStorefrontPhoto('\${p.id}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        container.innerHTML = '<p style="color:var(--accent-rose); text-align:center; grid-column:span 2;">خطأ في تحميل المعرض.</p>';
      }
    }

    function openAddPhotoModal() {
      document.getElementById('photo-url').value = '';
      document.getElementById('photo-caption').value = '';
      document.getElementById('photo-modal').style.display = 'flex';
    }

    function closePhotoModal() {
      document.getElementById('photo-modal').style.display = 'none';
    }

    async function submitPhotoForm(event) {
      event.preventDefault();
      const url = document.getElementById('photo-url').value.trim();
      const caption = document.getElementById('photo-caption').value.trim();

      const body = {
        url,
        caption: caption || undefined
      };

      try {
        const res = await fetch(\`\${API_URL}/life/locations/\${selectedLocationId}/photos\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          closePhotoModal();
          loadStorefrontPhotos();
        } else {
          alert('خطأ أثناء إضافة الصورة المعرض.');
        }
      } catch (err) {
        alert('حدث خطأ بالشبكة.');
      }
    }

    async function deleteStorefrontPhoto(photoId) {
      if (!confirm('هل ترغب بحذف هذه الصورة من المعرض؟')) return;
      try {
        const res = await fetch(\`\${API_URL}/life/locations/photos/\${photoId}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (res.ok) {
          loadStorefrontPhotos();
        }
      } catch (err) {
        alert('خطأ.');
      }
    }

    // ────────────────────── USERS TAB ──────────────────────

    async function fetchUsers() {
      const search = document.getElementById('users-search').value;

      try {
        const res = await fetch(\`\${API_URL}/admin-api/users?page=\${usersPage}&limit=10&q=\${search}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderUsersTable(result.data);
          document.getElementById('users-page-info').textContent = \`صفحة \${result.page} من \${result.totalPages || 1} (إجمالي الحسابات: \${result.total})\`;
          
          document.getElementById('users-prev-btn').disabled = result.page <= 1;
          document.getElementById('users-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderUsersTable(users) {
      const tbody = document.getElementById('users-table-body');
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">لا يوجد مستخدمين مسجلين بعد.</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(u => {
        let trustClass = 'high';
        if (u.trustScore < 40) trustClass = 'low';
        else if (u.trustScore < 80) trustClass = 'medium';

        return \`
          <tr>
            <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-muted); direction: ltr; text-align: right;">\${u.id.slice(0, 8)}...</td>
            <td style="font-weight: 600; color:var(--text-main); direction: ltr; text-align: right;">\${u.phoneNumber}</td>
            <td><span class="trust-pill \${trustClass}">\${u.trustScore} %</span></td>
            <td><span class="badge" style="background: rgba(0,0,0,0.05); color:var(--text-main);">\${u.role}</span></td>
            <td>\${u.listingsCount} إعلان</td>
            <td>\${u.offersCount} عرض</td>
            <td>\${u.kitchenSlug ? \`<code style="background: rgba(79, 70, 229, 0.08); color: var(--primary); padding: 2px 6px; border-radius: 4px; font-weight: 600;">\text-muted \${u.kitchenSlug}</code>\` : '<span style="color:var(--text-muted); font-size:0.85rem;">لا يوجد</span>'}</td>
            <td>\${u.disputesCount} شكوى</td>
            <td>\${new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
          </tr>
        \`;
      }).join('');
    }

    // ────────────────────── DISPUTES TAB ──────────────────────

    async function fetchDisputes() {
      const status = document.getElementById('disputes-filter-status').value;

      try {
        const res = await fetch(\`\${API_URL}/admin-api/souq/disputes?page=\${disputesPage}&limit=10&status=\${status}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderDisputesTable(result.data);
          document.getElementById('disputes-page-info').textContent = \`صفحة \${result.page} من \${result.totalPages || 1} (إجمالي البلاغات: \${result.total})\`;
          
          document.getElementById('disputes-prev-btn').disabled = result.page <= 1;
          document.getElementById('disputes-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderDisputesTable(disputes) {
      const tbody = document.getElementById('disputes-table-body');
      if (disputes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">لا توجد شكاوى أو نزاعات مسجلة.</td></tr>';
        return;
      }

      tbody.innerHTML = disputes.map(d => {
        let statusAr = 'مفتوح';
        if (d.status === 'RESOLVED') statusAr = 'تم الحل';
        else if (d.status === 'REJECTED') statusAr = 'مرفوض';

        return \`
          <tr>
            <td style="direction: ltr; text-align: right;">\${d.filedBy?.phoneNumber || 'غير معروف'}</td>
            <td style="direction: ltr; text-align: right;">\${d.against?.phoneNumber || 'غير معروف'}</td>
            <td>\${d.offer?.listing?.title || 'تم إزالة الإعلان'}</td>
            <td>\${d.offer?.amount} ج.م</td>
            <td><span style="font-weight: 600;">\text-muted \${d.reason}</span></td>
            <td>\${new Date(d.createdAt).toLocaleDateString('ar-EG')}</td>
            <td><span class="badge \${d.status.toLowerCase()}">\${statusAr}</span></td>
            <td>
              \${d.status === 'OPEN' ? \`
                <button class="action-btn" style="background: rgba(5, 150, 105, 0.1); color: var(--accent-emerald); border-color: rgba(5, 150, 105, 0.15);" onclick="openResolveModal('\${d.id}')">
                  <i class="fa-solid fa-check"></i> حل النزاع
                </button>
                <button class="action-btn danger" style="background: rgba(225, 29, 72, 0.1); color: var(--accent-rose); border-color: rgba(225, 29, 72, 0.15);" onclick="rejectDispute('\${d.id}')">
                  <i class="fa-solid fa-xmark"></i> رفض الشكوى
                </button>
              \` : \`<div style="font-size:0.85rem; color: var(--text-muted);">بواسطة: \text-muted \${d.resolvedBy?.phoneNumber || 'النظام'}</div>\`}
            </td>
          </tr>
        \`;
      }).join('');
    }

    function openResolveModal(disputeId) {
      document.getElementById('modal-dispute-id').value = disputeId;
      document.getElementById('resolution-text').value = '';
      document.getElementById('file-report-check').checked = false;
      document.getElementById('resolve-modal').style.display = 'flex';
    }

    function closeResolveModal() {
      document.getElementById('resolve-modal').style.display = 'none';
    }

    async function submitResolveDispute() {
      const id = document.getElementById('modal-dispute-id').value;
      const resolution = document.getElementById('resolution-text').value.trim();
      const fileReport = document.getElementById('file-report-check').checked;

      if (!resolution) return alert('الرجاء إدخال تفاصيل الحل والقرار.');

      try {
        const res = await fetch(\`\${API_URL}/disputes/\${id}/resolve\`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          },
          body: JSON.stringify({ resolution, fileReport })
        });

        if (res.ok) {
          closeResolveModal();
          fetchDisputes();
        } else {
          const data = await res.json();
          alert(data.message || 'فشل في إنهاء الشكوى.');
        }
      } catch (err) {
        alert('خطأ بالشبكة أثناء تسوية النزاع.');
      }
    }

    async function rejectDispute(id) {
      const reason = prompt('الرجاء كتابة سبب رفض هذه الشكوى:');
      if (reason === null) return;
      if (!reason.trim()) return alert('السبب مطلوب لرفض الشكوى.');

      try {
        const res = await fetch(\`\${API_URL}/disputes/\${id}/reject\`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          },
          body: JSON.stringify({ reason })
        });

        if (res.ok) {
          fetchDisputes();
        } else {
          const data = await res.json();
          alert(data.message || 'فشل في رفض الشكوى.');
        }
      } catch (err) {
        alert('خطأ بالشبكة أثناء رفض الشكوى.');
      }
    }

    // ────────────────────── EXPRESS COURIERS & DELIVERIES ──────────────────────
    let expressCouriersPage = 1;
    let expressDeliveriesPage = 1;
    const expressLimit = 10;

    async function fetchExpressCouriers() {
      const statusFilter = document.getElementById('express-couriers-filter-status').value;
      const searchVal = document.getElementById('express-couriers-search').value.trim();

      try {
        const url = API_URL + '/admin-api/express/couriers?page=' + expressCouriersPage + '&limit=' + expressLimit + '&status=' + statusFilter + '&q=' + encodeURIComponent(searchVal);
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const envelope = await res.json();
        
        if (res.ok) {
          const tbody = document.getElementById('express-couriers-table-body');
          tbody.innerHTML = '';

          const couriers = envelope.data.items || [];
          const total = envelope.data.total || 0;

          document.getElementById('express-couriers-page-info').textContent = 
            'يتم عرض ' + (total > 0 ? (expressCouriersPage - 1) * expressLimit + 1 : 0) + ' - ' + Math.min(expressCouriersPage * expressLimit, total) + ' من أصل ' + total + ' كابتن';

          if (couriers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">لا يوجد كباتن بهذه المواصفات حالياً.</td></tr>';
            return;
          }

                    const vehicleNames = {
            BICYCLE: "دراجة هوائية",
            MOTORCYCLE: "دراجة نارية",
            SCOOTER: "سكوتر",
            CAR: "سيارة",
            WALKING: "مشياً على الأقدام"
          };

                    const statuses = {
            PENDING: '<span class="badge" style="background-color: var(--primary); color: #0f172a; padding: 4px 8px; border-radius: 6px; font-weight: 700;">بانتظار التفعيل</span>',
            APPROVED: '<span class="badge" style="background-color: var(--accent-emerald); color: white; padding: 4px 8px; border-radius: 6px; font-weight: 700;">نشط ومفعل</span>',
            REJECTED: '<span class="badge" style="background-color: var(--accent-rose); color: white; padding: 4px 8px; border-radius: 6px; font-weight: 700;">مرفوض</span>'
          };

          couriers.forEach(c => {
            const date = new Date(c.createdAt).toLocaleDateString('ar-EG');
            
            let actions = '';
            if (c.status === 'PENDING') {
              actions = '<button class="action-btn" style="background: var(--accent-emerald); border-color: var(--accent-emerald); color: white; padding: 4px 8px; font-size: 0.8rem;" onclick="approveCourier(\\\'' + c.id + '\\\')"><i class="fa-solid fa-check"></i> تفعيل</button> ' +
                '<button class="action-btn" style="background: var(--accent-rose); border-color: var(--accent-rose); color: white; padding: 4px 8px; font-size: 0.8rem;" onclick="rejectCourier(\\\'' + c.id + '\\\')"><i class="fa-solid fa-xmark"></i> رفض</button>';
            } else if (c.status === 'APPROVED') {
              actions = '<button class="action-btn" style="background: var(--accent-rose); border-color: var(--accent-rose); color: white; padding: 4px 8px; font-size: 0.8rem;" onclick="rejectCourier(\\\'' + c.id + '\\\')"><i class="fa-solid fa-ban"></i> تعطيل</button>';
            } else if (c.status === 'REJECTED') {
              actions = '<button class="action-btn" style="background: var(--accent-emerald); border-color: var(--accent-emerald); color: white; padding: 4px 8px; font-size: 0.8rem;" onclick="approveCourier(\\\'' + c.id + '\\\')"><i class="fa-solid fa-check"></i> تفعيل</button>';
            }

            tbody.innerHTML += \`
              <tr>
                <td style="font-weight: 700;">\${c.name}</td>
                <td style="direction: ltr; text-align: right;">\${c.phone}</td>
                <td>\${c.nationalId}</td>
                <td>\${vehicleNames[c.vehicleType] || c.vehicleType}</td>
                <td>\${statuses[c.status] || c.status}</td>
                <td>\${c.isOnline ? '<span style="color: var(--accent-emerald); font-weight: 700;"><i class="fa-solid fa-circle"></i> متصل</span>' : '<span style="color: var(--text-muted);"><i class="fa-solid fa-circle-notch"></i> غير متصل</span>'}</td>
                <td>\${date}</td>
                <td><div style="display: flex; gap: 5px;">\${actions}</div></td>
              </tr>
            \`;
          });
        }
      } catch (err) {
        console.error('Error fetching couriers:', err);
      }
    }

    async function approveCourier(id) {
      if (!confirm('هل أنت متأكد من تفعيل وتعميد هذا الكابتن لتوصيل الطلبات؟')) return;
      try {
        const res = await fetch(API_URL + '/admin-api/express/couriers/' + id + '/approve', {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          fetchExpressCouriers();
        } else {
          alert('فشل تفعيل الكابتن.');
        }
      } catch (err) {
        alert('خطأ في الشبكة.');
      }
    }

    async function rejectCourier(id) {
      if (!confirm('هل أنت متأكد من رفض/تعطيل عضوية هذا الكابتن؟')) return;
      try {
        const res = await fetch(API_URL + '/admin-api/express/couriers/' + id + '/reject', {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          fetchExpressCouriers();
        } else {
          alert('فشل تعطيل الكابتن.');
        }
      } catch (err) {
        alert('خطأ في الشبكة.');
      }
    }

    function changeExpressCouriersPage(direction) {
      expressCouriersPage += direction;
      if (expressCouriersPage < 1) expressCouriersPage = 1;
      fetchExpressCouriers();
    }

    async function fetchExpressDeliveries() {
      const statusFilter = document.getElementById('express-deliveries-filter-status').value;

      try {
        const url = API_URL + '/admin-api/express/deliveries?page=' + expressDeliveriesPage + '&limit=' + expressLimit + '&status=' + statusFilter;
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const envelope = await res.json();

        if (res.ok) {
          const tbody = document.getElementById('express-deliveries-table-body');
          tbody.innerHTML = '';

          const deliveries = envelope.data.items || [];
          const total = envelope.data.total || 0;

          document.getElementById('express-deliveries-page-info').textContent = 
            'يتم عرض ' + (total > 0 ? (expressDeliveriesPage - 1) * expressLimit + 1 : 0) + ' - ' + Math.min(expressDeliveriesPage * expressLimit, total) + ' من أصل ' + total + ' طلب';

          if (deliveries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">لا توجد طلبات توصيل حالياً.</td></tr>';
            return;
          }

          const statuses = {
            PENDING: '<span class="badge" style="background-color: var(--primary); color: #0f172a; padding: 4px 8px; border-radius: 6px;">جاري البحث عن كابتن</span>',
            ACCEPTED: '<span class="badge" style="background-color: #3b82f6; color: white; padding: 4px 8px; border-radius: 6px;">تم قبول الطلب</span>',
            PICKED_UP: '<span class="badge" style="background-color: #f59e0b; color: white; padding: 4px 8px; border-radius: 6px;">تم الاستلام (جاري التوصيل)</span>',
            DELIVERED: '<span class="badge" style="background-color: var(--accent-emerald); color: white; padding: 4px 8px; border-radius: 6px;">تم التوصيل بنجاح</span>',
            CANCELLED: '<span class="badge" style="background-color: var(--accent-rose); color: white; padding: 4px 8px; border-radius: 6px;">ملغي</span>'
          };

          deliveries.forEach(d => {
            const date = new Date(d.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            
            tbody.innerHTML += '<tr style="border-bottom: 1px solid #f1f5f9;">' +
              '<td style="font-weight: 700; font-size: 0.85rem; font-family: monospace;">' + d.id.slice(0, 8) + '...</td>' +
              '<td>' + d.kitchenName + '</td>' +
              '<td style="color: var(--primary); font-weight: 600;">' + d.deliveryPoint + '</td>' +
              '<td>' + d.recipientName + ' (' + d.recipientPhone + ')</td>' +
              '<td>' + (d.courierName ? (d.courierName + ' (' + d.courierPhone + ')') : '<span style="color: var(--text-muted);">لم يحدد بعد</span>') + '</td>' +
              '<td>' + (statuses[d.status] || d.status) + '</td>' +
              '<td>' + date + '</td>' +
              '</tr>';
          });
        }
      } catch (err) {
        console.error('Error fetching deliveries:', err);
      }
    }

    function changeExpressDeliveriesPage(direction) {
      expressDeliveriesPage += direction;
      if (expressDeliveriesPage < 1) expressDeliveriesPage = 1;
      fetchExpressDeliveries();
    }

    // ────────────────────── UTILS & FILTER SETUP ──────────────────────

    function setupFilters() {
      document.getElementById('listing-search').addEventListener('input', debounce(() => {
        listingsPage = 1;
        fetchListings();
      }, 300));

      document.getElementById('listing-filter-status').addEventListener('change', () => {
        listingsPage = 1;
        fetchListings();
      });

      document.getElementById('listing-filter-category').addEventListener('change', () => {
        listingsPage = 1;
        fetchListings();
      });

      const categories = [
        { en: 'FURNITURE', ar: 'الأثاث والمنزل' },
        { en: 'ELECTRONICS', ar: 'الأجهزة الإلكترونية' },
        { en: 'APPLIANCES', ar: 'الأجهزة المنزلية' },
        { en: 'FASHION', ar: 'الملابس والأزياء' },
        { en: 'KIDS_TOYS', ar: 'ألعاب الأطفال' },
        { en: 'KIDS_CLOTHING', ar: 'ملابس الأطفال' },
        { en: 'KIDS_GEAR', ar: 'مستلزمات الأطفال' },
        { en: 'BOOKS_MEDIA', ar: 'الكتب والوسائط' },
        { en: 'SPORTS_OUTDOOR', ar: 'الأدوات الرياضية' },
        { en: 'HOME_DECOR', ar: 'الديكور والمنزل' },
        { en: 'KITCHEN_DINING', ar: 'أدوات المطبخ' },
        { en: 'BABY_MATERNITY', ar: 'مستلزمات الأم والطفل' },
        { en: 'MOBILE_TABLETS', ar: 'الهواتف والأجهزة اللوحية' },
        { en: 'VINTAGE_COLLECTIBLES', ar: 'التحف والمقتنيات' },
        { en: 'MOVING_BUNDLE', ar: 'حقائب سفر وأغراض ترحيل' },
        { en: 'OTHER', ar: 'أخرى' }
      ];
      const catSelect = document.getElementById('listing-filter-category');
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.en;
        opt.textContent = c.ar;
        catSelect.appendChild(opt);
      });

      document.getElementById('kitchens-search').addEventListener('input', debounce(() => {
        kitchensPage = 1;
        fetchKitchens();
      }, 300));

      document.getElementById('kitchens-filter-status').addEventListener('change', () => {
        kitchensPage = 1;
        fetchKitchens();
      });

      document.getElementById('life-search').addEventListener('input', debounce(() => {
        fetchLifeTree();
      }, 300));

      document.getElementById('users-search').addEventListener('input', debounce(() => {
        usersPage = 1;
        fetchUsers();
      }, 300));

      document.getElementById('disputes-filter-status').addEventListener('change', () => {
        disputesPage = 1;
        fetchDisputes();
      });

      document.getElementById('listings-prev-btn').addEventListener('click', () => {
        if (listingsPage > 1) { listingsPage--; fetchListings(); }
      });
      document.getElementById('listings-next-btn').addEventListener('click', () => {
        listingsPage++; fetchListings();
      });

      document.getElementById('kitchens-prev-btn').addEventListener('click', () => {
        if (kitchensPage > 1) { kitchensPage--; fetchKitchens(); }
      });
      document.getElementById('kitchens-next-btn').addEventListener('click', () => {
        kitchensPage++; fetchKitchens();
      });

      document.getElementById('users-prev-btn').addEventListener('click', () => {
        if (usersPage > 1) { usersPage--; fetchUsers(); }
      });
      document.getElementById('users-next-btn').addEventListener('click', () => {
        usersPage++; fetchUsers();
      });

      document.getElementById('disputes-prev-btn').addEventListener('click', () => {
        if (disputesPage > 1) { disputesPage--; fetchDisputes(); }
      });
      document.getElementById('disputes-next-btn').addEventListener('click', () => {
        disputesPage++; fetchDisputes();
      });
    }

    function debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
            // ────────────────────── INTERACTIVE MAP OPERATIONS ──────────────────────

    let mappingLocationId = null;
    let mapSidebarTab = 'mapped'; // 'mapped' | 'unmapped'
    
    // Polygon drawing states
    let polygonDrawingMode = false;
    let polygonLocId = null;
    let drawingPolygonCoords = [];
    let drawingPolygonInstance = null;
    let drawingMarkers = [];

    async function initInteractiveMap() {
      // Set active switcher selection
      const switcher = document.getElementById('workspace-switcher');
      if (switcher) switcher.value = 'life';

      try {
        const res = await fetch(API_URL + '/life/locations', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const envelope = await res.json();
        allLifeLocations = envelope.data || [];

        // Initialize Leaflet Map centered on real-world Madinty
        initLeafletMapContainer();

        renderMapLocationsList();
        renderMapPins();
      } catch (err) {
        console.error('Error loading interactive map:', err);
        if (window.showDebugError) {
          window.showDebugError('Error loading interactive map', err);
        }
      }
    }

    function initLeafletMapContainer() {
      if (!leafletMap) {
        // Madinty Egypt Coordinates: Lat 30.0963, Lng 31.6288
        leafletMap = L.map('madinty-map-interactive-container').setView([30.0963, 31.6288], 13);
        
        // Add CartoDB Voyager tile layer (clean light theme, bypasses OSM referer policy blocks)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(leafletMap);

        leafletMap.on('click', (e) => {
          handleLeafletMapClick(e);
        });

        leafletMap.on('contextmenu', (e) => {
          handleLeafletMapRightClick(e);
        });
      } else {
        // Force Leaflet to recalculate container size in case tab switching hid it
        setTimeout(() => {
          leafletMap.invalidateSize();
        }, 100);
      }
    }

    function renderMapLocationsList() {
      const container = document.getElementById('map-locations-list');
      const searchVal = document.getElementById('map-location-search').value.toLowerCase().trim();

      // Mapped vs Unmapped split
      const isMappedTab = mapSidebarTab === 'mapped';
      const filteredList = allLifeLocations.filter(loc => {
        if (loc.type === 'CITY') return false; // Hide root city
        const hasCoords = typeof loc.latitude === 'number' && typeof loc.longitude === 'number';
        if (isMappedTab !== hasCoords) return false;

        const name = (loc.nameAr || loc.name || '').toLowerCase();
        const type = (loc.type || '').toLowerCase();
        return name.includes(searchVal) || type.includes(searchVal);
      });

      if (filteredList.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 20px;">لا توجد منشآت مطابقة.</p>';
        return;
      }

      container.innerHTML = filteredList.map(loc => {
        const name = loc.nameAr || loc.name;
        const typeText = getTypeText(loc.type);
        const isSelected = selectedMapLocationId === loc.id;
        
        if (isMappedTab) {
          // Mapped places list
          return \`
            <div class="zone-list-item \${isSelected ? 'selected' : ''}" onclick="selectLocationOnMap('\${loc.id}')">
              <div style="display:flex; align-items:center; gap: 8px;">
                <span class="zone-badge" style="background:var(--primary); color:white; font-size:0.75rem; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center;">
                  <i class="fa-solid fa-location-dot"></i>
                </span>
                <div>
                  <div style="font-weight:700; font-size:0.9rem;">\${name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:'Outfit';">\${loc.type}</div>
                </div>
              </div>
              <span class="badge \${loc.type.toLowerCase()}" style="font-size:0.75rem; padding:2px 6px;">\${typeText}</span>
            </div>
          \`;
        } else {
          // Unmapped places list with "Plot on Map" button
          const isMappingThis = mappingLocationId === loc.id;
          return \`
            <div class="zone-list-item" style="flex-direction:column; align-items:stretch; gap:10px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:700; font-size:0.9rem;">\${name}</div>
                  <span class="badge \${loc.type.toLowerCase()}" style="font-size:0.7rem; padding:2px 6px;">\${typeText}</span>
                </div>
                <button class="action-btn" onclick="startMappingLocation('\${loc.id}', '\${name}')" style="background:\${isMappingThis ? 'var(--accent-emerald)' : 'var(--primary)'}; color:white; border-color:\${isMappingThis ? 'var(--accent-emerald)' : 'var(--primary)'}; font-size:0.78rem; font-weight:700; padding:4px 8px;">
                  <i class="fa-solid fa-map-pin"></i> \${isMappingThis ? 'جاري التحديد...' : 'تحديد الموقع'}
                </button>
              </div>
            </div>
          \`;
        }
      }).join('');
    }

    function switchMapSidebarTab(tab) {
      mapSidebarTab = tab;
      document.getElementById('btn-map-tab-mapped').classList.toggle('active', tab === 'mapped');
      document.getElementById('btn-map-tab-unmapped').classList.toggle('active', tab === 'unmapped');
      renderMapLocationsList();
    }

    function filterMapLocations() {
      renderMapLocationsList();
    }

    function renderMapPins() {
      if (!leafletMap) return;

      // Clear existing markers from map
      for (let id in leafletMarkers) {
        leafletMap.removeLayer(leafletMarkers[id]);
      }
      leafletMarkers = {};

      // Clear existing polygons from map
      for (let id in leafletPolygons) {
        leafletMap.removeLayer(leafletPolygons[id]);
      }
      leafletPolygons = {};

      // Render saved polygons
      allLifeLocations.forEach(loc => {
        if (loc.metadata && loc.metadata.polygonCoords && loc.metadata.polygonCoords.length > 0) {
          const isSelected = selectedMapLocationId === loc.id;
          let polyColor = '#ef4444'; // Red default
          if (loc.type === 'MALL') polyColor = '#4f46e5'; // Indigo
          else if (loc.type === 'PARK') polyColor = '#059669'; // Emerald
          else if (loc.type === 'SERVICE_AREA') polyColor = '#ea580c'; // Orange

          const polygon = L.polygon(loc.metadata.polygonCoords, {
            color: polyColor,
            fillColor: polyColor,
            fillOpacity: isSelected ? 0.35 : 0.15,
            weight: isSelected ? 4 : 2
          }).addTo(leafletMap);

          polygon.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            selectLocationOnMap(loc.id);
          });

          polygon.bindTooltip(loc.nameAr || loc.name, {
            sticky: true,
            direction: 'center'
          });

          leafletPolygons[loc.id] = polygon;
        }
      });

      allLifeLocations.forEach(loc => {
        if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return;

        const isSelected = selectedMapLocationId === loc.id;
        
        let markerColor = '#0891b2'; // Cyan (Madinty Life)
        let iconHtml = '<i class="fa-solid fa-location-dot"></i>';

        if (loc.type === 'MALL') {
          markerColor = '#4f46e5'; // Indigo
          iconHtml = '<i class="fa-solid fa-bag-shopping"></i>';
        } else if (loc.type === 'PARK') {
          markerColor = '#059669'; // Emerald
          iconHtml = '<i class="fa-solid fa-tree"></i>';
        } else if (loc.type === 'SERVICE_AREA') {
          markerColor = '#ea580c'; // Orange
          iconHtml = '<i class="fa-solid fa-gears"></i>';
        } else if (loc.type === 'STORE') {
          markerColor = '#0891b2'; // Cyan
          iconHtml = '<i class="fa-solid fa-store"></i>';
        } else if (loc.type === 'STREET') {
          markerColor = '#64748b'; // Slate
          iconHtml = '<i class="fa-solid fa-road"></i>';
        }

        const markerIcon = L.divIcon({
          html: \`<div class="map-marker-leaflet \${isSelected ? 'active' : ''}" style="background: \${markerColor}; color: white; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; box-shadow: 0 0 0 3px white, 0 3px 8px rgba(0,0,0,0.3); font-size: 0.85rem;">\${iconHtml}</div>\`,
          className: \`custom-leaflet-icon-wrap \${isSelected ? 'active' : ''}\`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([loc.latitude, loc.longitude], {
          icon: markerIcon,
          draggable: mapEditMode
        }).addTo(leafletMap);

        // Bind hover tooltip with place name
        marker.bindTooltip(loc.nameAr || loc.name, {
          direction: 'top',
          offset: [0, -10]
        });

        // Click handler
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          selectLocationOnMap(loc.id);
        });

        // Dragend handler
        marker.on('dragend', async (e) => {
          const newPos = marker.getLatLng();
          await updateLocationCoords(loc.id, newPos.lat, newPos.lng);
        });

        const hasPolygon = loc.metadata && loc.metadata.polygonCoords && loc.metadata.polygonCoords.length > 0;
        const polyButton = hasPolygon 
          ? \`<button class="action-btn" style="padding:4px 8px; font-size:0.75rem; background:#4f46e5; border-color:#4f46e5; color:white;" onclick="event.stopPropagation(); window.startEditingPolygon('\${loc.id}')" title="تعديل أبعاد المنطقة">
              <i class="fa-solid fa-draw-polygon"></i> تعديل الأبعاد
             </button>
             <button class="action-btn danger" style="padding:4px 8px; font-size:0.75rem; background:#ef4444; border-color:#ef4444; color:white;" onclick="event.stopPropagation(); window.deletePolygonDimensions('\${loc.id}')" title="حذف أبعاد المنطقة">
              <i class="fa-solid fa-draw-polygon"></i> مسح الأبعاد
             </button>\`
          : \`<button class="action-btn" style="padding:4px 8px; font-size:0.75rem; background:#4f46e5; border-color:#4f46e5; color:white;" onclick="event.stopPropagation(); window.startDrawingPolygon('\${loc.id}')" title="تحديد أبعاد المنطقة على الخريطة">
              <i class="fa-solid fa-draw-polygon"></i> رسم الأبعاد
             </button>\`;

        const popupContent = \`
          <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; min-width: 220px; padding: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:6px;">
              <strong style="font-size: 0.95rem; color: var(--text-main);">\${loc.nameAr || loc.name}</strong>
              <span class="badge \${loc.type.toLowerCase()}" style="font-size: 0.7rem; padding: 2px 6px;">\${getTypeText(loc.type)}</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">\${loc.descriptionAr || loc.description || 'لا يوجد وصف متاح'}</p>
            <div style="display: flex; gap: 6px; justify-content: flex-end; border-top: 1px dashed rgba(0,0,0,0.06); padding-top: 8px; flex-wrap: wrap;">
              \${polyButton}
              <button class="action-btn" style="padding:4px 8px; font-size:0.75rem;" onclick="event.stopPropagation(); window.editLocationFromMap('\${loc.id}')">
                <i class="fa-solid fa-pencil"></i> تعديل
              </button>
              <button class="action-btn danger" style="padding:4px 8px; font-size:0.75rem;" onclick="event.stopPropagation(); window.deleteLocationFromMap('\${loc.id}')">
                <i class="fa-solid fa-trash-can"></i> حذف
              </button>
            </div>
          </div>
        \`;
        marker.bindPopup(popupContent);

        leafletMarkers[loc.id] = marker;
      });
    }

    function selectLocationOnMap(locId) {
      selectedMapLocationId = locId;

      // Update sidebar highlight
      document.querySelectorAll('.zone-list-item').forEach(item => item.classList.remove('selected'));
      renderMapLocationsList();

      const marker = leafletMarkers[locId];
      if (marker) {
        const latlng = marker.getLatLng();
        leafletMap.setView(latlng, leafletMap.getZoom() < 15 ? 15 : leafletMap.getZoom());
        marker.openPopup();
      }
    }

    function startMappingLocation(locId, locName) {
      mappingLocationId = locId;
      document.getElementById('mapping-loc-name').textContent = locName;
      document.getElementById('map-mapping-alert').style.display = 'flex';
      
      // Highlight selection in list
      renderMapLocationsList();
    }

    function cancelMappingLocation() {
      mappingLocationId = null;
      document.getElementById('map-mapping-alert').style.display = 'none';
      renderMapLocationsList();
    }

    function createVertexMarker(coord, idx) {
      const handleIcon = L.divIcon({
        html: '<div style="background: #ef4444; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>',
        className: 'vertex-drag-handle',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
      
      const m = L.marker(coord, {
        icon: handleIcon,
        draggable: true
      }).addTo(leafletMap);
      
      m.on('drag', (e) => {
        const newPos = m.getLatLng();
        drawingPolygonCoords[idx] = [newPos.lat, newPos.lng];
        if (drawingPolygonInstance) {
          drawingPolygonInstance.setLatLngs(drawingPolygonCoords);
        }
      });
      
      m.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        m.remove();
        drawingPolygonCoords.splice(idx, 1);
        if (drawingPolygonInstance) {
          drawingPolygonInstance.setLatLngs(drawingPolygonCoords);
        }
        rebuildVertexMarkers();
      });
      
      drawingMarkers.push(m);
    }

    function rebuildVertexMarkers() {
      drawingMarkers.forEach(m => leafletMap.removeLayer(m));
      drawingMarkers = [];
      drawingPolygonCoords.forEach((coord, idx) => {
        createVertexMarker(coord, idx);
      });
    }

    function handleLeafletMapClick(e) {
      const latlng = e.latlng;

      if (polygonDrawingMode) {
        drawingPolygonCoords.push([latlng.lat, latlng.lng]);
        
        // Render vertex draggable marker handle
        const idx = drawingPolygonCoords.length - 1;
        createVertexMarker([latlng.lat, latlng.lng], idx);
        
        // Render or update polygon path
        if (drawingPolygonInstance) {
          drawingPolygonInstance.setLatLngs(drawingPolygonCoords);
        } else {
          drawingPolygonInstance = L.polygon(drawingPolygonCoords, {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.25,
            weight: 3
          }).addTo(leafletMap);
        }
        return;
      }

      if (mappingLocationId) {
        // We are placing an existing unmapped location
        updateLocationCoords(mappingLocationId, latlng.lat, latlng.lng);
        document.getElementById('map-mapping-alert').style.display = 'none';
        mappingLocationId = null;
      } else if (mapEditMode) {
        // We are adding a brand new location
        openAddLocationModal();
        document.getElementById('loc-lat').value = latlng.lat.toFixed(6);
        document.getElementById('loc-lng').value = latlng.lng.toFixed(6);
      }
    }

    async function updateLocationCoords(locId, lat, lng) {
      try {
        const res = await fetch(API_URL + '/life/locations/' + locId, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6))
          })
        });

        if (res.ok) {
          // Re-fetch tree & map
          fetchLifeTree();
          initInteractiveMap();
        } else {
          alert('فشل تحديث إحداثيات الموقع.');
        }
      } catch (err) {
        console.error('Error updating coords:', err);
      }
    }

    // Attach map popup handlers to global window object
    window.deleteLocationFromMap = function(id) {
      if (confirm('هل أنت متأكد من رغبتك في حذف هذا الموقع نهائياً؟')) {
        deleteLocation(id);
      }
    };
    window.editLocationFromMap = function(id) {
      editLocation(id);
    };

    window.toggleMapEditMode = function() {
      mapEditMode = !mapEditMode;
      const btn = document.getElementById('map-edit-toggle-btn');
      if (!btn) return;

      if (mapEditMode) {
        btn.innerHTML = \`<i class="fa-solid fa-check"></i> إنهاء تعديل المواقع\`;
        btn.style.background = 'var(--accent-emerald, #10b981)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--accent-emerald, #10b981)';

        // Make all markers draggable
        Object.values(leafletMarkers).forEach(marker => {
          if (marker && marker.dragging) {
            marker.dragging.enable();
          }
        });

        alert('وضع تعديل المواقع نشط. يمكنك الآن سحب وإفلات المؤشرات لتغيير أماكنها.');
      } else {
        btn.innerHTML = \`<i class="fa-solid fa-arrows-to-dot"></i> تعديل مواقع المؤشرات\`;
        btn.style.background = 'rgba(0,0,0,0.03)';
        btn.style.color = 'var(--text-main)';
        btn.style.borderColor = 'rgba(15,23,42,0.1)';

        // Disable drag on all markers
        Object.values(leafletMarkers).forEach(marker => {
          if (marker && marker.dragging) {
            marker.dragging.disable();
          }
        });

        alert('تم إغلاق وضع التعديل وحفظ المواقع الجغرافية الجديدة.');
      }
    };

    function getTypeText(type) {
      if (type === 'CITY') return 'مدينة';
      if (type === 'DISTRICT') return 'حي';
      if (type === 'BLOCK') return 'بلوك';
      if (type === 'GROUP') return 'مجموعة';
      if (type === 'PARK') return 'حديقة';
      if (type === 'BUILDING') return 'عمارة';
      if (type === 'MALL') return 'مول';
      if (type === 'STORE') return 'متجر';
      if (type === 'SERVICE_AREA') return 'منطقة خدمات';
      if (type === 'STREET') return 'شارع';
      return type;
    }

    function handleLeafletMapRightClick(e) {
      // Prevent browser default context menu
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
      }
      
      const latlng = e.latlng;
      openAddLocationModal('', '');
      
      // Update coordinates inputs
      document.getElementById('loc-lat').value = latlng.lat.toFixed(6);
      document.getElementById('loc-lng').value = latlng.lng.toFixed(6);
      document.getElementById('location-modal-title').textContent = 'إضافة موقع جديد عند النقطة المحددة';
    }

    // ────────────────────── POLYGON DRAWING OPERATIONS ──────────────────────

    window.startDrawingPolygon = function(locId) {
      const loc = allLifeLocations.find(l => l.id === locId);
      if (!loc) return;
      
      // Close open popup
      if (leafletMap) leafletMap.closePopup();
      
      polygonDrawingMode = true;
      polygonLocId = locId;
      drawingPolygonCoords = [];
      
      // Clear previous drawing layers if any
      drawingMarkers.forEach(m => leafletMap.removeLayer(m));
      drawingMarkers = [];
      if (drawingPolygonInstance) {
        leafletMap.removeLayer(drawingPolygonInstance);
        drawingPolygonInstance = null;
      }
      
      document.getElementById('polygon-loc-name').textContent = loc.nameAr || loc.name;
      document.getElementById('map-polygon-alert').style.display = 'flex';
      
      // Cancel pin placement mode if active
      if (mappingLocationId) {
        cancelMappingLocation();
      }
    };

    window.startEditingPolygon = function(locId) {
      const loc = allLifeLocations.find(l => l.id === locId);
      if (!loc || !loc.metadata || !loc.metadata.polygonCoords) return;
      
      // Close open popup
      if (leafletMap) leafletMap.closePopup();
      
      polygonDrawingMode = true;
      polygonLocId = locId;
      
      // Clear previous drawing layers if any
      drawingMarkers.forEach(m => leafletMap.removeLayer(m));
      drawingMarkers = [];
      if (drawingPolygonInstance) {
        leafletMap.removeLayer(drawingPolygonInstance);
        drawingPolygonInstance = null;
      }
      
      // Load existing coordinates
      drawingPolygonCoords = [...loc.metadata.polygonCoords];
      
      document.getElementById('polygon-loc-name').textContent = loc.nameAr || loc.name;
      document.getElementById('map-polygon-alert').style.display = 'flex';
      
      // Draw the editable polygon
      drawingPolygonInstance = L.polygon(drawingPolygonCoords, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        weight: 3
      }).addTo(leafletMap);
      
      // Render draggable marker handles for each coordinate
      drawingPolygonCoords.forEach((coord, idx) => {
        createVertexMarker(coord, idx);
      });
      
      // Zoom to polygon bounds
      if (drawingPolygonInstance) {
        leafletMap.fitBounds(drawingPolygonInstance.getBounds());
      }
      
      // Cancel pin placement mode if active
      if (mappingLocationId) {
        cancelMappingLocation();
      }
    };

    window.resetPolygonDrawing = function() {
      drawingMarkers.forEach(m => leafletMap.removeLayer(m));
      drawingMarkers = [];
      if (drawingPolygonInstance) {
        leafletMap.removeLayer(drawingPolygonInstance);
        drawingPolygonInstance = null;
      }
      drawingPolygonCoords = [];
    };

    window.cancelPolygonDrawing = function() {
      resetPolygonDrawing();
      polygonDrawingMode = false;
      polygonLocId = null;
      document.getElementById('map-polygon-alert').style.display = 'none';
    };

    window.savePolygonDimensions = async function() {
      if (drawingPolygonCoords.length < 3) {
        alert('يرجى تحديد 3 نقاط على الأقل لرسم أبعاد المنطقة.');
        return;
      }
      
      const loc = allLifeLocations.find(l => l.id === polygonLocId);
      if (!loc) return;
      
      const currentMeta = loc.metadata || {};
      const updatedMeta = { ...currentMeta, polygonCoords: drawingPolygonCoords };
      
      try {
        const res = await fetch(API_URL + '/life/locations/' + polygonLocId, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            metadata: updatedMeta
          })
        });
        
        if (res.ok) {
          cancelPolygonDrawing();
          fetchLifeTree();
          initInteractiveMap();
        } else {
          alert('فشل حفظ أبعاد المنطقة.');
        }
      } catch (err) {
        console.error('Error saving polygon:', err);
      }
    };

    window.deletePolygonDimensions = async function(locId) {
      if (!confirm('هل أنت متأكد من رغبتك في حذف أبعاد هذه المنطقة؟')) return;
      const loc = allLifeLocations.find(l => l.id === locId);
      if (!loc) return;
      
      const currentMeta = loc.metadata || {};
      delete currentMeta.polygonCoords;
      
      try {
        const res = await fetch(API_URL + '/life/locations/' + locId, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            metadata: currentMeta
          })
        });
        
        if (res.ok) {
          if (leafletMap) leafletMap.closePopup();
          fetchLifeTree();
          initInteractiveMap();
        } else {
          alert('فشل حذف أبعاد المنطقة.');
        }
      } catch (err) {
        console.error('Error deleting polygon:', err);
      }
    };

  </script>
</body>
</html>
`;
