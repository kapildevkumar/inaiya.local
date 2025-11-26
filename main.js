/**
 * CORE APPLICATION CONTROLLER (LOCAL PWA)
 * ============================================================================
 * Adapted for IndexedDB Local Storage usage.
 */

import { initAuth, logout } from './auth.js'; 
import { loadData, saveData, siteData, setSiteData, addPhoto, deletePhoto, updatePhoto, uploadGenericImage, resetAllData } from './data.js';
import { renderContent, renderCalendar, renderTimelineList } from './render.js';
import { digestMessage, validateInput, sanitize } from './utils.js';

// DOM Elements
const mainContent = document.getElementById('main-content');
const desktopNavContainer = document.getElementById('desktop-nav-items');
const mobileNavContainer = document.getElementById('mobile-nav-items');
const sidebarPhoto = document.getElementById('sidebar-spouse-photo');
const sidebarName = document.getElementById('sidebar-spouse-name');
const sidebarTag = document.getElementById('sidebar-spouse-tag');
const formModalBackdrop = document.getElementById('form-modal-backdrop');
const loginOverlay = document.getElementById('login-overlay');
const passwordOverlay = document.getElementById('password-overlay');
const appContainer = document.getElementById('app-container');
const mobileNav = document.getElementById('mobile-nav');

// Themes
const THEMES = {
    'default': { '--bg-light': '#FFF8F0', '--bg-soft': '#FFEAE3', '--primary': '#E8A0BF', '--accent': '#BA90C6', '--text-dark': '#432C39', '--text-light': '#6D5D6E' },
    'ocean': { '--bg-light': '#F0F9FF', '--bg-soft': '#E0F2FE', '--primary': '#38BDF8', '--accent': '#0284C7', '--text-dark': '#0C4A6E', '--text-light': '#475569' },
    'nature': { '--bg-light': '#F7FEE7', '--bg-soft': '#ECFCCB', '--primary': '#84CC16', '--accent': '#4D7C0F', '--text-dark': '#14532D', '--text-light': '#3F6212' },
    'lavender': { '--bg-light': '#FAF5FF', '--bg-soft': '#F3E8FF', '--primary': '#A855F7', '--accent': '#7E22CE', '--text-dark': '#3B0764', '--text-light': '#6B21A8' },
    'cherry': { '--bg-light': '#FFF1F2', '--bg-soft': '#FFE4E6', '--primary': '#FB7185', '--accent': '#E11D48', '--text-dark': '#881337', '--text-light': '#9F1239' },
    'sunshine': { '--bg-light': '#FEFCE8', '--bg-soft': '#FEF9C3', '--primary': '#FACC15', '--accent': '#CA8A04', '--text-dark': '#422006', '--text-light': '#713F12' },
    'coral': { '--bg-light': '#FFF7ED', '--bg-soft': '#FFEDD5', '--primary': '#FB923C', '--accent': '#EA580C', '--text-dark': '#431407', '--text-light': '#7C2D12' },
    'teal': { '--bg-light': '#F0FDFA', '--bg-soft': '#CCFBF1', '--primary': '#2DD4BF', '--accent': '#0D9488', '--text-dark': '#134E4A', '--text-light': '#115E59' },
    'mocha': { '--bg-light': '#F5F5F4', '--bg-soft': '#E7E5E4', '--primary': '#A8A29E', '--accent': '#57534E', '--text-dark': '#292524', '--text-light': '#44403C' },
    'berry': { '--bg-light': '#FDF2F8', '--bg-soft': '#FCE7F3', '--primary': '#F472B6', '--accent': '#DB2777', '--text-dark': '#500724', '--text-light': '#831843' }
};

let isProcessingAuth = false;
let countdownInterval, relationshipInterval, slideshowInterval;
let currentCalendarDate = new Date();
let galleryIndex = 0;

const navLinks = [
    { id: 'home', icon: 'fas fa-heart', text: 'Home' },
    { id: 'journey', icon: 'fas fa-calendar-alt', text: 'Journey' },
    { id: 'gallery', icon: 'fas fa-images', text: 'Gallery' },
    { id: 'allMyLove', icon: 'fas fa-heart-pulse', text: 'All My Love' },
    { id: 'bucketList', icon: 'fas fa-map-signs', text: 'Bucket List' },
    { id: 'promises', icon: 'fas fa-hand-holding-heart', text: 'Promises' },
    { id: 'memories', icon: 'fas fa-book-open', text: 'Memories' },
    { id: 'playlist', icon: 'fas fa-music', text: 'Playlist' },
    { id: 'video', icon: 'fas fa-video', text: 'Video' },
    { id: 'surprise', icon: 'fas fa-gift', text: 'Surprise' },
    { id: 'settings', icon: 'fas fa-cog', text: 'Settings' }
];

