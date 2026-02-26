// js/store.js

const STORAGE_KEY_SETTINGS = 'spinner_settings';
const STORAGE_KEY_DATA = 'spinner_data';

// Default settings per specification
const defaultSettings = {
    displayTitles: false,
    displayedLists: 1, // Max 3
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

            // Validate limits immediately upon loading
            settings.displayedLists = clamp(settings.displayedLists, 1, 3);
            if (appData && appData.lists && settings.displayedLists > appData.lists.length && appData.lists.length > 0) {
                settings.displayedLists = appData.lists.length;
            }
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

    // Enforce constraints
    settings.displayedLists = clamp(settings.displayedLists, 1, 3);

    // If the data has fewer lists than displayedLists, clamp it down
    if (appData.lists.length > 0 && settings.displayedLists > appData.lists.length) {
        settings.displayedLists = appData.lists.length;
    }

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

    // Also update settings if displayedLists is now invalid
    if (settings.displayedLists > 1) {
        setSettings({ displayedLists: 1 });
    }
}

export function updateData(hasHeaders, headers, lists) {
    // Limits check: Max 3 lists stored
    const storingLists = lists.slice(0, 3);
    const storingHeaders = headers.slice(0, 3);

    appData = {
        hasHeaders,
        headers: storingHeaders,
        lists: storingLists,
        exhaustedIndices: []
    };
    initExhaustedTracker();
    saveData();

    // Truncate displayed list count if necessary
    if (settings.displayedLists > storingLists.length) {
        setSettings({ displayedLists: storingLists.length });
    }
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
