import io

from PIL import Image
from rembg import new_session, remove


# Worker başına bir kere oluşturulur.
# Her task'ta modeli yeniden yüklemeyiz.
background_session = new_session(
    "u2net_human_seg",
)


def remove_person_background(
    image_bytes: bytes,
) -> bytes:
    source = Image.open(
        io.BytesIO(image_bytes),
    ).convert("RGB")

    output = remove(
        source,
        session=background_session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )

    if not isinstance(output, Image.Image):
        output = Image.open(
            io.BytesIO(output),
        )

    output = output.convert("RGBA")

    buffer = io.BytesIO()

    output.save(
        buffer,
        format="PNG",
        optimize=True,
    )

    return buffer.getvalue()


def create_preview(
    cutout_bytes: bytes,
) -> bytes:
    cutout = Image.open(
        io.BytesIO(cutout_bytes),
    ).convert("RGBA")

    background = Image.new(
        "RGBA",
        cutout.size,
        (44, 36, 31, 255),
    )

    background.alpha_composite(cutout)

    output = io.BytesIO()

    background.convert("RGB").save(
        output,
        format="WEBP",
        quality=90,
        method=6,
    )

    return output.getvalue()