async function init() {
  console.log("Initializing Local PWA...");
  
  // Theme
  const savedTheme = localStorage.getItem('app_theme') || (window.SITE_CONFIG ? window.SITE_CONFIG.theme : 'default');
  if (savedTheme && THEMES[savedTheme]) {
    applyThemeInternal(savedTheme);
  }
  
  // Network listeners
  window.addEventListener('offline', () => showCustomAlert("Connection Lost", "You are offline (Local mode active).", true));
  window.addEventListener('online', () => showCustomAlert("Back Online", "Connection restored.", true));
  
  // Hash routing
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.substring(1);
    const validPage = navLinks.find(l => l.id === page) ? page : 'home';
    navigateTo(validPage);
  });

  // EMERGENCY FIX: Always add 'loaded' class after a short delay
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 100);

  // Check session
  if (sessionStorage.getItem('inaiya_session')) {
    // Already has session, proceed
    handleAuthenticatedState();
  } else {
    // Show login
    loginOverlay.classList.remove('hidden');
    document.body.classList.add('loaded'); // Ensure login shows
  }
  
  // Setup auth callbacks
  initAuth(
    (session) => {
      if (!isProcessingAuth) {
        isProcessingAuth = true;
        handleAuthenticatedState();
      }
    },
    () => {
      window.location.reload();
    }
  );
}


function applyThemeInternal(themeKey) {
    const theme = THEMES[themeKey];
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    localStorage.setItem('app_theme', themeKey);
}


async function handleAuthenticatedState() {
  console.log('Authentication successful');
  
  // Hide overlays
  loginOverlay.classList.add('hidden');
  
  // Check for App Password
  const isPassOk = sessionStorage.getItem('isAppAuthenticated') === 'true';
  if (!isPassOk && window.SITE_CONFIG?.appPasswordHash) {
    passwordOverlay.classList.remove('hidden');
    passwordOverlay.style.display = 'flex';
    document.body.classList.add('loaded'); // Ensure password screen shows
    await promptForAppPassword();
  }
  
  passwordOverlay.classList.add('hidden');
  passwordOverlay.style.display = 'none';
  
  // Show app containers
  appContainer.classList.remove('hidden');
  mobileNav.classList.remove('hidden');
  
  if (localStorage.getItem('app_edit_mode') === 'true') {
    document.body.classList.add('is-editing');
  }
  
  // Ensure screen is visible
  document.body.classList.add('loaded');
  
  try {
    await loadData();
    renderAll();
  } catch(e) {
    console.error('Data load error:', e);
    renderErrorState(e);
  }
}


function renderAll() {
  // 1. Sync Sidebar
  sidebarPhoto.src = siteData.homepage.mainImage || 'https://placehold.co/100x100';
  sidebarName.textContent = window.SITE_CONFIG?.SpouseName || 'My Love';
  if(sidebarTag) sidebarTag.textContent = siteData.homepage.relationshipTag || 'For You';
  
  updateMetaTags();
  
  // 2. CRITICAL: Build navigation
  buildNavigation();
  
  // 3. Container setup
  mainContent.innerHTML = navLinks.map(link => 
    `<div id="${link.id}" class="content-section" role="tabpanel" aria-labelledby="nav-${link.id}"></div>`
  ).join('');
  
  // 4. Route to initial page
  const initialPage = window.location.hash.substring(1) || 'home';
  navigateTo(initialPage);
}

