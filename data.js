// data.js
/**
 * DATA LAYER (INDEXEDDB VERSION - PRODUCTION READY)
 * ------------------------------------------------------------------
 * Handles state management, data persistence, and memory cleanup.
 */

// Placeholder Asset imports
const aiImg = new URL('./images/ai.png', import.meta.url).href;
const cityImg = new URL('./images/city.jpg', import.meta.url).href;
const ghibliImg = new URL('./images/ghibli.jpg', import.meta.url).href;
const giftcardImg = new URL('./images/giftcard.png', import.meta.url).href;
const indianImg = new URL('./images/indian.png', import.meta.url).href;
const natureImg = new URL('./images/nature.jpg', import.meta.url).href;
const picnicImg = new URL('./images/picnic.jpeg', import.meta.url).href;

import { deepMerge } from './utils.js';
import imageCompression from 'browser-image-compression';

// Global State
export let siteData = {};
export let globalError = false;

// Memory Management: Track active Object URLs to revoke them later
let activeObjectUrls = [];

// --- INDEXEDDB CONFIGURATION ---
const DB_NAME = 'InaiyaLocalDB';
const DB_VERSION = 2;
const STORE_CONTENT = 'site_content';
const STORE_PHOTOS = 'photos';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_CONTENT)) {
                db.createObjectStore(STORE_CONTENT, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
                db.createObjectStore(STORE_PHOTOS, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(new Error(`OpenDB Error: ${event.target.error}`));
    });
}

function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function cleanupMemory() {
    activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
    activeObjectUrls = [];
}

/**
 * Generates the default JSON structure for the application.
 */
// function getDefaults() {
//     return {
//         homepage: {
//             mainImage: natureImg,
//             introMessage: 'Welcome to the world I created just for you to celebrate the wonderful person you are. It is a treasure to look back at our journey, our joys, and all the moments that make our life together so special. Every day with you is a new adventure, and I cherish every moment we share together. I love you more than words can say.',
//             relationshipTag: 'My Soulmate',
//             relationshipStart: '2020-01-01T00:00:00.000Z'
//         },
//         events: [
//             {
//                 date: '2023-09-10',
//                 title: 'Said "I Love You"',
//                 description: 'The moment I finally told you how I really felt. Best decision ever.',
//                 showYear: false,
//                 type: 'milestone'
//             },
//             {
//                 date: '2024-07-04',
//                 title: 'Beach Weekend',
//                 description: 'Watching the sunset together by the ocean. Pure magic.',
//                 showYear: true,
//                 type: 'trip'
//             }
//         ],
//         notes: [
//             { date: '2025-12-15', text: 'Plan surprise dinner for anniversary' }
//         ],
//         photoGallery: [
//             { image: cityImg, caption: "Love Proposal..." },
//             { image: natureImg }
//         ],
//         promises: {
//             intro: "I'll always be there for you, through every season of life. Here are my promises to you...",
//             promises: [
//                 'I promise to always make you laugh, even on the hardest days',
//                 'I promise to support your dreams and celebrate your victories'
//             ]
//         },
//         loveReasons: {
//             intro: "I could list hundreds of reasons why I love you, but here are just a few that make my heart full...",
//             reasons: [
//                 'The way you care so deeply about everyone around you',
//                 'Your adventurous spirit that makes life exciting'
//             ]
//         },
//         loveLanguages: {
//             intro: "They say there are many ways to say 'I love you', and this is how I speak my love to you.",
//             languages: [
//                 {
//                     name: 'Words of Affirmation',
//                     icon: 'fas fa-comments',
//                     description: 'Telling you how much you mean to me, complimenting you, and expressing my love through heartfelt words and messages.'
//                 },
//                 {
//                     name: 'Physical Touch',
//                     icon: 'fas fa-hand-holding-heart',
//                     description: 'Holding hands, warm hugs, and gentle kisses. Physical connection that reminds us we\'re always there for each other.'
//                 }
//             ]
//         },
//         bucketList: {
//             intro: "The future is bright and full of possibilities. Here's what I'm dreaming of experiencing with you.",
//             items: [
//                 {
//                     title: 'Go Skydiving',
//                     description: 'Experience the thrill of freefalling together and conquer our fears.',
//                     targetDate: '2026-08-15',
//                     icon: 'fas fa-parachute-box',
//                     completed: false
//                 }
//             ]
//         },
//         memoryBook: [
//             { date: '2023-05-14', message: 'Getting caught in the rain and laughing until our sides hurt. Pure joy.', author: 'Him' }
//         ],
//         playlist: {
//             intro: "Some songs that make me think of you and some are the soundtracks of our love story...",
//             songs: [
//                 {
//                     title: 'Make You Feel My Love',
//                     embedId: 'https://www.youtube.com/watch?v=zeVWTY31Vn8',
//                     note: 'I\'d do anything to make you happy'
//                 }
//             ]
//         },
//         videoMontage: {
//             intro: 'A special clip of our favorite moments together, for the person who means everything to me...',
//             fileId: 'https://www.youtube.com/watch?v=xdHx1YEsWwk'
//         },
//         surprise: {
//             title: "You're My Everything!",
//             message: "Every day with you is a gift. Thank you for being you, for loving me, and for making life so beautiful. I can't wait to create a million more memories with you. 💕",
//             image: giftcardImg,
//             wheelItems: ['Fancy Dinner', 'Movie Marathon', 'Couples Massage', 'Beach Picnic', 'Game Night', 'Cooking Together', 'Sunrise Hike', 'Wine Tasting']
//         }
//     };
// }

