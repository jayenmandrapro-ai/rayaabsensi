const STORAGE_KEYS = {
  students: 'rayaabsensi.students',
  attendance: 'rayaabsensi.attendance',
  session: 'rayaabsensi.session'
};

const DEFAULT_ADMIN = {
  name: 'Admin Sekolah',
  email: 'admin@rayaabsensi.com',
  password: 'admin123'
};

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpa', label: 'Alpa' }
];

const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const adminNameEl = document.getElementById('adminName');
const studentForm = document.getElementById('studentForm');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const recapTableBody = document.getElementById('recapTableBody');
const attendanceDateInput = document.getElementById('attendanceDate');
const saveAttendanceButton = document.getElementById('saveAttendance');
const exportCsvButton = document.getElementById('exportCsv');
const resetDataButton = document.getElementById('resetData');
const logoutButton = document.getElementById('logoutBtn');
const totalStudentsEl = document.getElementById('totalStudents');

const elements = {
  hadir: document.getElementById('hadirCount'),
  izin: document.getElementById('izinCount'),
  sakit: document.getElementById('sakitCount'),
  alpa: document.getElementById('alpaCount')
};

let students = loadStudents();
let attendance = loadAttendance();

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function loadStudents() {
  const saved = localStorage.getItem(STORAGE_KEYS.students);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch (error) {
      console.error('Gagal membaca data siswa:', error);
    }
  }

  const demoStudents = [
    { id: crypto.randomUUID(), nis: '1001', nama: 'Ayu Rahma', kelas: 'X IPA 1' },
    { id: crypto.randomUUID(), nis: '1002', nama: 'Budi Santoso', kelas: 'X IPA 1' },
    { id: crypto.randomUUID(), nis: '1003', nama: 'Citra Lestari', kelas: 'X IPS 2' },
    { id: crypto.randomUUID(), nis: '1004', nama: 'Dimas Prasetya', kelas: 'X IPS 2' },
    { id: crypto.randomUUID(), nis: '1005', nama: 'Eka Putri', kelas: 'XI IPA 1' }
  ];

  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(demoStudents));
  return demoStudents;
}

function loadAttendance() {
  const saved = localStorage.getItem(STORAGE_KEYS.attendance);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (error) {
      console.error('Gagal membaca data absensi:', error);
    }
  }

  return {};
}

function persistStudents() {
  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
}

function persistAttendance() {
  localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(attendance));
}

function getSelectedDate() {
  return attendanceDateInput.value || todayISO();
}

function checkSession() {
  const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
  if (session && session.email === DEFAULT_ADMIN.email) {
    adminNameEl.textContent = DEFAULT_ADMIN.name;
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
  } else {
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
  }
}

function loginAdmin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(DEFAULT_ADMIN));
    adminNameEl.textContent = DEFAULT_ADMIN.name;
    loginError.classList.add('hidden');
    loginError.textContent = '';
    loginForm.reset();
    checkSession();
    return;
  }

  loginError.textContent = 'Email atau password salah. Silakan coba lagi.';
  loginError.classList.remove('hidden');
}

function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.session);
  checkSession();
  loginForm.reset();
}