function buildNavigation() {
  // FIXED: Add null checks
  if (!desktopNavContainer || !mobileNavContainer) {
    console.error('Navigation containers not found in DOM');
    return;
  }
  
  desktopNavContainer.innerHTML = '';
  mobileNavContainer.innerHTML = '';
  
  navLinks.forEach(link => {
    // Desktop Link
    const a = document.createElement('a');
    a.href = `#${link.id}`;
    a.id = `nav-${link.id}`;
    a.className = 'nav-item block font-bold text-slate-600 rounded-lg p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary';
    a.dataset.page = link.id;
    a.setAttribute('role', 'tab');
    a.innerHTML = `<i class="${link.icon} w-6 mr-2 text-center"></i> ${link.text}`;
    a.onclick = (e) => {
      e.preventDefault();
      navigateTo(link.id);
    };
    desktopNavContainer.appendChild(a);
    
    // Mobile Link
    const ma = document.createElement('a');
    ma.href = `#${link.id}`;
    ma.className = 'mobile-nav-item flex flex-col items-center justify-center h-full focus:outline-none';
    ma.dataset.page = link.id;
    ma.innerHTML = `<i class="${link.icon}"></i><span>${link.text}</span>`;
    ma.onclick = (e) => {
      e.preventDefault();
      navigateTo(link.id);
    };
    mobileNavContainer.appendChild(ma);
  });
  
  console.log('Navigation built successfully');
}


function navigateTo(pageId) {
    if (!navLinks.find(l => l.id === pageId)) return;

    if (window.location.hash.substring(1) !== pageId) {
        window.location.hash = pageId;
        return; 
    }

    if (countdownInterval) clearInterval(countdownInterval);
    if (relationshipInterval) clearInterval(relationshipInterval);
    
    document.querySelectorAll('.content-section.active').forEach(s => s.classList.remove('active', 'fade-in'));
    
    const activeSection = document.getElementById(pageId);
    if (activeSection) {
        activeSection.innerHTML = renderContent(pageId, navLinks);
        
        if (pageId === 'journey') {
            const placeholder = activeSection.querySelector('#dynamic-content');
            const journeyContent = `<div id="calendar-container" class="mb-8">${renderCalendar(currentCalendarDate)}</div><div class="border-t pt-6"><h3 class="text-xl font-bold mb-4">🗓️ Our Timeline</h3><div id="timeline-list">${renderTimelineList()}</div></div>`;
            if (placeholder) placeholder.outerHTML = journeyContent; 
        }
        
        activeSection.classList.add('active');
        setTimeout(() => activeSection.classList.add('fade-in'), 10);
    }

    if (pageId === 'bucketList') { updateAllCountdowns(); countdownInterval = setInterval(updateAllCountdowns, 1000); }
    else if (pageId === 'home') { updateRelationshipTimer(); relationshipInterval = setInterval(updateRelationshipTimer, 1000); }
    else if (pageId === 'memories') { addNoteEventListeners(); }
    else if (pageId === 'settings') { bindSettingsEvents(); }
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
    document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
    window.scrollTo(0, 0);
}

function toggleEditMode(enable) {
    if (enable) {
        document.body.classList.add('is-editing');
        localStorage.setItem('app_edit_mode', 'true');
        showCustomAlert('Edit Mode On', 'You can now add, edit, and delete items.', true);
    } else {
        document.body.classList.remove('is-editing');
        localStorage.setItem('app_edit_mode', 'false');
    }
    const currentPage = window.location.hash.substring(1) || 'home';
    navigateTo(currentPage);
}