function getDefaults() {
  return {
    homepage: {
      // Use the variable, not the string './images/nature.jpg'
      mainImage: natureImg, 
      introMessage: 'Welcome to the world I created just for you to celebrate the wonderful person you are. It is a treasure to look back at our journey, our joys, and all the moments that make our life together so special. Every day with you is a new adventure, and I cherish every moment we share together. I love you more than words can say.',
      relationshipTag: 'My Soulmate',
      relationshipStart: '2020-01-01T00:00:00.000Z'
    },
    events: [
      {
        date: '2023-09-10',
        title: 'Said "I Love You"',
        description: 'The moment I finally told you how I really felt. Best decision ever.',
        showYear: false,
        type: 'milestone'
      },
      {
        date: '2024-07-04',
        title: 'Beach Weekend',
        description: 'Watching the sunset together by the ocean. Pure magic.',
        showYear: true,
        type: 'trip'
      },
      {
        date: '2024-10-30',
        title: 'Cozy Fall Evening',
        description: 'Hot cocoa, blankets, and your favorite movie. Perfect winter night.',
        showYear: true,
        type: 'memory'
      }
    ],
    notes: [
      { date: '2025-12-15', text: 'Plan surprise dinner for anniversary' },
      { date: '2026-02-14', text: 'Book spa weekend for Valentine\'s Day' },
      { date: '2026-06-20', text: 'Research summer vacation destinations together' }
    ],
    photoGallery: [
      {
        "image": cityImg, // Use variable
        "caption": "Love Proposal..."
      },
      {
        "image": natureImg, // Use variable
      },
      {
        "image": picnicImg, // Use variable
        "caption": "Sunday Evening..."
      },
      {
        "image": aiImg, // Use variable
      },
      {
        "image": ghibliImg, // Use variable
      },
      {
        "image": indianImg, // Use variable
      }
    ],
    promises: {
      intro: "I'll always be there for you, through every season of life. Here are my promises to you...",
      promises: [
        'I promise to always make you laugh, even on the hardest days',
        'I promise to support your dreams and celebrate your victories',
        'I promise to always choose you, every single day'
      ]
    },
    loveReasons: {
      intro: "I could list hundreds of reasons why I love you, but here are just a few that make my heart full...",
      reasons: [
        'The way you care so deeply about everyone around you',
        'Your adventurous spirit that makes life exciting',
        'How comfortable I feel being completely myself with you'
      ]
    },
    loveLanguages: {
      intro: "They say there are many ways to say 'I love you', and this is how I speak my love to you.",
      languages: [
        {
          name: 'Words of Affirmation',
          icon: 'fas fa-comments',
          description: 'Telling you how much you mean to me, complimenting you, and expressing my love through heartfelt words and messages.'
        },
        {
          name: 'Physical Touch',
          icon: 'fas fa-hand-holding-heart',
          description: 'Holding hands, warm hugs, and gentle kisses. Physical connection that reminds us we\'re always there for each other.'
        },
        {
          name: 'Gift Giving',
          icon: 'fas fa-gift',
          description: 'Thoughtful surprises that show I\'m always thinking of you - from your favorite snack to something that reminded me of us.'
        }
      ]
    },
    bucketList: {
      intro: "The future is bright and full of possibilities. Here's what I'm dreaming of experiencing with you.",
      items: [
        {
          item: 'Go Skydiving',
          description: 'Experience the thrill of freefalling together and conquer our fears.',
          targetDate: '2026-08-15',
          icon: 'fas fa-parachute-box',
          completed: false
        },
        {
          item: 'Watch Sunrise from a Mountain',
          description: 'Hike up early and witness the world wake up from a beautiful peak.',
          targetDate: '2024-09-20',
          icon: 'fas fa-mountain-sun',
          completed: true
        },
        {
          item: 'Road Trip Across the Country',
          description: 'Take a spontaneous adventure with no strict plans, just us and the open road.',
          targetDate: '2027-06-01',
          icon: 'fas fa-road',
          completed: false
        }
      ],
    },
    memoryBook: [
      {
        date: '2023-05-14',
        message: 'Getting caught in the rain and laughing until our sides hurt. Pure joy.',
        author: 'Him'
      },
      {
        date: '2024-03-17',
        message: 'Building that bookshelf together and only arguing once. We make a great team!',
        author: 'Him'
      },
      {
        date: '2024-08-25',
        message: 'Your face when I told you I love your weird laugh - priceless and adorable.',
        author: 'Her'
      }
    ],
    playlist: {
      intro: "Some songs that make me think of you and some are the soundtracks of our love story...",
      songs: [
        {
          title: '',
          embedId: 'https://www.youtube.com/watch?v=EmsNH47y7Jo&pp=ygUZYWxsIHRpbWUgbG92ZSBzb25ncyB0YW1pbA%3D%3D',
          note: 'Reminds me of our first date'
        },
        {
          title: 'You are my everything',
          embedId: 'https://www.youtube.com/watch?v=_NhwOcq_2Bw&pp=ygUbYWxsIHRpbWUgbG92ZSBzb25ncyBlbmdsaXNo',
          note: 'Our song - reminds me of our first dance together'
        },
        {
          title: 'Make You Feel My Love',
          artist: 'Adele',
          embedId: 'https://www.youtube.com/watch?v=zeVWTY31Vn8&pp=ygUZYWxsIHRpbWUgbG92ZSBzb25ncyBoaW5kaQ%3D%3D',
          note: 'I\'d do anything to make you happy'
        }
      ]
    },
    videoMontage: {
      intro: 'A special clip of our favorite moments together, for the person who means everything to me...',
      fileId: 'https://www.youtube.com/watch?v=xdHx1YEsWwk&pp=ygUoQ2FydG9vbiByb21hbnRpYyB2aWRlb3MgZm9yIHJlbGF0aW9uc2hpcNIHCQkLCgGHKiGM7w%3D%3D'
    },
    surprise: {
      title: "You're My Everything!",
      message: "Every day with you is a gift. Thank you for being you, for loving me, and for making life so beautiful. I can't wait to create a million more memories with you. 💕",
      image: giftcardImg,
        wheelItems: ['Fancy Dinner', 'Movie Marathon', 'Couples Massage', 'Beach Picnic', 'Game Night', 'Cooking Together', 'Sunrise Hike', 'Wine Tasting']
    }
  };
}


