import Image from "@11ty/eleventy-img";
import fs from "fs";
import path from "path";
import exifr from "exifr";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function captionFromExif(exif){
    // Shutterspeed, Aperture, ISO, Focal length,, Lens, Camera
    // Exposure time is in seconds. Need to convert it to the form 1/x = exposure speed
    const shutterSpeed = exif.ExposureTime
    ? exif.ExposureTime >= 1
        ? `${exif.ExposureTime}s`
        : `1/${Math.round(1 / exif.ExposureTime)}s`
    : 'Unknown';

    const aperture = exif.FNumber ? `f/${exif.FNumber}` : 'Unknown';
    const iso = exif.ISO? `ISO ${exif.ISO}` : 'Unknown';
    const focalLength = exif.FocalLength ? `${exif.FocalLength}mm` : 'Unknown';

    // no way to see manufacturer of lens. flickr also uses exif so its probably fine
    const lens = exif.LensModel ? exif.LensModel : 'Unknown';

    const camera = exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : 'Unknown';

    return `${shutterSpeed}, ${aperture}, ${iso}, ${focalLength}`//, ${lens}, ${camera}`;
}

async function photosFromDir(subfolder){
    const baseDir = path.join(__dirname, "photos", subfolder);
    const outputDir = path.join(process.cwd(), "_site", "img", subfolder);


    const files = fs.readdirSync(baseDir).filter(f => /\.(jpe?g)$/i.test(f));

    const results = await Promise.all(files.map(async file => {
        const fullPath = path.join(baseDir, file);
        const exif = await exifr.parse(fullPath, { translateValues: false });

        const thumbnail = await Image(fullPath, {
            widths: ["auto"],          // keep original dimensions
            formats: ["jpeg"],
            outputDir: outputDir,
            urlPath: `/images/${subfolder}`, // TODO: Make dynamic
            sharpOptions: {
                quality: 70              // lower = smaller file (try 60–80)
            }
        }).jpeg[0];

        return {
          file,
          url: `/images/${subfolder}/${file}`, // TODO: Make dynamic
          thumbUrl: thumbnail.url,
          caption: captionFromExif(exif),
          date: exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate
        };
    }));
    

    // Sort by capture date (newest first)
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    return results;
}

export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js");
    
    eleventyConfig.setNunjucksEnvironmentOptions({
        throwOnUndefined: true,
        autoescape: false, // warning: don’t do this!
    });
    
    eleventyConfig.addNunjucksGlobal("photosFromDir", photosFromDir);
        eleventyConfig.addPassthroughCopy({ "images": "images" })
};