import { getSettings, getData, getAvailableItems, markItemDrawn } from './store.js';

let isFirstSpinInSession = true;
let isSpinning = false;
let currentReelStates = []; // Tracks the 5 visible items for each spinner to maintain state after spin

export function initSpinnerView() {
    renderSpinners();

    // Re-render when window hash changes to main (to pick up data/settings changes)
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '' || window.location.hash === '#main') {
            renderSpinners();
        }
    });

    // Handle resize to fix any inline layout sizing if needed, but CSS handles most of it.
}

function renderSpinners() {
    if (isSpinning) return; // Prevent render mid-spin

    const data = getData();
    const settings = getSettings();
    const spinnersContainer = document.getElementById('spinners-container');
    const headersContainer = document.getElementById('headers-container');

    spinnersContainer.innerHTML = '';
    headersContainer.innerHTML = '';

    // Determine how many lists to show
    const listsCount = data.lists.length;

    if (listsCount === 0) {
        spinnersContainer.innerHTML = '<div style="margin: auto; font-size: xx-large;">No data loaded. Go to the Data view to load a CSV.</div>';
        headersContainer.style.display = 'none';
        spinnersContainer.style.height = '100%';
        return;
    }

    // Headers Layout
    if (settings.displayTitles && data.hasHeaders && data.headers.length > 0) {
        headersContainer.style.display = 'flex';
        spinnersContainer.style.height = '85%';
        for (let i = 0; i < listsCount; i++) {
            const hDiv = document.createElement('div');
            hDiv.className = 'header-title';
            hDiv.textContent = data.headers[i] || `List ${i + 1}`;
            headersContainer.appendChild(hDiv);
        }
    } else {
        headersContainer.style.display = 'none';
        spinnersContainer.style.height = '100%';
    }

    // Initialize or reset real states
    if (currentReelStates.length !== listsCount) {
        currentReelStates = [];
        for (let i = 0; i < listsCount; i++) {
            const listData = data.lists[i];
            currentReelStates.push(getDistinctItems(listData, 5));
        }
    }

    // Render Spinners
    for (let i = 0; i < listsCount; i++) {
        const spinner = buildSpinnerElement(i, currentReelStates[i]);
        spinnersContainer.appendChild(spinner);
    }
}

function buildSpinnerElement(listIndex, visibleItems) {
    const node = document.createElement('div');
    node.className = 'spinner-node';
    node.dataset.listIndex = listIndex;

    const selector = document.createElement('div');
    selector.className = 'spinner-selector';
    node.appendChild(selector);

    const reel = document.createElement('div');
    reel.className = 'spinner-reel';
    reel.id = `spinner-reel-${listIndex}`;

    // Populate the reel with the 5 visible items
    visibleItems.forEach(itemText => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'spinner-item';
        itemDiv.textContent = itemText;
        reel.appendChild(itemDiv);
    });

    node.appendChild(reel);

    // Click handler to start spin
    node.addEventListener('click', handleSpinClick);

    return node;
}