// --- Universal Save Handler (Local) ---
async function saveEntry(pageId, index, context) {
    const btn = document.getElementById('modal-save-btn');
    const val = id => document.getElementById(id)?.value.trim();
    const checked = id => document.getElementById(id)?.checked;
    const isNew = index === -1;
    
    let error = null; 
    if (pageId === 'home' && context === 'timer') error = validateInput(val('date'), 'date', 'Relationship Date'); 
    else if (pageId === 'journey') error = validateInput(val('date'), 'date', 'Date') || validateInput(val('title'), 'required', 'Title'); 
    if (error) { showCustomAlert('Validation Error', error); return; } 

    btn.innerHTML = 'Saving...'; btn.disabled = true;

    try {
        const fileInput = document.getElementById('image-file') || document.querySelector('input[type="file"]');
        let uploadedUrl = null;
        
        // --- HANDLE GALLERY UPLOAD (BLOB STORAGE) ---
        if (pageId === 'gallery') {
             if(isNew) {
                if (fileInput && fileInput.files.length > 0) {
                    await addPhoto(fileInput.files[0], val('caption'));
                }
             } else {
                // UPDATE EXISTING PHOTO
                const fileToUpdate = (fileInput && fileInput.files.length > 0) ? fileInput.files[0] : null;
                await updatePhoto(index, val('caption'), fileToUpdate);
             }
        } 
        // --- HANDLE GENERIC UPLOAD (BASE64 STORAGE) ---
        else {
            if (fileInput && fileInput.files.length > 0) {
                uploadedUrl = await uploadGenericImage(fileInput.files[0]);
            }
            const getImgVal = (id) => uploadedUrl || val(id);

            if (pageId === 'home') { 
                if (context === 'timer') {
                    siteData.homepage.relationshipStart = val('date'); 
                } else { 
                    siteData.homepage.mainImage = getImgVal('image'); 
                    siteData.homepage.introMessage = val('intro'); 
                    siteData.homepage.relationshipTag = val('tag'); 
                } 
            } 
            else if (pageId === 'journey') { const evt = { date: val('date'), title: val('title'), description: val('desc'), showYear: !checked('hideYear') }; if (isNew) siteData.events.push(evt); else siteData.events[index] = evt; } 
            else if (pageId === 'video') { siteData.videoMontage = { intro: val('intro'), fileId: val('url') }; } 
            else if (pageId === 'surprise') { 
                siteData.surprise = { 
                    ...siteData.surprise, 
                    title: val('title'), 
                    message: val('msg'), 
                    image: getImgVal('image') 
                }; 
            } 
            else if (pageId === 'wheel') {
                siteData.surprise.wheelItems = val('wheel-items').split(',').map(s => s.trim()).filter(s => s);
                pageId = 'surprise';
            }
            else if (pageId === 'bucketList') { if (context === 'intro') siteData.bucketList.intro = val('intro'); else { const item = { title: val('title'), description: val('desc'), targetDate: val('date'), icon: val('icon') }; if(isNew) siteData.bucketList.items.push(item); else siteData.bucketList.items[index] = item; } } 
            else if (pageId === 'playlist') { if (context === 'intro') siteData.playlist.intro = val('intro'); else { const s = { title: val('title'), embedId: val('embed'), note: val('note') }; if(isNew) siteData.playlist.songs.push(s); else siteData.playlist.songs[index] = s; } } 
            else if (pageId === 'promises') { if(context==='intro') siteData.promises.intro=val('intro'); else if(isNew) siteData.promises.promises.push(val('promise')); else siteData.promises.promises[index]=val('promise'); } 
            else if (pageId === 'loveLanguages') { const l = { name:val('name'), icon:val('icon'), description:val('desc') }; if(isNew) siteData.loveLanguages.languages.push(l); else siteData.loveLanguages.languages[index]=l; } 
            else if (pageId === 'loveReasons') { if(isNew) siteData.loveReasons.reasons.push(val('reason')); else siteData.loveReasons.reasons[index]=val('reason'); } 
            else if (pageId === 'memoryBook') { const m = { message:val('msg'), author:val('auth') }; if(isNew) siteData.memoryBook.push(m); else siteData.memoryBook[index]=m; } 
            
            else if (pageId === 'allMyLove') {
                if (context === 'intro') siteData.loveLanguages.intro = val('intro');
                else if (context === 'loveReasonsIntro') siteData.loveReasons.intro = val('intro'); 
                else if (context === 'loveLanguages') {
                    const l = { name: val('name'), icon: val('icon'), description: val('desc') };
                    siteData.loveLanguages.languages.push(l);
                }
                else if (context === 'loveReasons') {
                    siteData.loveReasons.reasons.push(val('reason'));
                }
            }

            await saveData(false, showCustomAlert);
        }

        formModalBackdrop.classList.remove('active');
        const sectionMap = { 'loveLanguages': 'allMyLove', 'loveReasons': 'allMyLove', 'loveReasonsIntro': 'allMyLove', 'notes': 'memories' };
        navigateTo(sectionMap[pageId] || pageId);

    } catch (e) {
        console.error(e);
        showCustomAlert('Error', e.message || 'Failed to save.');
    } finally {
        btn.disabled = false;
    }
}

async function deleteItem(type, index) {
    if (!confirm("Are you sure?")) return;
    try {
        if (type === 'photoGallery') {
            await deletePhoto(index);
            navigateTo('gallery');
        } else {
            let arr = null, page = 'home';
            if(type==='events') { arr = siteData.events; page='journey'; }
            if(type==='bucketList') { arr = siteData.bucketList.items; page='bucketList'; }
            if(type==='notes') { arr = siteData.notes; page='memories'; }
            if(type==='playlist') { arr = siteData.playlist.songs; page='playlist'; }
            if(type==='promises') { arr = siteData.promises.promises; page='promises'; }
            if(type==='loveLanguages') { arr = siteData.loveLanguages.languages; page='allMyLove'; }
            if(type==='loveReasons') { arr = siteData.loveReasons.reasons; page='allMyLove'; }
            if(type==='memoryBook') { arr = siteData.memoryBook; page='memories'; }
            
            if (arr) {
                arr.splice(index, 1);
                await saveData(false, showCustomAlert);
                navigateTo(page);
            }
        }
    } catch(e) {
        showCustomAlert("Error", "Could not delete item.");
    }
}

