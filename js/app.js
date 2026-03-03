import { initRouter } from './router.js';
import * as store from './store.js';
const { initStore, hasData, updateData } = store;
import { parseCSV, processCSVToData } from './csv-helper.js';

// We will import view controllers here as we build them
import { initOptionsView } from './options-view.js';
import { initDataView } from './data-view.js';
import { initSpinnerView } from './spinner-view.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize State/Storage
    initStore();

    // 2. Load default data if nothing is saved
    if (!hasData()) {
        try {
            const response = await fetch('data/PurimRoulette.csv');
            if (response.ok) {
                const csvText = await response.text();
                const rawGrid = parseCSV(csvText);
                const { headers, lists } = processCSVToData(rawGrid, true);
                updateData(true, headers, lists);
            }
        } catch (e) {
            console.error("Failed to load default data", e);
        }
    }

    // 3. Initialize Views
    initOptionsView();
    initDataView();
    initSpinnerView();

    // 4. Initialize Router (this handles initial hash resolution)
    initRouter();

    // 5. Expose the store to the global window for console access
    window.spinnerStore = store;
});
