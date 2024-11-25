// CDN @ https://cdn.jsdelivr.net/gh/ninjamar/analytics@latest/analytics.min.js
(function(){
    function loadFromURL(url, onload){
        let tag = document.createElement("script");
        tag.src = url;
        tag.onload = onload;
        document.head.appendChild(tag);
    }
    let setupAnalytics = () => window.analytics.initialize("https://analytics.ninjamar.dev/v1/info");
    // Don't use analytics on localhost
    if (new URL(window.location.href).hostname != "localhost"){
        if (!window.analytics){
            loadFromURL("https://cdn.jsdelivr.net/gh/ninjamar/analytics@latest/analytics.min.js", setupAnalytics);
        } else {
            setupAnalytics();
        }
    }
})()