function updateRelationshipTimer() {
    const start = new Date(siteData.homepage.relationshipStart || new Date());
    const now = new Date();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const el = document.getElementById('relationship-timer');
    if(el) {
        el.innerHTML = `
            <span class="heart-beat" aria-hidden="true"><i class="fas fa-heart"></i></span>
            <span>${days}d</span> : <span>${hours}h</span> : <span>${minutes}m</span> : <span>${seconds}s</span> 
            <span class="heart-beat" aria-hidden="true"><i class="fas fa-heart"></i></span>
        `;
    }
}

function updateMetaTags() {
    if (siteData.SpouseName) document.title = siteData.SpouseName;
    const imageUrl = siteData.homepage.mainImage || 'https://placehold.co/100x100';
    
    const setLink = (rel, href) => {
        let link = document.querySelector(`link[rel='${rel}']`);
        if (!link) {
            link = document.createElement('link');
            link.rel = rel;
            document.head.appendChild(link);
        }
        link.href = href;
    };
    setLink('icon', imageUrl);
    setLink('apple-touch-icon', imageUrl);
    setLink('shortcut icon', imageUrl);

    let metaTheme = document.querySelector("meta[name='theme-color']");
    if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
    }
    metaTheme.content = '#FFEAE3';
}


function spinWheel() {
    const result = document.getElementById('wheel-result');
    const btn = document.getElementById('spin-btn');
    const wheel = document.getElementById('the-wheel');
    
    const items = siteData.surprise.wheelItems;
    if (items.length === 0) { result.textContent = "Add items first!"; return; }

    btn.disabled = true;
    
    // Accessibility check
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        result.textContent = `✨ Let's do: ${randomItem}! ✨`;
        btn.disabled = false;
        return;
    }

    wheel.style.transition = 'none'; 
    wheel.style.transform = `rotate(0deg)`; 
    result.textContent = ''; 
    
    setTimeout(() => { 
        const extraSpins = 360 * 5; 
        const randomStop = Math.floor(Math.random() * 360); 
        const totalDeg = extraSpins + randomStop; 
        
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'; 
        wheel.style.transform = `rotate(${totalDeg}deg)`; 
        
        wheel.addEventListener('transitionend', () => {
             const degPerSlice = 360 / items.length;
             const normalizedDeg = totalDeg % 360; 
             const winningIndex = Math.floor((360 - normalizedDeg) / degPerSlice) % items.length; 
             result.textContent = `✨ Let's do: ${items[winningIndex]}! ✨`; 
             btn.disabled = false; 
        }, { once: true });
    }, 50);
}

