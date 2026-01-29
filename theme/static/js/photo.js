
document.addEventListener("DOMContentLoaded", () => {
    // https://github.com/ninjamar/grid-lanes-polyfill/
    if (GridLanesPolyfill.supportsGridLanes()) {
        console.log("Using native grid lanes;")
    } else {
        console.log("Using grid-lanes polyfill");
        GridLanesPolyfill.init({ force: true });
    }

    const lightbox = GLightbox({ selector: ".photo-lightbox" });
});