function handleSpinClick() {
    if (isSpinning) return;

    const settings = getSettings();
    const data = getData();
    const listsCount = data.lists.length;

    // 1. Validate if we can spin
    const availablePerList = [];
    for (let i = 0; i < listsCount; i++) {
        const avail = getAvailableItems(i);
        if (avail.length === 0) {
            alert(`List ${i + 1} is exhausted! Reset data or change sampling mode.`);
            return;
        }
        availablePerList.push(avail);
    }

    isSpinning = true;

    // 2. Determine duration
    let durationSeconds = settings.subsequentDrawDelay;
    if (settings.firstDrawLonger && isFirstSpinInSession) {
        durationSeconds = settings.firstDrawDelay;
        isFirstSpinInSession = false;
    } else {
        isFirstSpinInSession = false; // Even if firstDrawLonger is false, mark to false
    }

    // 4 items passing per second makes it very visible and slow
    const NUMBER_OF_BLUR_ITEMS = Math.max(10, Math.floor(durationSeconds * 4));

    // 3. Setup Reels
    for (let i = 0; i < listsCount; i++) {
        const avail = availablePerList[i];

        // Deterministic Picking
        const chosenObj = avail[Math.floor(Math.random() * avail.length)];
        // Mark as drawn immediately in state
        markItemDrawn(i, chosenObj.originalIndex);

        const reel = document.getElementById(`spinner-reel-${i}`);

        // Generate the animation stack
        // The stack will be: [Current 5 items] + [40 blur items] + [2 padding] + [CHOSEN] + [2 padding]
        // Currently reel has 5 items. We append to it.
        const fullList = data.lists[i];
        let newItemsFragment = document.createDocumentFragment();

        for (let j = 0; j < NUMBER_OF_BLUR_ITEMS; j++) {
            const bgItem = fullList[Math.floor(Math.random() * fullList.length)];
            const div = document.createElement('div');
            div.className = 'spinner-item';
            div.textContent = bgItem;
            newItemsFragment.appendChild(div);
        }

        // Generate landing set (2 above, 2 below) all distinct from chosen
        const landingSet = getDistinctItems(fullList, 4, [chosenObj.item]);

        const pad1 = landingSet[0];
        const pad2 = landingSet[1];
        const pad3 = landingSet[2];
        const pad4 = landingSet[3];

        [pad1, pad2, chosenObj.item, pad3, pad4].forEach((txt) => {
            const div = document.createElement('div');
            div.className = 'spinner-item';
            div.textContent = txt;
            newItemsFragment.appendChild(div);
        });

        reel.appendChild(newItemsFragment);

        // Calculate translation
        // Total items in reel: 5 (initial) + 50 (blur) + 5 (landing) = 60 items
        // We want the chosen item (index 57) to be in the center (index 2 relative to viewport)
        // translateY = - (targetIndex - 2) * 20%
        // Target index for chosen item = 57.
        // translateY = - (57 - 2) * 20% = - 55 * 20% = -1100%
        const targetTranslateY = - (5 + NUMBER_OF_BLUR_ITEMS) * 20;

        // Force reflow
        void reel.offsetWidth;

        // Apply transition
        reel.style.transition = `transform ${durationSeconds}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
        reel.style.transform = `translateY(${targetTranslateY}%)`;

        // Save the final 5 items to state
        currentReelStates[i] = [pad1, pad2, chosenObj.item, pad3, pad4];
    }

    // 4. Wait for animation to finish, then clean up the DOM
    setTimeout(() => {
        isSpinning = false;

        // Reset DOM so it's only 5 items again without a transition
        for (let i = 0; i < listsCount; i++) {
            const reel = document.getElementById(`spinner-reel-${i}`);
            reel.style.transition = 'none';
            reel.style.transform = 'translateY(0%)';

            // Re-build inner items to just the final 5
            reel.innerHTML = '';
            currentReelStates[i].forEach(txt => {
                const div = document.createElement('div');
                div.className = 'spinner-item';
                div.textContent = txt;
                reel.appendChild(div);
            });
        }
    }, durationSeconds * 1000);
}

/**
 * Utility to pick N distinct items from a list.
 * @param {string[]} list The source list of items
 * @param {number} count How many items to pick
 * @param {string[]} exclude Optional array of items to exclude from selection
 * @returns {string[]}
 */
function getDistinctItems(list, count, exclude = []) {
    // Collect all candidates
    let candidates = [...new Set(list)];
    if (exclude.length > 0) {
        candidates = candidates.filter(item => !exclude.includes(item));
    }

    // Shuffle and pick
    const result = [];
    while (result.length < count && candidates.length > 0) {
        const idx = Math.floor(Math.random() * candidates.length);
        result.push(candidates.splice(idx, 1)[0]);
    }

    // Fallback if not enough distinct items (shouldn't happen per spec of min 5 items)
    while (result.length < count) {
        result.push(list[Math.floor(Math.random() * list.length)]);
    }

    return result;
}
