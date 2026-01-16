
document.addEventListener('DOMContentLoaded', function () {
    // https://github.com/simonw/tools/commit/8ca341f1fa7f535682f4cf4271669c99ef0befbb
    // TODO: Use resizeobserver and resize grid lanes on refresh
    if (GridLanesPolyfill.supportsGridLanes()){
        console.log("Using native grid lanes;")
    } else {
        console.log("Using grid-lanes polyfill");
        GridLanesPolyfill.init({ force: true });
    }
});