// Modal Logic
function getModalContent(pageId, index, context) {
    const isNew = index === -1;
    let title = '', fields = '';
    
    const input = (id, label, val) => `<div class="mb-4"><label class="block text-sm font-bold mb-1 text-gray-700" for="${id}">${label}</label><input id="${id}" value="${sanitize(val)}" class="form-input"></div>`;
    const textarea = (id, label, val) => `<div class="mb-4"><label class="block text-sm font-bold mb-1 text-gray-700" for="${id}">${label}</label><textarea id="${id}" class="form-input h-24">${sanitize(val)}</textarea></div>`;
    const dateInput = (id, label, val) => `<div class="mb-4"><label class="block text-sm font-bold mb-1 text-gray-700" for="${id}">${label}</label><input type="date" id="${id}" value="${val}" class="form-input"></div>`;
    const imageInput = (id, label, currentUrl) => `
        <div class="mb-4"><label class="block text-sm font-bold mb-1 text-gray-700" for="${id}-file">${label}</label>
        <div class="flex gap-2 items-center"><input type="file" id="${id}-file" accept="image/*" class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-soft file:text-primary hover:file:bg-gray-100"/></div>
        <input type="hidden" id="${id}" value="${sanitize(currentUrl)}">${currentUrl ? `<p class="text-xs text-green-600 mt-1">Current image loaded.</p>` : ''}</div>`;

    if(pageId === 'home') {
        if(context === 'timer') { title = 'Relationship Start Date'; fields = dateInput('date', 'When did it start?', siteData.homepage.relationshipStart ? siteData.homepage.relationshipStart.slice(0, 10) : ''); } 
        else { title = 'Edit Home'; fields = imageInput('image', 'Main Photo', siteData.homepage.mainImage) + input('tag', 'Relationship Tag', siteData.homepage.relationshipTag || 'For You') + textarea('intro', 'Intro Message', siteData.homepage.introMessage); }
    } else if(pageId === 'journey') {
        const evt = !isNew ? siteData.events[index] : {};
        title = isNew ? 'Add Event' : 'Edit Event';
        fields = dateInput('date', 'Date', evt.date||'') + input('title', 'Title', evt.title||'') + textarea('desc', 'Description', evt.description||'') + `<div class="flex items-center mt-2"><input id="hideYear" type="checkbox" class="h-4 w-4 rounded" ${evt.showYear === false ? 'checked' : ''}><label for="hideYear" class="ml-2 text-sm">Recurring Anniversary (Hide Year)</label></div>`;
    } else if(pageId === 'gallery') {
        const photo = !isNew ? siteData.photoGallery[index] : {};
        title = isNew ? 'Add Photo' : 'Edit Photo';
        fields = imageInput('image', 'Upload Photo', photo.image||'') + textarea('caption', 'Caption', photo.caption||'');
    }
    else if (pageId === 'video') { title = 'Edit Video'; fields = textarea('intro', 'Intro', siteData.videoMontage.intro) + input('url', 'YouTube Video/Playlist URL', siteData.videoMontage.fileId || ''); }
    else if (pageId === 'surprise') { title = 'Edit Surprise'; fields = input('title', 'Title', siteData.surprise.title) + textarea('msg', 'Message', siteData.surprise.message) + imageInput('image', 'Surprise Image', siteData.surprise.image); }
    else if (pageId === 'bucketList') {
         if(context === 'intro') { title = 'Edit Intro'; fields = textarea('intro', 'Intro', siteData.bucketList.intro); } 
         else { const item = !isNew ? siteData.bucketList.items[index] : {}; title = isNew ? 'New Adventure' : 'Edit Adventure'; fields = input('title', 'Title', item.title||'') + input('icon', 'Icon Class', item.icon||'fas fa-star') + textarea('desc', 'Description', item.description||'') + dateInput('date', 'Target Date', item.targetDate||''); }
    }
    else if (pageId === 'wheel') { title = 'Edit Wheel'; fields = `<div class="mb-4"><label class="block text-sm font-bold mb-1 text-gray-700" for="wheel-items">Items (Comma separated)</label><textarea id="wheel-items" class="form-input h-24">${(siteData.surprise.wheelItems || []).join(', ')}</textarea></div>`; }
    else if (pageId === 'playlist') { if(context === 'intro') { title = 'Edit Intro'; fields = textarea('intro', 'Intro', siteData.playlist.intro); } else { const song = !isNew ? siteData.playlist.songs[index] : {}; title = 'Edit Song'; fields = input('title', 'Title', song.title||'') + input('embed', 'YouTube URL', song.embedId||'') + textarea('note', 'Note', song.note||''); } }
    else if (pageId === 'promises') { if(context==='intro') { title='Edit Intro'; fields=textarea('intro', 'Intro', siteData.promises.intro); } else { title='Promise'; fields=textarea('promise', 'Promise', !isNew ? siteData.promises.promises.push(val('promise')) : siteData.promises.promises[index]); } }
    
    else if (pageId === 'allMyLove') {
        if (context === 'intro') {
            title = 'Edit Intro';
            fields = textarea('intro', 'Intro', siteData.loveLanguages.intro);
        } 
        else if (context === 'loveReasonsIntro') { 
            title = 'Edit Reasons Intro';
            fields = textarea('intro', 'Intro', siteData.loveReasons.intro);
        }
        else if (context === 'loveLanguages') {
            title = 'Add Love Language';
            fields = input('name', 'Name', '') + input('icon', 'Icon', 'fas fa-heart') + textarea('desc', 'Description', '');
        } else if (context === 'loveReasons') {
            title = 'Add Reason';
            fields = textarea('reason', 'Reason', '');
        }
    }
    
    else if (pageId === 'loveLanguages') { const l = !isNew ? siteData.loveLanguages.languages[index] : {}; title='Love Language'; fields=input('name','Name',l.name||'') + input('icon','Icon',l.icon||'fas fa-heart') + textarea('desc','Description',l.description||''); }
    else if (pageId === 'loveReasons') { title='Reason'; fields=textarea('reason','Reason', !isNew ? siteData.loveReasons.reasons[index] : ''); }
    else if (pageId === 'memoryBook') { const m = !isNew ? siteData.memoryBook[index] : {}; title='Memory'; fields=textarea('msg','Message',m.message||'') + input('auth','Author',m.author||''); }

    return { title, fields };
}

