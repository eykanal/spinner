// js/router.js

// Valid routes in the application
const ROUTES = {
    MAIN: 'main',
    DATA: 'data',
    OPTIONS: 'options'
};

// Map of route names to their DOM container IDs
const ROUTE_VIEWS = {
    [ROUTES.MAIN]: 'view-main',
    [ROUTES.DATA]: 'view-data',
    [ROUTES.OPTIONS]: 'view-options'
};

export function initRouter() {
    window.addEventListener('hashchange', handleHashChange);

    // Trigger initial route
    handleHashChange();
}

function handleHashChange() {
    let hash = window.location.hash.replace('#', '');

    if (!Object.values(ROUTES).includes(hash)) {
        // Default route
        hash = ROUTES.MAIN;
        window.location.hash = hash;
        return;
    }

    // Hide all views
    Object.values(ROUTE_VIEWS).forEach(viewId => {
        document.getElementById(viewId).style.display = 'none';
    });

    // Show the active view
    const activeViewId = ROUTE_VIEWS[hash];
    if (activeViewId) {
        document.getElementById(activeViewId).style.display = 'block';
    }

    // Update footer navigation links
    document.getElementById('link-data').style.display = hash === ROUTES.DATA ? 'none' : 'inline';
    document.getElementById('link-options').style.display = hash === ROUTES.OPTIONS ? 'none' : 'inline';
    document.getElementById('link-main').style.display = hash === ROUTES.MAIN ? 'none' : 'inline';
}