export async function loadData() {
  try {
    const db = await openDB();
    
    // 1. Fetch Data
    const contentTx = db.transaction(STORE_CONTENT, 'readonly');
    const contentReq = contentTx.objectStore(STORE_CONTENT).get('main');
    const photosTx = db.transaction(STORE_PHOTOS, 'readonly');
    const photosReq = photosTx.objectStore(STORE_PHOTOS).getAll();
    const [contentResult, photosResult] = await Promise.all([
      promisifyRequest(contentReq),
      promisifyRequest(photosReq)
    ]);

    // 2. Clean up old memory before creating new blobs
    cleanupMemory();

    const defaults = getDefaults();

    if (contentResult && contentResult.content) {
      // RETURNING USER
      siteData = deepMerge(defaults, contentResult.content);
      
      if (photosResult && photosResult.length > 0) {
        siteData.photoGallery = photosResult.map(p => {
          let imageUrl = p.url;
          if (p.blob) {
            imageUrl = URL.createObjectURL(p.blob);
            activeObjectUrls.push(imageUrl);
          }
          return { id: p.id, image: imageUrl, caption: p.caption };
        });
        siteData.photoGallery.reverse();
      } else {
        // FIX: Use defaults if no photos in DB
        siteData.photoGallery = defaults.photoGallery;
      }
    } else {
      // FIRST RUN - Initialize DB
      console.log("Initializing new database...");
      siteData = defaults;
      
      // Save main content
      const contentTx = db.transaction(STORE_CONTENT, 'readwrite');
      await promisifyRequest(contentTx.objectStore(STORE_CONTENT).put({ id: 'main', content: siteData }));
      
      // FIX: Insert default photos into IndexedDB
      if (defaults.photoGallery && defaults.photoGallery.length > 0) {
        const photoTx = db.transaction(STORE_PHOTOS, 'readwrite');
        const photoStore = photoTx.objectStore(STORE_PHOTOS);
        
        for (const photo of defaults.photoGallery) {
          await promisifyRequest(photoStore.add({
            url: photo.image,
            caption: photo.caption || '',
            createdat: new Date().toISOString()
          }));
        }
        console.log(`Initialized ${defaults.photoGallery.length} default photos`);
      }
    }

    siteData.SpouseName = window.SITE_CONFIG?.SpouseName || 'My Love';
    globalError = false;
  } catch (err) {
    console.error("Data Load Error:", err);
    globalError = true;
    throw err;
  }
}


