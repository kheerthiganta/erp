// ========= DATA STORE =========
let state = {
  currentRole: 'admin',
  currentUser: null,
  users: [
    { id:1, name:'Dr. Admin', email:'admin@edu.com', password:'admin123', role:'admin' },
    { id:2, name:'Prof. Ravi Kumar', email:'ravi@edu.com', password:'faculty123', role:'faculty', dept:'Computer Science', subject:'Data Structures' },
    { id:3, name:'Prof. Meena Sharma', email:'meena@edu.com', password:'faculty123', role:'faculty', dept:'Mathematics', subject:'Engineering Maths' },
    { id:4, name:'Arjun Reddy', email:'arjun@edu.com', password:'student123', role:'student', rollNo:'101', className:'CS-A' },
    { id:5, name:'Priya Nair', email:'priya@edu.com', password:'student123', role:'student', rollNo:'102', className:'CS-A' },
    { id:6, name:'Karthik Rao', email:'karthik@edu.com', password:'student123', role:'student', rollNo:'103', className:'CS-A' },
  ],
  students: [
    { id:101, name:'Arjun Reddy', rollNo:'101', className:'CS-A', email:'arjun@edu.com', phone:'9876543210' },
    { id:102, name:'Priya Nair', rollNo:'102', className:'CS-A', email:'priya@edu.com', phone:'9876543211' },
    { id:103, name:'Karthik Rao', rollNo:'103', className:'CS-A', email:'karthik@edu.com', phone:'9876543212' },
    { id:104, name:'Sneha Patel', rollNo:'104', className:'CS-A', email:'sneha@edu.com', phone:'9876543213' },
    { id:105, name:'Rahul Verma', rollNo:'105', className:'CS-A', email:'rahul@edu.com', phone:'9876543214' },
    { id:106, name:'Ananya Singh', rollNo:'106', className:'CS-B', email:'ananya@edu.com', phone:'9876543215' },
    { id:107, name:'Vikram Das', rollNo:'107', className:'CS-B', email:'vikram@edu.com', phone:'9876543216' },
    { id:108, name:'Divya Menon', rollNo:'108', className:'ECE-A', email:'divya@edu.com', phone:'9876543217' },
    { id:109, name:'Suresh Kumar', rollNo:'109', className:'ECE-A', email:'suresh@edu.com', phone:'9876543218' },
    { id:110, name:'Lakshmi Iyer', rollNo:'110', className:'ME-A', email:'lakshmi@edu.com', phone:'9876543219' },
  ],
  faculties: [
    { id:1, name:'Prof. Ravi Kumar', email:'ravi@edu.com', dept:'Computer Science', subject:'Data Structures' },
    { id:2, name:'Prof. Meena Sharma', email:'meena@edu.com', dept:'Mathematics', subject:'Engineering Maths' },
    { id:3, name:'Dr. Sunil Reddy', email:'sunil@edu.com', dept:'Electronics', subject:'Digital Circuits' },
  ],
  attendanceRecords: {},
  subjects: ['Data Structures','DBMS','OS','Computer Networks','Eng. Maths','Digital Electronics','Physics','English'],
  classes: ['CS-A','CS-B','ECE-A','ME-A'],
  periods: ['Period 1','Period 2','Period 3','Period 4','Period 5','Period 6','Period 7','Period 8'],
  currentAttendance: {},
};

// ========= AUTH =========
let selectedRole = 'admin';
function selectRole(el, role) {
  selectedRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}
