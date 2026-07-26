export const getKitchenPortalHtml = (apiBaseUrl: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوابة إدارة مطبخك - مدينتي كيتشن</title>
  
  <!-- Fonts (Cairo & Outfit) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <style>
    :root {
      --bg-dark: #f4fbf7; /* Mint Tinted */
      --bg-glass: rgba(255, 255, 255, 0.9);
      --border-glass: rgba(16, 185, 129, 0.12);
      --text-main: #064e3b; /* Dark Forest Green */
      --text-muted: #374151;
      --primary: #10b981; /* Emerald */
      --primary-hover: #059669;
      --accent-emerald: #059669;
      --accent-rose: #ef4444;
      --accent-amber: #d97706;
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
      direction: rtl;
      text-align: right;
      background-image: 
        radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 10% 90%, rgba(5, 150, 105, 0.05) 0%, transparent 40%);
      background-attachment: fixed;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(16, 185, 129, 0.2);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(16, 185, 129, 0.4);
    }

    /* Common Auth Screen Styling */
    #auth-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      position: relative;
    }

    .glass-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-glass);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 40px rgba(6, 78, 59, 0.06);
      text-align: center;
    }

    .logo-icon {
      font-size: 3.5rem;
      color: var(--primary);
      margin-bottom: 15px;
      display: inline-block;
      filter: drop-shadow(0 4px 6px rgba(16, 185, 129, 0.15));
    }

    .title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 8px;
    }

    .subtitle {
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
      color: var(--text-main);
      margin-bottom: 8px;
    }

    .input-field {
      width: 100%;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      padding: 14px 16px;
      color: var(--text-main);
      font-family: var(--font-cairo);
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      background: #ffffff;
    }

    .btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      border: none;
      border-radius: 12px;
      padding: 14px;
      color: white;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      font-family: var(--font-cairo);
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
    }

    .btn.secondary {
      background: transparent;
      border: 1px solid var(--primary);
      color: var(--primary);
      box-shadow: none;
    }

    .btn.secondary:hover {
      background: rgba(16, 185, 129, 0.05);
    }

    /* Dashboard Layout */
    #dashboard-screen {
      display: none;
      min-height: 100vh;
      grid-template-rows: auto 1fr;
    }

    .navbar {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-glass);
      padding: 15px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 1.3rem;
      color: var(--text-main);
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-user-info {
      text-align: left;
    }

    .logout-btn {
      background: rgba(239, 68, 68, 0.08);
      color: var(--accent-rose);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
      font-family: var(--font-cairo);
      font-weight: 600;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: var(--accent-rose);
      color: white;
    }

    .dashboard-container {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: calc(100vh - 75px);
    }

    /* Sidebar */
    .sidebar {
      background: rgba(255, 255, 255, 0.7);
      border-left: 1px solid var(--border-glass);
      padding: 30px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: 12px;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sidebar-item:hover {
      background: rgba(16, 185, 129, 0.05);
      color: var(--primary);
    }

    .sidebar-item.active {
      background: var(--primary);
      color: white;
      font-weight: 600;
    }

    /* Main Content */
    .content-area {
      padding: 40px;
      overflow-y: auto;
    }

    .tab-content {
      display: none;
      animation: fadeIn 0.4s ease;
    }

    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .panel {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(6, 78, 59, 0.02);
      border: 1px solid rgba(16, 185, 129, 0.08);
      margin-bottom: 25px;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .badge.active { background: rgba(16, 185, 129, 0.1); color: var(--primary); }
    .badge.pending { background: rgba(217, 119, 6, 0.1); color: var(--accent-amber); }
    .badge.inactive { background: rgba(239, 68, 68, 0.1); color: var(--accent-rose); }
    .badge.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(16, 185, 129, 0.08);
      box-shadow: 0 4px 20px rgba(6, 78, 59, 0.02);
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .stat-icon.emerald { background: rgba(16, 185, 129, 0.1); color: var(--primary); }
    .stat-icon.amber { background: rgba(217, 119, 6, 0.1); color: var(--accent-amber); }
    .stat-icon.cyan { background: rgba(6, 182, 212, 0.1); color: #0891b2; }

    .stat-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Menu Grid */
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .menu-item-card {
      background: white;
      border-radius: 16px;
      border: 1px solid rgba(16, 185, 129, 0.08);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s;
      position: relative;
    }

    .menu-item-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(6, 78, 59, 0.06);
    }

    .menu-item-image {
      width: 100%;
      height: 160px;
      object-fit: cover;
      background-color: #f1f5f9;
      background-image: radial-gradient(circle, #e2e8f0 10%, transparent 60%);
    }

    .menu-item-info {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .menu-item-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .menu-item-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-bottom: 12px;
      line-height: 1.5;
      flex-grow: 1;
    }

    .menu-item-price {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 15px;
    }

    .menu-item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .btn-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #e2e8f0;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .btn-circle:hover {
      background: var(--bg-dark);
      color: var(--primary);
    }

    .btn-circle.delete:hover {
      color: var(--accent-rose);
      background: rgba(239, 68, 68, 0.05);
    }

    /* Modal */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(6, 78, 59, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-content {
      background: white;
      border-radius: 24px;
      padding: 35px;
      width: 100%;
      max-width: 550px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.15);
      animation: modalSlide 0.3s ease;
    }

    @keyframes modalSlide {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }

    .close-btn {
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }

    .close-btn:hover {
      color: var(--accent-rose);
    }

    /* Opening Hours grid editing */
    .hours-grid {
      display: grid;
      gap: 15px;
    }

    .day-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
    }

    .day-name {
      font-weight: 700;
      width: 70px;
      color: var(--text-main);
    }

    /* Toggle Switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
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
      background-color: #cbd5e1;
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
      background-color: var(--primary);
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }

    /* Screen states styling */
    .state-screen {
      display: none;
      min-height: 100vh;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    /* Portal-wide UX polish */
    html {
      scroll-behavior: smooth;
    }

    body {
      line-height: 1.65;
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
    .sidebar-item,
    .logout-btn,
    .btn-circle {
      min-height: 42px;
    }

    button:focus-visible,
    a:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 3px solid rgba(16, 185, 129, 0.28);
      outline-offset: 3px;
    }

    .navbar {
      gap: 16px;
    }

    .dashboard-container,
    .content-area {
      min-width: 0;
    }

    .panel,
    .stat-card,
    .menu-item-card,
    .glass-card,
    .modal-content {
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    }

    .input-field {
      min-height: 44px;
      line-height: 1.4;
    }

    textarea.input-field {
      min-height: 96px;
      line-height: 1.65;
    }

    .table-container {
      border: 1px solid rgba(16, 185, 129, 0.1);
      border-radius: 14px;
      background: #fff;
    }

    .table-container table {
      min-width: 680px;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #f8fafc;
    }

    td {
      vertical-align: middle;
    }

    @media (max-width: 980px) {
      .navbar {
        padding: 14px 20px;
        align-items: flex-start;
      }

      .dashboard-container {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: sticky;
        top: 70px;
        z-index: 80;
        flex-direction: row;
        overflow-x: auto;
        padding: 12px 14px;
        border-left: none;
        border-bottom: 1px solid var(--border-glass);
        background: rgba(255, 255, 255, 0.92);
        scroll-snap-type: x proximity;
      }

      .sidebar-item {
        flex: 0 0 auto;
        white-space: nowrap;
        scroll-snap-align: start;
        border: 1px solid rgba(16, 185, 129, 0.1);
        background: rgba(255, 255, 255, 0.7);
      }

      .content-area {
        padding: 24px;
      }

      .menu-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
    }

    @media (max-width: 680px) {
      .glass-card {
        padding: 26px 20px;
        border-radius: 18px;
      }

      .navbar {
        flex-direction: column;
      }

      .nav-user {
        width: 100%;
        justify-content: space-between;
        gap: 12px;
      }

      .nav-user-info {
        text-align: right;
      }

      .content-area {
        padding: 18px 14px 28px;
      }

      .panel {
        padding: 20px;
        border-radius: 16px;
      }

      .stats-grid,
      .menu-grid {
        grid-template-columns: 1fr;
      }

      .modal {
        padding: 14px;
        align-items: flex-start;
        overflow-y: auto;
      }

      .modal-content {
        padding: 22px;
        border-radius: 18px;
        margin: 24px 0;
      }

      .day-row,
      .menu-item-footer {
        align-items: flex-start;
        flex-direction: column;
      }

      .btn,
      .logout-btn {
        width: 100%;
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

  <!-- 1. AUTH SCREEN -->
  <div id="auth-screen">
    <div class="glass-card">
      <div class="logo-container">
        <i class="fa-solid fa-utensils logo-icon"></i>
        <h2 class="title">مدينتي كيتشن</h2>
        <p class="subtitle">البوابة الإدارية لأصحاب وصاحبات المطابخ المنزلية</p>
      </div>

      <!-- Stage 1: Enter Phone -->
      <div id="auth-stage-phone">
        <div class="form-group">
          <label class="form-label" for="auth-phone">رقم الهاتف</label>
          <input type="text" id="auth-phone" class="input-field" value="01000000000" placeholder="01000000000" style="direction: ltr; text-align: left;">
        </div>
        <button type="button" id="send-otp-btn" class="btn" onclick="sendOtp(event)">طلب رمز التحقق</button>
      </div>

      <!-- Stage 2: Enter OTP -->
      <div id="auth-stage-otp" style="display: none;">
        <div class="form-group">
          <label class="form-label" for="auth-otp">رمز التحقق (OTP)</label>
          <input type="text" id="auth-otp" class="input-field" value="000000" placeholder="000000" style="direction: ltr; text-align: center; letter-spacing: 5px;">
          <small style="color: var(--text-muted); display: block; margin-top: 8px;">أدخل رمز التحقق للتأكيد (في وضع التطوير: 000000)</small>
        </div>
        <button type="button" id="verify-otp-btn" class="btn" onclick="verifyOtp(event)">تأكيد وتسجيل الدخول</button>
        <button type="button" class="btn secondary" onclick="goBackToPhone(event)" style="margin-top: 10px;">الرجوع للخلف</button>
      </div>
    </div>
  </div>

  <!-- 2. REGISTRATION REQUEST SCREEN -->
  <div id="registration-screen" class="state-screen">
    <div class="glass-card" style="max-width: 600px;">
      <i class="fa-solid fa-store logo-icon" style="color: var(--accent-amber);"></i>
      <h2 class="title">طلب تسجيل مطبخ جديد</h2>
      <p class="subtitle">قم بملء البيانات التالية لتفعيل حساب مطبخك لدى الإدارة</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: right;">
        <div class="form-group">
          <label class="form-label">اسم المطبخ</label>
          <input type="text" id="reg-name" class="input-field" placeholder="مطبخ أميرة الأكلات">
        </div>
        <div class="form-group">
          <label class="form-label">رابط المطبخ الفريد (Slug)</label>
          <input type="text" id="reg-slug" class="input-field" placeholder="ameera-kitchen" style="direction: ltr; text-align: left;">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: right;">
        <div class="form-group">
          <label class="form-label">نوع المطبخ (Cuisine)</label>
          <input type="text" id="reg-cuisine" class="input-field" placeholder="مأكولات مصرية، حلويات شرقية">
        </div>
        <div class="form-group">
          <label class="form-label">رقم الهاتف للتواصل</label>
          <input type="text" id="reg-phone" class="input-field" placeholder="010XXXXXXXX">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">العنوان بالتفصيل</label>
        <input type="text" id="reg-address" class="input-field" placeholder="مدينتي، منطقة B3، عمارة 12">
      </div>

      <div class="form-group">
        <label class="form-label">وصف وقصة المطبخ</label>
        <textarea id="reg-desc" class="input-field" placeholder="مثال: نقوم بتحضير أشهى المأكولات المنزلية الطازجة بعناية فائقة ونظافة تامة..." style="height: 100px; resize: none;"></textarea>
      </div>

      <button class="btn" onclick="submitRegistration()">إرسال طلب التفعيل</button>
      <button class="btn secondary" onclick="logout()" style="margin-top: 10px;">تسجيل الخروج</button>
    </div>
  </div>

  <!-- 3. UNDER REVIEW STATE SCREEN -->
  <div id="pending-screen" class="state-screen">
    <div class="glass-card">
      <i class="fa-solid fa-hourglass-half logo-icon" style="color: var(--accent-amber); animation: pulse 2s infinite;"></i>
      <h2 class="title" style="margin-top: 15px;">حسابك قيد المراجعة</h2>
      <p class="subtitle" style="margin-bottom: 20px;">تقوم إدارة MadintyAI حالياً بمراجعة معلومات مطبخك لتفعيل الحساب. سيتم تشغيل البوابة بمجرد الموافقة عليها!</p>
      
      <div style="background: rgba(217, 119, 6, 0.05); padding: 15px; border-radius: 12px; border: 1px dashed rgba(217, 119, 6, 0.2); margin-bottom: 25px; text-align: right;">
        <div style="font-size: 0.9rem; margin-bottom: 5px;"><strong>اسم المطبخ:</strong> <span id="pending-biz-name"></span></div>
        <div style="font-size: 0.9rem;"><strong>المعرف الفريد:</strong> <span id="pending-biz-slug"></span></div>
      </div>

      <button class="btn secondary" onclick="checkBusinessStatus()"><i class="fa-solid fa-arrows-rotate"></i> تحديث الحالة</button>
      <button class="btn secondary" onclick="logout()" style="margin-top: 10px; border-color: rgba(239,68,68,0.3); color: var(--accent-rose);">تسجيل الخروج</button>
    </div>
  </div>

  <!-- 4. REJECTED STATE SCREEN -->
  <div id="rejected-screen" class="state-screen">
    <div class="glass-card">
      <i class="fa-solid fa-circle-xmark logo-icon" style="color: var(--accent-rose);"></i>
      <h2 class="title" style="margin-top: 15px;">تم رفض الطلب</h2>
      <p class="subtitle" style="margin-bottom: 25px;">للأسف تم رفض طلب تفعيل مطبخك المنزلي لمخالفة شروط النشر أو نقص التفاصيل الإدارية. يرجى مراجعة الإدارة.</p>
      <button class="btn secondary" onclick="logout()">تسجيل الخروج</button>
    </div>
  </div>

  <!-- 5. MAIN KITCHEN OWNER DASHBOARD SCREEN -->
  <div id="dashboard-screen">
    <!-- Navbar -->
    <div class="navbar">
      <div class="nav-brand">
        <i class="fa-solid fa-fire-burner" style="color: var(--primary);"></i>
        <span>لوحة كيتشن: <span id="nav-kitchen-name">مطبخي</span></span>
      </div>
      <div class="nav-user">
        <span class="badge active" id="kitchen-status-badge">نشط ومقبول</span>
        <button class="logout-btn" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> خروج</button>
      </div>
    </div>

    <!-- Layout Container -->
    <div class="dashboard-container">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-item active" id="side-tab-overview" onclick="switchTab('overview')">
          <i class="fa-solid fa-chart-pie"></i> نظرة عامة
        </div>
        <div class="sidebar-item" id="side-tab-menu" onclick="switchTab('menu')">
          <i class="fa-solid fa-pizza-slice"></i> قائمة وجباتي (المنيّو)
        </div>
        <div class="sidebar-item" id="side-tab-profile" onclick="switchTab('profile')">
          <i class="fa-solid fa-gear"></i> الإعدادات
        </div>
        <div class="sidebar-item" id="side-tab-financials" onclick="switchTab('financials')">
          <i class="fa-solid fa-wallet"></i> الإدارة المالية
        </div>
        <div class="sidebar-item" id="side-tab-delivery" onclick="switchTab('delivery')">
          <i class="fa-solid fa-truck"></i> التوصيل والديلفري
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        
        <!-- Tab 1: OVERVIEW -->
        <div id="content-overview" class="tab-content active">
          <div class="panel" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none;">
            <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 8px;">مرحباً بك مجدداً في مدينتي كيتشن! 🍳</h2>
            <p style="opacity: 0.9; max-width: 600px;">هنا يمكنك إدارة مطبخك ونشر وجباتك اللذيذة وتحديد أوقات عملك صباحاً ومساءً لمساعدة الزبائن في مدينتي على طلب أطباقك المميزة.</p>
          </div>

          <!-- Stats Row -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon emerald">
                <i class="fa-solid fa-bowl-food"></i>
              </div>
              <div>
                <div class="stat-value" id="stat-total-items">0</div>
                <div class="stat-label">أصناف الطبخات المضافة</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon amber">
                <i class="fa-solid fa-clock"></i>
              </div>
              <div>
                <div class="stat-value" id="stat-schedule-type">طوال اليوم</div>
                <div class="stat-label">توزيع مواعيد الأطباق</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon cyan">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <div class="stat-value" id="stat-trust-score">100 %</div>
                <div class="stat-label">مستوى الموثوقية والثقة</div>
              </div>
            </div>
          </div>

          <div class="panel">
            <h3 class="panel-title"><i class="fa-solid fa-circle-info" style="color: var(--primary);"></i> نصائح لنشر أعمالك بنجاح</h3>
            <ul style="margin-right: 20px; color: var(--text-muted); font-size: 0.95rem; line-height: 2;">
              <li><strong>مواعيد التوفير:</strong> قم بجدولة الطبخات الصباحية (كالفطور والمخبوزات) والمسائية (كالغداء والعشاء) لمساعدة الزبائن على تصفح الأطباق في أوقاتها المحددة.</li>
              <li><strong>الصور الجذابة:</strong> الصور الحقيقية لأكلك تزيد من نسبة الطلبات بأكثر من 150%.</li>
              <li><strong>ساعات العمل:</strong> احرص على تحديث ساعات العمل الخاصة بمطبخك بدقة لتجنب استلام طلبات أثناء الإغلاق.</li>
            </ul>
          </div>
        </div>

        <!-- Tab 2: MENU MANAGEMENT -->
        <div id="content-menu" class="tab-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <div>
              <h2 style="font-weight: 700; font-size: 1.5rem;">قائمة الطبخات والوجبات</h2>
              <p style="color: var(--text-muted); font-size: 0.9rem;">قم بإضافة وتعديل الأكلات التي يوفرها مطبخك المنزلي وجدولتها</p>
            </div>
            <button class="btn" style="width: auto; padding: 10px 24px;" onclick="openAddModal()"><i class="fa-solid fa-plus"></i> إضافة طبخة جديدة</button>
          </div>

          <!-- Items Grid -->
          <div class="menu-grid" id="menu-items-container">
            <!-- Loaded Dynamically -->
          </div>
        </div>

        <!-- Tab 3: PROFILE & WORKING HOURS -->
        <div id="content-profile" class="tab-content">
          <h2 style="font-weight: 700; font-size: 1.5rem; margin-bottom: 25px;">الإعدادات</h2>

          <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 30px; align-items: start;">
            <!-- Profile Form -->
            <div class="panel">
              <h3 class="panel-title"><i class="fa-solid fa-store" style="color: var(--primary);"></i> معلومات الملف التعريفي لمطبخك</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label class="form-label">اسم المطبخ</label>
                  <input type="text" id="prof-name" class="input-field">
                </div>
                <div class="form-group">
                  <label class="form-label">تصنيف الأكل (Cuisine)</label>
                  <input type="text" id="prof-cuisine" class="input-field">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label class="form-label">رقم الهاتف للتواصل</label>
                  <input type="text" id="prof-phone" class="input-field">
                </div>
                <div class="form-group">
                  <label class="form-label">العنوان بالتفصيل</label>
                  <input type="text" id="prof-address" class="input-field">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">قصة المطبخ والوصف</label>
                <textarea id="prof-desc" class="input-field" style="height: 100px; resize: none;"></textarea>
              </div>

              <button class="btn" onclick="saveProfile()" style="width: auto; padding: 10px 30px;"><i class="fa-solid fa-floppy-disk"></i> حفظ معلومات الملف</button>
            </div>

            <!-- Working Hours Form -->
            <div class="panel">
              <h3 class="panel-title"><i class="fa-solid fa-clock" style="color: var(--primary);"></i> إدارة أوقات وساعات العمل</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">قم بتحديد فترات التوفر اليومية للمطبخ لاستقبال الطلبات</p>
              
              <div class="hours-grid" id="working-hours-container">
                <!-- Dynamically Generated Day Rows -->
              </div>

              <button class="btn" onclick="saveWorkingHours()" style="margin-top: 25px;"><i class="fa-solid fa-calendar-check"></i> حفظ ساعات العمل</button>
            </div>
          </div>
        </div>

        <!-- Tab 4: FINANCIAL MANAGEMENT -->
        <div id="content-financials" class="tab-content">
          <h2 style="font-weight: 700; font-size: 1.5rem; margin-bottom: 25px;">الإدارة المالية والحسابات</h2>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon emerald" style="background: rgba(16, 185, 129, 0.1); color: var(--primary);">
                <i class="fa-solid fa-wallet"></i>
              </div>
              <div>
                <div class="stat-value" id="fin-available-balance">1,420 ج.م</div>
                <div class="stat-label">الرصيد الحالي القابل للسحب</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon cyan" style="background: rgba(6, 182, 212, 0.1); color: #0891b2;">
                <i class="fa-solid fa-money-bill-trend-up"></i>
              </div>
              <div>
                <div class="stat-value" id="fin-total-sales">3,850 ج.م</div>
                <div class="stat-label">إجمالي المبيعات</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon amber" style="background: rgba(217, 119, 6, 0.1); color: var(--accent-amber);">
                <i class="fa-solid fa-percentage"></i>
              </div>
              <div>
                <div class="stat-value" id="fin-platform-fees">385 ج.م</div>
                <div class="stat-label">عمولة المنصة الإجمالية (10%)</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                <i class="fa-solid fa-hand-holding-dollar"></i>
              </div>
              <div>
                <div class="stat-value" id="fin-withdrawn-balance">2,045 ج.م</div>
                <div class="stat-label">الرصيد المسحوب مسبقاً</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #d97706;">
                <i class="fa-solid fa-coins"></i>
              </div>
              <div>
                <div class="stat-value" id="fin-tokens-balance">0 TKN</div>
                <div class="stat-label">رصيد الـ Tokens التمويلي</div>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 30px; align-items: start;">
            <!-- Transactions list -->
            <div class="panel" style="overflow: hidden;">
              <h3 class="panel-title"><i class="fa-solid fa-list-check" style="color: var(--primary);"></i> سجل المعاملات المالية والمبيعات</h3>
              
              <div style="overflow-x: auto; margin-top: 15px;">
                <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 0.9rem; min-width: 500px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #e2e8f0; color: var(--text-main); font-weight: 700;">
                      <th style="padding: 12px 8px;">رقم المعاملة</th>
                      <th style="padding: 12px 8px;">التاريخ</th>
                      <th style="padding: 12px 8px;">التفاصيل</th>
                      <th style="padding: 12px 8px;">القيمة</th>
                      <th style="padding: 12px 8px;">العمولة (10%)</th>
                      <th style="padding: 12px 8px;">صافي الربح</th>
                      <th style="padding: 12px 8px;">الحالة</th>
                    </tr>
                  </thead>
                  <tbody id="financial-transactions-tbody">
                    <!-- Loaded dynamically / Mocked -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Payout request & account details -->
            <div class="panel">
              <h3 class="panel-title"><i class="fa-solid fa-building-columns" style="color: var(--primary);"></i> طلب سحب الأرباح</h3>
              
              <div class="form-group" style="margin-top: 15px;">
                <label class="form-label">طريقة استلام الأرباح</label>
                <select id="payout-method" class="input-field" style="height: 52px; padding: 10px 15px;" onchange="togglePayoutDetailsLabel()">
                  <option value="instapay">InstaPay (إنستاباي)</option>
                  <option value="vodafone">Vodafone Cash (فودافون كاش)</option>
                  <option value="bank">حساب بنكي (Bank Transfer)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" id="payout-account-label">عنوان الـ InstaPay (مثال: name@instapay)</label>
                <input type="text" id="payout-account-details" class="input-field" placeholder="name@instapay" style="direction: ltr; text-align: left;">
              </div>

              <div class="form-group">
                <label class="form-label">المبلغ المطلوب سحبه (ج.م)</label>
                <input type="number" id="payout-amount" class="input-field" placeholder="المبلغ المتوفر" min="1">
                <small style="color: var(--text-muted); display: block; margin-top: 6px;">الحد الأدنى للسحب: 100 جنيه مصري.</small>
              </div>

              <button class="btn" onclick="submitWithdrawalRequest()"><i class="fa-solid fa-circle-dollar-to-slot"></i> تقديم طلب السحب</button>
            </div>

            <!-- Convert Cash to Tokens -->
            <div class="panel" style="margin-top: 20px;">
              <h3 class="panel-title"><i class="fa-solid fa-arrow-right-arrow-left" style="color: #d97706;"></i> تحويل الأرباح إلى Tokens تمويلية</h3>
              
              <div class="form-group" style="margin-top: 15px;">
                <label class="form-label">المبلغ المراد تحويله (ج.م)</label>
                <input type="number" id="convert-cash-amount" class="input-field" placeholder="ادخل المبلغ للتحويل" min="1">
                <small style="color: var(--text-muted); display: block; margin-top: 6px;">معدل التحويل: 1 جنيه مصري = 1 Token.</small>
              </div>

              <button class="btn" onclick="convertCashToTokens()" style="background: linear-gradient(135deg, #d97706, #f59e0b); border-color: #d97706; color: white;"><i class="fa-solid fa-rotate"></i> تحويل إلى رصيد التوكنز</button>
            </div>
          </div>
        </div>

        <!-- Tab 5: DELIVERY MANAGEMENT -->
        <div id="content-delivery" class="tab-content">
          <h2 style="font-weight: 700; font-size: 1.5rem; margin-bottom: 25px;">إعدادات التوصيل والديلفري</h2>

          <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 30px; align-items: start;">
            <!-- Options Form -->
            <div class="panel">
              <h3 class="panel-title"><i class="fa-solid fa-truck-ramp-box" style="color: var(--primary);"></i> خيارات وتكلفة التوصيل</h3>
              
              <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
                <!-- Mode checkboxes -->
                <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 12px;">
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600;">
                    <input type="checkbox" id="del-enable-pickup" checked style="width: 18px; height: 18px; accent-color: var(--primary);">
                    <span>السماح للزبون بالاستلام بنفسه من المطبخ (Pickup)</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600;">
                    <input type="checkbox" id="del-enable-self" checked style="width: 18px; height: 18px; accent-color: var(--primary);" onchange="toggleSelfDeliveryInputs()">
                    <span>توفير توصيل خاص عن طريق المطبخ (Self-Delivery)</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600;">
                    <input type="checkbox" id="del-enable-platform" style="width: 18px; height: 18px; accent-color: var(--primary);">
                    <span>الاستعانة بأسطول ديلفري مدينتي كيتشن المشترك (Platform Delivery)</span>
                  </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;">
                  <div class="form-group" id="group-del-fee">
                    <label class="form-label">تكلفة التوصيل الخاص (ج.م)</label>
                    <input type="number" id="del-fee" class="input-field" placeholder="30" style="direction: ltr; text-align: left;">
                  </div>
                  <div class="form-group">
                    <label class="form-label">الوقت المتوقع للتحضير والتوصيل (بالدقائق)</label>
                    <input type="number" id="del-time" class="input-field" placeholder="45" style="direction: ltr; text-align: left;">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">تعليمات خاصة بالتوصيل وملاحظات للزبائن</label>
                  <textarea id="del-notes" class="input-field" placeholder="مثال: يرجى تقديم طلبات العشاء قبل موعد التوصيل بساعتين على الأقل..." style="height: 80px; resize: none;"></textarea>
                </div>
              </div>

              <button class="btn" onclick="saveDeliverySettings()" style="width: auto; padding: 10px 30px; margin-top: 15px;"><i class="fa-solid fa-floppy-disk"></i> حفظ خيارات التوصيل</button>
            </div>

            <!-- Coverage area information card -->
            <div class="panel">
              <h3 class="panel-title"><i class="fa-solid fa-map-location-dot" style="color: var(--primary);"></i> التغطية الجغرافية</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 15px;">نطاق تغطية الكباتن والتوصيل داخل مدينتي</p>
              
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.1); font-size: 0.85rem;">
                  <i class="fa-solid fa-circle-check" style="color: var(--primary); margin-left: 6px;"></i> جميع مناطق مدينتي (من B1 إلى B12) مشمولة في خدمة توصيل المطبخ والتوصيل المشترك.
                </div>
                <div style="background: rgba(217, 119, 6, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(217, 119, 6, 0.1); font-size: 0.85rem;">
                  <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber); margin-left: 6px;"></i> خدمة ديلفري المنصة المشترك تطبق رسوماً ديناميكية بناءً على المسافة الجغرافية بين المطبخ والزبون.
                </div>
            </div>
          </div>
        </div>

        <!-- Express Delivery Requests Section -->
        <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start;">
          <!-- Request Form Panel -->
          <div class="panel">
            <h3 class="panel-title" style="color: var(--primary);"><i class="fa-solid fa-paper-plane"></i> طلب كابتن توصيل Express</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 15px;">استعن بأسطول مدينتي Express لإيصال طلب لعميلك</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">نقطة التسليم في مدينتي</label>
                <input type="text" id="exp-delivery-point" class="input-field" placeholder="مثال: مجموعة 95، عمارة 12، شقة 4">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">اسم العميل المستلم</label>
                <input type="text" id="exp-recipient-name" class="input-field" placeholder="الاسم الكامل للعميل">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">رقم هاتف العميل</label>
                <input type="tel" id="exp-recipient-phone" class="input-field" placeholder="01000000000" style="direction: ltr; text-align: left;">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">ملاحظات الطلب (محتويات الوجبة...)</label>
                <textarea id="exp-notes" class="input-field" placeholder="مثال: وجبة كشري عائلي + بيبسي (الدفع كاش)" style="height: 60px; resize: none;"></textarea>
              </div>

              <button class="btn" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); color: #0f172a;" onclick="requestExpressCourier()"><i class="fa-solid fa-truck-fast"></i> إرسال طلب التوصيل</button>
            </div>
          </div>

          <!-- Tracker Panel -->
          <div class="panel">
            <h3 class="panel-title"><i class="fa-solid fa-clock-rotate-left"></i> متابعة طلبات التوصيل النشطة والتاريخية</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 15px;">مراقبة تحركات الكباتن وحالة توصيل الوجبات</p>
            
            <div class="table-container" style="max-height: 380px; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>نقطة التسليم</th>
                    <th>العميل</th>
                    <th>الكابتن</th>
                    <th>الحالة</th>
                    <th>وقت الطلب</th>
                  </tr>
                </thead>
                <tbody id="express-deliveries-tbody">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  </div>

  <!-- ADD / EDIT DISH MODAL -->
  <div id="dish-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title" style="font-weight: 700;">إضافة طبق جديد</h3>
        <span class="close-btn" onclick="closeModal()">&times;</span>
      </div>

      <input type="hidden" id="modal-dish-id">

      <div class="form-group">
        <label class="form-label">اسم الطبخة/الوجبة</label>
        <input type="text" id="dish-title" class="input-field" placeholder="مثال: طاجن ملوخية بالدجاج البلدي">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">السعر الأساسي (بالجنيه المصري)</label>
          <input type="number" id="dish-price" class="input-field" placeholder="150" style="direction: ltr; text-align: left;">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">التصنيف الرئيسي</label>
          <select id="dish-category" class="input-field" style="height: 52px; padding: 10px 15px;">
            <option value="وجبات رئيسية">وجبات رئيسية (Main)</option>
            <option value="مقبلات وسلطات">مقبلات وسلطات (Appetizers)</option>
            <option value="مخبوزات وفطائر">مخبوزات وفطائر (Bakery)</option>
            <option value="حلويات">حلويات (Desserts)</option>
            <option value="مشروبات">مشروبات (Drinks)</option>
          </select>
        </div>
      </div>

      <!-- Dish Sizes Block -->
      <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 700; margin-bottom: 10px;">
          <input type="checkbox" id="dish-has-sizes" onchange="toggleSizesSection()" style="width: 18px; height: 18px; accent-color: var(--primary);">
          <span>تفعيل أحجام وأسعار متعددة (صغير / وسط / كبير)</span>
        </label>
        
        <div id="sizes-section" style="display: none; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">سعر الحجم الصغير</label>
            <input type="number" id="dish-price-small" class="input-field" placeholder="100" style="direction: ltr; text-align: left; height: 42px;">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">سعر الحجم الوسط</label>
            <input type="number" id="dish-price-medium" class="input-field" placeholder="150" style="direction: ltr; text-align: left; height: 42px;">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">سعر الحجم الكبير</label>
            <input type="number" id="dish-price-large" class="input-field" placeholder="200" style="direction: ltr; text-align: left; height: 42px;">
          </div>
        </div>
      </div>

      <!-- Dish Addons Block -->
      <div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="font-weight: 700; margin: 0; font-size: 0.9rem; color: var(--text-main);"><i class="fa-solid fa-circle-plus" style="color: var(--primary); margin-left: 6px;"></i> الملحقات والإضافات للطلب</h4>
          <button type="button" class="action-btn" onclick="addAddonRow()" style="background: var(--primary); color: white; padding: 4px 8px; font-size: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-family: var(--font-cairo); font-weight:600;">+ إضافة ملحق</button>
        </div>
        
        <div id="addons-list-container" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Dynamically populated rows -->
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label class="form-label">جدولة التوفر للوجبة</label>
          <select id="dish-schedule" class="input-field" style="height: 52px; padding: 10px 15px;">
            <option value="ALL_DAY">طوال اليوم (All Day)</option>
            <option value="MORNING">صباحاً وفطور (Morning)</option>
            <option value="EVENING">مساءً وغداء وعشاء (Evening)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">رابط صورة الوجبة (اختياري)</label>
          <input type="text" id="dish-image" class="input-field" placeholder="https://..." style="direction: ltr; text-align: left;">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">المكونات وتفاصيل الطبخة</label>
        <textarea id="dish-desc" class="input-field" placeholder="مثال: خضار طازج، دجاج متبل، ثوم وكزبرة بلدي، يقدم مع أرز..." style="height: 80px; resize: none;"></textarea>
      </div>

      <button class="btn" onclick="saveDish()"><i class="fa-solid fa-check"></i> حفظ الطبخة في القائمة</button>
    </div>
  </div>

  <script>
    const API_URL = '${apiBaseUrl}';
    let token = localStorage.getItem('kitchen_token') || '';
    let currentPhoneNumber = '';
    let myBusiness = null;
    let kitchensPage = 1;
    let menuItemsList = [];

    // Weekdays Mapping
    const DAYS_MAP = {
      mon: 'الإثنين',
      tue: 'الثلاثاء',
      wed: 'الأربعاء',
      thu: 'الخميس',
      fri: 'الجمعة',
      sat: 'السبت',
      sun: 'الأحد'
    };

    // Auto Login on boot
    window.addEventListener('DOMContentLoaded', () => {
      if (token) {
        checkBusinessStatus();
      } else {
        showScreen('auth-screen');
      }
      generateHoursFormFields();
    });

    function showScreen(screenId) {
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('registration-screen').style.display = 'none';
      document.getElementById('pending-screen').style.display = 'none';
      document.getElementById('rejected-screen').style.display = 'none';
      document.getElementById('dashboard-screen').style.display = 'none';

      const scr = document.getElementById(screenId);
      if (scr) {
        if (screenId === 'dashboard-screen') scr.style.display = 'grid';
        else scr.style.display = 'flex';
      }
    }

    async function sendOtp(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      const sendBtn = document.getElementById('send-otp-btn');
      if (sendBtn && sendBtn.disabled) return;

      let phone = document.getElementById('auth-phone').value.trim();
      if (!phone) return alert('الرجاء إدخال رقم الهاتف.');

      currentPhoneNumber = phone;
      const originalText = sendBtn ? sendBtn.textContent : '';

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'جاري طلب رمز التحقق...';
      }

      try {
        const res = await fetch(\`\${API_URL}/auth/login\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone })
        });
        if (res.ok) {
          document.getElementById('auth-stage-phone').style.display = 'none';
          document.getElementById('auth-stage-otp').style.display = 'block';
        } else {
          // If login failed because user not found, trigger register flow automatically (Ecosystem policy)
          const regRes = await fetch(\`\${API_URL}/auth/register\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
          });
          if (regRes.ok) {
            document.getElementById('auth-stage-phone').style.display = 'none';
            document.getElementById('auth-stage-otp').style.display = 'block';
          } else {
            alert('حدث خطأ أثناء الاتصال بالخادم.');
          }
        }
      } catch (err) {
        alert('فشل الاتصال بالإنترنت.');
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = originalText || 'طلب رمز التحقق';
        }
      }
    }

    function goBackToPhone(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      document.getElementById('auth-stage-phone').style.display = 'block';
      document.getElementById('auth-stage-otp').style.display = 'none';
    }

    async function verifyOtp(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      const verifyBtn = document.getElementById('verify-otp-btn');
      if (verifyBtn && verifyBtn.disabled) return;

      const code = document.getElementById('auth-otp').value.trim();
      if (!code) return alert('أدخل رمز التحقق.');

      const originalText = verifyBtn ? verifyBtn.textContent : '';

      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'جاري التحقق...';
      }

      try {
        const res = await fetch(\`\${API_URL}/auth/verify-otp\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: currentPhoneNumber, code })
        });
        const envelope = await res.json();
        if (res.ok) {
          token = envelope.data.token;
          localStorage.setItem('kitchen_token', token);
          checkBusinessStatus();
        } else {
          alert('رمز التحقق غير صحيح أو منتهي الصلاحية.');
        }
      } catch (err) {
        alert('حدث خطأ في الشبكة.');
      } finally {
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = originalText || 'تأكيد وتسجيل الدخول';
        }
      }
    }

    function logout() {
      token = '';
      myBusiness = null;
      localStorage.removeItem('kitchen_token');
      document.getElementById('auth-phone').value = '';
      document.getElementById('auth-otp').value = '';
      document.getElementById('auth-stage-phone').style.display = 'block';
      document.getElementById('auth-stage-otp').style.display = 'none';
      showScreen('auth-screen');
    }

    // Business Status Checker
    async function checkBusinessStatus() {
      try {
        const res = await fetch(\`\${API_URL}/business/my-kitchen\`, {
          headers: { 
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kitchen'
          }
        });
        const envelope = await res.json();
        
        if (res.status === 401) {
          logout();
          return;
        }

        const biz = envelope.data;
        if (!biz) {
          showScreen('registration-screen');
        } else {
          myBusiness = biz;
          if (biz.status === 'PENDING') {
            document.getElementById('pending-biz-name').textContent = biz.name;
            document.getElementById('pending-biz-slug').textContent = biz.slug;
            showScreen('pending-screen');
          } else if (biz.status === 'REJECTED') {
            showScreen('rejected-screen');
          } else if (biz.status === 'APPROVED') {
            setupDashboard(biz);
          }
        }
      } catch (err) {
        console.error(err);
        alert('فشل الاتصال بجلب معلومات المطبخ.');
      }
    }

    // Submit Kitchen Registration
    async function submitRegistration() {
      const name = document.getElementById('reg-name').value.trim();
      const slug = document.getElementById('reg-slug').value.trim();
      const cuisine = document.getElementById('reg-cuisine').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const address = document.getElementById('reg-address').value.trim();
      const desc = document.getElementById('reg-desc').value.trim();

      if (!name || !slug || !cuisine || !phone || !address) {
        return alert('الرجاء تعبئة كافة التفاصيل الإدارية للمطبخ.');
      }

      try {
        const res = await fetch(\`\${API_URL}/business\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kitchen'
          },
          body: JSON.stringify({
            name,
            slug,
            cuisineType: cuisine,
            phone,
            address,
            description: desc,
            branding: {}
          })
        });
        if (res.ok) {
          checkBusinessStatus();
        } else {
          const envelope = await res.json();
          alert(envelope.message || 'فشل في إرسال طلب التفعيل. ربما معرف المطبخ مستخدم بالفعل.');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالشبكة.');
      }
    }

    // Dashboard setup
    function setupDashboard(biz) {
      document.getElementById('nav-kitchen-name').textContent = biz.name;
      document.getElementById('prof-name').value = biz.name || '';
      document.getElementById('prof-cuisine').value = biz.cuisineType || '';
      document.getElementById('prof-phone').value = biz.phone || '';
      document.getElementById('prof-address').value = biz.address || '';
      document.getElementById('prof-desc').value = biz.description || '';

      // Populate hours if they exist
      if (biz.openingHours) {
        populateHoursFields(biz.openingHours);
      }

      // Fetch Menu Items
      fetchMenu();

      // Show Dashboard screen
      showScreen('dashboard-screen');
      switchTab('overview');
    }

    // Tab Switching
    function switchTab(tabId) {
      document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

      document.getElementById(\`side-tab-\${tabId}\`).classList.add('active');
      document.getElementById(\`content-\${tabId}\`).classList.add('active');

      if (tabId === 'menu') {
        fetchMenu();
      }
      if (tabId === 'financials') {
        renderFinancials();
      }
      if (tabId === 'delivery') {
        renderDeliverySettings();
        fetchExpressDeliveries();
      }
    }

    // Fetch and Render Menu Items
    async function fetchMenu() {
      try {
        const res = await fetch(API_URL + '/business/my-menu', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'kitchen'
          }
        });
        const envelope = await res.json();
        const items = envelope.data;

        if (res.ok) {
          menuItemsList = items || [];
          renderMenuItems(menuItemsList);
          document.getElementById('stat-total-items').textContent = menuItemsList.length;
          
          // Determine schedules counts
          let morningCount = menuItemsList.filter(function(i) { return i.scheduleType === 'MORNING'; }).length;
          let eveningCount = menuItemsList.filter(function(i) { return i.scheduleType === 'EVENING'; }).length;
          document.getElementById('stat-schedule-type').textContent = morningCount + ' صباحي / ' + eveningCount + ' مسائي';
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderMenuItems(items) {
      const container = document.getElementById('menu-items-container');
      if (!items || items.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-muted);">' +
            '<i class="fa-solid fa-cookie-bite" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px; display: block;"></i>' +
            'لا توجد وجبات في المنيّو الخاص بك بعد. اضغط على إضافة طبق للبدء بالنشر!' +
          '</div>';
        return;
      }

      container.innerHTML = items.map(function(item) {
        let schedText = 'طوال اليوم';
        let schedClass = 'info';
        if (item.scheduleType === 'MORNING') {
          schedText = 'صباحاً (فطور)';
          schedClass = 'pending';
        } else if (item.scheduleType === 'EVENING') {
          schedText = 'مساءً (غداء/عشاء)';
          schedClass = 'active';
        }

        const imgUrl = item.imageUrl || 'https://placehold.co/400x300/e6f4ea/059669?text=Meal';

        // Parse meta
        let descText = item.description || 'لا يوجد وصف مضاف لهذه الوجبة.';
        let sizesHtml = '';
        let addonsHtml = '';
        
        try {
          if (item.description && item.description.startsWith('{')) {
            const parsed = JSON.parse(item.description);
            descText = parsed.text || '';
            if (parsed.sizes) {
              sizesHtml = '<div style="font-size: 0.8rem; margin: 8px 0; color: var(--text-main); font-weight:600; display:flex; gap:8px; flex-wrap:wrap;">' +
                '<span style="background:rgba(5, 150, 105, 0.08); color:var(--primary); padding:2px 8px; border-radius:6px; border: 1px solid rgba(5, 150, 105, 0.15); font-family: var(--font-cairo);">صغير: ' + parsed.sizes.small + ' ج.م</span>' +
                '<span style="background:rgba(5, 150, 105, 0.08); color:var(--primary); padding:2px 8px; border-radius:6px; border: 1px solid rgba(5, 150, 105, 0.15); font-family: var(--font-cairo);">وسط: ' + parsed.sizes.medium + ' ج.م</span>' +
                '<span style="background:rgba(5, 150, 105, 0.08); color:var(--primary); padding:2px 8px; border-radius:6px; border: 1px solid rgba(5, 150, 105, 0.15); font-family: var(--font-cairo);">كبير: ' + parsed.sizes.large + ' ج.م</span>' +
                '</div>';
            }
            if (Array.isArray(parsed.addons) && parsed.addons.length > 0) {
              addonsHtml = '<div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px; padding-top:6px; border-top:1px dashed #e2e8f0; font-family: var(--font-cairo);">' +
                '<strong style="color:var(--text-main);"><i class="fa-solid fa-puzzle-piece" style="color: var(--primary); margin-left: 3px;"></i> إضافات متاحة:</strong> ' +
                parsed.addons.map(function(add) {
                  return add.name + ' (+' + add.price + ' ج.م)';
                }).join('، ') +
                '</div>';
            }
          }
        } catch (e) {
          console.error(e);
        }

        const priceText = sizesHtml ? 'أسعار متعددة' : (item.price || 0) + ' ج.م';

        return '<div class="menu-item-card">' +
            '<img src="' + imgUrl + '" class="menu-item-image" alt="' + item.title + '">' +
            '<div class="menu-item-info">' +
              '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">' +
                '<h4 class="menu-item-title">' + item.title + '</h4>' +
                '<span class="badge ' + (item.isAvailable ? 'active' : 'inactive') + '">' + (item.isAvailable ? 'متوفر' : 'غير متوفر') + '</span>' +
              '</div>' +
              '<p class="menu-item-desc">' + descText + '</p>' +
              sizesHtml +
              addonsHtml +
              '<div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px;">' +
                '<div class="menu-item-price">' + priceText + '</div>' +
                '<span class="badge ' + schedClass + '">' + schedText + '</span>' +
              '</div>' +
              '<div class="menu-item-footer">' +
                '<span style="font-size:0.8rem; color:var(--text-muted);">الفئة: ' + (item.category || 'غير مصنف') + '</span>' +
                '<div class="card-actions">' +
                  '<button class="btn-circle" onclick="openEditModalById(\\\'' + item.id + '\\\')"><i class="fa-solid fa-pen"></i></button>' +
                  '<button class="btn-circle delete" onclick="deleteDish(\\\'' + item.id + '\\\')"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
      }).join('');
    }

    // Modal Operations
    function openAddModal() {
      document.getElementById('modal-title').textContent = 'إضافة طبق جديد';
      document.getElementById('modal-dish-id').value = '';
      document.getElementById('dish-title').value = '';
      document.getElementById('dish-price').value = '';
      document.getElementById('dish-category').value = 'وجبات رئيسية';
      document.getElementById('dish-schedule').value = 'ALL_DAY';
      document.getElementById('dish-image').value = '';
      document.getElementById('dish-desc').value = '';
      
      document.getElementById('dish-has-sizes').checked = false;
      document.getElementById('sizes-section').style.display = 'none';
      document.getElementById('dish-price').disabled = false;
      document.getElementById('dish-price-small').value = '';
      document.getElementById('dish-price-medium').value = '';
      document.getElementById('dish-price-large').value = '';
      document.getElementById('addons-list-container').innerHTML = '';
      
      document.getElementById('dish-modal').style.display = 'flex';
    }

    function openEditModalById(id) {
      const item = menuItemsList.find(function(i) { return i.id === id; });
      if (!item) return;

      let descText = item.description || '';
      let hasSizes = false;
      let priceSmall = '';
      let priceMedium = '';
      let priceLarge = '';
      let addons = [];

      try {
        if (item.description && item.description.startsWith('{')) {
          const parsed = JSON.parse(item.description);
          descText = parsed.text || '';
          if (parsed.sizes) {
            hasSizes = true;
            priceSmall = parsed.sizes.small || '';
            priceMedium = parsed.sizes.medium || '';
            priceLarge = parsed.sizes.large || '';
          }
          addons = Array.isArray(parsed.addons) ? parsed.addons : [];
        }
      } catch (e) {
        console.error('Error parsing item details JSON:', e);
      }

      document.getElementById('modal-title').textContent = 'تعديل الوجبة';
      document.getElementById('modal-dish-id').value = item.id;
      document.getElementById('dish-title').value = item.title;
      document.getElementById('dish-price').value = hasSizes ? priceMedium : (item.price || '');
      document.getElementById('dish-category').value = item.category || 'وجبات رئيسية';
      document.getElementById('dish-schedule').value = item.scheduleType || 'ALL_DAY';
      document.getElementById('dish-image').value = item.imageUrl || '';
      document.getElementById('dish-desc').value = descText;

      document.getElementById('dish-has-sizes').checked = hasSizes;
      document.getElementById('sizes-section').style.display = hasSizes ? 'grid' : 'none';
      document.getElementById('dish-price').disabled = hasSizes;
      document.getElementById('dish-price-small').value = priceSmall;
      document.getElementById('dish-price-medium').value = priceMedium;
      document.getElementById('dish-price-large').value = priceLarge;

      const addonsContainer = document.getElementById('addons-list-container');
      addonsContainer.innerHTML = '';
      addons.forEach(function(add) {
        addAddonRow(add.name, add.price);
      });
      
      document.getElementById('dish-modal').style.display = 'flex';
    }

    function toggleSizesSection() {
      const hasSizes = document.getElementById('dish-has-sizes').checked;
      document.getElementById('sizes-section').style.display = hasSizes ? 'grid' : 'none';
      document.getElementById('dish-price').disabled = hasSizes;
      if (hasSizes) {
        document.getElementById('dish-price').value = '';
      }
    }

    function addAddonRow(name = '', price = '') {
      const container = document.getElementById('addons-list-container');
      const div = document.createElement('div');
      div.className = 'addon-row';
      div.style.display = 'grid';
      div.style.gridTemplateColumns = '3fr 1fr auto';
      div.style.gap = '8px';
      div.style.alignItems = 'center';
      
      div.innerHTML = 
        '<input type="text" class="input-field addon-name" placeholder="اسم الإضافة (مثال: أرز زيادة)" value="' + name + '" style="height: 38px; font-size: 0.85rem;">' +
        '<input type="number" class="input-field addon-price" placeholder="+20" value="' + price + '" style="direction: ltr; text-align: left; height: 38px; font-size: 0.85rem;">' +
        '<button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 1.1rem; padding: 0 5px;"><i class="fa-solid fa-trash-can"></i></button>';
      
      container.appendChild(div);
    }

    function closeModal() {
      document.getElementById('dish-modal').style.display = 'none';
    }

    async function saveDish() {
      const id = document.getElementById('modal-dish-id').value;
      const title = document.getElementById('dish-title').value.trim();
      const price = parseFloat(document.getElementById('dish-price').value);
      const category = document.getElementById('dish-category').value;
      const scheduleType = document.getElementById('dish-schedule').value;
      const imageUrl = document.getElementById('dish-image').value.trim();
      const descText = document.getElementById('dish-desc').value.trim();

      if (!title) return alert('الرجاء إدخال اسم الطبخة.');

      const hasSizes = document.getElementById('dish-has-sizes').checked;
      const priceSmall = parseFloat(document.getElementById('dish-price-small').value);
      const priceMedium = parseFloat(document.getElementById('dish-price-medium').value);
      const priceLarge = parseFloat(document.getElementById('dish-price-large').value);

      if (hasSizes && (isNaN(priceSmall) || isNaN(priceMedium) || isNaN(priceLarge))) {
        return alert('الرجاء إدخال أسعار المقاسات الثلاثة بشكل صحيح.');
      }

      if (!hasSizes && isNaN(price)) {
        return alert('الرجاء إدخال السعر الأساسي للوجبة.');
      }

      const addonRows = document.querySelectorAll('.addon-row');
      const addons = [];
      let addonError = false;
      addonRows.forEach(function(row) {
        const nameVal = row.querySelector('.addon-name').value.trim();
        const priceVal = parseFloat(row.querySelector('.addon-price').value);
        if (nameVal && !isNaN(priceVal)) {
          addons.push({ name: nameVal, price: priceVal });
        } else if (nameVal || !isNaN(priceVal)) {
          addonError = true;
        }
      });

      if (addonError) {
        return alert('الرجاء تعبئة اسم الإضافة وسعرها بشكل صحيح في صفوف الملحقات.');
      }

      // Compile description text
      let description = '';
      if (hasSizes || addons.length > 0) {
        const meta = {
          text: descText,
          sizes: hasSizes ? { small: priceSmall, medium: priceMedium, large: priceLarge } : null,
          addons: addons
        };
        description = JSON.stringify(meta);
      } else {
        description = descText;
      }

      const finalPrice = hasSizes ? priceMedium : price;
      const url = id ? (API_URL + '/business/my-menu/' + id) : (API_URL + '/business/my-menu');
      const method = id ? 'PATCH' : 'POST';

      try {
        const res = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'kitchen'
          },
          body: JSON.stringify({
            title: title,
            price: finalPrice,
            category: category,
            scheduleType: scheduleType,
            imageUrl: imageUrl,
            description: description,
            isAvailable: true
          })
        });

        if (res.ok) {
          closeModal();
          fetchMenu();
        } else {
          alert('فشل في حفظ الطبخة.');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالشبكة.');
      }
    }

    async function deleteDish(id) {
      if (!confirm('هل أنت متأكد من حذف هذه الطبخة من قائمة طعامك؟')) return;

      try {
        const res = await fetch(\`\${API_URL}/business/my-menu/\${id}\`, {
          method: 'DELETE',
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kitchen'
          }
        });
        if (res.ok) {
          fetchMenu();
        } else {
          alert('فشل في حذف الطبخة.');
        }
      } catch (err) {
        alert('خطأ في الاتصال.');
      }
    }

    // Profile Settings save
    async function saveProfile() {
      const name = document.getElementById('prof-name').value.trim();
      const cuisine = document.getElementById('prof-cuisine').value.trim();
      const phone = document.getElementById('prof-phone').value.trim();
      const address = document.getElementById('prof-address').value.trim();
      const desc = document.getElementById('prof-desc').value.trim();

      if (!name) return alert('اسم المطبخ مطلوب.');

      try {
        const res = await fetch(\`\${API_URL}/business/\${myBusiness.id}/profile\`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kitchen'
          },
          body: JSON.stringify({
            name,
            cuisineType: cuisine,
            phone,
            address,
            description: desc
          })
        });

        if (res.ok) {
          alert('تم حفظ معلومات الملف التعريفي بنجاح!');
          checkBusinessStatus();
        } else {
          alert('فشل في حفظ الملف.');
        }
      } catch (err) {
        alert('خطأ في الاتصال.');
      }
    }

    // Opening Hours Generation & Save
    function generateHoursFormFields() {
      const container = document.getElementById('working-hours-container');
      container.innerHTML = Object.keys(DAYS_MAP).map(dayKey => {
        return \`
          <div class="day-row" data-day="\${dayKey}">
            <span class="day-name">\${DAYS_MAP[dayKey]}</span>
            <label class="switch">
              <input type="checkbox" class="day-closed-toggle" onchange="toggleDayInputs('\${dayKey}')" checked>
              <span class="slider"></span>
            </label>
            <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex-grow: 1; direction: ltr;">
              <input type="time" class="time-open input-field" value="09:00" style="padding: 6px; height: 36px; display: inline-block; width: 100px; text-align: center;">
              <span style="font-size: 0.85rem; color:var(--text-muted); flex-shrink:0;">إلى</span>
              <input type="time" class="time-close input-field" value="22:00" style="padding: 6px; height: 36px; display: inline-block; width: 100px; text-align: center;">
            </div>
          </div>
        \`;
      }).join('');
    }

    function toggleDayInputs(dayKey) {
      const row = document.querySelector(\`.day-row[data-day="\${dayKey}"]\`);
      const checked = row.querySelector('.day-closed-toggle').checked;
      row.querySelector('.time-open').disabled = !checked;
      row.querySelector('.time-close').disabled = !checked;
    }

    function populateHoursFields(hours) {
      Object.keys(hours).forEach(day => {
        const row = document.querySelector(\`.day-row[data-day="\${day}"]\`);
        if (row) {
          const config = hours[day];
          row.querySelector('.day-closed-toggle').checked = !config.closed;
          row.querySelector('.time-open').value = config.open || '09:00';
          row.querySelector('.time-close').value = config.close || '22:00';
          toggleDayInputs(day);
        }
      });
    }

    async function saveWorkingHours() {
      const hours = {};
      document.querySelectorAll('.day-row').forEach(row => {
        const day = row.getAttribute('data-day');
        const active = row.querySelector('.day-closed-toggle').checked;
        const open = row.querySelector('.time-open').value;
        const close = row.querySelector('.time-close').value;

        hours[day] = {
          open,
          close,
          closed: !active
        };
      });

      try {
        const res = await fetch(\`\${API_URL}/business/\${myBusiness.id}/profile\`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kitchen'
          },
          body: JSON.stringify({
            openingHours: hours
          })
        });

        if (res.ok) {
          alert('تم حفظ ساعات العمل بنجاح!');
        } else {
          alert('فشل في حفظ أوقات العمل.');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالشبكة.');
      }
    }

    // ────────────────────── FINANCIAL MANAGEMENT ──────────────────────
    let balanceState = {
      available: 1420,
      sales: 3850,
      fees: 385,
      withdrawn: 2045
    };

    let payoutTransactions = [
      { id: 'TX-9841', date: '2026-07-09', details: 'طاجن ملوخية + أرز بلدي', amount: 180, commission: 18, net: 162, status: 'completed' },
      { id: 'TX-8822', date: '2026-07-08', details: 'ورق عنب عائلي + كفتة', amount: 450, commission: 45, net: 405, status: 'completed' },
      { id: 'TX-8711', date: '2026-07-07', details: 'صينية بشاميل + فراخ شواية', amount: 320, commission: 32, net: 288, status: 'completed' },
      { id: 'TX-8604', date: '2026-07-05', details: 'طاجن بامية باللحم الضأن', amount: 290, commission: 29, net: 261, status: 'completed' }
    ];

    function renderFinancials() {
      if (myBusiness && myBusiness.branding?.financials) {
        const fin = myBusiness.branding.financials;
        balanceState.available = typeof fin.available === 'number' ? fin.available : balanceState.available;
        balanceState.sales = typeof fin.sales === 'number' ? fin.sales : balanceState.sales;
        balanceState.fees = typeof fin.fees === 'number' ? fin.fees : balanceState.fees;
        balanceState.withdrawn = typeof fin.withdrawn === 'number' ? fin.withdrawn : balanceState.withdrawn;

        // Restore custom Instapay/Vodafone inputs
        if (fin.method) {
          document.getElementById('payout-method').value = fin.method;
          togglePayoutDetailsLabel();
        }
        if (fin.accountDetails) {
          document.getElementById('payout-account-details').value = fin.accountDetails;
        }

        // Restore submitted withdrawal requests
        if (Array.isArray(fin.customTransactions)) {
          const baseTx = [
            { id: 'TX-9841', date: '2026-07-09', details: 'طاجن ملوخية + أرز بلدي', amount: 180, commission: 18, net: 162, status: 'completed' },
            { id: 'TX-8822', date: '2026-07-08', details: 'ورق عنب عائلي + كفتة', amount: 450, commission: 45, net: 405, status: 'completed' },
            { id: 'TX-8711', date: '2026-07-07', details: 'صينية بشاميل + فراخ شواية', amount: 320, commission: 32, net: 288, status: 'completed' },
            { id: 'TX-8604', date: '2026-07-05', details: 'طاجن بامية باللحم الضأن', amount: 290, commission: 29, net: 261, status: 'completed' }
          ];
          payoutTransactions = [...fin.customTransactions, ...baseTx];
        }
      }

      // Update Card Values
      document.getElementById('fin-available-balance').textContent = balanceState.available.toLocaleString() + ' ج.م';
      document.getElementById('fin-total-sales').textContent = balanceState.sales.toLocaleString() + ' ج.م';
      document.getElementById('fin-platform-fees').textContent = balanceState.fees.toLocaleString() + ' ج.م';
      document.getElementById('fin-withdrawn-balance').textContent = balanceState.withdrawn.toLocaleString() + ' ج.م';

      const tokensBal = myBusiness && myBusiness.branding && myBusiness.branding.financials && typeof myBusiness.branding.financials.tokensBalance === 'number'
        ? myBusiness.branding.financials.tokensBalance
        : 0;
      document.getElementById('fin-tokens-balance').textContent = tokensBal.toLocaleString() + ' TKN';

      // Render transactions table
      const tbody = document.getElementById('financial-transactions-tbody');
      tbody.innerHTML = payoutTransactions.map(tx => {
        let statusBadge = '';
        if (tx.status === 'completed') {
          statusBadge = '<span class="badge active">مكتمل</span>';
        } else if (tx.status === 'pending') {
          statusBadge = '<span class="badge pending">قيد المراجعة</span>';
        } else {
          statusBadge = '<span class="badge inactive">' + tx.status + '</span>';
        }

        const formattedAmount = tx.amount.toLocaleString() + ' ج.م';
        const formattedCommission = tx.commission > 0 ? tx.commission.toLocaleString() + ' ج.م' : '-';
        const formattedNet = tx.net.toLocaleString() + ' ج.م';

        return '<tr style="border-bottom: 1px solid #f1f5f9;">' +
            '<td style="padding: 12px 8px; direction: ltr; text-align: right;"><code>' + tx.id + '</code></td>' +
            '<td style="padding: 12px 8px;">' + tx.date + '</td>' +
            '<td style="padding: 12px 8px;">' + tx.details + '</td>' +
            '<td style="padding: 12px 8px; font-weight: 600; color: var(--text-main);">' + formattedAmount + '</td>' +
            '<td style="padding: 12px 8px; color: var(--accent-rose);">' + formattedCommission + '</td>' +
            '<td style="padding: 12px 8px; font-weight: 700; color: var(--primary);">' + formattedNet + '</td>' +
            '<td style="padding: 12px 8px;">' + statusBadge + '</td>' +
          '</tr>';
      }).join('');
    }

    function togglePayoutDetailsLabel() {
      const method = document.getElementById('payout-method').value;
      const label = document.getElementById('payout-account-label');
      const input = document.getElementById('payout-account-details');

      if (method === 'instapay') {
        label.textContent = 'عنوان الـ InstaPay (مثال: name@instapay)';
        input.placeholder = 'name@instapay';
      } else if (method === 'vodafone') {
        label.textContent = 'رقم المحفظة الإلكترونية (مثال: 010xxxxxxxx)';
        input.placeholder = '01000000000';
      } else if (method === 'bank') {
        label.textContent = 'رقم الحساب البنكي أو الـ IBAN (مثال: EGxxxxxxxxxxxxxxxxxxxxxx)';
        input.placeholder = 'EG0000000000000000000000000';
      }
    }

    async function submitWithdrawalRequest() {
      const method = document.getElementById('payout-method').value;
      const accountDetails = document.getElementById('payout-account-details').value.trim();
      const amount = parseFloat(document.getElementById('payout-amount').value);

      if (!accountDetails) {
        return alert('الرجاء إدخال تفاصيل الحساب لاستلام الأموال.');
      }
      if (isNaN(amount) || amount <= 0) {
        return alert('الرجاء إدخال مبلغ صحيح للسحب.');
      }
      if (amount < 100) {
        return alert('الحد الأدنى لطلب السحب هو 100 جنيه مصري.');
      }
      if (amount > balanceState.available) {
        return alert('رصيدك المتوفر غير كافٍ لإتمام عملية السحب المطلوبة.');
      }

      // Process Withdrawal (Simulation)
      balanceState.available -= amount;
      balanceState.withdrawn += amount;

      const newTx = {
        id: 'WD-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().split('T')[0],
        details: 'طلب سحب أرباح (' + (method === 'instapay' ? 'InstaPay' : method === 'vodafone' ? 'فودافون كاش' : 'تحويل بنكي') + ')',
        amount: amount,
        commission: 0,
        net: amount,
        status: 'pending'
      };

      const customTxList = myBusiness?.branding?.financials?.customTransactions || [];
      customTxList.unshift(newTx);

      // Save to branding database
      await saveFinancialBranding({
        available: balanceState.available,
        withdrawn: balanceState.withdrawn,
        method: method,
        accountDetails: accountDetails,
        customTransactions: customTxList
      });

      alert('تم تقديم طلب السحب بنجاح! الرصيد قيد المراجعة الآن من قبل الإدارة المالية.');
      
      // Reset inputs
      document.getElementById('payout-amount').value = '';
      
      // Re-render
      renderFinancials();
    }

    async function convertCashToTokens() {
      const amount = parseFloat(document.getElementById('convert-cash-amount').value);

      if (isNaN(amount) || amount <= 0) {
        return alert('الرجاء إدخال مبلغ صحيح للتحويل.');
      }
      if (amount > balanceState.available) {
        return alert('رصيدك المالي المتوفر غير كافٍ لإتمام عملية التحويل.');
      }

      // Simulation
      balanceState.available -= amount;

      const currentTokens = myBusiness && myBusiness.branding && myBusiness.branding.financials && typeof myBusiness.branding.financials.tokensBalance === 'number'
        ? myBusiness.branding.financials.tokensBalance
        : 0;
      const newTokensBal = currentTokens + amount;

      const newFinancialTx = {
        id: 'CONV-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().split('T')[0],
        details: 'تحويل أرباح نقدية إلى توكنز تمويلية',
        amount: amount,
        commission: 0,
        net: amount,
        status: 'completed'
      };

      const newTokenTx = {
        id: 'TKN-' + Math.floor(10000 + Math.random() * 90000),
        date: new Date().toISOString(),
        type: 'credit',
        amount: amount,
        reason: 'شحن رصيد تحويل من أرباح المطبخ النقدية'
      };

      const customTxList = myBusiness?.branding?.financials?.customTransactions || [];
      customTxList.unshift(newFinancialTx);

      const tokenTxList = myBusiness?.branding?.financials?.tokenTransactions || [];
      tokenTxList.unshift(newTokenTx);

      await saveFinancialBranding({
        available: balanceState.available,
        tokensBalance: newTokensBal,
        customTransactions: customTxList,
        tokenTransactions: tokenTxList
      });

      alert('تم تحويل المبلغ إلى رصيد التوكنز التمويلي بنجاح!');
      document.getElementById('convert-cash-amount').value = '';
      renderFinancials();
    }

    async function saveFinancialBranding(financialData) {
      if (!myBusiness) return;
      
      const updatedBranding = { 
        ...(myBusiness.branding || {}), 
        financials: {
          ...(myBusiness.branding?.financials || {}),
          ...financialData
        }
      };

      try {
        const res = await fetch(API_URL + '/business/' + myBusiness.id + '/branding', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'kitchen'
          },
          body: JSON.stringify({ branding: updatedBranding })
        });
        if (res.ok) {
          myBusiness.branding = updatedBranding;
        } else {
          console.error("Failed to save financial branding data.");
        }
      } catch (err) {
        console.error("Network error saving financial branding:", err);
      }
    }

    // ────────────────────── DELIVERY & COURIER MANAGEMENT ──────────────────────
    function renderDeliverySettings() {
      if (myBusiness && myBusiness.branding && myBusiness.branding.delivery) {
        const del = myBusiness.branding.delivery;
        document.getElementById('del-enable-pickup').checked = del.enablePickup !== false;
        document.getElementById('del-enable-self').checked = del.enableSelf !== false;
        document.getElementById('del-enable-platform').checked = del.enablePlatform === true;
        document.getElementById('del-fee').value = typeof del.fee === 'number' ? del.fee : '';
        document.getElementById('del-time').value = typeof del.time === 'number' ? del.time : '';
        document.getElementById('del-notes').value = del.notes || '';
        toggleSelfDeliveryInputs();
      }
    }

    function toggleSelfDeliveryInputs() {
      const selfEnabled = document.getElementById('del-enable-self').checked;
      document.getElementById('del-fee').disabled = !selfEnabled;
    }

    async function saveDeliverySettings() {
      if (!myBusiness) return;

      const enablePickup = document.getElementById('del-enable-pickup').checked;
      const enableSelf = document.getElementById('del-enable-self').checked;
      const enablePlatform = document.getElementById('del-enable-platform').checked;
      const fee = parseFloat(document.getElementById('del-fee').value);
      const time = parseInt(document.getElementById('del-time').value);
      const notes = document.getElementById('del-notes').value.trim();

      if (enableSelf && (isNaN(fee) || fee < 0)) {
        return alert('الرجاء إدخال رسوم توصيل صحيحة للتوصيل الخاص.');
      }

      const deliveryData = {
        enablePickup: enablePickup,
        enableSelf: enableSelf,
        enablePlatform: enablePlatform,
        fee: isNaN(fee) ? 0 : fee,
        time: isNaN(time) ? 0 : time,
        notes: notes
      };

      const updatedBranding = {
        ...(myBusiness.branding || {}),
        delivery: deliveryData
      };

      try {
        const res = await fetch(API_URL + '/business/' + myBusiness.id + '/branding', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'x-tenant-id': 'kitchen'
          },
          body: JSON.stringify({ branding: updatedBranding })
        });

        if (res.ok) {
          myBusiness.branding = updatedBranding;
          alert('تم حفظ إعدادات التوصيل والديلفري بنجاح!');
        } else {
          alert('فشل في حفظ إعدادات التوصيل.');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالخادم.');
      }
    }

    async function requestExpressCourier() {
      const deliveryPoint = document.getElementById('exp-delivery-point').value.trim();
      const recipientName = document.getElementById('exp-recipient-name').value.trim();
      const recipientPhone = document.getElementById('exp-recipient-phone').value.trim();
      const notes = document.getElementById('exp-notes').value.trim();

      if (!deliveryPoint || !recipientName || !recipientPhone) {
        return alert('الرجاء إدخال نقطة التسليم، اسم العميل ورقم هاتفه.');
      }

      try {
        const res = await fetch(API_URL + '/express-api/deliveries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ deliveryPoint, recipientName, recipientPhone, notes })
        });

        if (res.ok) {
          alert('تم إرسال طلب التوصيل بنجاح! جاري البحث عن كابتن...');
          document.getElementById('exp-delivery-point').value = '';
          document.getElementById('exp-recipient-name').value = '';
          document.getElementById('exp-recipient-phone').value = '';
          document.getElementById('exp-notes').value = '';
          fetchExpressDeliveries();
        } else {
          const env = await res.json();
          alert(env.message || 'فشل إرسال طلب التوصيل.');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالشبكة.');
      }
    }

    let expressPollingInterval = null;

    async function fetchExpressDeliveries() {
      if (!token) return;
      try {
        const res = await fetch(API_URL + '/express-api/deliveries/kitchen', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        const envelope = await res.json();

        if (res.ok) {
          const tbody = document.getElementById('express-deliveries-tbody');
          tbody.innerHTML = '';

          const deliveries = envelope.data || envelope || [];
          if (deliveries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">لا توجد طلبات توصيل مرسلة حالياً.</td></tr>';
            return;
          }

          const statuses = {
            PENDING: '<span style="color: var(--primary);"><i class="fa-solid fa-clock-notch fa-spin"></i> جاري البحث...</span>',
            ACCEPTED: '<span style="color: #3b82f6; font-weight: 700;"><i class="fa-solid fa-check"></i> تم القبول</span>',
            PICKED_UP: '<span style="color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-truck-ramp-box"></i> جاري التوصيل</span>',
            DELIVERED: '<span style="color: var(--emerald); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> تم التوصيل</span>',
            CANCELLED: '<span style="color: var(--rose);"><i class="fa-solid fa-ban"></i> ملغي</span>'
          };

          deliveries.forEach(d => {
            const time = new Date(d.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            
            tbody.innerHTML += '<tr style="border-bottom: 1px solid #f1f5f9;">' +
                '<td style="font-weight: 700; color: var(--primary);">' + d.deliveryPoint + '</td>' +
                '<td>' + d.recipientName + ' (' + d.recipientPhone + ')</td>' +
                '<td>' + (d.courierName ? (d.courierName + ' (' + d.courierPhone + ')') : '<span style="color: var(--text-muted);">جاري البحث عن كابتن...</span>') + '</td>' +
                '<td>' + (statuses[d.status] || d.status) + '</td>' +
                '<td>' + time + '</td>' +
              '</tr>';
          });

          // Setup dynamic polling when viewing deliveries tab
          if (!expressPollingInterval && currentTab === 'delivery') {
            expressPollingInterval = setInterval(fetchExpressDeliveries, 5000);
          }
        }
      } catch (err) {
        console.error('Error fetching express deliveries:', err);
      }
    }

    // Clear interval when switching tabs
    const originalSwitchTab = switchTab;
    switchTab = function(tabId) {
      if (tabId !== 'delivery' && expressPollingInterval) {
        clearInterval(expressPollingInterval);
        expressPollingInterval = null;
      }
      originalSwitchTab(tabId);
    }
  </script>
</body>
</html>
`;
