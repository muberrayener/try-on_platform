import io
from collections import deque

from PIL import Image
from rembg import new_session, remove


# Worker başına bir kere oluşturulur.
# Her task'ta modeli yeniden yüklemeyiz.
background_session = new_session(
    "u2net_human_seg",
)
garment_session = new_session("u2net")


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


def remove_garment_background(image_bytes: bytes) -> bytes:
    source = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    output = remove(
        source,
        session=garment_session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )
    if not isinstance(output, Image.Image):
        output = Image.open(io.BytesIO(output))
    output = output.convert("RGBA")
    buffer = io.BytesIO()
    output.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


def remove_accessory_background(image_bytes: bytes) -> bytes:
    source = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    output = remove(
        source,
        session=garment_session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )
    if not isinstance(output, Image.Image):
        output = Image.open(io.BytesIO(output))

    output = output.convert("RGBA")
    pixels = output.load()
    width, height = output.size
    candidate = bytearray(width * height)

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 160 and min(red, green, blue) >= 190 and max(red, green, blue) - min(red, green, blue) <= 28:
                candidate[y * width + x] = 1

    visited = bytearray(width * height)
    for start in range(width * height):
        if not candidate[start] or visited[start]:
            continue

        queue = deque([start])
        visited[start] = 1
        component = []
        touches_edge = False

        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            y = index // width
            if x == 0 or y == 0 or x == width - 1 or y == height - 1:
                touches_edge = True

            neighbors = []
            if x > 0:
                neighbors.append(index - 1)
            if x < width - 1:
                neighbors.append(index + 1)
            if y > 0:
                neighbors.append(index - width)
            if y < height - 1:
                neighbors.append(index + width)

            for neighbor in neighbors:
                if not visited[neighbor] and candidate[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        if not touches_edge and len(component) >= 9:
            for index in component:
                pixels[index % width, index // width] = (0, 0, 0, 0)

    content_box = output.getchannel("A").getbbox()
    if content_box:
        output = output.crop(content_box)

    buffer = io.BytesIO()
    output.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


def create_preview(
    cutout_bytes: bytes,
) -> bytes:
    cutout = Image.open(
        io.BytesIO(cutout_bytes),
    ).convert("RGBA")

    transparent_background = Image.new(
        "RGBA",
        cutout.size,
        (0, 0, 0, 0),
    )
    transparent_background.alpha_composite(cutout)

    output = io.BytesIO()

    transparent_background.save(
        output,
        format="WEBP",
        quality=90,
        method=6,
    )

    return output.getvalue()