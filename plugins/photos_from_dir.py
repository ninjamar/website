from pathlib import Path
from datetime import datetime
from PIL import Image, ExifTags
from pelican import signals

EXIF_TAGS = {v: k for k, v in ExifTags.TAGS.items()}


def _format_shutter(speed):
    if not speed:
        return "Unknown"
    if speed >= 1:
        return f"{speed}s"
    return f"1/{round(1 / speed)}s"


def caption_from_exif(exif):
    shutter = _format_shutter(exif.get("ExposureTime"))
    aperture = f"f/{exif['FNumber']}" if "FNumber" in exif else "Unknown"
    iso = f"ISO {exif['ISOSpeedRatings']}" if "ISOSpeedRatings" in exif else "Unknown"
    focal = f"{exif['FocalLength']}mm" if "FocalLength" in exif else "Unknown"
    return f"{shutter}, {aperture}, {iso}, {focal}"


def read_exif(img):
    raw = img._getexif() or {}
    exif = {}
    for tag, value in raw.items():
        name = EXIF_TAGS.get(tag, tag)
        exif[name] = value
    return exif


def parse_date(exif):
    for key in ("DateTimeOriginal", "CreateDate", "DateTime"):
        if key in exif:
            try:
                return datetime.strptime(exif[key], "%Y:%m:%d %H:%M:%S")
            except Exception:
                pass
    return datetime.min  # Earliest possible date (1970?)


def photos_from_dir(subfolder):
    base_dir = Path("theme/static/images") / subfolder
    output_dir = Path("output/static/images") / subfolder
    output_dir.mkdir(exist_ok=True, parents=True)

    results = []

    for img_path in sorted(base_dir.glob("*.jp*g")):
        img = Image.open(img_path)

        exif = read_exif(img)
        date = parse_date(exif)

        thumb_name = f"{img_path.stem}_t{img_path.suffix}"
        thumb_path = output_dir / thumb_name
        img.save(thumb_path, quality=30)

        results.append(
            {
                "file": img_path.name,
                "url": f"/static/images/{subfolder}/{img_path.name}",
                "thumb_url": f"/static/images/{subfolder}/{thumb_name}",  # hook for later thumb gen
                "caption": caption_from_exif(exif),
                "date": date,
                "exif": exif,
            }
        )

    results.sort(key=lambda x: x["date"], reverse=True)
    return results


def add_to_jinja(pelican):
    pelican.env.globals["photos_from_dir"] = photos_from_dir


def register():
    signals.generator_init.connect(add_to_jinja)
