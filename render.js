// render.js
/**
 * ============================================================================
 * VIEW CONTROLLER / RENDER ENGINE
 * ============================================================================
 * Updated for Local Storage: Removed server-side image resizing parameters.
 */

import { siteData } from './data.js';
import { sanitize, getYouTubeEmbedUrl } from './utils.js';

// ==========================================
// INTERNAL HELPERS
// ==========================================

function getRawActionButtons(pageId) {
  const add = (ctx, text) => `<button type="button" onclick="window.app.openModal('${pageId}', -1, '${ctx}')" class="btn btn-primary text-sm whitespace-nowrap hover:scale-105 transition-transform"><i class="fas fa-plus mr-2"></i>${text}</button>`;

  let buttons = '';

  if (pageId === 'journey') buttons = add('default', 'Add Event');
  if (pageId === 'gallery') buttons = add('default', 'Add Photo');
  if (pageId === 'allMyLove') buttons = add('loveLanguages', 'Language') + add('loveReasons', 'Reason');
  if (pageId === 'surprise') buttons = add('default', 'Add Item') + `<button type="button" onclick="window.app.openModal('wheel')" class="btn btn-secondary text-sm whitespace-nowrap ml-2"><i class="fas fa-dharmachakra mr-2"></i>Edit Wheel</button>`;
  if (pageId === 'promises') buttons = add('default', 'Add Promise');
  if (pageId === 'memories') buttons = add('memoryBook', 'Add Memory');
  if (pageId === 'playlist') buttons = add('default', 'Add Song');

  return buttons;
}

// ==========================================
// MAIN RENDERER
// ==========================================

export function renderContent(pageId, navLinks) {
  const sectionTitle = navLinks.find(link => link.id === pageId)?.text || 'Page';
  const actionButtonsHtml = getRawActionButtons(pageId);

  const editIntro = (ctx) => `<button type="button" class="btn-icon text-base ml-2 edit-mode-only" onclick="window.app.openModal('${pageId}', -1, '${ctx}')" aria-label="Edit Intro"><i class="fas fa-edit"></i></button>`;

  let headerExtra = '';
  if(['bucketList', 'promises', 'playlist', 'allMyLove'].includes(pageId)) headerExtra = editIntro('intro');
  if(pageId === 'video') headerExtra = editIntro('default');

  const header = pageId !== 'home' ? `
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
      <div class="flex items-center">
        <h2 class="text-2xl md:text-3xl font-bold">${sanitize(sectionTitle)}</h2>
        ${headerExtra}
      </div>
      ${actionButtonsHtml ? `<div class="flex flex-wrap gap-2 edit-mode-only self-start md:self-auto">${actionButtonsHtml}</div>` : ''}
    </div>
  ` : '';

  let content;
  switch(pageId) {
    case 'home': content = renderHomepage(); break;
    case 'gallery': content = renderGallery(); break;
    case 'video': content = renderVideoMontage(); break;
    case 'allMyLove': content = renderAllMyLovePage(); break;
    case 'bucketList': content = renderBucketListPage(); break;
    case 'promises': content = renderPromises(); break;
    case 'memories': content = renderMemoriesAndNotesPage(); break;
    case 'playlist': content = renderPlaylist(); break;
    case 'surprise': content = renderSurprise(); break;
    case 'settings': content = renderSettingsPage(); break;
    default:
      content = `<div id="dynamic-content"></div>`; 
  }

  return `<div class="card rounded-2xl shadow-lg p-6 md:p-8 relative min-h-[50vh]">${header}${content}</div>`;
}

// ==========================================
// SUB-RENDERERS (PAGE-SPECIFIC)
// ==========================================

