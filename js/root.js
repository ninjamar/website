
document.addEventListener("DOMContentLoaded", () => {
    // https://github.com/simonw/tools/commit/8ca341f1fa7f535682f4cf4271669c99ef0befbb
    // TODO: Use resizeobserver and resize grid lanes on refresh
    if (GridLanesPolyfill.supportsGridLanes()) {
        console.log("Using native grid lanes;")
    } else {
        console.log("Using grid-lanes polyfill");
        GridLanesPolyfill.init({ force: true });
    }

    const lightbox = GLightbox({ selector: ".lane-photo" })

    // TODO: Use exiftool server side (meaning the date can also be embedded)
    Promise.all([...document.querySelectorAll(".lane-photo")].map(
        img => exifr.parse(img.href, { makerNote: true }).then(exif => {
            // Shutterspeed, Aperture, ISO, Focal length,, Lens, Camera
            // Exposure time is in seconds. Need to convert it to the form 1/x = exposure speed
            const shutterSpeed = exif.ExposureTime ? `1/${1 / exif.ExposureTime}s` : 'Unknown';
            const aperture = exif.FNumber ? `f/${exif.FNumber}` : 'Unknown';
            const iso = `ISO ${exif.ISO}` || 'Unknown';
            const focalLength = exif.FocalLength ? `${exif.FocalLength}mm` : 'Unknown';

            // no way to see manufacturer of lens. flickr also uses exif so its probably fine
            const lens = exif.LensModel ? exif.LensModel : 'Unknown';

            const camera = exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : 'Unknown';

            const title = `${shutterSpeed}, ${aperture}, ${iso}, ${focalLength}`//, ${lens}, ${camera}`;
            img.setAttribute("data-title", title);
        }
    ))).then(() => lightbox.reload());

});