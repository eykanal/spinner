import { getData, updateData, clearData, getSettings } from './store.js';
import { parseCSV, processCSVToData } from './csv-helper.js';

/**
 * Configuration for quick-load datasets.
 * Each object contains:
 * - name: The display name shown on the page
 * - path: The relative path to the CSV file in the 'data/' directory
 * - hasHeaders: Boolean indicating if the first row of the CSV contains list titles
 * 
 * To add a new dataset:
 * 1. Place the .csv file in the /data/ directory
 * 2. Add a new object to this array with the appropriate properties.
 */
const QUICK_LOAD_DATASETS = [
    { name: 'Purim Roulette', path: 'data/PurimRoulette.csv', hasHeaders: true },
];

export function initDataView() {
    const fileInput = document.getElementById('csv-upload');
    const cbHasHeaders = document.getElementById('csv-has-headers');
    const btnDelete = document.getElementById('btn-delete-data');

    // Init form state
    const data = getData();
    cbHasHeaders.checked = data.hasHeaders;

    renderTable();
    renderQuickLoadLinks();

    btnDelete.addEventListener('click', () => {
        if (getData().lists.length > 0) {
            if (!confirm("Are you sure you want to delete all currently loaded data?")) return;
        }
        clearData();
        renderTable();
        // Reset file input so we can select the same file again if desired
        fileInput.value = '';
    });

    cbHasHeaders.addEventListener('change', (e) => {
        // We only save this state loosely until a csv is uploaded, but if data exists we should update it.
        const currentData = getData();
        if (currentData.lists.length > 0) {
            // We do not re-parse the CSV dynamically upon checkbox toggle 
            // since we don't store the raw string, we just store what was parsed.
            // To keep it simple per spec: check the box THEN upload.
            alert("Please re-upload your CSV for this change to take effect correctly on your lists.");
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (getData().lists.length > 0) {
            if (!confirm("Loading new data will replace your current lists. Continue?")) {
                fileInput.value = '';
                return;
            }
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const text = event.target.result;
            processCSV(text, cbHasHeaders.checked);
        };
        reader.readAsText(file);
    });

    // Re-render when navigating to this view to pick up any state changes 
    // (like exhausted items from the Spinner view)
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#data') {
            renderTable();
        }
    });
}

function renderQuickLoadLinks() {
    const container = document.getElementById('quick-load-links');
    if (!container) return;

    container.innerHTML = '';

    QUICK_LOAD_DATASETS.forEach(dataset => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'quick-load-link';
        link.textContent = dataset.name;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleQuickLoad(dataset);
        });
        container.appendChild(link);
    });
}

async function handleQuickLoad(dataset) {
    if (getData().lists.length > 0) {
        if (!confirm(`Loading "${dataset.name}" will replace your current lists. Continue?`)) {
            return;
        }
    }

    try {
        const response = await fetch(dataset.path);
        if (!response.ok) throw new Error(`Failed to fetch ${dataset.path}`);
        const csvText = await response.text();
        processCSV(csvText, dataset.hasHeaders);
    } catch (error) {
        console.error("Quick load error:", error);
        alert(`Error loading dataset: ${error.message}`);
    }
}

function processCSV(csvText, hasHeaders) {
    const rawGrid = parseCSV(csvText);

    if (rawGrid.length === 0) {
        clearData();
        renderTable();
        return;
    }

    // Check Max Columns rule = 4. Any row has > 4? Reject.
    for (let i = 0; i < rawGrid.length; i++) {
        if (rawGrid[i].length > 4) {
            alert("Error: CSV has more than 4 columns in a row. Rejected.");
            clearData();
            renderTable();
            return;
        }
    }

    const { headers: parsedHeaders, lists } = processCSVToData(rawGrid, hasHeaders);

    // Validate rules: min 5 items, max 1000 items per list (spec explicitly states this checking criteria)
    for (let i = 0; i < lists.length; i++) {
        if (lists[i].length > 1000) {
            alert(`Error: List ${i + 1} has more than 1000 items. Entire file rejected.`);
            clearData();
            renderTable();
            return;
        }
        if (lists[i].length < 5) {
            alert(`Error: List ${i + 1} has fewer than 5 items. Entire file rejected.`);
            clearData();
            renderTable();
            return;
        }
    }

    // Accept data
    updateData(hasHeaders, parsedHeaders, lists);

    // Warn if the options need adjusting? We do it automatically in store.js
    const settings = getSettings();
    if (settings.displayedLists > lists.length) {
        // This is handled by store.js, just let user know
        console.log(`Displayed lists automatically reduced to ${lists.length}`);
    }

    renderTable();
}


function renderTable() {
    const data = getData();
    const settings = getSettings();
    const container = document.getElementById('data-preview');
    container.innerHTML = '';

    if (data.lists.length === 0) {
        container.innerHTML = '<p>No data loaded.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const trHead = document.createElement('tr');
    for (let i = 0; i < data.lists.length; i++) {
        const th = document.createElement('th');
        // Render headers if they exist, otherwise just column index
        th.textContent = data.hasHeaders && data.headers[i] ? data.headers[i] : `List ${i + 1}`;
        trHead.appendChild(th);
    }
    thead.appendChild(trHead);

    // Find longest list
    let maxLen = 0;
    data.lists.forEach(l => {
        if (l.length > maxLen) maxLen = l.length;
    });

    for (let r = 0; r < maxLen; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < data.lists.length; c++) {
            const td = document.createElement('td');
            if (data.lists[c] && r < data.lists[c].length) {
                td.textContent = data.lists[c][r];

                // Style exhausted items if we're picking without replacement
                if (settings.samplingMode === 'without') {
                    const exhaustedList = data.exhaustedIndices[c] || [];
                    if (exhaustedList.includes(r)) {
                        td.style.backgroundColor = '#eeeeee';
                        td.style.color = '#888888'; // Optional: slightly fade text too
                    }
                }
            } else {
                td.textContent = "";
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
}