function showAlert(msg, type='error') {
  const b = document.getElementById('alertBox');
  b.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => b.innerHTML = '', 3000);
}
function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('regRole').addEventListener('change', function() {
    document.getElementById('regClassGroup').style.display = this.value === 'student' ? 'block' : 'none';
  });
}
function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}
function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email||!pass) { showAlert('Please fill in all fields'); return; }
  const user = state.users.find(u => u.email===email && u.password===pass && u.role===selectedRole);
  if (!user) { showAlert('Invalid credentials or role mismatch'); return; }
  state.currentUser = user;
  launchApp(user.role);
}
function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const role = document.getElementById('regRole').value;
  const pass = document.getElementById('regPassword').value;
  if (!name||!email||!pass) { showAlert('Please fill all fields'); return; }
  if (state.users.find(u=>u.email===email)) { showAlert('Email already registered'); return; }
  const newUser = { id: Date.now(), name, email, password:pass, role };
  if (role==='student') {
    newUser.rollNo = document.getElementById('regClass').value || '000';
    newUser.className = 'CS-A';
    state.students.push({ id:Date.now(), name, rollNo:newUser.rollNo, className:'CS-A', email, phone:'' });
  }
  state.users.push(newUser);
  showAlert(`Account created! You can now sign in as ${role}.`, 'success');
  setTimeout(showLogin, 1500);
}
function handleLogout() {
  state.currentUser = null;
  document.getElementById('appWrap').classList.remove('active');
  document.getElementById('authWrap').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

// ========= APP LAUNCH =========
function launchApp(role) {
  document.getElementById('authWrap').style.display = 'none';
  document.getElementById('appWrap').classList.add('active');
  const u = state.currentUser;
  const initial = u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors = { admin:'#7c3aed', faculty:'#0284c7', student:'#059669' };
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarAvatar').style.background = colors[role]||'#2563eb';
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarRole').textContent = role.charAt(0).toUpperCase()+role.slice(1);
  buildNav(role);
  buildContent(role);
}

// ========= NAVIGATION =========
const navItems = {
  admin: [
    { icon:'📊', label:'Dashboard', id:'dashboard' },
    { icon:'👥', label:'Students', id:'students' },
    { icon:'👨‍🏫', label:'Faculty', id:'faculty' },
    { icon:'📋', label:'Attendance Records', id:'records' },
    { icon:'📈', label:'Reports', id:'reports' },
  ],
  faculty: [
    { icon:'📊', label:'Dashboard', id:'dashboard' },
    { icon:'✅', label:'Mark Attendance', id:'markatt' },
    { icon:'📋', label:'My Records', id:'records' },
    { icon:'📈', label:'Class Report', id:'reports' },
  ],
  student: [
    { icon:'📊', label:'Dashboard', id:'dashboard' },
    { icon:'📋', label:'My Attendance', id:'myatt' },
    { icon:'📈', label:'My Report', id:'reports' },
  ],
};
function buildNav(role) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '<div class="nav-label">Main Menu</div>';
  navItems[role].forEach((item,i) => {
    nav.innerHTML += `<div class="nav-item ${i===0?'active':''}" onclick="navigate('${item.id}',this)">
      <span class="nav-icon">${item.icon}</span>${item.label}
    </div>`;
  });
}
function navigate(id, el) {
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec = document.getElementById('sec-'+id);
  if (sec) sec.classList.add('active');
}

// ========= CONTENT BUILD =========
function buildContent(role) {
  const main = document.getElementById('mainContent');
  if (role==='admin') main.innerHTML = buildAdminContent();
  else if (role==='faculty') main.innerHTML = buildFacultyContent();
  else main.innerHTML = buildStudentContent();
  if (role==='faculty') initAttendance();
}

