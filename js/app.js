// js/app.js

import { initRouter } from './router.js';
import * as store from './store.js';
const { initStore } = store;
// We will import view controllers here as we build them
import { initOptionsView } from './options-view.js';
import { initDataView } from './data-view.js';
import { initSpinnerView } from './spinner-view.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize State/Storage
    initStore();

    // 2. Initialize Views
    initOptionsView();
    initDataView();
    initSpinnerView();

    // 3. Initialize Router (this handles initial hash resolution)
    initRouter();

    // 4. Expose the store to the global window for console access
    window.spinnerStore = store;
});
