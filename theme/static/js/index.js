document.addEventListener("DOMContentLoaded", () => {

    const supportsGridLanes = GridLanesPolyfill.supportsGridLanes();

    // check css variable and use resize observer
    let size = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--mobile-min-width"));

    const mediaQuery = window.matchMedia(`(max-width: ${size}px)`);
    
    let options = {};
    if (supportsGridLanes){
        console.log("Using native grid lanes");
    } else {
        console.log("Using grid lanes polyfill");
    }

    function updateGridLanes(isMobile){
        if (supportsGridLanes) return;
        if (isMobile){
            if (options?.destroy) options.destroy();
        } else {
            options = GridLanesPolyfill.init({ force: true });
        }
    }
    const lightbox = GLightbox({ selector: ".photo-lightbox" });


    function updateMobileClass(e) {
        const isMobile = e.matches; // css query matches
        if (isMobile) {
            document.body.classList.add("mobile");
        } else {
            document.body.classList.remove("mobile");
        }
        updateGridLanes(isMobile);
    }

    updateMobileClass(mediaQuery); // run once on load
    mediaQuery.addEventListener("change", updateMobileClass);
});

// NOTE TO SELF: look at back button positioning
// better margins for project page on mobile