function openModal(pageId, index = -1, context = 'default') {
    const { title, fields } = getModalContent(pageId, index, context);
    if(!fields) return;
    
    formModalBackdrop.innerHTML = `<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-content-header p-4 flex justify-between items-center"><h3 id="modal-title" class="font-bold text-xl">${title}</h3><button onclick="document.getElementById('form-modal-backdrop').classList.remove('active')" class="text-2xl" aria-label="Close Modal">&times;</button></div><div class="modal-content-body p-4">${fields}</div><div class="modal-content-footer p-4 flex justify-end gap-2"><button onclick="document.getElementById('form-modal-backdrop').classList.remove('active')" class="btn btn-secondary">Cancel</button><button id="modal-save-btn" onclick="window.app.saveEntry('${pageId}', ${index}, '${context}')" class="btn btn-primary">Save</button></div></div>`;
    formModalBackdrop.classList.add('active');
    
    const firstInput = formModalBackdrop.querySelector('input, textarea, button');
    if(firstInput) firstInput.focus();
}

function showCustomAlert(title, msg, autoClose = false) { const modal = document.getElementById('alert-modal-backdrop'); modal.innerHTML = `<div class="alert-modal-content text-center" role="alertdialog" aria-labelledby="alert-title" aria-describedby="alert-desc"><h3 id="alert-title" class="text-xl font-bold mb-2">${title}</h3><p id="alert-desc" class="text-gray-600 mb-4">${msg}</p><button onclick="document.getElementById('alert-modal-backdrop').classList.remove('active')" class="btn btn-primary">OK</button></div>`; modal.classList.add('active'); if(autoClose) setTimeout(() => modal.classList.remove('active'), 2000); }

function promptForAppPassword() {
    return new Promise((resolve) => {
        const input = document.getElementById('password-input');
        const form = document.getElementById('password-form');
        const error = document.getElementById('password-error');
        
        const tryLogin = async () => {
            const enteredHash = await digestMessage(input.value);
            if (enteredHash === window.SITE_CONFIG.appPasswordHash) {
                sessionStorage.setItem('isAppAuthenticated', 'true');
                error.classList.add('hidden');
                resolve();
            } else { error.classList.remove('hidden'); input.value = ''; input.focus(); }
        };
        
        // Use the form submit handler
        form.onsubmit = (e) => {
            e.preventDefault();
            tryLogin();
        };
    });
}

function updateAllCountdowns() { document.querySelectorAll('.countdown-container').forEach(el => { const target = new Date(el.dataset.countdownTarget).getTime(); const now = new Date().getTime(); const dist = target - now; if (dist < 0) { el.innerHTML = "It's here!"; return; } el.querySelector('.days').innerText = Math.floor(dist / (1000 * 60 * 60 * 24)); el.querySelector('.hours').innerText = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); el.querySelector('.minutes').innerText = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)); el.querySelector('.seconds').innerText = Math.floor((dist % (1000 * 60)) / 1000); }); }

function addNoteEventListeners() { document.getElementById('add-note-btn')?.addEventListener('click', async () => { const txt = document.getElementById('new-note-input').value; if(txt) { siteData.notes.push({ text: txt, done: false }); await saveData(true); navigateTo('memories'); } }); }

function bindSettingsEvents() {
  document.getElementById('clear-data-button')?.addEventListener('click', async () => {
    if(confirm("⚠️ WARNING: This will permanently delete ALL your data, photos, and settings. This cannot be undone!\n\nAre you absolutely sure?")) {
      const btn = document.getElementById('clear-data-button');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
      
      const result = await resetAllData();
      
      if (result.success) {
        showCustomAlert("Data Reset", "All data has been cleared. Reloading...", true);
        setTimeout(() => location.reload(), 2000);
      } else {
        showCustomAlert("Error", "Failed to reset data: " + result.error);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash mr-2"></i>Reset All Data';
      }
    }
  });
  
  document.getElementById('edit-mode-toggle')?.addEventListener('change', (e) => {
    toggleEditMode(e.target.checked);
  });
}

