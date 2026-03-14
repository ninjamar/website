import GridLanesPolyfill from "https://cdn.jsdelivr.net/gh/ninjamar/grid-lanes-polyfill@v1.0.0/grid-lanes-polyfill.js";

document.addEventListener("DOMContentLoaded", () => {

    if (typeof GLightbox !== "undefined") {
        GLightbox({ selector: ".photo-lightbox" });
    }

    const supportsGridLanes = GridLanesPolyfill.supportsGridLanes();

    let size = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--mobile-min-width"));

    const mediaQuery = window.matchMedia(`(max-width: ${size}px)`);

    if (!supportsGridLanes) {
        console.log("Using grid lanes polyfill");
    }


    const options = supportsGridLanes? {} : GridLanesPolyfill.init({ force: true });
    window.options = options
    function updateMobileClass(e) {
        const isMobile = e.matches; // css query matches
        if (isMobile) {
            document.body.classList.add("mobile");
        } else {
            document.body.classList.remove("mobile");
        }
        options?.refresh();
    }

    updateMobileClass(mediaQuery); // run once on load
    mediaQuery.addEventListener("change", updateMobileClass);
});

// NOTE TO SELF: look at back button positioning
// better margins for project page on mobile