import { getSettings, setSettings } from './store.js';

export function initOptionsView() {
    // Bind DOM elements
    const cbDisplayTitle = document.getElementById('opt-display-title');
    const selectSamplingMode = document.getElementById('opt-sampling-mode');
    const cbFirstDrawLonger = document.getElementById('opt-first-draw-longer');
    const inputFirstDelay = document.getElementById('opt-first-delay');
    const inputSubsequentDelay = document.getElementById('opt-subsequent-delay');

    // Load current values
    const settings = getSettings();
    cbDisplayTitle.checked = settings.displayTitles;
    selectSamplingMode.value = settings.samplingMode;
    cbFirstDrawLonger.checked = settings.firstDrawLonger;
    inputFirstDelay.value = settings.firstDrawDelay;
    inputSubsequentDelay.value = settings.subsequentDrawDelay;

    // Toggle delay inputs based on checkbox
    toggleDelayInputs();

    // Event Listeners (Auto-save on change)
    cbDisplayTitle.addEventListener('change', (e) => setSettings({ displayTitles: e.target.checked }));

    selectSamplingMode.addEventListener('change', (e) => setSettings({ samplingMode: e.target.value }));

    cbFirstDrawLonger.addEventListener('change', (e) => {
        setSettings({ firstDrawLonger: e.target.checked });
        toggleDelayInputs();
    });

    inputFirstDelay.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        setSettings({ firstDrawDelay: val });
    });

    inputSubsequentDelay.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        setSettings({ subsequentDrawDelay: val });
    });

    function toggleDelayInputs() {
        if (cbFirstDrawLonger.checked) {
            inputFirstDelay.disabled = false;
        } else {
            inputFirstDelay.disabled = true;
        }
    }
}
