(function bootstrapAttendanceSystem() {
  const API_BASE = 'http://localhost:5000';
  const TOKEN_KEY = 'attendance_token';

  const authState = document.getElementById('authState');
  const authDot = document.getElementById('authDot');
  const logoutBtn = document.getElementById('logoutBtn');
  const flash = document.getElementById('flash');

  const authPanel = document.getElementById('authPanel');
  const authChooser = document.getElementById('authChooser');
  const registerWrap = document.getElementById('registerWrap');
  const loginWrap = document.getElementById('loginWrap');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const showLoginBtn = document.getElementById('showLoginBtn');
  const backFromRegisterBtn = document.getElementById('backFromRegisterBtn');
  const backFromLoginBtn = document.getElementById('backFromLoginBtn');

  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const registerCaptchaCode = document.getElementById('registerCaptchaCode');
  const registerCaptchaInput = document.getElementById('registerCaptchaInput');
  const refreshRegisterCaptchaBtn = document.getElementById('refreshRegisterCaptchaBtn');
  const loginCaptchaCode = document.getElementById('loginCaptchaCode');
  const loginCaptchaInput = document.getElementById('loginCaptchaInput');
  const refreshLoginCaptchaBtn = document.getElementById('refreshLoginCaptchaBtn');

  const managementZone = document.getElementById('managementZone');
  const studentForm = document.getElementById('studentForm');
  const filterForm = document.getElementById('filterForm');
  const refreshStudentsBtn = document.getElementById('refreshStudentsBtn');
  const studentList = document.getElementById('studentList');
  const attendanceOptions = document.getElementById('attendanceOptions');
  const attendanceDate = document.getElementById('attendanceDate');
  const attendanceClass = document.getElementById('attendanceClass');
  const loadAttendanceBtn = document.getElementById('loadAttendanceBtn');
  const attendanceForm = document.getElementById('attendanceForm');
  const attendanceRows = document.getElementById('attendanceRows');
  const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
  const refreshReportBtn = document.getElementById('refreshReportBtn');
  const reportList = document.getElementById('reportList');

  const studentCount = document.getElementById('studentCount');
  const presentCount = document.getElementById('presentCount');
  const absentCount = document.getElementById('absentCount');
  const lateCount = document.getElementById('lateCount');

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: null,
    students: [],
    attendanceRecords: [],
    registerCaptcha: '',
    loginCaptcha: '',
  };

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function showFlash(message) {
    flash.textContent = message;
    flash.classList.add('show');
    clearTimeout(showFlash.timer);
    showFlash.timer = setTimeout(() => flash.classList.remove('show'), 2400);
  }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${path}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  }

  function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let value = '';
    for (let i = 0; i < 6; i += 1) {
      value += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return value;
  }

  function refreshRegisterCaptcha() {
    state.registerCaptcha = generateCaptcha();
    registerCaptchaCode.value = state.registerCaptcha;
    registerCaptchaInput.value = '';
  }

  function refreshLoginCaptcha() {
    state.loginCaptcha = generateCaptcha();
    loginCaptchaCode.value = state.loginCaptcha;
    loginCaptchaInput.value = '';
  }

  function showAuthChooser() {
    authChooser.hidden = false;
    registerWrap.hidden = true;
    loginWrap.hidden = true;
  }

  function showRegisterForm() {
    authChooser.hidden = true;
    registerWrap.hidden = false;
    loginWrap.hidden = true;
    refreshRegisterCaptcha();
  }

  function showLoginForm() {
    authChooser.hidden = true;
    registerWrap.hidden = true;
    loginWrap.hidden = false;
    refreshLoginCaptcha();
  }

  function setAuthStatus() {
    if (state.user) {
      authState.textContent = `${state.user.name} (#${state.user.id})`;
      authDot.style.background = '#227c5d';
      logoutBtn.hidden = false;
      return;
    }

    authState.textContent = 'Guest mode';
    authDot.style.background = '#aab2ba';
    logoutBtn.hidden = true;
  }

  function setMainVisibility(isLoggedIn) {
    authPanel.hidden = isLoggedIn;
    managementZone.hidden = !isLoggedIn;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderStudents() {
    studentCount.textContent = String(state.students.length);

    if (!state.students.length) {
      studentList.innerHTML = '<div class="empty">No students found. Add a student to begin.</div>';
      return;
    }

    studentList.innerHTML = state.students.map((student) => `
      <article class="item-card">
        <div class="item-row">
          <strong>${escapeHtml(student.rollNo)} - ${escapeHtml(student.name)}</strong>
          <span class="badge badge-class">${escapeHtml(student.className)}</span>
        </div>
        <p class="meta">${escapeHtml(student.email || 'No email added')}</p>
      </article>
    `).join('');
  }

  function statusBadge(status) {
    if (status === 'present') return 'badge badge-present';
    if (status === 'late') return 'badge badge-late';
    return 'badge badge-absent';
  }

  function renderAttendanceRows() {
    const counts = state.attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    presentCount.textContent = String(counts.present || 0);
    absentCount.textContent = String(counts.absent || 0);
    lateCount.textContent = String(counts.late || 0);

    if (!state.attendanceRecords.length) {
      attendanceRows.innerHTML = '<div class="empty">No students available for this class filter.</div>';
      saveAttendanceBtn.disabled = true;
      return;
    }

    saveAttendanceBtn.disabled = false;
    attendanceRows.innerHTML = state.attendanceRecords.map((record) => `
      <article class="item-card attendance-row" data-student-id="${record.studentId}">
        <div class="item-row">
          <div>
            <strong>${escapeHtml(record.rollNo)} - ${escapeHtml(record.name)}</strong>
            <p class="meta">${escapeHtml(record.className)}</p>
          </div>
          <span class="${statusBadge(record.status)}">${escapeHtml(record.status)}</span>
        </div>
        <div class="status-options">
          <label><input type="radio" name="status-${record.studentId}" value="present" ${record.status === 'present' ? 'checked' : ''}> Present</label>
          <label><input type="radio" name="status-${record.studentId}" value="absent" ${record.status === 'absent' ? 'checked' : ''}> Absent</label>
          <label><input type="radio" name="status-${record.studentId}" value="late" ${record.status === 'late' ? 'checked' : ''}> Late</label>
        </div>
        <label>Remarks <input name="remarks-${record.studentId}" type="text" value="${escapeHtml(record.remarks)}" placeholder="Optional note"></label>
      </article>
    `).join('');
  }

  function renderReport(rows) {
    if (!rows.length) {
      reportList.innerHTML = '<div class="empty">No report data yet.</div>';
      return;
    }

    reportList.innerHTML = rows.map((row) => `
      <article class="item-card">
        <div class="item-row">
          <strong>${escapeHtml(row.rollNo)} - ${escapeHtml(row.name)}</strong>
          <span class="badge badge-class">${row.percentage}%</span>
        </div>
        <p class="meta">${escapeHtml(row.className)} | Total marked: ${row.totalMarked}</p>
        <div class="mini-stats">
          <span>Present: ${row.presentCount}</span>
          <span>Absent: ${row.absentCount}</span>
          <span>Late: ${row.lateCount}</span>
        </div>
      </article>
    `).join('');
  }

  async function loadProfile() {
    if (!state.token) {
      state.user = null;
      setAuthStatus();
      return;
    }

    state.user = await request('/api/users/me');
    setAuthStatus();
  }

  async function loadStudents() {
    const className = filterForm.className.value.trim();
    const query = className ? `?className=${encodeURIComponent(className)}` : '';
    state.students = await request(`/api/attendance/students${query}`);
    renderStudents();
  }

  async function loadAttendance() {
    const date = attendanceDate.value || today();
    const className = attendanceClass.value.trim();
    const query = new URLSearchParams({ date });

    if (className) {
      query.set('className', className);
    }

    state.attendanceRecords = await request(`/api/attendance/records?${query.toString()}`);
    renderAttendanceRows();
  }

  async function loadReport() {
    const className = filterForm.className.value.trim();
    const query = className ? `?className=${encodeURIComponent(className)}` : '';
    const rows = await request(`/api/attendance/summary${query}`);
    renderReport(rows);
  }

  async function refreshDashboard() {
    await loadStudents();
    await Promise.all([loadAttendance(), loadReport()]);
  }

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const enteredCaptcha = registerCaptchaInput.value.trim().toUpperCase();
      if (!enteredCaptcha || enteredCaptcha !== state.registerCaptcha) {
        refreshRegisterCaptcha();
        showFlash('Invalid CAPTCHA. Please try again.');
        return;
      }

      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;

      await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: registerForm.name.value.trim(),
          email,
          password,
          skillsOffered: [],
          skillsWanted: [],
        },
      });

      const data = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem(TOKEN_KEY, state.token);
      registerForm.reset();
      setAuthStatus();
      setMainVisibility(true);
      await refreshDashboard();
      showFlash('Teacher account created.');
    } catch (error) {
      showFlash(error.message);
    }
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const enteredCaptcha = loginCaptchaInput.value.trim().toUpperCase();
      if (!enteredCaptcha || enteredCaptcha !== state.loginCaptcha) {
        refreshLoginCaptcha();
        showFlash('Invalid CAPTCHA. Please try again.');
        return;
      }

      const data = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: loginForm.email.value.trim(),
          password: loginForm.password.value,
        },
      });

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem(TOKEN_KEY, state.token);
      setAuthStatus();
      setMainVisibility(true);
      await refreshDashboard();
      showFlash('Logged in.');
    } catch (error) {
      refreshLoginCaptcha();
      showFlash(error.message);
    }
  });

  logoutBtn.addEventListener('click', () => {
    state.token = '';
    state.user = null;
    state.students = [];
    state.attendanceRecords = [];
    localStorage.removeItem(TOKEN_KEY);
    setAuthStatus();
    setMainVisibility(false);
    showAuthChooser();
    renderStudents();
    renderAttendanceRows();
    reportList.innerHTML = '<div class="empty">Login to view reports.</div>';
    showFlash('Logged out.');
  });

  studentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      await request('/api/attendance/students', {
        method: 'POST',
        body: {
          rollNo: studentForm.rollNo.value.trim(),
          name: studentForm.name.value.trim(),
          className: studentForm.className.value.trim(),
          email: studentForm.email.value.trim(),
        },
      });

      studentForm.reset();
      await refreshDashboard();
      showFlash('Student added.');
    } catch (error) {
      showFlash(error.message);
    }
  });

  filterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      attendanceClass.value = filterForm.className.value.trim();
      await refreshDashboard();
      showFlash('Filter applied.');
    } catch (error) {
      showFlash(error.message);
    }
  });

  attendanceOptions.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await loadAttendance();
      showFlash('Attendance sheet loaded.');
    } catch (error) {
      showFlash(error.message);
    }
  });

  attendanceForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const records = state.attendanceRecords.map((record) => {
        const checked = attendanceForm.querySelector(`input[name="status-${record.studentId}"]:checked`);
        const remarks = attendanceForm.querySelector(`input[name="remarks-${record.studentId}"]`);

        return {
          studentId: record.studentId,
          status: checked ? checked.value : 'absent',
          remarks: remarks ? remarks.value.trim() : '',
        };
      });

      await request('/api/attendance/records', {
        method: 'POST',
        body: {
          date: attendanceDate.value,
          records,
        },
      });

      await Promise.all([loadAttendance(), loadReport()]);
      showFlash('Attendance saved.');
    } catch (error) {
      showFlash(error.message);
    }
  });

  attendanceRows.addEventListener('change', (event) => {
    if (!event.target.matches('input[type="radio"]')) return;

    const row = event.target.closest('.attendance-row');
    const badge = row.querySelector('.badge');
    badge.className = statusBadge(event.target.value);
    badge.textContent = event.target.value;
  });

  refreshStudentsBtn.addEventListener('click', () => refreshDashboard().catch((error) => showFlash(error.message)));
  loadAttendanceBtn.addEventListener('click', () => loadAttendance().catch((error) => showFlash(error.message)));
  refreshReportBtn.addEventListener('click', () => loadReport().catch((error) => showFlash(error.message)));
  showRegisterBtn.addEventListener('click', showRegisterForm);
  showLoginBtn.addEventListener('click', showLoginForm);
  backFromRegisterBtn.addEventListener('click', showAuthChooser);
  backFromLoginBtn.addEventListener('click', showAuthChooser);
  refreshRegisterCaptchaBtn.addEventListener('click', refreshRegisterCaptcha);
  refreshLoginCaptchaBtn.addEventListener('click', refreshLoginCaptcha);

  async function init() {
    attendanceDate.value = today();
    setAuthStatus();
    renderStudents();
    renderAttendanceRows();
    reportList.innerHTML = '<div class="empty">Login to view reports.</div>';

    try {
      if (state.token) {
        await loadProfile();
        setMainVisibility(true);
        await refreshDashboard();
      } else {
        setMainVisibility(false);
        showAuthChooser();
        refreshRegisterCaptcha();
        refreshLoginCaptcha();
      }
    } catch (error) {
      state.token = '';
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
      setAuthStatus();
      setMainVisibility(false);
      showAuthChooser();
      refreshRegisterCaptcha();
      refreshLoginCaptcha();
      showFlash(error.message);
    }
  }

  init();
})();