function renderHomepage() {
  const { homepage, SpouseName, events } = siteData;
  const now = new Date();
  let title = '', subtitle = '';

  const hour = now.getHours();
  if (hour < 12) subtitle = `Good Morning, ${sanitize(SpouseName)}!`;
  else if (hour < 18) subtitle = `Good Afternoon, ${sanitize(SpouseName)}!`;
  else subtitle = `Good Evening, ${sanitize(SpouseName)}!`;

  const todaysEvents = events
    .filter(e => {
      if (!e.date) return false;
      const eventMonthDay = e.date.slice(5, 10);
      const todayMonthDay = now.toISOString().slice(5, 10);
      if (e.showYear === false) return eventMonthDay === todayMonthDay; 
      return e.date === now.toISOString().slice(0, 10); 
    });

  if (todaysEvents.some(e => e.title.toLowerCase().includes('birthday'))) {
    title = `<h1 class="text-4xl md:text-5xl font-bold mb-2 text-primary">ðŸŽ‰ Happy Birthday, ${sanitize(SpouseName)}! ðŸŽ‰</h1>`;
  }

  const mobileHeader = `
    <div class="md:hidden flex items-center justify-center gap-3 mb-6 pb-4 border-b border-slate-100">
      <img src="${homepage.mainImage || 'https://placehold.co/100x100'}" class="w-12 h-12 rounded-full object-cover shadow-sm">
      <div class="text-left">
        <div class="font-bold text-lg leading-none">${sanitize(SpouseName)}</div>
        <div class="text-xs text-gray-400">${sanitize(homepage.relationshipTag || 'My Love')}</div>
      </div>
    </div>
  `;

  return `
    <div class="text-center pt-4">
      ${mobileHeader}
      ${title}
      <h2 class="text-2xl text-gray-500">${subtitle}</h2>
      <div class="relative max-w-3xl mx-auto mt-4">
        <img src="${homepage.mainImage || 'https://placehold.co/800x600/FFEAE3/432C39?text=Us'}" class="w-full h-96 object-cover rounded-xl shadow-lg mb-6" alt="Our Main Photo">
        <button class="absolute top-2 right-2 btn-icon bg-white/80 edit-mode-only" onclick="window.app.openModal('home', -1, 'default')" aria-label="Edit Home Photo"><i class="fas fa-edit"></i></button>
        <p class="text-lg leading-relaxed whitespace-pre-wrap">${sanitize(homepage.introMessage)}</p>
      </div>
      <div class="my-8 p-4 bg-soft rounded-xl inline-block max-w-full">
        <h4 class="text-lg font-bold mb-2 text-primary">â³ Relationship Clock</h4>
        <div id="relationship-timer" class="text-xl md:text-3xl font-bold text-slate-700 flex flex-wrap justify-center items-center gap-x-4 gap-y-1" aria-live="polite">Loading...</div>
        <div class="edit-mode-only mt-2"><button onclick="window.app.openModal('home', -1, 'timer')" class="text-xs underline text-gray-500">Edit Start Date</button></div>
      </div>
    </div>
  `;
}

function renderGallery() {
  if(!siteData.photoGallery.length) return `<p class="text-center text-gray-500 italic py-10">No photos yet. Tap "Add Photo" to begin!</p>`;

  const slideshowBtn = `<div class="w-full flex justify-end mb-4"><button onclick="window.app.startSlideshowFromPage()" class="btn btn-primary shadow-md"><i class="fas fa-play mr-2"></i>Play Slideshow</button></div>`;

  // FIXED: Removed query parameters (?width=...) from image src. 
  // Base64 Data URIs do not support query parameters and will break if they are present.
  return slideshowBtn + `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${
    siteData.photoGallery.map((p, i) => `
      <div class="rounded-xl shadow-lg overflow-hidden group relative bg-white">
        <button type="button" class="w-full p-0 border-0 cursor-pointer" onclick="window.app.openImageModal(${i})">
          <img src="${p.image}" loading="lazy" class="w-full h-60 object-cover" alt="${sanitize(p.caption)}">
        </button>
        <div class="absolute top-2 right-2 flex space-x-1 edit-mode-only">
          <button class="btn-icon bg-white/90 w-8 h-8 flex items-center justify-center" onclick="event.stopPropagation(); window.app.openModal('gallery', ${i})" aria-label="Edit Photo"><i class="fas fa-edit"></i></button>
          <button class="btn-icon bg-white/90 w-8 h-8 flex items-center justify-center" onclick="event.stopPropagation(); window.app.deleteItem('photoGallery', ${i})" aria-label="Delete Photo"><i class="fas fa-trash"></i></button>
        </div>
        <div class="p-4"><p class="text-sm truncate">${sanitize(p.caption)}</p></div>
      </div>
    `).join('')
  }</div>`;
}

