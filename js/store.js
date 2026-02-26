// js/store.js

const STORAGE_KEY_SETTINGS = 'spinner_settings';
const STORAGE_KEY_DATA = 'spinner_data';

// Default settings per specification
const defaultSettings = {
    displayTitles: false,
    samplingMode: 'with', // 'with' or 'without'
    firstDrawLonger: true,
    firstDrawDelay: 5,
    subsequentDrawDelay: 2
};

// Initial state
let settings = { ...defaultSettings };

// Data format:
// {
//    hasHeaders: boolean,
//    headers: ["Title 1", "Title 2"],
//    lists: [
//       ["Item A", "Item B", ...],
//       ["Item C", "Item D", ...]
//    ],
//    exhaustedIndices: [ [], [] ] // Used to track which indices have been picked if "without replacement"
// }
let appData = {
    hasHeaders: false,
    headers: [],
    lists: [],
    exhaustedIndices: []
};

export function initStore() {
    loadSettings();
    loadData();
}

// --- Settings ---

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
        try {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
            console.error("Failed to parse settings", e);
        }
    }
}

export function getSettings() {
    return { ...settings };
}

export function setSettings(newSettings) {
    settings = { ...settings, ...newSettings };

    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// --- Data ---

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse data", e);
        }
    }

    if (!appData.lists) appData.lists = [];
    if (!appData.headers) appData.headers = [];
    if (!appData.exhaustedIndices) initExhaustedTracker();
}

export function getData() {
    return { ...appData };
}

export function clearData() {
    appData = {
        hasHeaders: false,
        headers: [],
        lists: [],
        exhaustedIndices: []
    };
    saveData();
}

export function updateData(hasHeaders, headers, lists) {
    // Limits check: Max 4 lists stored
    const storingLists = lists.slice(0, 4);
    const storingHeaders = headers.slice(0, 4);

    appData = {
        hasHeaders,
        headers: storingHeaders,
        lists: storingLists,
        exhaustedIndices: []
    };
    initExhaustedTracker();
    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(appData));
}

// --- Sampling / Exhaustion Handling ---

function initExhaustedTracker() {
    appData.exhaustedIndices = appData.lists.map(() => []);
}

export function getAvailableItems(listIndex) {
    const list = appData.lists[listIndex];
    if (!list) return [];

    if (settings.samplingMode === 'with') {
        return list.map((item, idx) => ({ item, originalIndex: idx }));
    } else {
        const exhausted = appData.exhaustedIndices[listIndex] || [];
        return list
            .map((item, idx) => ({ item, originalIndex: idx }))
            .filter((_, idx) => !exhausted.includes(idx));
    }
}

export function markItemDrawn(listIndex, originalIndex) {
    if (settings.samplingMode === 'with') return;

    if (!appData.exhaustedIndices[listIndex]) {
        appData.exhaustedIndices[listIndex] = [];
    }

    if (!appData.exhaustedIndices[listIndex].includes(originalIndex)) {
        appData.exhaustedIndices[listIndex].push(originalIndex);
        saveData();
    }
}

// --- Utilities ---
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
