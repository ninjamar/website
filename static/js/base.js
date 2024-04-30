(() => {
    // Don't use analytics on localhost
    if (new URL(window.location.href).hostname != "localhost"){
        window.analytics.initialize("https://analytics.ninjamar.workers.dev/v1/info");
    }
})();