export function getCourierPortalHtml(apiBaseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>مدينتي Express — بوابة الكابتن</title>
  
  <!-- Fonts & Icons -->
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <style>
    :root {
      --primary: #f59e0b; /* Golden Yellow for Express Speed */
      --primary-hover: #d97706;
      --bg-dark: #090e1a;
      --panel-dark: #131b2e;
      --border-dark: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #64748b;
      --emerald: #10b981;
      --rose: #ef4444;
      --font-cairo: 'Cairo', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--font-cairo);
      -webkit-tap-highlight-color: transparent;
    }

    body {
      background-color: #05070f;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }

    /* Mobile Shell Simulator for Desktop */
    .app-container {
      width: 100%;
      height: 100vh;
      max-width: 430px; /* Standard smartphone width */
      max-height: 900px; /* Standard smartphone height */
      background-color: var(--bg-dark);
      border: 1.5px solid var(--border-dark);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      border-radius: 40px; /* Premium rounded corner like modern iPhone */
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Reset shell simulator on mobile screens */
    @media (max-width: 480px) {
      .app-container {
        max-width: 100%;
        max-height: 100vh;
        border: none;
        border-radius: 0;
        box-shadow: none;
        height: 100vh;
      }
    }

    /* Premium Header */
    header {
      background-color: rgba(19, 27, 46, 0.85);
      backdrop-filter: blur(10px);
      border-bottom: 1.5px solid var(--border-dark);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      flex-shrink: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--primary);
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
    }

    .brand i {
      font-size: 1.5rem;
    }

    /* Connection Status Ring on Header */
    .header-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(255,255,255,0.03);
      padding: 5px 12px;
      border-radius: 15px;
      border: 1px solid var(--border-dark);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--text-muted);
    }

    .status-dot.active {
      background-color: var(--emerald);
      box-shadow: 0 0 8px var(--emerald);
      animation: pulse-dot 1.5s infinite;
    }

    @keyframes pulse-dot {
      0% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 0.6; }
    }

    /* Content Area */
    main {
      flex-grow: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Screen Styles */
    .screen {
      display: none;
      flex-direction: column;
      height: 100%;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .screen.active {
      display: flex;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .panel {
      background-color: var(--panel-dark);
      border: 1px solid var(--border-dark);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
    }

    /* Form UI */
    .form-logo {
      width: 70px;
      height: 70px;
      background: rgba(245, 158, 11, 0.15);
      color: var(--primary);
      border-radius: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2.2rem;
      margin: 10px auto 20px auto;
    }

    .form-title {
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: 8px;
      text-align: center;
      color: var(--text-main);
    }

    .form-subtitle {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-bottom: 25px;
      text-align: center;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-main);
    }

    .input-field {
      width: 100%;
      background-color: rgba(9, 14, 26, 0.6);
      border: 1.5px solid var(--border-dark);
      color: white;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
      font-weight: 600;
    }

    .input-field:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
      background-color: rgba(9, 14, 26, 0.8);
    }

    .btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
      color: #090e1a;
      border: none;
      padding: 15px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
    }

    .btn-secondary {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      border: 1.5px solid var(--border-dark);
      padding: 14px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--text-muted);
      transform: translateY(-2px);
    }

    .btn-secondary:active {
      transform: translateY(0);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    select.input-field {
      appearance: none;
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: left 12px center;
      background-size: 16px;
      padding-left: 40px;
    }

    /* Wait & Status Screens */
    .status-panel {
      text-align: center;
      padding: 40px 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .status-icon {
      font-size: 4.5rem;
      margin-bottom: 25px;
    }

    .status-icon.pending {
      color: var(--primary);
      animation: pulse 2s infinite;
    }

    .status-icon.rejected {
      color: var(--rose);
      animation: shake-error 0.5s ease-in-out;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 0.8; }
    }

    @keyframes shake-error {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }

    /* Dashboard & Tabs UI */
    .dashboard-tabs-container {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    .dashboard-tab {
      display: none;
      flex-direction: column;
      gap: 15px;
      animation: fadeIn 0.25s ease-in-out;
    }

    .dashboard-tab.active-tab {
      display: flex;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .welcome-box {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.03) 100%);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .welcome-text h4 {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary);
    }

    .welcome-text p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 3px;
    }

    .section-title {
      font-size: 1.05rem;
      font-weight: 800;
      margin-top: 10px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-main);
    }

    /* Courier Profile SPA UI */
    .profile-card {
      background-color: var(--panel-dark);
      border: 1.5px solid var(--border-dark);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 5px;
    }

    .profile-avatar {
      width: 68px;
      height: 68px;
      background: rgba(245, 158, 11, 0.1);
      border: 2px solid var(--primary);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2rem;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .profile-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
    }

    .vehicle-badge {
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border-dark);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-top: 10px;
      color: var(--primary);
    }

    .settings-panel {
      background-color: var(--panel-dark);
      border: 1.5px solid var(--border-dark);
      border-radius: 20px;
      overflow: hidden;
      margin-top: 10px;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1.5px solid var(--border-dark);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .setting-info i {
      font-size: 1.2rem;
      width: 24px;
      text-align: center;
    }

    .setting-title {
      font-weight: 700;
      font-size: 0.9rem;
    }

    .setting-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Switch toggle */
    .switch {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 24px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #334155;
      transition: .3s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--emerald);
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    /* Available request cards */
    .request-item {
      background-color: var(--panel-dark);
      border: 1.5px solid var(--border-dark);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      position: relative;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .request-item::before {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0;
      width: 4px;
      background-color: var(--primary);
    }

    .request-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1.5px solid rgba(255,255,255,0.03);
    }

    .request-kitchen {
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .request-time {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .request-address {
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.4;
      margin-bottom: 14px;
    }

    .request-address i {
      margin-top: 3px;
    }

    .request-btn {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.15) 100%);
      border: 1.5px solid var(--primary);
      color: var(--primary);
      width: 100%;
      padding: 10px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .request-btn:hover {
      background: var(--primary);
      color: #090e1a;
    }

    .no-requests {
      text-align: center;
      padding: 35px 20px;
      color: var(--text-muted);
      border: 1.5px dashed var(--border-dark);
      border-radius: 16px;
      font-size: 0.85rem;
      line-height: 1.6;
    }

    /* Active delivery card */
    .delivery-card {
      background-color: var(--panel-dark);
      border: 1.5px solid var(--primary);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 12px 30px rgba(245,158,11,0.12);
      position: relative;
    }

    .delivery-detail {
      margin-bottom: 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .delivery-detail-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 700;
    }

    .delivery-detail-val {
      font-size: 1rem;
      font-weight: 800;
    }

    .delivery-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-top: 15px;
    }

    /* Persistent Bottom Navigation Bar */
    .bottom-nav {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background-color: rgba(19, 27, 46, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1.5px solid var(--border-dark);
      display: flex;
      justify-content: space-around;
      padding: 10px 4px 24px 4px; /* extra bottom padding for mobile gesture bar */
      z-index: 99;
      flex-shrink: 0;
    }

    /* Desktop adjustments for bottom nav */
    @media (min-width: 481px) {
      .bottom-nav {
        padding-bottom: 12px;
      }
    }

    .nav-item {
      background: none;
      border: none;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 0.75rem;
      font-weight: 800;
      cursor: pointer;
      width: 30%;
      position: relative;
      transition: color 0.2s;
    }

    .nav-item.active {
      color: var(--primary);
    }

    .nav-item i {
      font-size: 1.25rem;
    }

    .nav-badge {
      position: absolute;
      top: -2px;
      right: calc(50% - 18px);
      background-color: var(--rose);
      color: white;
      font-size: 0.65rem;
      font-weight: 800;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid var(--panel-dark);
    }

    /* Mobile-first UX polish */
    html {
      scroll-behavior: smooth;
    }

    body {
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    button,
    select,
    input,
    textarea {
      font: inherit;
    }

    button,
    .btn,
    .request-btn,
    .nav-item {
      min-height: 44px;
    }

    button:focus-visible,
    a:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 3px solid rgba(245, 158, 11, 0.35);
      outline-offset: 3px;
    }

    .app-container {
      isolation: isolate;
    }

    main {
      padding-bottom: 110px;
      scrollbar-width: thin;
    }

    .panel,
    .request-item,
    .delivery-card,
    .profile-card,
    .settings-panel,
    .welcome-box {
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    }

    .request-item:hover,
    .delivery-card:hover {
      border-color: rgba(245, 158, 11, 0.55);
    }

    .input-field {
      min-height: 46px;
      font-size: 16px;
      line-height: 1.4;
    }

    .bottom-nav {
      padding-bottom: max(14px, env(safe-area-inset-bottom));
    }

    .nav-item {
      justify-content: center;
      border-radius: 12px;
    }

    .nav-item:active,
    .request-btn:active,
    .btn:active {
      transform: scale(0.98);
    }

    @media (max-width: 360px) {
      header {
        padding: 14px 16px;
      }

      .brand {
        font-size: 1.05rem;
      }

      .header-status {
        padding: 5px 9px;
      }

      main {
        padding: 16px 14px 104px;
      }

      .panel,
      .profile-card,
      .delivery-card,
      .request-item {
        padding: 18px;
        border-radius: 16px;
      }

      .setting-item,
      .welcome-box {
        align-items: flex-start;
        gap: 12px;
      }
    }

    @media (min-width: 481px) {
      body {
        padding: 24px;
      }

      .app-container {
        height: min(900px, calc(100vh - 48px));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>

  <div class="app-container">
    <header>
      <div class="brand">
        <i class="fa-solid fa-truck-fast"></i>
        <span>مدينتي Express</span>
      </div>
      <div class="header-status">
        <span class="status-dot" id="header-status-dot"></span>
        <span id="header-status-text">غير متصل</span>
      </div>
    </header>

    <main>
      <!-- Screen 1: AUTH (PHONE) -->
      <div id="screen-auth-phone" class="screen active">
        <div class="panel">
          <div class="form-logo">
            <i class="fa-solid fa-mobile-screen-button"></i>
          </div>
          <h2 class="form-title">دخول كابتن التوصيل</h2>
          <p class="form-subtitle">سجل رقم هاتفك لاستلام طلبات التوصيل النشطة في مدينتي</p>
          
          <div class="form-group">
            <label class="form-label">رقم الهاتف</label>
            <input type="tel" id="auth-phone" class="input-field" placeholder="مثال: +201000000000" style="direction: ltr; text-align: left;" inputmode="numeric" value="01000000000">
          </div>

          <button class="btn" id="btn-send-otp" onclick="requestOtp()"><i class="fa-solid fa-paper-plane"></i> إرسال رمز التحقق</button>

          <!-- Local Testing Tip -->
          <div style="margin-top: 20px; padding: 12px; background: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.2); border-radius: 8px; font-size: 0.8rem; text-align: center; color: var(--primary);">
            <i class="fa-solid fa-circle-info" style="margin-left: 4px;"></i>
            <strong>بيانات التجربة والاختبار المحلي:</strong><br>
            رقم الهاتف: <span style="font-family: monospace; font-weight: bold;">01000000000</span> | رمز التحقق: <span style="font-family: monospace; font-weight: bold;">000000</span>
          </div>
        </div>
      </div>

      <!-- Screen 2: AUTH (OTP) -->
      <div id="screen-auth-otp" class="screen">
        <div class="panel">
          <div class="form-logo">
            <i class="fa-solid fa-key"></i>
          </div>
          <h2 class="form-title">رمز التحقق</h2>
          <p class="form-subtitle" id="otp-subtitle">تم إرسال رمز التحقق المؤلف من 6 أرقام إلى هاتفك</p>
          
          <div class="form-group">
            <label class="form-label">أدخل رمز التحقق</label>
            <input type="text" id="auth-otp" class="input-field" placeholder="000000" maxlength="6" style="direction: ltr; text-align: center; letter-spacing: 5px; font-size: 1.3rem;" inputmode="numeric" value="000000">
          </div>

          <button class="btn" id="btn-verify-otp" onclick="verifyOtp()"><i class="fa-solid fa-circle-check"></i> تأكيد ودخول</button>

          <!-- Local Testing Tip -->
          <div style="margin-top: 20px; padding: 12px; background: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.2); border-radius: 8px; font-size: 0.8rem; text-align: center; color: var(--primary);">
            <i class="fa-solid fa-circle-info" style="margin-left: 4px;"></i>
            <strong>بيانات التجربة والاختبار المحلي:</strong><br>
            رقم الهاتف: <span style="font-family: monospace; font-weight: bold;">01000000000</span> | رمز التحقق: <span style="font-family: monospace; font-weight: bold;">000000</span>
          </div>
        </div>
      </div>

      <!-- Screen 3: ONBOARDING -->
      <div id="screen-onboarding" class="screen">
        <div class="panel">
          <div class="form-logo">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <h2 class="form-title">تسجيل البيانات الشخصية</h2>
          <p class="form-subtitle">يرجى استكمال بياناتك للانضمام إلى أسطول التوصيل</p>
          
          <div class="form-group">
            <label class="form-label">الاسم الكامل</label>
            <input type="text" id="onboard-name" class="input-field" placeholder="الاسم رباعي">
          </div>

          <div class="form-group">
            <label class="form-label">الرقم القومي (14 رقم)</label>
            <input type="text" id="onboard-national-id" class="input-field" maxlength="14" placeholder="29000000000000" style="direction: ltr;" inputmode="numeric">
          </div>

          <div class="form-group">
            <label class="form-label">نوع وسيلة التوصيل</label>
            <select id="onboard-vehicle" class="input-field">
              <option value="BICYCLE">🚲 دراجة هوائية</option>
              <option value="MOTORCYCLE">🏍️ دراجة نارية</option>
              <option value="SCOOTER">🛴 سكوتر</option>
              <option value="CAR">🚗 سيارة</option>
              <option value="WALKING">🚶 مشياً على الأقدام</option>
            </select>
          </div>

          <button class="btn" onclick="submitOnboarding()"><i class="fa-solid fa-paper-plane"></i> تقديم الطلب للمراجعة</button>
        </div>
      </div>

      <!-- Screen 4: STATUS (PENDING) -->
      <div id="screen-status-pending" class="screen">
        <div class="panel status-panel">
          <div class="status-icon pending">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <h2 class="form-title" style="margin-bottom: 12px;">قيد مراجعة الإدارة</h2>
          <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.9rem; margin-bottom: 20px;">
            تم استلام بياناتك بنجاح. جاري مراجعة طلبك وتفعيل عضويتك من قبل إدارة منصة مدينتي. سيتم فتح حسابك وتنشيطه بمجرد تفعيل الإدارة.
          </p>
          <button class="btn-secondary" onclick="editProfileFromStatus()"><i class="fa-solid fa-pen-to-square"></i> تعديل بيانات التسجيل</button>
        </div>
      </div>

      <!-- Screen 5: STATUS (REJECTED) -->
      <div id="screen-status-rejected" class="screen">
        <div class="panel status-panel">
          <div class="status-icon rejected">
            <i class="fa-solid fa-circle-xmark"></i>
          </div>
          <h2 class="form-title" style="margin-bottom: 12px; color: var(--rose);">تم رفض العضوية</h2>
          <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.9rem; margin-bottom: 20px;">
            عذراً، تم رفض طلب انضمامك لأسطول توصيل مدينتي Express. يرجى مراجعة الإدارة أو التواصل مع الدعم الفني للاستفسار.
          </p>
          <button class="btn-secondary" onclick="editProfileFromStatus()"><i class="fa-solid fa-pen-to-square"></i> تعديل وإعادة التقديم</button>
        </div>
      </div>

      <!-- Screen 6: DASHBOARD -->
      <div id="screen-dashboard" class="screen" style="height: 100%;">
        <div class="dashboard-tabs-container">
          
          <!-- Tab 1: Available Deliveries -->
          <div id="tab-available" class="dashboard-tab active-tab">
            <div class="welcome-box">
              <div class="welcome-text">
                <h4>أهلاً بك، <span id="courier-welcome-name">...</span> 👋</h4>
                <p>تصفح وقبول طلبات التوصيل المتاحة الآن</p>
              </div>
            </div>
            
            <h2 class="section-title"><i class="fa-solid fa-bell"></i> الطلبات المتاحة للتوصيل</h2>
            <div id="available-list">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Tab 2: Active Delivery -->
          <div id="tab-active" class="dashboard-tab">
            <h2 class="section-title" style="color: var(--primary); margin-bottom: 15px;"><i class="fa-solid fa-truck-fast"></i> الطلب النشط حالياً</h2>
            <div id="active-delivery-card-container">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Tab 3: Profile & Settings -->
          <div id="tab-profile" class="dashboard-tab">
            <div class="profile-card">
              <div class="profile-avatar">
                <i class="fa-solid fa-user"></i>
              </div>
              <h3 id="profile-courier-name">الكابتن</h3>
              <p id="profile-courier-phone" style="direction: ltr; font-weight: 600; color: var(--text-muted); margin-top: 2px;">+20100...</p>
              <div class="vehicle-badge" id="profile-courier-vehicle">مركبة</div>
            </div>

            <div class="settings-panel">
              <div class="setting-item">
                <div class="setting-info">
                  <i class="fa-solid fa-wifi" style="color: var(--emerald);"></i>
                  <div>
                    <div class="setting-title">حالة الاتصال والعمل</div>
                    <div class="setting-desc" id="status-desc">غير متصل (مغلق)</div>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="online-switch" onchange="toggleOnlineSwitch()">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item" style="cursor: pointer;" onclick="logout()">
                <div class="setting-info">
                  <i class="fa-solid fa-right-from-bracket" style="color: var(--rose);"></i>
                  <div>
                    <div class="setting-title" style="color: var(--rose); font-weight: 700;">تسجيل الخروج</div>
                    <div class="setting-desc">الخروج من الحساب والعودة للرئيسية</div>
                  </div>
                </div>
                <i class="fa-solid fa-chevron-left" style="color: var(--text-muted); font-size: 0.9rem;"></i>
              </div>
            </div>
          </div>

          <!-- Persistent Bottom Nav Bar -->
          <div class="bottom-nav">
            <button class="nav-item active" id="nav-btn-available" onclick="switchDashboardTab('available')">
              <i class="fa-solid fa-list-ul"></i>
              <span>الطلبات</span>
            </button>
            <button class="nav-item" id="nav-btn-active" onclick="switchDashboardTab('active')">
              <i class="fa-solid fa-truck-fast"></i>
              <span>الطلب النشط</span>
              <span class="nav-badge" id="active-badge" style="display: none;">1</span>
            </button>
            <button class="nav-item" id="nav-btn-profile" onclick="switchDashboardTab('profile')">
              <i class="fa-solid fa-user"></i>
              <span>حسابي</span>
            </button>
          </div>

        </div>
      </div>
    </main>
  </div>

  <script>
    const API_URL = '${apiBaseUrl}';
    let token = localStorage.getItem('courier_token') || '';
    let currentPhoneNumber = '';
    let myCourierProfile = null;
    let refreshInterval = null;
    let currentTab = 'available';
    let isSubmitting = false;

    if (!token || token === 'undefined' || token === 'null') {
      token = '';
      localStorage.removeItem('courier_token');
    }

    function getPhoneFromToken(t) {
      try {
        const base64Url = t.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).phoneNumber || '';
      } catch (e) {
        return '';
      }
    }

    function ensureCurrentPhoneNumber() {
      if (!currentPhoneNumber) {
        let phoneInput = document.getElementById('auth-phone').value.trim();
        if (phoneInput) {
          if (phoneInput.startsWith('01')) {
            phoneInput = '+2' + phoneInput;
          } else if (phoneInput.startsWith('201') && !phoneInput.startsWith('+')) {
            phoneInput = '+' + phoneInput;
          }
          currentPhoneNumber = phoneInput;
        } else if (token) {
          currentPhoneNumber = getPhoneFromToken(token);
        }
      }
    }

    function unwrapApiData(payload) {
      if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')) {
        return payload.data;
      }
      return payload;
    }

    function getApiMessage(payload, fallback) {
      if (payload && typeof payload === 'object') {
        return payload.message || (payload.data && payload.data.message) || fallback;
      }
      return fallback;
    }

    // Initialize Page
    document.addEventListener('DOMContentLoaded', () => {
      if (token) {
        currentPhoneNumber = getPhoneFromToken(token);
        checkCourierStatus();
      } else {
        showScreen('auth-phone');
      }
    });

    function showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const activeScreen = document.getElementById('screen-' + screenId);
      if (activeScreen) activeScreen.classList.add('active');

      const headerStatus = document.querySelector('.header-status');
      if (screenId === 'auth-phone' || screenId === 'auth-otp' || screenId === 'onboarding') {
        headerStatus.style.display = 'none';
      } else {
        headerStatus.style.display = 'flex';
      }

      // Reset onboarding text if shown fresh
      if (screenId === 'onboarding' && !myCourierProfile) {
        const onboardTitle = document.querySelector('#screen-onboarding .form-title');
        const onboardSub = document.querySelector('#screen-onboarding .form-subtitle');
        if (onboardTitle) onboardTitle.textContent = 'تسجيل البيانات الشخصية';
        if (onboardSub) onboardSub.textContent = 'يرجى استكمال بياناتك للانضمام إلى أسطول التوصيل';
      }
    }

    // Tab switcher
    function switchDashboardTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active-tab'));
      document.getElementById('tab-' + tabId).classList.add('active-tab');

      document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
      document.getElementById('nav-btn-' + tabId).classList.add('active');

      refreshDashboardData();
    }

    // OTP Flow
    async function requestOtp() {
      if (isSubmitting) return;
      isSubmitting = true;
      let phoneInput = document.getElementById('auth-phone').value.trim();
      if (!phoneInput) {
        isSubmitting = false;
        return alert('الرجاء إدخال رقم الهاتف.');
      }

      // Normalize local Egyptian numbers starting with '01' to international '+201'
      if (phoneInput.startsWith('01')) {
        phoneInput = '+2' + phoneInput;
      } else if (phoneInput.startsWith('201') && !phoneInput.startsWith('+')) {
        phoneInput = '+' + phoneInput;
      }

      currentPhoneNumber = phoneInput;
      const btn = document.getElementById('btn-send-otp');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

      try {
        const res = await fetch(API_URL + '/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phoneInput })
        });

        if (res.ok) {
          document.getElementById('otp-subtitle').textContent = 'تم إرسال رمز التحقق إلى الرقم ' + phoneInput;
          showScreen('auth-otp');
        } else {
          // If already registered, try login endpoint
          const loginRes = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phoneInput })
          });
          if (loginRes.ok) {
            document.getElementById('otp-subtitle').textContent = 'تم إرسال رمز التحقق إلى الرقم ' + phoneInput;
            showScreen('auth-otp');
          } else {
            alert('فشل إرسال رمز التحقق. تأكد من صحة الرقم.');
          }
        }
      } catch (err) {
        alert('حدث خطأ في الشبكة.');
      } finally {
        isSubmitting = false;
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال رمز التحقق';
      }
    }

    async function verifyOtp() {
      if (isSubmitting) return;
      isSubmitting = true;
      const code = document.getElementById('auth-otp').value.trim();
      if (!code) {
        isSubmitting = false;
        return alert('الرجاء إدخال رمز التحقق.');
      }

      ensureCurrentPhoneNumber();

      const btn = document.getElementById('btn-verify-otp');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';

      try {
        const res = await fetch(API_URL + '/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: currentPhoneNumber, code })
        });
        const envelope = await res.json();
        
        if (res.ok) {
          const authData = unwrapApiData(envelope);
          token = authData && authData.token;
          if (!token) {
            alert('تعذر قراءة رمز الدخول من الخادم. حاول مرة أخرى.');
            return;
          }
          localStorage.setItem('courier_token', token);
          checkCourierStatus();
        } else {
          alert('رمز التحقق غير صحيح أو منتهي الصلاحية.');
        }
      } catch (err) {
        alert('حدث خطأ في الشبكة.');
      } finally {
        isSubmitting = false;
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> تأكيد ودخول';
      }
    }

    function editProfileFromStatus() {
      if (!myCourierProfile) return;
      document.getElementById('onboard-name').value = myCourierProfile.name;
      document.getElementById('onboard-national-id').value = myCourierProfile.nationalId;
      document.getElementById('onboard-vehicle').value = myCourierProfile.vehicleType;
      
      const onboardTitle = document.querySelector('#screen-onboarding .form-title');
      const onboardSub = document.querySelector('#screen-onboarding .form-subtitle');
      if (onboardTitle) onboardTitle.textContent = 'تعديل البيانات الشخصية';
      if (onboardSub) onboardSub.textContent = 'قم بتحديث بياناتك ثم أعد إرسال الطلب للمراجعة';

      showScreen('onboarding');
    }

    // Onboarding
    async function submitOnboarding() {
      ensureCurrentPhoneNumber();

      const name = document.getElementById('onboard-name').value.trim();
      const nationalId = document.getElementById('onboard-national-id').value.trim();
      const vehicleType = document.getElementById('onboard-vehicle').value;

      if (myCourierProfile && myCourierProfile.status === 'APPROVED') {
        return alert('لا يمكن تعديل ملف الكابتن بعد تفعيل الإدارة.');
      }
      if (!name) return alert('الرجاء إدخال اسمك الكامل.');
      if (nationalId.length !== 14 || isNaN(nationalId)) return alert('الرقم القومي يجب أن يتكون من 14 رقماً.');

      try {
        const isProfileUpdate = Boolean(myCourierProfile);
        const res = await fetch(API_URL + '/express-api/courier', {
          method: isProfileUpdate ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          },
          body: JSON.stringify({ name, phone: currentPhoneNumber, vehicleType, nationalId })
        });

        if (res.ok) {
          checkCourierStatus();
        } else {
          const envelope = await res.json();
          alert(getApiMessage(envelope, 'فشل تقديم البيانات.'));
        }
      } catch (err) {
        alert('حدث خطأ في الشبكة.');
      }
    }

    // Check Status
    async function checkCourierStatus() {
      try {
        const res = await fetch(API_URL + '/express-api/courier/me', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          }
        });
        
        if (res.status === 401) {
          logout();
          return;
        }

        const envelope = await res.json();
        const profile = unwrapApiData(envelope);
        if (!profile) {
          // Needs onboarding
          showScreen('onboarding');
        } else {
          myCourierProfile = profile;
          currentPhoneNumber = profile.phone;
          
          if (profile.status === 'PENDING') {
            showScreen('status-pending');
          } else if (profile.status === 'REJECTED') {
            showScreen('status-rejected');
          } else if (profile.status === 'APPROVED') {
            setupDashboard(profile);
          }
        }
      } catch (err) {
        alert('حدث خطأ أثناء تحميل بيانات الحساب.');
      }
    }

    // Dashboard setup
    function setupDashboard(profile) {
      document.getElementById('profile-courier-name').textContent = profile.name;
      document.getElementById('courier-welcome-name').textContent = profile.name.split(' ')[0];
      document.getElementById('profile-courier-phone').textContent = profile.phone;

      const vehicleNames = {
        BICYCLE: '🚲 دراجة هوائية',
        MOTORCYCLE: '🏍️ دراجة نارية',
        SCOOTER: '🛴 سكوتر',
        CAR: '🚗 سيارة',
        WALKING: '🚶 مشياً على الأقدام'
      };
      document.getElementById('profile-courier-vehicle').textContent = vehicleNames[profile.vehicleType] || profile.vehicleType;
      
      const switchEl = document.getElementById('online-switch');
      switchEl.checked = profile.isOnline;
      updateStatusUI(profile.isOnline);
      
      showScreen('dashboard');
      switchDashboardTab('available');

      // Start Polling data
      refreshDashboardData();
      if (!refreshInterval) {
        refreshInterval = setInterval(refreshDashboardData, 5000);
      }
    }

    function updateStatusUI(isOnline) {
      const dot = document.getElementById('header-status-dot');
      const text = document.getElementById('header-status-text');
      const desc = document.getElementById('status-desc');
      
      if (isOnline) {
        dot.classList.add('active');
        text.textContent = 'متصل';
        desc.textContent = 'متصل ومستعد لاستقبال طلبات جديدة';
      } else {
        dot.classList.remove('active');
        text.textContent = 'غير متصل';
        desc.textContent = 'غير متصل (مغلق) — لن تظهر لك طلبات';
      }
    }

    async function refreshDashboardData() {
      if (!myCourierProfile || myCourierProfile.status !== 'APPROVED') return;

      try {
        // 1. Fetch Active Delivery
        const activeRes = await fetch(API_URL + '/express-api/deliveries/active', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          }
        });
        const activeEnvelope = await activeRes.json();
        const activeDelivery = unwrapApiData(activeEnvelope);
        renderActiveDelivery(activeDelivery);

        // 2. Fetch Available requests (only if online and no active delivery)
        if (myCourierProfile.isOnline && !activeDelivery) {
          const listRes = await fetch(API_URL + '/express-api/deliveries/available', {
            headers: {
              'Authorization': 'Bearer ' + token,
              'x-tenant-id': 'express'
            }
          });
          const availableEnvelope = await listRes.json();
          const available = unwrapApiData(availableEnvelope);
          renderAvailableRequests(available);
        } else {
          document.getElementById('available-list').innerHTML = 
            '<div class="no-requests"><i class="fa-solid fa-circle-exclamation" style="font-size: 1.8rem; color: var(--text-muted); margin-bottom: 8px; display: block;"></i>الرجاء تفعيل حالة الاتصال (نشط) من صفحة حسابي لاستلاف طلبات التوصيل.</div>';
        }
      } catch (err) {
        console.error('Error refreshing dashboard:', err);
      }
    }

    function renderActiveDelivery(delivery) {
      const container = document.getElementById('active-delivery-card-container');
      const badge = document.getElementById('active-badge');

      if (!delivery) {
        container.innerHTML = \`
          <div class="no-requests" style="border-style: solid; padding: 40px 20px;">
            <i class="fa-solid fa-circle-info" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
            لا يوجد طلب توصيل نشط حالياً.<br>قم بقبول طلب من قائمة الطلبات المتاحة.
          </div>
        \`;
        badge.style.display = 'none';
        return;
      }

      badge.style.display = 'flex';

      const statuses = {
        ACCEPTED: '<span style="color: var(--primary); font-weight: 800;"><i class="fa-solid fa-clock"></i> تم القبول (يرجى التوجه للمطبخ)</span>',
        PICKED_UP: '<span style="color: var(--emerald); font-weight: 800;"><i class="fa-solid fa-truck-ramp-box"></i> تم الاستلام (جاري التوصيل للعميل)</span>'
      };

      let actionButton = '';
      if (delivery.status === 'ACCEPTED') {
        actionButton = \`<button class="btn" style="background: var(--primary);" onclick="pickupDelivery('\${delivery.id}')"><i class="fa-solid fa-truck-ramp-box"></i> استلمت الطلب من المطبخ</button>\`;
      } else if (delivery.status === 'PICKED_UP') {
        actionButton = \`<button class="btn" style="background: var(--emerald); color: white;" onclick="completeDelivery('\${delivery.id}')"><i class="fa-solid fa-circle-check"></i> سلمت الطلب للعميل (تم التوصيل)</button>\`;
      }

      container.innerHTML = \`
        <div class="delivery-card">
          <div class="delivery-detail">
            <div class="delivery-detail-label">حالة التوصيل</div>
            <div class="delivery-detail-val">\${statuses[delivery.status] || delivery.status}</div>
          </div>
          <div class="delivery-detail">
            <div class="delivery-detail-label">مطبخ الإرسال</div>
            <div class="delivery-detail-val" style="color: var(--primary); font-size: 1.15rem; font-weight: 800;">\${delivery.kitchenName}</div>
          </div>
          <div class="delivery-detail">
            <div class="delivery-detail-label">عنوان التسليم في مدينتي</div>
            <div class="delivery-detail-val" style="color: var(--text-main); font-size: 1.1rem; font-weight: 800;"><i class="fa-solid fa-location-dot" style="color: var(--rose); margin-left: 6px;"></i> \${delivery.deliveryPoint}</div>
          </div>
          <div class="delivery-detail">
            <div class="delivery-detail-label">اسم العميل</div>
            <div class="delivery-detail-val">\${delivery.recipientName}</div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 15px; margin-bottom: 15px;">
            <a href="tel:\${delivery.recipientPhone}" class="btn" style="flex: 1; background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; font-size: 0.85rem; padding: 10px; display: flex; justify-content: center; align-items: center; gap: 8px;"><i class="fa-solid fa-phone"></i> اتصل بالعميل</a>
            \${delivery.kitchenPhone ? \`<a href="tel:\${delivery.kitchenPhone}" class="btn" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border-dark); color: var(--text-main); font-size: 0.85rem; padding: 10px; display: flex; justify-content: center; align-items: center; gap: 8px;"><i class="fa-solid fa-store"></i> اتصل بالمطبخ</a>\` : ''}
          </div>

          \${delivery.notes ? \`
          <div class="delivery-detail">
            <div class="delivery-detail-label">ملاحظات العميل / محتويات الوجبة</div>
            <div class="delivery-detail-val" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-dark); padding: 12px; border-radius: 10px; font-size: 0.9rem; line-height: 1.6;">\${delivery.notes}</div>
          </div>
          \` : ''}
          
          <div class="delivery-actions">
            \${actionButton}
          </div>
        </div>
      \`;
    }

    function renderAvailableRequests(list) {
      const listEl = document.getElementById('available-list');
      if (!list || list.length === 0) {
        listEl.innerHTML = '<div class="no-requests"><i class="fa-solid fa-circle-info" style="font-size: 1.8rem; color: var(--text-muted); margin-bottom: 8px; display: block;"></i>لا توجد طلبات توصيل متاحة حالياً في مدينتي.</div>';
        return;
      }

      let html = '';
      list.forEach(req => {
        const time = new Date(req.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        html += \`
          <div class="request-item">
            <div class="request-meta">
              <span class="request-kitchen"><i class="fa-solid fa-store" style="color: var(--primary);"></i> \${req.kitchenName}</span>
              <span class="request-time">\${time}</span>
            </div>
            <div class="request-address">
              <i class="fa-solid fa-location-dot" style="color: var(--rose);"></i> \${req.deliveryPoint}
            </div>
            <button class="request-btn" onclick="acceptDelivery('\${req.id}')">قبول وتوصيل الطلب</button>
          </div>
        \`;
      });
      listEl.innerHTML = html;
    }

    // Actions
    async function toggleOnlineSwitch() {
      const switchEl = document.getElementById('online-switch');
      const isOnline = switchEl.checked;

      try {
        const res = await fetch(API_URL + '/express-api/courier/online', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          },
          body: JSON.stringify({ isOnline })
        });

        if (res.ok) {
          myCourierProfile.isOnline = isOnline;
          updateStatusUI(isOnline);
          refreshDashboardData();
        } else {
          switchEl.checked = !isOnline;
          const env = await res.json();
          alert(getApiMessage(env, 'فشل تعديل الحالة.'));
        }
      } catch (err) {
        switchEl.checked = !isOnline;
        alert('حدث خطأ في الاتصال.');
      }
    }

    async function acceptDelivery(id) {
      if (!confirm('هل أنت متأكد من رغبتك في قبول طلب التوصيل هذا؟')) return;

      try {
        const res = await fetch(API_URL + '/express-api/deliveries/' + id + '/accept', {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          }
        });

        if (res.ok) {
          switchDashboardTab('active');
        } else {
          const env = await res.json();
          alert(getApiMessage(env, 'فشل قبول الطلب.'));
        }
      } catch (err) {
        alert('خطأ في الشبكة.');
      }
    }

    async function pickupDelivery(id) {
      try {
        const res = await fetch(API_URL + '/express-api/deliveries/' + id + '/pickup', {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          }
        });

        if (res.ok) {
          refreshDashboardData();
        } else {
          const env = await res.json();
          alert(getApiMessage(env, 'فشل استلام الطلب.'));
        }
      } catch (err) {
        alert('خطأ في الشبكة.');
      }
    }

    async function completeDelivery(id) {
      if (!confirm('هل تم تسليم الطلب للعميل واستلام الحساب؟')) return;

      try {
        const res = await fetch(API_URL + '/express-api/deliveries/' + id + '/deliver', {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'express'
          }
        });

        if (res.ok) {
          refreshDashboardData();
          switchDashboardTab('available');
        } else {
          const env = await res.json();
          alert(getApiMessage(env, 'فشل إكمال الطلب.'));
        }
      } catch (err) {
        alert('خطأ في الشبكة.');
      }
    }

    function logout() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
      token = '';
      myCourierProfile = null;
      localStorage.removeItem('courier_token');
      document.getElementById('auth-phone').value = '';
      document.getElementById('auth-otp').value = '';
      updateStatusUI(false);
      showScreen('auth-phone');
    }
  </script>
</body>
</html>`;
}
