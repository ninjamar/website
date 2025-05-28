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

/* Functions to get, set, and toggle themes*/
function getTheme(){
    let pref = localStorage.getItem("theme");

    if (!pref){
        pref = window.matchMedia("prefers-color-scheme: dark").matches ? "dark" : "light";
        localStorage.setItem("theme", pref);
    }
    return pref;
}
function setTheme(theme){
    if (theme == "dark"){
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
    } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");   
    }
}
function toggleTheme(){
    let theme = getTheme();
    let newTheme = theme == "dark" ? "light" : "dark";

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
    // Apply the theme on load
    setTheme(getTheme());
})