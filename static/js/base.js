// CDN @ https://cdn.jsdelivr.net/gh/ninjamar/analytics@latest/analytics.min.js
(() => {
    // Don't use analytics on localhost
    if (new URL(window.location.href).hostname != "localhost"){
        window.analytics.initialize("https://analytics.ninjamar.workers.dev/v1/info");
    }
})();