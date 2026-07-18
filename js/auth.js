/**
 * Auth module — localStorage-based user auth, profile, and session management.
 * Exposes window.PokeAuth as the public API.
 */
const PokeAuth = (() => {
  'use strict';

  const USERS_KEY = 'pokemon_users';
  const SESSION_KEY = 'pokemon_current_user';

  // ─── Helpers ───
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch { return []; }
  }

  function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function generateId() {
    return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_pokechamp_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getCurrentUserId() {
    return localStorage.getItem(SESSION_KEY);
  }

  function getCurrentUser() {
    const id = getCurrentUserId();
    if (!id) return null;
    const users = getUsers();
    return users.find(u => u.id === id) || null;
  }

  // ─── Auth API ───
  async function register(username, email, password) {
    const users = getUsers();
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUser || !trimmedEmail || !password) {
      return { ok: false, error: 'Todos los campos son obligatorios' };
    }
    if (trimmedUser.length < 3) {
      return { ok: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' };
    }
    if (password.length < 4) {
      return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }
    if (users.find(u => u.username.toLowerCase() === trimmedUser.toLowerCase())) {
      return { ok: false, error: 'El nombre de usuario ya existe' };
    }
    if (users.find(u => u.email === trimmedEmail)) {
      return { ok: false, error: 'El email ya está registrado' };
    }

    const hashedPw = await hashPassword(password);
    const newUser = {
      id: generateId(),
      username: trimmedUser,
      email: trimmedEmail,
      password: hashedPw,
      profile: {
        playerName: '',
        trainerName: '',
        playerId: '',
        dobMm: '',
        dobDd: '',
        dobYyyy: '',
        teamNumber: '',
        switchProfile: '',
        supportId: '',
        ageDivision: 'Masters',
      },
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setUsers(users);
    localStorage.setItem(SESSION_KEY, newUser.id);
    return { ok: true, user: sanitizeUser(newUser) };
  }

  async function login(username, password) {
    const users = getUsers();
    const trimmed = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === trimmed || u.email === trimmed);
    if (!user) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }
    const hashedPw = await hashPassword(password);
    if (user.password !== hashedPw) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }
    localStorage.setItem(SESSION_KEY, user.id);
    return { ok: true, user: sanitizeUser(user) };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function getProfile() {
    const user = getCurrentUser();
    return user ? user.profile : null;
  }

  function updateProfile(profileData) {
    const id = getCurrentUserId();
    if (!id) return false;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users[idx].profile = { ...users[idx].profile, ...profileData };
    setUsers(users);
    return true;
  }

  function getSavedTeams() {
    const user = getCurrentUser();
    if (!user) return [];
    try {
      const allTeams = JSON.parse(localStorage.getItem('pokemon_champion_teams') || '[]');
      return allTeams.filter(t => t.userId === user.id);
    } catch { return []; }
  }

  function saveTeamToStorage(teamObj) {
    const user = getCurrentUser();
    if (!user) return false;
    const allTeams = getUnscopedTeams();
    allTeams.push({ ...teamObj, userId: user.id });
    localStorage.setItem('pokemon_champion_teams', JSON.stringify(allTeams));
    return true;
  }

  function deleteTeamFromStorage(index) {
    const user = getCurrentUser();
    if (!user) return false;
    const userTeams = getSavedTeams();
    if (index < 0 || index >= userTeams.length) return false;
    const target = userTeams[index];
    const allTeams = getUnscopedTeams();
    const globalIdx = allTeams.findIndex(t => t === target);
    if (globalIdx === -1) return false;
    allTeams.splice(globalIdx, 1);
    localStorage.setItem('pokemon_champion_teams', JSON.stringify(allTeams));
    return true;
  }

  function loadTeamFromStorage(index) {
    const userTeams = getSavedTeams();
    return userTeams[index] || null;
  }

  function getUnscopedTeams() {
    try { return JSON.parse(localStorage.getItem('pokemon_champion_teams') || '[]'); }
    catch { return []; }
  }

  function sanitizeUser(user) {
    const { password, ...rest } = user;
    return rest;
  }

  // ─── UI Rendering ───
  function renderAuthButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const user = getCurrentUser();

    if (user) {
      container.innerHTML = `
        <div class="auth-user-menu">
          <button class="auth-avatar-btn" id="authMenuToggle">
            <span class="auth-avatar">${user.username.charAt(0).toUpperCase()}</span>
            <span class="auth-username">${user.username}</span>
          </button>
          <div class="auth-dropdown hidden" id="authDropdown">
            <button class="auth-dropdown-item" data-action="profile">
              <span data-es="Mi Perfil" data-en="My Profile">Mi Perfil</span>
            </button>
            <div class="auth-dropdown-divider"></div>
            <button class="auth-dropdown-item auth-dropdown-danger" data-action="logout">
              <span data-es="Cerrar Sesión" data-en="Log Out">Cerrar Sesión</span>
            </button>
          </div>
        </div>`;
      applyLangTo(container);

      const toggleBtn = container.querySelector('#authMenuToggle');
      const dropdown = container.querySelector('#authDropdown');
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });
      document.addEventListener('click', () => dropdown.classList.add('hidden'));

      container.querySelectorAll('.auth-dropdown-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          if (action === 'profile') openProfileModal();
          else if (action === 'logout') { logout(); location.reload(); }
        });
      });
    } else {
      container.innerHTML = `<button class="auth-login-btn" id="authLoginBtn"><span data-es="Iniciar Sesión" data-en="Log In">Iniciar Sesión</span></button>`;
      applyLangTo(container);
      container.querySelector('#authLoginBtn').addEventListener('click', openLoginModal);
    }
  }

  // ─── Modals ───
  function createModalHTML() {
    if (document.getElementById('authModals')) return;
    const div = document.createElement('div');
    div.id = 'authModals';
    div.innerHTML = `
      <!-- Login Modal -->
      <div id="loginModal" class="auth-modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Login">
        <div class="auth-modal">
          <button class="auth-modal-close" id="loginClose">&times;</button>
          <h3 class="auth-modal-title" data-es="Iniciar Sesión" data-en="Log In">Iniciar Sesión</h3>
          <form id="loginForm" autocomplete="on">
            <div class="auth-field">
              <label for="loginUser" data-es="Usuario o Email" data-en="Username or Email">Usuario o Email</label>
              <input type="text" id="loginUser" autocomplete="username" required>
            </div>
            <div class="auth-field">
              <label for="loginPass" data-es="Contraseña" data-en="Password">Contraseña</label>
              <input type="password" id="loginPass" autocomplete="current-password" required>
            </div>
            <div class="auth-error hidden" id="loginError"></div>
            <button type="submit" class="auth-btn auth-btn-primary" id="loginSubmit">
              <span data-es="Entrar" data-en="Log In">Entrar</span>
            </button>
          </form>
          <p class="auth-switch-text">
            <span data-es="¿No tienes cuenta?" data-en="Don't have an account?">¿No tienes cuenta?</span>
            <button class="auth-link-btn" id="goToRegister">
              <span data-es="Regístrate" data-en="Sign Up">Regístrate</span>
            </button>
          </p>
        </div>
      </div>

      <!-- Register Modal -->
      <div id="registerModal" class="auth-modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Register">
        <div class="auth-modal">
          <button class="auth-modal-close" id="registerClose">&times;</button>
          <h3 class="auth-modal-title" data-es="Crear Cuenta" data-en="Sign Up">Crear Cuenta</h3>
          <form id="registerForm" autocomplete="on">
            <div class="auth-field">
              <label for="regUser" data-es="Nombre de usuario" data-en="Username">Nombre de usuario</label>
              <input type="text" id="regUser" autocomplete="username" minlength="3" required>
            </div>
            <div class="auth-field">
              <label for="regEmail" data-es="Email" data-en="Email">Email</label>
              <input type="email" id="regEmail" autocomplete="email" required>
            </div>
            <div class="auth-field">
              <label for="regPass" data-es="Contraseña" data-en="Password">Contraseña</label>
              <input type="password" id="regPass" autocomplete="new-password" minlength="4" required>
            </div>
            <div class="auth-field">
              <label for="regPass2" data-es="Repetir contraseña" data-en="Confirm password">Repetir contraseña</label>
              <input type="password" id="regPass2" autocomplete="new-password" minlength="4" required>
            </div>
            <div class="auth-error hidden" id="registerError"></div>
            <button type="submit" class="auth-btn auth-btn-primary" id="registerSubmit">
              <span data-es="Crear Cuenta" data-en="Sign Up">Crear Cuenta</span>
            </button>
          </form>
          <p class="auth-switch-text">
            <span data-es="¿Ya tienes cuenta?" data-en="Already have an account?">¿Ya tienes cuenta?</span>
            <button class="auth-link-btn" id="goToLogin">
              <span data-es="Inicia Sesión" data-en="Log In">Inicia Sesión</span>
            </button>
          </p>
        </div>
      </div>

      <!-- Profile Modal -->
      <div id="profileModal" class="auth-modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Profile">
        <div class="auth-modal auth-modal-wide">
          <button class="auth-modal-close" id="profileClose">&times;</button>
          <h3 class="auth-modal-title" data-es="Mi Perfil" data-en="My Profile">Mi Perfil</h3>
          <div class="auth-profile-header">
            <div class="auth-avatar auth-avatar-lg" id="profileAvatar"></div>
            <div class="auth-profile-info">
              <div class="auth-profile-name" id="profileUsername"></div>
              <div class="auth-profile-email" id="profileEmail"></div>
            </div>
          </div>
          <div class="auth-divider"></div>
          <h4 class="auth-section-title" data-es="Datos del Jugador" data-en="Player Data">Datos del Jugador</h4>
          <form id="profileForm" class="auth-profile-form">
            <div class="auth-field">
              <label for="profPlayerName" data-es="Nombre del Jugador" data-en="Player Name">Nombre del Jugador</label>
              <input type="text" id="profPlayerName">
            </div>
            <div class="auth-field">
              <label for="profTrainerName" data-es="Nombre de Entrenador" data-en="Trainer Name">Nombre de Entrenador</label>
              <input type="text" id="profTrainerName">
            </div>
            <div class="auth-field">
              <label for="profPlayerId" data-es="ID Jugador" data-en="Player ID">ID Jugador</label>
              <input type="text" id="profPlayerId" maxlength="10">
            </div>
            <div class="auth-field">
              <label data-es="Fecha de Nacimiento" data-en="Date of Birth">Fecha de Nacimiento</label>
              <div class="auth-dob-row">
                <input type="text" id="profDobMm" placeholder="MM" maxlength="2">
                <span>/</span>
                <input type="text" id="profDobDd" placeholder="DD" maxlength="2">
                <span>/</span>
                <input type="text" id="profDobYyyy" placeholder="YYYY" maxlength="4">
              </div>
            </div>
            <div class="auth-field">
              <label for="profTeamNumber" data-es="Nº Equipo de Batalla" data-en="Battle Team Number">Nº Equipo de Batalla</label>
              <input type="text" id="profTeamNumber">
            </div>
            <div class="auth-field">
              <label for="profSwitchProfile" data-es="Perfil de Switch" data-en="Switch Profile">Perfil de Switch</label>
              <input type="text" id="profSwitchProfile">
            </div>
            <div class="auth-field">
              <label for="profSupportId" data-es="Support ID" data-en="Support ID">Support ID</label>
              <input type="text" id="profSupportId">
            </div>
            <div class="auth-field">
              <label data-es="División de Edad" data-en="Age Division">División de Edad</label>
              <div class="auth-division-btns">
                <label class="auth-chip-btn"><input type="radio" name="profAgeDivision" value="Juniors" style="display:none;">Juniors</label>
                <label class="auth-chip-btn"><input type="radio" name="profAgeDivision" value="Seniors" style="display:none;">Seniors</label>
                <label class="auth-chip-btn active"><input type="radio" name="profAgeDivision" value="Masters" checked style="display:none;">Masters</label>
              </div>
            </div>
            <div class="auth-profile-actions">
              <button type="submit" class="auth-btn auth-btn-primary">
                <span data-es="Guardar Perfil" data-en="Save Profile">Guardar Perfil</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    setupModalEvents();
  }

  function setupModalEvents() {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const profileModal = document.getElementById('profileModal');

    document.getElementById('loginClose').addEventListener('click', () => loginModal.classList.add('hidden'));
    document.getElementById('registerClose').addEventListener('click', () => registerModal.classList.add('hidden'));
    document.getElementById('profileClose').addEventListener('click', () => profileModal.classList.add('hidden'));

    [loginModal, registerModal, profileModal].forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
    });

    document.getElementById('goToRegister').addEventListener('click', () => {
      loginModal.classList.add('hidden');
      registerModal.classList.remove('hidden');
    });
    document.getElementById('goToLogin').addEventListener('click', () => {
      registerModal.classList.add('hidden');
      loginModal.classList.remove('hidden');
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUser').value;
      const pass = document.getElementById('loginPass').value;
      const errEl = document.getElementById('loginError');
      errEl.classList.add('hidden');
      document.getElementById('loginSubmit').disabled = true;
      const result = await login(username, pass);
      document.getElementById('loginSubmit').disabled = false;
      if (result.ok) {
        loginModal.classList.add('hidden');
        location.reload();
      } else {
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
      }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('regUser').value;
      const email = document.getElementById('regEmail').value;
      const pass = document.getElementById('regPass').value;
      const pass2 = document.getElementById('regPass2').value;
      const errEl = document.getElementById('registerError');
      errEl.classList.add('hidden');
      if (pass !== pass2) {
        errEl.textContent = 'Las contraseñas no coinciden';
        errEl.classList.remove('hidden');
        return;
      }
      document.getElementById('registerSubmit').disabled = true;
      const result = await register(user, email, pass);
      document.getElementById('registerSubmit').disabled = false;
      if (result.ok) {
        registerModal.classList.add('hidden');
        location.reload();
      } else {
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
      }
    });

    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const profile = {
        playerName: document.getElementById('profPlayerName').value.trim(),
        trainerName: document.getElementById('profTrainerName').value.trim(),
        playerId: document.getElementById('profPlayerId').value.trim(),
        dobMm: document.getElementById('profDobMm').value.trim(),
        dobDd: document.getElementById('profDobDd').value.trim(),
        dobYyyy: document.getElementById('profDobYyyy').value.trim(),
        teamNumber: document.getElementById('profTeamNumber').value.trim(),
        switchProfile: document.getElementById('profSwitchProfile').value.trim(),
        supportId: document.getElementById('profSupportId').value.trim(),
        ageDivision: document.querySelector('[name="profAgeDivision"]:checked')?.value || 'Masters',
      };
      updateProfile(profile);
      profileModal.classList.add('hidden');
    });

    document.querySelectorAll('[name="profAgeDivision"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('[name="profAgeDivision"]').forEach(l => {
          l.closest('.auth-chip-btn')?.classList.toggle('active', l.checked);
        });
      });
    });
  }

  function openLoginModal() {
    createModalHTML();
    const modal = document.getElementById('loginModal');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('loginUser').focus(), 100);
  }

  function openRegisterModal() {
    createModalHTML();
    const modal = document.getElementById('registerModal');
    document.getElementById('registerError').classList.add('hidden');
    document.getElementById('regUser').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regPass2').value = '';
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('regUser').focus(), 100);
  }

  function openProfileModal() {
    createModalHTML();
    const user = getCurrentUser();
    if (!user) return openLoginModal();
    const modal = document.getElementById('profileModal');
    const p = user.profile || {};

    document.getElementById('profileAvatar').textContent = user.username.charAt(0).toUpperCase();
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;

    document.getElementById('profPlayerName').value = p.playerName || '';
    document.getElementById('profTrainerName').value = p.trainerName || '';
    document.getElementById('profPlayerId').value = p.playerId || '';
    document.getElementById('profDobMm').value = p.dobMm || '';
    document.getElementById('profDobDd').value = p.dobDd || '';
    document.getElementById('profDobYyyy').value = p.dobYyyy || '';
    document.getElementById('profTeamNumber').value = p.teamNumber || '';
    document.getElementById('profSwitchProfile').value = p.switchProfile || '';
    document.getElementById('profSupportId').value = p.supportId || '';

    if (p.ageDivision) {
      const radio = document.querySelector(`[name="profAgeDivision"][value="${p.ageDivision}"]`);
      if (radio) {
        radio.checked = true;
        document.querySelectorAll('[name="profAgeDivision"]').forEach(l => {
          l.closest('.auth-chip-btn')?.classList.toggle('active', l.checked);
        });
      }
    }

    modal.classList.remove('hidden');
  }

  function applyLangTo(root) {
    const lang = document.documentElement.getAttribute('data-lang') || 'es';
    root.querySelectorAll('[data-es][data-en]').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) el.textContent = text;
    });
  }

  return {
    register,
    login,
    logout,
    isLoggedIn,
    getCurrentUser,
    getProfile,
    updateProfile,
    getSavedTeams,
    saveTeamToStorage,
    deleteTeamFromStorage,
    loadTeamFromStorage,
    renderAuthButton,
    openLoginModal,
    openRegisterModal,
    openProfileModal,
  };
})();