export async function saveData(silent = false, showAlertFn) {
    if (globalError) return { success: false, error: 'Global error state. Refresh page.' };
    
    try {
        const dataToSave = JSON.parse(JSON.stringify(siteData));
        delete dataToSave.photoGallery; // Photos stored separately
        delete dataToSave.SpouseName; // Config based
        dataToSave.lastUpdated = new Date().toISOString();
        
        const db = await openDB();
        const tx = db.transaction(STORE_CONTENT, 'readwrite');
        await promisifyRequest(tx.objectStore(STORE_CONTENT).put({ id: 'main', content: dataToSave }));
        
        if (!silent && showAlertFn) showAlertFn("Saved", "Changes saved to device.", true);
        return { success: true };
    } catch (err) {
        console.error('Save error:', err);
        if (showAlertFn) showAlertFn("Error", "Save failed.");
        return { success: false, error: err.message };
    }
}

export async function resetAllData() {
    try {
        const db = await openDB();
        const tx = db.transaction([STORE_CONTENT, STORE_PHOTOS], 'readwrite');
        tx.objectStore(STORE_CONTENT).clear();
        tx.objectStore(STORE_PHOTOS).clear();
        
        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        cleanupMemory(); 
        localStorage.removeItem('app_theme');
        localStorage.removeItem('app_edit_mode');
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function addPhoto(file, caption) {
    if (!file) throw new Error('No file provided');
    try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
        const db = await openDB();
        const tx = db.transaction(STORE_PHOTOS, 'readwrite');
        
        const newRecord = { blob: compressedFile, caption: caption || '', created_at: new Date().toISOString() };
        const id = await promisifyRequest(tx.objectStore(STORE_PHOTOS).add(newRecord));
        
        const objectUrl = URL.createObjectURL(compressedFile);
        activeObjectUrls.push(objectUrl);
        
        siteData.photoGallery.unshift({ id, image: objectUrl, caption: caption || '' });
        return { success: true };
    } catch (error) {
        console.error('Error adding photo:', error);
        throw error;
    }
}

export async function updatePhoto(index, caption, newFile = null) {
    const photo = siteData.photoGallery[index];
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_PHOTOS, 'readwrite');
        const store = tx.objectStore(STORE_PHOTOS);
        const record = await promisifyRequest(store.get(photo.id));
        
        if(record) {
            record.caption = caption || '';
            if (newFile) {
                const compressedFile = await imageCompression(newFile, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                record.blob = compressedFile;
                record.url = null;
                if (photo.image.startsWith('blob:')) URL.revokeObjectURL(photo.image);
                
                const objectUrl = URL.createObjectURL(compressedFile);
                activeObjectUrls.push(objectUrl);
                siteData.photoGallery[index].image = objectUrl;
            }
            await promisifyRequest(store.put(record));
        }
        
        siteData.photoGallery[index].caption = caption || '';
        return { success: true };
    } catch(e) { console.error(e); throw e; }
}

export function setSiteData(newData) {
    siteData = newData;
}

export async function deletePhoto(index) {
    const photo = siteData.photoGallery[index];
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_PHOTOS, 'readwrite');
        await promisifyRequest(tx.objectStore(STORE_PHOTOS).delete(photo.id));
        
        if (photo.image.startsWith('blob:')) URL.revokeObjectURL(photo.image);
        siteData.photoGallery.splice(index, 1);
        return { success: true };
    } catch(e) { console.error(e); throw e; }
}

export async function uploadGenericImage(file) {
    const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1000 });
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
    });
}