// Global Exports
window.app = {
    logout,
    applyTheme: (key) => {
        applyThemeInternal(key);
        if (window.location.hash === '#settings') {
            const activeSection = document.getElementById('settings');
            if (activeSection) {
                activeSection.innerHTML = renderContent('settings', navLinks);
                bindSettingsEvents();
            }
        }
    },
    navigateMonth: (dir) => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + dir); const el = document.getElementById('calendar-container'); if(el) el.innerHTML = renderCalendar(currentCalendarDate); },
    jumpToDate: () => { const m = document.getElementById('cal-month').value; const y = document.getElementById('cal-year').value; currentCalendarDate = new Date(y, m, 1); document.getElementById('calendar-container').innerHTML = renderCalendar(currentCalendarDate); },
    openModal,
    saveEntry,
    deleteItem,
    spinWheel,
    retryLoad: () => { window.location.reload(); },
    toggleNote: async (index) => { siteData.notes[index].done = !siteData.notes[index].done; await saveData(true); navigateTo('memories'); },
    
    // Lightbox Logic
    openImageModal: (i) => {
        galleryIndex = i;
        const p = siteData.photoGallery[i];
        document.getElementById('modal-image').src = p.image;
        document.getElementById('modal-caption').textContent = p.caption;
        document.getElementById('image-modal-backdrop').classList.add('active');
    },
    closeImageModal: () => { clearInterval(slideshowInterval); slideshowInterval = null; document.getElementById('image-modal-backdrop').classList.remove('active'); },
    navGallery: (dir) => { galleryIndex += dir; if (galleryIndex < 0) galleryIndex = siteData.photoGallery.length - 1; if (galleryIndex >= siteData.photoGallery.length) galleryIndex = 0; const p = siteData.photoGallery[galleryIndex]; document.getElementById('modal-image').src = p.image; document.getElementById('modal-caption').textContent = p.caption; },
    startSlideshowFromPage: () => { if (siteData.photoGallery.length === 0) return; window.app.openImageModal(0); slideshowInterval = setInterval(() => window.app.navGallery(1), 3000); },
    
    emergencyReset: async () => {
        if(confirm("This will wipe all local data to fix the corruption. Continue?")) {
            const req = indexedDB.deleteDatabase('InaiyaLocalDB');
            req.onsuccess = () => window.location.reload();
            req.onerror = () => alert("Could not delete DB. Clear browser cache manually.");
        }
    },

    // Export Data Function
    exportData: async () => {
      try {
        const btn = document.getElementById('export-data-button');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Exporting...'; }
        
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          appName: 'LoveWebsite',
          siteData: JSON.parse(JSON.stringify(siteData))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `love-website-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showCustomAlert('Export Successful', 'Your data has been exported successfully!', true);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download mr-2"></i>Export Data'; }
      } catch (error) {
        console.error('Export error:', error);
        showCustomAlert('Export Failed', 'Failed to export data: ' + error.message);
        const btn = document.getElementById('export-data-button');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download mr-2"></i>Export Data'; }
      }
    },
    
    // Import Data Function
    importData: async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const btn = document.getElementById('import-data-button');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Importing...'; }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.siteData) throw new Error('Invalid file format');

            if (!confirm('⚠️ WARNING: Importing will replace all current data. Are you sure?')) {
               if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload mr-2"></i>Import Data'; }
               return;
            }

            // Update State
            setSiteData(deepMerge(siteData, importedData.siteData));
            await saveData(false, showCustomAlert);

            showCustomAlert('Import Successful', 'Data imported successfully!', true);
            renderAll();
            const currentPage = window.location.hash.substring(1) || 'home';
            navigateTo(currentPage);

          } catch (error) {
            console.error('Import parse error:', error);
            showCustomAlert('Import Failed', error.message);
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload mr-2"></i>Import Data'; }
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Import error:', error);
        showCustomAlert('Import Failed', error.message);
        const btn = document.getElementById('import-data-button');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload mr-2"></i>Import Data'; }
      }
      event.target.value = '';
    }
};

// Start the engine
init();

// --- SERVICE WORKER REGISTRATION (Moved from index.html) ---
// Placing it here ensures 'import.meta' is available because main.js is loaded as a module.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), { type: 'module' })
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('SW Registration Failed: ', err));
    });
}