// ========= ADMIN CONTENT =========
function buildAdminContent() {
  const totalAtt = Object.values(state.attendanceRecords).reduce((a,r)=>a+r.length,0);
  return `
  <section class="section active" id="sec-dashboard">
    <div class="page-header"><h2>Admin Dashboard</h2><p>Welcome back, ${state.currentUser.name}. Here's your system overview.</p></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">📚</div><div class="stat-info"><p>Total Students</p><h3>${state.students.length}</h3><small>↑ Active</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#dcfce7">👨‍🏫</div><div class="stat-info"><p>Faculty Members</p><h3>${state.faculties.length}</h3><small>↑ Active</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fef9c3">📋</div><div class="stat-info"><p>Att. Sessions</p><h3>${totalAtt}</h3><small>This month</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#f3e8ff">🏫</div><div class="stat-info"><p>Classes</p><h3>${state.classes.length}</h3><small>Active</small></div></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3 style="font-size:16px;font-weight:600;margin-bottom:16px">📢 Recent Activity</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[['Prof. Ravi Kumar marked CS-A attendance','2 hrs ago','🟢'],['New student Lakshmi Iyer enrolled','Today','🔵'],['Attendance report generated','Yesterday','📊']].map(([a,b,c])=>`<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--surface);border-radius:8px"><span style="font-size:18px">${c}</span><div><p style="font-size:13px;font-weight:500">${a}</p><p style="font-size:12px;color:var(--text-light)">${b}</p></div></div>`).join('')}
        </div>
      </div>
      <div class="card"><h3 style="font-size:16px;font-weight:600;margin-bottom:16px">📊 Attendance by Class</h3>
        ${state.classes.map(c=>{
          const pct = Math.floor(Math.random()*20)+75;
          return `<div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:13px;font-weight:500">${c}</span><span style="font-size:13px;font-weight:600;color:${pct>80?'var(--green)':'var(--orange)'}">${pct}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct>80?'var(--green)':'var(--orange)'}"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="sec-students">
    <div class="page-header"><h2>Student Management</h2><p>Manage all enrolled students.</p></div>
    <div class="card">
      <div class="attendance-header">
        <h3 style="font-size:16px;font-weight:600">All Students (${state.students.length})</h3>
        <button class="btn-sm btn-blue" onclick="openModal('addStudentModal')">+ Add Student</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Name</th><th>Roll No.</th><th>Class</th><th>Email</th><th>Attendance</th><th>Status</th></tr></thead>
        <tbody id="studentsTable">${buildStudentRows()}</tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-faculty">
    <div class="page-header"><h2>Faculty Management</h2><p>Manage faculty members and their subjects.</p></div>
    <div class="card">
      <div class="attendance-header">
        <h3 style="font-size:16px;font-weight:600">Faculty Members (${state.faculties.length})</h3>
        <button class="btn-sm btn-blue" onclick="openModal('addFacultyModal')">+ Add Faculty</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Name</th><th>Department</th><th>Subject</th><th>Email</th><th>Status</th></tr></thead>
        <tbody>${state.faculties.map((f,i)=>`
          <tr><td style="color:var(--text-light);font-weight:500">${String(i+1).padStart(2,'0')}</td>
          <td><div style="display:flex;align-items:center;gap:10px"><div style="width:34px;height:34px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">${f.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><div><p style="font-weight:500;font-size:13px">${f.name}</p></div></div></td>
          <td>${f.dept}</td><td>${f.subject}</td><td style="color:var(--text-mid);font-size:13px">${f.email}</td>
          <td><span class="badge badge-green">Active</span></td></tr>
        `).join('')}</tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-records">
    <div class="page-header"><h2>Attendance Records</h2><p>View all attendance sessions.</p></div>
    <div class="card">
      <div class="select-row" style="margin-bottom:16px">
        <select onchange="filterRecords(this.value)"><option value="">All Classes</option>${state.classes.map(c=>`<option>${c}</option>`).join('')}</select>
        <select><option>All Subjects</option>${state.subjects.map(s=>`<option>${s}</option>`).join('')}</select>
        <input type="date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Class</th><th>Subject</th><th>Period</th><th>Faculty</th><th>Present</th><th>Absent</th><th>%</th></tr></thead>
        <tbody>${buildRecordsRows()}</tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-reports">
    <div class="page-header"><h2>Reports & Analytics</h2><p>Overall attendance statistics.</p></div>
    ${buildReports('admin')}
  </section>`;
}
function buildStudentRows() {
  return state.students.map((s,i)=>{
    const pct = Math.floor(Math.random()*25)+70;
    return `<tr><td style="color:var(--text-light);font-weight:500">${String(i+1).padStart(2,'0')}</td>
      <td><div style="display:flex;align-items:center;gap:10px"><div style="width:34px;height:34px;border-radius:50%;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">${s.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><div><p style="font-weight:500;font-size:13px">${s.name}</p><p style="font-size:12px;color:var(--text-light)">${s.email}</p></div></div></td>
      <td><span class="badge badge-blue">${s.rollNo}</span></td><td>${s.className}</td>
      <td style="font-size:13px;color:var(--text-mid)">${s.email}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${pct}%;background:${pct>75?'var(--green)':'var(--orange)'}"></div></div><span style="font-size:12px;font-weight:600;color:${pct>75?'var(--green)':'var(--orange)'}">${pct}%</span></div></td>
      <td><span class="badge ${pct>75?'badge-green':'badge-yellow'}">${pct>75?'Good':'Low'}</span></td></tr>`;
  }).join('');
}
function buildRecordsRows() {
  const rows = [];
  const today = new Date();
  for (let d=0;d<5;d++) {
    const date = new Date(today); date.setDate(today.getDate()-d);
    const dateStr = date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    for (let p=0;p<3;p++) {
      const prs = Math.floor(Math.random()*3)+3;
      const abs = 5-prs;
      const pct = Math.round(prs/5*100);
      rows.push(`<tr><td>${dateStr}</td><td><span class="badge badge-blue">${state.classes[p%state.classes.length]}</span></td>
        <td>${state.subjects[p%state.subjects.length]}</td><td>Period ${p+1}</td>
        <td style="font-size:13px;color:var(--text-mid)">${state.faculties[p%state.faculties.length].name}</td>
        <td><span style="color:var(--green);font-weight:600">${prs}</span></td>
        <td><span style="color:var(--red);font-weight:600">${abs}</span></td>
        <td><span class="badge ${pct>=80?'badge-green':'badge-yellow'}">${pct}%</span></td></tr>`);
    }
  }
  return rows.join('');
}

// ========= FACULTY CONTENT =========
function buildFacultyContent() {
  const u = state.currentUser;
  return `
  <section class="section active" id="sec-dashboard">
    <div class="page-header"><h2>Faculty Dashboard</h2><p>Welcome, ${u.name}. Manage your class attendance below.</p></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">👥</div><div class="stat-info"><p>My Students</p><h3>${state.students.filter(s=>s.className==='CS-A').length}</h3><small>CS-A Class</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#dcfce7">✅</div><div class="stat-info"><p>Today's Sessions</p><h3>3</h3><small>Marked today</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fef9c3">📊</div><div class="stat-info"><p>Avg Attendance</p><h3>82%</h3><small>This month</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2">⚠️</div><div class="stat-info"><p>Low Attendance</p><h3>2</h3><small>Below 75%</small></div></div>
    </div>
    <div class="card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">📅 Today's Schedule</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Period</th><th>Time</th><th>Subject</th><th>Class</th><th>Status</th></tr></thead>
        <tbody>${['8:00–8:50','9:00–9:50','10:00–10:50','11:00–11:50','12:00–12:50','1:00–1:50','2:00–2:50','3:00–3:50'].map((t,i)=>`
          <tr><td class="period-label">Period ${i+1}</td><td style="color:var(--text-mid);font-size:13px">${t}</td>
          <td>${state.subjects[i%state.subjects.length]}</td><td><span class="badge badge-blue">CS-A</span></td>
          <td><span class="badge ${i<3?'badge-green':'badge-yellow'}">${i<3?'Marked':'Pending'}</span></td></tr>`).join('')}
        </tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-markatt">
    <div class="page-header"><h2>Mark Attendance</h2><p>Select class, subject and period to mark attendance.</p></div>
    <div class="card" style="margin-bottom:20px">
      <div class="select-row" style="flex-wrap:wrap;gap:12px">
        <div><label style="font-size:12px;font-weight:500;color:var(--text-mid);display:block;margin-bottom:4px">Date</label>
          <input type="date" id="attDate" value="${new Date().toISOString().split('T')[0]}"></div>
        <div><label style="font-size:12px;font-weight:500;color:var(--text-mid);display:block;margin-bottom:4px">Class</label>
          <select id="attClass" onchange="filterStudentsByClass()">${state.classes.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div><label style="font-size:12px;font-weight:500;color:var(--text-mid);display:block;margin-bottom:4px">Subject</label>
          <select id="attSubject">${state.subjects.map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div><label style="font-size:12px;font-weight:500;color:var(--text-mid);display:block;margin-bottom:4px">Period</label>
          <select id="attPeriod">${state.periods.map((p,i)=>`<option value="${i+1}">${p} (${['8:00','9:00','10:00','11:00','12:00','1:00','2:00','3:00'][i]}–${['8:50','9:50','10:50','11:50','12:50','1:50','2:50','3:50'][i]})</option>`).join('')}</select></div>
      </div>
    </div>
    <div class="card">
      <div class="attendance-header">
        <div>
          <h3 style="font-size:16px;font-weight:600">Student List</h3>
          <p style="font-size:13px;color:var(--text-mid);margin-top:3px" id="attSummaryLine">Mark each student present or absent</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-sm btn-outline" onclick="markAll('present')">✅ All Present</button>
          <button class="btn-sm btn-outline" onclick="markAll('absent')">❌ All Absent</button>
          <button class="btn-sm btn-green" onclick="submitAttendance()">💾 Save Attendance</button>
        </div>
      </div>
      <div class="table-wrap"><table class="attendance-table">
        <thead><tr><th>#</th><th>Roll No.</th><th>Student Name</th><th>Mark Attendance</th><th>Status</th></tr></thead>
        <tbody id="attendanceBody">${buildAttendanceRows('CS-A')}</tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-records">
    <div class="page-header"><h2>My Attendance Records</h2><p>View previously marked attendance.</p></div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Subject</th><th>Period</th><th>Class</th><th>Present</th><th>Absent</th><th>%</th></tr></thead>
        <tbody>${[...Array(8)].map((_,i)=>{
          const d = new Date(); d.setDate(d.getDate()-i);
          const prs = Math.floor(Math.random()*3)+3;
          const pct = Math.round(prs/5*100);
          return `<tr><td>${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</td>
            <td>${state.subjects[i%state.subjects.length]}</td><td>Period ${(i%8)+1}</td>
            <td><span class="badge badge-blue">CS-A</span></td>
            <td><span style="color:var(--green);font-weight:600">${prs}</span></td>
            <td><span style="color:var(--red);font-weight:600">${5-prs}</span></td>
            <td><span class="badge ${pct>=80?'badge-green':'badge-yellow'}">${pct}%</span></td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-reports">
    <div class="page-header"><h2>Class Report</h2><p>Attendance analytics for your class.</p></div>
    ${buildReports('faculty')}
  </section>`;
}

function buildAttendanceRows(className) {
  const students = state.students.filter(s=>s.className===className);
  if (!students.length) return `<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:30px">No students in this class</td></tr>`;
  return students.map((s,i)=>{
    if (!state.currentAttendance[s.id]) state.currentAttendance[s.id] = 'present';
    const status = state.currentAttendance[s.id];
    return `<tr id="att-row-${s.id}">
      <td style="color:var(--text-light);font-weight:500">${String(i+1).padStart(2,'0')}</td>
      <td><span class="badge badge-blue">${s.rollNo}</span></td>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">${s.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <span style="font-weight:500;font-size:14px">${s.name}</span>
      </div></td>
      <td><div class="att-toggle">
        <button class="att-btn ${status==='present'?'present':'inactive'}" onclick="setAttendance(${s.id},'present',this)">✓ Present</button>
        <button class="att-btn ${status==='absent'?'absent':'inactive'}" onclick="setAttendance(${s.id},'absent',this)">✗ Absent</button>
      </div></td>
      <td><span class="badge ${status==='present'?'badge-green':'badge-red'}" id="att-status-${s.id}">${status==='present'?'Present':'Absent'}</span></td>
    </tr>`;
  }).join('');
}

function initAttendance() {
  const students = state.students.filter(s=>s.className==='CS-A');
  students.forEach(s=>{ state.currentAttendance[s.id]='present'; });
  updateAttSummary();
}
function filterStudentsByClass() {
  const cls = document.getElementById('attClass').value;
  const tbody = document.getElementById('attendanceBody');
  if (tbody) { state.currentAttendance = {}; tbody.innerHTML = buildAttendanceRows(cls); updateAttSummary(); }
}
function setAttendance(sid, status, btn) {
  state.currentAttendance[sid] = status;
  const row = document.getElementById('att-row-'+sid);
  row.querySelectorAll('.att-btn').forEach(b=>b.className='att-btn inactive');
  btn.className = `att-btn ${status}`;
  const statusBadge = document.getElementById('att-status-'+sid);
  statusBadge.className = `badge ${status==='present'?'badge-green':'badge-red'}`;
  statusBadge.textContent = status==='present'?'Present':'Absent';
  updateAttSummary();
}
function markAll(status) {
  const cls = document.getElementById('attClass')?.value || 'CS-A';
  state.students.filter(s=>s.className===cls).forEach(s=>{ state.currentAttendance[s.id]=status; });
  document.getElementById('attendanceBody').innerHTML = buildAttendanceRows(cls);
  updateAttSummary();
}
function updateAttSummary() {
  const vals = Object.values(state.currentAttendance);
  const prs = vals.filter(v=>v==='present').length;
  const total = vals.length;
  const el = document.getElementById('attSummaryLine');
  if (el) el.textContent = `Present: ${prs} / ${total} students (${total?Math.round(prs/total*100):0}%)`;
}
function submitAttendance() {
  const date = document.getElementById('attDate')?.value;
  const cls = document.getElementById('attClass')?.value;
  const subject = document.getElementById('attSubject')?.value;
  const period = document.getElementById('attPeriod')?.value;
  const key = `${date}-${cls}-${subject}-${period}`;
  state.attendanceRecords[key] = Object.entries(state.currentAttendance).map(([id,status])=>({studentId:parseInt(id),status}));
  showToast('✅ Attendance saved successfully!','success');
}

// ========= STUDENT CONTENT =========
function buildStudentContent() {
  const u = state.currentUser;
  const student = state.students.find(s=>s.email===u.email) || state.students[0];
  const subjects = state.subjects.slice(0,6);
  const subjectData = subjects.map(s=>({ name:s, pct: Math.floor(Math.random()*25)+70 }));
  const overall = Math.round(subjectData.reduce((a,s)=>a+s.pct,0)/subjectData.length);
  return `
  <section class="section active" id="sec-dashboard">
    <div class="page-header"><h2>My Dashboard</h2><p>Hello ${u.name}! Here's your attendance summary.</p></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe">📊</div><div class="stat-info"><p>Overall Attendance</p><h3 style="color:${overall>=75?'var(--green)':'var(--red)'}">${overall}%</h3><small>${overall>=75?'✓ Good Standing':'⚠ Below 75%'}</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#dcfce7">✅</div><div class="stat-info"><p>Classes Attended</p><h3>42</h3><small>Out of 51</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2">❌</div><div class="stat-info"><p>Classes Missed</p><h3>9</h3><small>This semester</small></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fef9c3">🎓</div><div class="stat-info"><p>Class</p><h3 style="font-size:20px">${student?.className||'CS-A'}</h3><small>Roll: ${student?.rollNo||'101'}</small></div></div>
    </div>
    <div class="card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">Subject-wise Attendance</h3>
      ${subjectData.map(s=>`<div class="subject-row">
        <label>${s.name}</label>
        <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${s.pct}%;background:${s.pct>=75?'var(--green)':'var(--red)'}"></div></div>
        <span class="att-percent ${s.pct>=75?'good':'bad'}" style="font-size:14px;min-width:42px;text-align:right">${s.pct}%</span>
        ${s.pct<75?`<span class="badge badge-red" style="margin-left:6px">Low</span>`:`<span class="badge badge-green" style="margin-left:6px">Good</span>`}
      </div>`).join('')}
    </div>
  </section>

  <section class="section" id="sec-myatt">
    <div class="page-header"><h2>My Attendance</h2><p>Full attendance record for this semester.</p></div>
    <div class="card">
      <div class="select-row" style="margin-bottom:16px">
        <select><option>All Subjects</option>${state.subjects.map(s=>`<option>${s}</option>`).join('')}</select>
        <select><option>All Periods</option>${state.periods.map(p=>`<option>${p}</option>`).join('')}</select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Subject</th><th>Period</th><th>Faculty</th><th>Status</th></tr></thead>
        <tbody>${[...Array(15)].map((_,i)=>{
          const d = new Date(); d.setDate(d.getDate()-i);
          const present = Math.random()>0.2;
          return `<tr><td>${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
            <td>${state.subjects[i%state.subjects.length]}</td>
            <td>Period ${(i%8)+1}</td>
            <td style="font-size:13px;color:var(--text-mid)">${state.faculties[i%state.faculties.length].name}</td>
            <td><span class="badge ${present?'badge-green':'badge-red'}">${present?'Present':'Absent'}</span></td></tr>`;
        }).join('')}
        </tbody>
      </table></div>
    </div>
  </section>

  <section class="section" id="sec-reports">
    <div class="page-header"><h2>My Report</h2><p>Detailed attendance analytics.</p></div>
    ${buildReports('student', subjectData, overall)}
  </section>`;
}

// ========= REPORTS =========
function buildReports(role, subjectData, overall) {
  if (!subjectData) {
    subjectData = state.subjects.slice(0,6).map(s=>({ name:s, pct: Math.floor(Math.random()*25)+70 }));
    overall = Math.round(subjectData.reduce((a,s)=>a+s.pct,0)/subjectData.length);
  }
  return `<div class="grid-2">
    <div class="card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:8px">${role==='student'?'My':'Class'} Overall Attendance</h3>
      <p style="font-size:13px;color:var(--text-mid);margin-bottom:20px">Semester aggregate</p>
      <div style="text-align:center;margin:20px 0">
        <div class="att-percent ${overall>=75?(overall>=85?'good':'warn'):'bad'}" style="font-size:52px">${overall}%</div>
        <p style="font-size:14px;color:var(--text-mid);margin-top:6px">${overall>=75?'✅ Meets minimum requirement':'⚠️ Below 75% threshold'}</p>
      </div>
      <div class="progress-bar" style="height:12px"><div class="progress-fill" style="width:${overall}%;background:${overall>=75?'var(--green)':'var(--red)'}"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px"><span style="font-size:12px;color:var(--text-light)">0%</span><span style="font-size:12px;color:var(--text-mid);font-weight:500">Min: 75%</span><span style="font-size:12px;color:var(--text-light)">100%</span></div>
    </div>
    <div class="card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">Subject Breakdown</h3>
      ${subjectData.map(s=>`<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:500">${s.name}</span>
          <span style="font-size:13px;font-weight:600;color:${s.pct>=75?'var(--green)':'var(--red)'}">${s.pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${s.pct}%;background:${s.pct>=75?'var(--green)':'var(--red)'}"></div></div>
      </div>`).join('')}
    </div>
  </div>
  ${role==='admin'?`<div class="card" style="margin-top:20px">
    <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">Students Below 75% Attendance</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Action</th></tr></thead>
      <tbody>${state.students.slice(0,4).map(s=>{
        const pct = Math.floor(Math.random()*20)+55;
        return `<tr><td style="font-weight:500">${s.name}</td><td>${s.className}</td>
          <td><span class="att-percent bad" style="font-size:16px">${pct}%</span></td>
          <td><button class="btn-sm" style="padding:5px 12px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;cursor:pointer;font-size:12px">⚠ Send Notice</button></td></tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>`:''}`;
}

// ========= HELPERS =========
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(()=>t.classList.remove('show'),3000);
}
function saveNewStudent() {
  const name = document.getElementById('newStudentName').value.trim();
  const roll = document.getElementById('newStudentRoll').value.trim();
  const email = document.getElementById('newStudentEmail').value.trim();
  const cls = document.getElementById('newStudentClass').value;
  if (!name||!roll) { showToast('Name and Roll No. are required','error'); return; }
  const newId = Date.now();
  state.students.push({ id:newId, name, rollNo:roll, className:cls, email, phone:'' });
  closeModal('addStudentModal');
  const tbody = document.getElementById('studentsTable');
  if (tbody) tbody.innerHTML = buildStudentRows();
  showToast(`✅ ${name} added successfully!`,'success');
  document.getElementById('newStudentName').value='';
  document.getElementById('newStudentRoll').value='';
  document.getElementById('newStudentEmail').value='';
}
function saveNewFaculty() {
  const name = document.getElementById('newFacultyName').value.trim();
  const email = document.getElementById('newFacultyEmail').value.trim();
  const dept = document.getElementById('newFacultyDept').value;
  if (!name) { showToast('Name is required','error'); return; }
  state.faculties.push({ id:Date.now(), name, email, dept, subject:dept });
  closeModal('addFacultyModal');
  showToast(`✅ ${name} added successfully!`,'success');
  document.getElementById('newFacultyName').value='';
  document.getElementById('newFacultyEmail').value='';
}
function filterRecords(cls) { /* filtering hook */ }

// Register role toggle
document.getElementById('regRole')?.addEventListener('change', function() {
  document.getElementById('regClassGroup').style.display = this.value==='student'?'block':'none';
});