function buildAttendanceRow(student) {
  const date = getSelectedDate();
  const currentStatus = attendance[date]?.[student.id] || 'hadir';

  const select = document.createElement('select');
  select.setAttribute('data-student-id', student.id);
  select.setAttribute('data-date', date);

  STATUS_OPTIONS.forEach((option) => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    if (option.value === currentStatus) {
      optionEl.selected = true;
    }
    select.appendChild(optionEl);
  });

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${student.nama}</td>
    <td>${student.kelas}</td>
  `;

  const statusCell = document.createElement('td');
  statusCell.appendChild(select);
  row.appendChild(statusCell);

  return row;
}

function renderAttendanceTable() {
  attendanceTableBody.innerHTML = '';

  if (!students.length) {
    attendanceTableBody.innerHTML = '<tr><td colspan="3" class="empty-state">Belum ada data siswa.</td></tr>';
    return;
  }

  students.forEach((student) => {
    attendanceTableBody.appendChild(buildAttendanceRow(student));
  });

  renderSummary();
}

function renderSummary() {
  const date = getSelectedDate();
  const record = attendance[date] || {};
  const counts = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpa: 0
  };

  students.forEach((student) => {
    const status = record[student.id] || 'hadir';
    if (counts[status] !== undefined) {
      counts[status] += 1;
    }
  });

  elements.hadir.textContent = counts.hadir;
  elements.izin.textContent = counts.izin;
  elements.sakit.textContent = counts.sakit;
  elements.alpa.textContent = counts.alpa;
  totalStudentsEl.textContent = students.length;
}

function renderRecap() {
  recapTableBody.innerHTML = '';

  if (!students.length) {
    recapTableBody.innerHTML = '<tr><td colspan="8" class="empty-state">Data rekap masih kosong.</td></tr>';
    return;
  }

  const recap = students.map((student) => {
    const studentDates = Object.keys(attendance);
    const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };

    studentDates.forEach((date) => {
      const status = attendance[date]?.[student.id];
      if (status && counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    const totalEntries = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    const persentase = totalEntries ? ((counts.hadir / totalEntries) * 100).toFixed(0) : 0;

    return { student, counts, persentase };
  });

  recap.forEach(({ student, counts, persentase }) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.nama}</td>
      <td>${student.nis}</td>
      <td>${student.kelas}</td>
      <td>${counts.hadir}</td>
      <td>${counts.izin}</td>
      <td>${counts.sakit}</td>
      <td>${counts.alpa}</td>
      <td>${persentase}%</td>
    `;
    recapTableBody.appendChild(row);
  });
}

function saveAttendanceForDate() {
  const date = getSelectedDate();
  const values = {};

  attendanceTableBody.querySelectorAll('select[data-student-id]').forEach((select) => {
    const studentId = select.getAttribute('data-student-id');
    const value = select.value;
    values[studentId] = value;
  });

  attendance[date] = values;
  persistAttendance();
  renderSummary();
  renderRecap();
  alert('Absensi berhasil disimpan!');
}

function addStudent(event) {
  event.preventDefault();

  const formData = new FormData(studentForm);
  const nama = (formData.get('nama') || '').toString().trim();
  const nis = (formData.get('nis') || '').toString().trim();
  const kelas = (formData.get('kelas') || '').toString().trim();

  if (!nama || !nis || !kelas) {
    alert('Semua field harus diisi.');
    return;
  }

  const duplicate = students.some((student) => student.nis === nis);
  if (duplicate) {
    alert('NIS sudah terdaftar.');
    return;
  }

  const newStudent = {
    id: crypto.randomUUID(),
    nama,
    nis,
    kelas
  };

  students.push(newStudent);
  persistStudents();
  studentForm.reset();
  renderAttendanceTable();
  renderRecap();
}

function exportRecapCsv() {
  const rows = [
    ['Nama', 'NIS', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Persentase']
  ];

  students.forEach((student) => {
    const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    Object.keys(attendance).forEach((date) => {
      const status = attendance[date]?.[student.id];
      if (status && counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    const percentage = total ? ((counts.hadir / total) * 100).toFixed(0) : '0';
    rows.push([
      student.nama,
      student.nis,
      student.kelas,
      counts.hadir,
      counts.izin,
      counts.sakit,
      counts.alpa,
      `${percentage}%`
    ]);
  });

  const csvContent = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rekap-absensi.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function resetData() {
  const confirmed = confirm('Apakah Anda yakin ingin menghapus semua data siswa dan absensi?');
  if (!confirmed) return;

  students = [];
  attendance = {};
  localStorage.removeItem(STORAGE_KEYS.students);
  localStorage.removeItem(STORAGE_KEYS.attendance);
  renderAttendanceTable();
  renderRecap();
  totalStudentsEl.textContent = '0';
}

loginForm.addEventListener('submit', loginAdmin);
logoutButton.addEventListener('click', logoutAdmin);
studentForm.addEventListener('submit', addStudent);
saveAttendanceButton.addEventListener('click', saveAttendanceForDate);
exportCsvButton.addEventListener('click', exportRecapCsv);
resetDataButton.addEventListener('click', resetData);
attendanceDateInput.addEventListener('change', () => {
  renderAttendanceTable();
  renderSummary();
  renderRecap();
});

attendanceDateInput.value = todayISO();
checkSession();
renderAttendanceTable();
renderRecap();
renderSummary();