function renderVideoMontage() {
  const embedUrl = getYouTubeEmbedUrl(siteData.videoMontage.fileId);

  return `
    <p class="mb-6">${sanitize(siteData.videoMontage.intro)}</p>
    <div class="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
      ${embedUrl ? `<iframe src="${embedUrl}" class="w-full h-[250px] md:h-[400px]" allowfullscreen title="YouTube Video"></iframe>` : `<p class="p-10 text-gray-500">No video URL set. Switch to Edit Mode to add a YouTube URL.</p>`}
    </div>
  `;
}

function renderPromises() {
  return `
    <p class="mb-8 text-gray-600">${sanitize(siteData.promises.intro)}</p>
    <div class="space-y-4">${
      siteData.promises.promises.map((p, i) => `
        <div class="p-5 rounded-r-lg border-l-4 border-primary bg-soft flex justify-between items-start gap-4">
          <p class="italic flex-1 font-medium text-sm md:text-base">"${sanitize(p)}"</p>
          <div class="flex space-x-2 shrink-0 edit-mode-only">
            <button class="btn-icon" onclick="window.app.openModal('promises', ${i})" aria-label="Edit Promise"><i class="fas fa-edit"></i></button>
            <button class="btn-icon" onclick="window.app.deleteItem('promises', ${i})" aria-label="Delete Promise"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('')
    }</div>
  `;
}

function renderPlaylist() {
  return `
    <p class="mb-6">${sanitize(siteData.playlist.intro)}</p>
    <div class="grid md:grid-cols-2 gap-6">${
      siteData.playlist.songs.map((s, i) => `
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex justify-between mb-2">
            <h3 class="font-bold truncate pr-2">${sanitize(s.title)}</h3>
            <div class="edit-mode-only shrink-0">
              <button class="btn-icon" onclick="window.app.openModal('playlist', ${i})" aria-label="Edit Song"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="window.app.deleteItem('playlist', ${i})" aria-label="Delete Song"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <iframe src="${getYouTubeEmbedUrl(s.embedId)}" class="w-full h-48 rounded" frameborder="0" allowfullscreen title="Song Embed"></iframe>
          <p class="text-sm mt-2 italic text-gray-600">${sanitize(s.note)}</p>
        </div>
      `).join('')
    }</div>
  `;
}

function renderSurprise() {
  const wheelColors = ['#FFD1DC', '#E0F2FE', '#D1FAE5', '#FEF3C7', '#F3E8FF'];
  const wheelItems = siteData.surprise?.wheelItems?.length > 0 ? siteData.surprise.wheelItems : ['Hug', 'Kiss', 'Date', 'Walk'];

  const sliceDeg = 360 / wheelItems.length;
  let gradient = 'conic-gradient(';
  wheelItems.forEach((_, i) => {
    const color = wheelColors[i % wheelColors.length];
    gradient += `${color} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg, `;
  });
  gradient = gradient.slice(0, -2) + ')'; 

  return `
    <div class="text-center">
      <div class="text-5xl mb-4">ðŸŽ</div>
      <h2 class="text-3xl md:text-4xl font-bold mb-4 text-primary">${sanitize(siteData.surprise.title)}</h2>
      <p class="text-lg mb-6 break-words text-gray-600">${sanitize(siteData.surprise.message)}</p>
      ${siteData.surprise.image ? `<img src="${siteData.surprise.image}" class="rounded-lg max-w-full md:max-w-md mx-auto shadow-lg mb-8" alt="Surprise">` : ''}

      <!-- Spin Wheel Section -->
      <div class="mt-8 p-6 bg-soft rounded-xl border border-pink-100">
        <h3 class="text-2xl font-bold mb-6 text-slate-700 text-center"> Let's play - Spin the wheel ðŸŽ²</h3>
        <div class="wheel-container">
          <div class="wheel-arrow"></div>
          <div id="the-wheel" class="wheel" style="background: ${gradient}"></div>
          <div class="wheel-center"></div>
        </div>
        <button id="spin-btn" onclick="window.app.spinWheel()" class="btn btn-primary mt-8 px-8 mx-auto block"> Spin It!</button>
        <p id="wheel-result" class="mt-4 font-bold text-lg h-8 text-slate-700 text-center" aria-live="polite"></p>
      </div>
    </div>
  `;
}

function renderAllMyLovePage() {
  return `<div>
    <h3 class="text-xl font-bold mb-4">ðŸ’• The Ways I Love You</h3>
    <p class="mb-6 text-gray-600">${sanitize(siteData.loveLanguages.intro)}</p>
    <div class="grid gap-4 mb-10">${
      siteData.loveLanguages.languages.map((l,i) => `
        <div class="bg-soft p-4 rounded flex items-start">
          <i class="${sanitize(l.icon || 'fas fa-heart')} text-2xl w-10 text-primary mt-1 shrink-0" aria-hidden="true"></i>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold truncate">${sanitize(l.name)}</h4>
            <p class="text-sm break-words">${sanitize(l.description)}</p>
          </div>
          <div class="edit-mode-only shrink-0 ml-2">
            <button class="btn-icon" onclick="window.app.openModal('loveLanguages', ${i})" aria-label="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon" onclick="window.app.deleteItem('loveLanguages', ${i})" aria-label="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('')
    }</div>

    <div class="border-t pt-6">
      <div class="flex items-center gap-2 mb-4">
        <h3 class="text-xl font-bold">ðŸ’– A Few Reasons Why</h3>
        <button type="button" class="btn-icon text-base edit-mode-only" onclick="window.app.openModal('allMyLove', -1, 'loveReasonsIntro')" aria-label="Edit Introduction"><i class="fas fa-edit"></i></button>
      </div>
      <p class="mb-6 text-gray-600">${sanitize(siteData.loveReasons.intro)}</p>
      <ul class="space-y-3">${
        siteData.loveReasons.reasons.map((r,i) => `
          <li class="flex items-center bg-soft p-3 rounded">
            <span class="w-6 h-6 bg-white text-primary rounded-full flex items-center justify-center text-xs font-bold mr-3 shrink-0">${i+1}</span>
            <span class="flex-1 break-words">${sanitize(r)}</span>
            <div class="edit-mode-only shrink-0">
              <button class="btn-icon" onclick="window.app.openModal('loveReasons', ${i})" aria-label="Edit"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="window.app.deleteItem('loveReasons', ${i})" aria-label="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </li>
        `).join('')
      }</ul>
    </div>
  </div>`;
}

function renderMemoriesAndNotesPage() {
  const notesHtml = siteData.notes.map((note, index) => `
    <div class="flex items-center p-3 rounded-lg bg-white border mb-2 shadow-sm">
      <input type="checkbox" onchange="window.app.toggleNote(${index})" ${note.done ? 'checked' : ''} class="h-5 w-5 text-primary rounded focus:ring-pink-500 shrink-0" aria-label="Mark as done">
      <span class="ml-3 flex-1 ${note.done ? 'line-through text-gray-400' : ''} break-words">${sanitize(note.text)}</span>
      <button class="btn-icon edit-mode-only shrink-0" onclick="window.app.deleteItem('notes', ${index})" aria-label="Delete note"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');

  return `<div>
    <h3 class="text-xl font-bold mb-4">ðŸ“– Times Together</h3>
    <div class="space-y-4 mb-10">${
      siteData.memoryBook.map((m, i) => `
        <div class="p-4 bg-soft border-l-4 border-primary rounded relative">
          <p class="italic mb-2 text-sm md:text-base">"${sanitize(m.message)}"</p>
          <p class="text-right font-bold text-sm"> - ${sanitize(m.author)}</p>
          <div class="absolute top-2 right-2 edit-mode-only">
            <button class="btn-icon w-8 h-8" onclick="window.app.openModal('memoryBook', ${i})" aria-label="Edit Memory"><i class="fas fa-edit"></i></button>
            <button class="btn-icon w-8 h-8" onclick="window.app.deleteItem('memoryBook', ${i})" aria-label="Delete Memory"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('')
    }</div>

    <div class="border-t pt-8">
      <h3 class="text-xl font-bold mb-4">ðŸ“ Our Notepad</h3>
      <div class="flex gap-2 mb-4 edit-mode-only">
        <input type="text" id="new-note-input" class="form-input flex-1" placeholder="Add a to-do...">
        <button id="add-note-btn" class="btn btn-primary">Add</button>
      </div>
      <div id="notes-list">${notesHtml}</div>
    </div>
  </div>`;
}

function renderBucketListPage() {
  const wheelColors = ['#FFD1DC', '#E0F2FE', '#D1FAE5', '#FEF3C7', '#F3E8FF'];
  const wheelItems = siteData.surprise?.wheelItems || [];  
  const sliceDeg = 360 / wheelItems.length;
  let gradient = 'conic-gradient(';
  wheelItems.forEach((_, i) => {
    const color = wheelColors[i % wheelColors.length];
    gradient += `${color} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg, `;
  });
  gradient = gradient.slice(0, -1);

  return `
    <p class="mb-8 text-gray-600">${sanitize(siteData.bucketList.intro)}</p>
    <div class="space-y-4 mb-12">${
      siteData.bucketList.items.map((item, i) => `
        <div class="p-5 rounded-lg bg-soft border border-slate-100">
          <div class="flex items-start">
            <i class="${sanitize(item.icon || 'fas fa-star')} text-2xl w-8 text-primary mr-4 mt-1 shrink-0" aria-hidden="true"></i>
            <div class="flex-grow min-w-0">
              <h3 class="font-bold text-xl truncate">${sanitize(item.title)}</h3>
              <p class="text-gray-600 break-words">${sanitize(item.description)}</p>
            </div>
            <div class="flex space-x-1 edit-mode-only shrink-0">
              <button class="btn-icon" onclick="window.app.openModal('bucketList', ${i})" aria-label="Edit Item"><i class="fas fa-edit"></i></button>
              <button class="btn-icon" onclick="window.app.deleteItem('bucketList', ${i})" aria-label="Delete Item"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          ${item.targetDate ? `
            <div class="mt-4 pt-4 border-t border-slate-200">
              <div class="countdown-container grid grid-cols-4 gap-2 text-center" data-countdown-target="${item.targetDate}">
                <div class="bg-white p-2 rounded shadow-sm"><div class="text-lg font-bold days">0</div><div class="text-xs">Days</div></div>
                <div class="bg-white p-2 rounded shadow-sm"><div class="text-lg font-bold hours">0</div><div class="text-xs">Hrs</div></div>
                <div class="bg-white p-2 rounded shadow-sm"><div class="text-lg font-bold minutes">0</div><div class="text-xs">Min</div></div>
                <div class="bg-white p-2 rounded shadow-sm"><div class="text-lg font-bold seconds">0</div><div class="text-xs">Sec</div></div>
              </div>
            </div>
          ` : ''}
        </div>
      `).join('')
    }</div>
  `;
}

function renderSettingsPage() {
  const currentTheme = localStorage.getItem('app_theme') || 'default';
  const isEditMode = localStorage.getItem('app_edit_mode') === 'true';

  const themeOptions = {
    'default': { primary: '#FFEAE3', border: 'border-pink-200', name: 'Rose ðŸŒ¹' },
    'ocean': { primary: '#E0F2FE', border: 'border-blue-200', name: 'Ocean ðŸŒŠ' },
    'nature': { primary: '#ECFCCB', border: 'border-green-200', name: 'Nature ðŸŒ¿' },
    'lavender': { primary: '#F3E8FF', border: 'border-purple-200', name: 'Lavender ðŸ’œ' },
    'cherry': { primary: '#FFE4E6', border: 'border-red-200', name: 'Cherry ðŸ’' },
    'sunshine': { primary: '#FEF9C3', border: 'border-yellow-200', name: 'Sunshine â˜€ï¸' },
    'coral': { primary: '#FFEDD5', border: 'border-orange-200', name: 'Coral ðŸ§¡' },
    'teal': { primary: '#CCFBF1', border: 'border-teal-200', name: 'Teal ðŸ’š' },
    'mocha': { primary: '#E7E5E4', border: 'border-stone-200', name: 'Mocha â˜•' },
    'berry': { primary: '#FCE7F3', border: 'border-pink-300', name: 'Berry ðŸ«' }
  };

  const themeCircles = Object.entries(themeOptions).map(([key, { primary, border, name }]) => {
    const isActive = key === currentTheme;
    const activeClass = isActive ? 'scale-110 ring-2 ring-offset-2 ring-primary' : '';
    return `
      <div class="text-center flex-shrink-0">
        <button onclick="window.app.applyTheme('${key}')" class="w-12 h-12 rounded-full ${border} border-2 shadow-sm transition-transform hover:scale-110 ${activeClass}" style="background-color: ${primary}" aria-label="${name}" title="${name}"></button>
        <p class="text-xs mt-2 text-gray-500">${name}</p>
      </div>
    `;
  }).join('');

  const toggleBgClass = isEditMode ? 'peer-checked:bg-green-500 bg-red-500' : 'peer-checked:bg-green-500 bg-red-500';
  const toggleInitialClass = isEditMode ? 'bg-green-500' : 'bg-red-500';
  const toggleText = isEditMode ? 'ðŸ”‘ Enabled' : 'ðŸ”’ Disabled';

  return `
    <div class="space-y-8">
      <div class="card p-6">
        <h3 class="text-2xl font-bold mb-4"><i class="fas fa-cog mr-2"></i>Edit Mode</h3>
        <p class="text-gray-600 mb-4">Enable to edit content.</p>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="edit-mode-toggle" class="sr-only peer" ${isEditMode ? 'checked' : ''}>
          <div class="w-11 h-6 ${toggleInitialClass} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${toggleBgClass}"></div>
          <span class="ml-3 text-sm font-medium text-gray-700">${toggleText}</span>
        </label>
      </div>

      <div class="card p-8">
        <h3 class="text-2xl font-bold mb-4"><i class="fas fa-palette mr-2"></i>Theme</h3>
        <p class="text-gray-600 mb-6">Tap a circle to switch the vibe.</p>
        <div class="flex flex-row overflow-x-auto gap-4 p-4">
          ${themeCircles}
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-2xl font-bold mb-4"><i class="fas fa-file-export mr-2"></i>Data Management</h3>
        <p class="text-gray-600 mb-4">Export your data for backup or import previously saved data.</p>
        <div class="flex gap-3 flex-wrap">
          <button id="export-data-button" class="btn btn-primary" onclick="window.app.exportData()">
            <i class="fas fa-download mr-2"></i>Export Data
          </button>
          <button id="import-data-button" class="btn btn-secondary" onclick="document.getElementById('import-file-input').click()">
            <i class="fas fa-upload mr-2"></i>Import Data
          </button>
          <input type="file" id="import-file-input" accept=".json" class="hidden" onchange="window.app.importData(event)">
        </div>
      </div>

      <div class="card p-6 border-2 border-red-200">
        <h3 class="text-2xl font-bold mb-4 text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>Danger Zone</h3>
        <p class="text-gray-600 mb-4">Reset all data and start fresh. This action cannot be undone.</p>
        <button id="clear-data-button" class="btn bg-red-500 text-white hover:bg-red-600">
          <i class="fas fa-trash mr-2"></i>Reset All Data
        </button>
      </div>
    </div>
  `;
}

export function renderCalendar(date) {
  const year = date.getFullYear(), month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); 

  let grid = '';

  for(let i=0; i<firstDay; i++) grid += `<div></div>`;

  for(let d=1; d<=daysInMonth; d++) {
    const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = new Date().toISOString().slice(0,10) === iso;

    const hasEvent = siteData.events.some(e => {
      if (!e.date) return false;
      if (e.date === iso) return true;
      if (e.showYear === false && e.date.slice(5) === iso.slice(5)) return true;
      return false;
    });

    let cls = 'w-8 h-8 flex items-center justify-center rounded-full text-sm';
    if(isToday) cls += ' bg-primary text-white font-bold'; 
    else if(hasEvent) cls += ' bg-soft text-primary font-bold'; 

    grid += `<div class="flex justify-center"><div class="${cls}">${d}</div></div>`;
  }

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthOptions = months.map((m, i) => `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`).join('');

  const currentYear = new Date().getFullYear();
  let yearOptions = '';
  for (let y = currentYear - 10; y <= currentYear + 10; y++) {
    yearOptions += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`;
  }

  return `
    <div class="flex justify-between items-center mb-4 bg-soft p-2 rounded-lg">
      <button onclick="window.app.navigateMonth(-1)" class="btn-icon" aria-label="Previous Month"><i class="fas fa-chevron-left"></i></button>
      <div class="flex items-center gap-2">
        <select id="cal-month" class="calendar-select bg-transparent" aria-label="Select Month" onchange="window.app.jumpToDate()">${monthOptions}</select>
        <select id="cal-year" class="calendar-select bg-transparent" aria-label="Select Year" onchange="window.app.jumpToDate()">${yearOptions}</select>
      </div>
      <button onclick="window.app.navigateMonth(1)" class="btn-icon" aria-label="Next Month"><i class="fas fa-chevron-right"></i></button>
    </div>
    <div class="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
      <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
    </div>
    <div class="grid grid-cols-7 gap-y-2">${grid}</div>
  `;
}

export function renderTimelineList() {
  const events = [...siteData.events].sort((a,b) => b.date.localeCompare(a.date));

  return events.map(e => {
    const idx = siteData.events.indexOf(e);
    const isRecurring = e.showYear === false;

    return `
      <div class="flex gap-4 mb-6">
        <div class="w-24 text-right text-sm text-primary font-bold pt-1 shrink-0">
          ${e.date || 'Someday'}
          ${isRecurring ? '<br><span class="text-xs text-gray-400 font-normal">Annual</span>' : ''}
        </div>
        <div class="border-l-2 border-slate-200 pl-4 pb-2 relative">
          <div class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-soft border-2 border-white"></div>
          <h4 class="font-bold text-lg">${sanitize(e.title)}</h4>
          <p class="text-gray-600 text-sm">${sanitize(e.description)}</p>
          <div class="mt-2 flex gap-2 edit-mode-only">
            <button class="text-xs text-gray-400 hover:text-primary" onclick="window.app.openModal('journey', ${idx})">Edit</button>
            <button class="text-xs text-gray-400 hover:text-red-500" onclick="window.app.deleteItem('events', ${idx})">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}