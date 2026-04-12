from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

WIDTH = 2400
HEIGHT = 4200
SEED = 17
OUTPUT = Path("public/images/backgrounds/obsidian-board.webp")


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def blend_rgb(left: tuple[int, int, int], right: tuple[int, int, int], t: float):
    return tuple(int(lerp(left[index], right[index], t)) for index in range(3))


def rotate_point(x: float, y: float, angle: float) -> tuple[float, float]:
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    return (x * cos_a - y * sin_a, x * sin_a + y * cos_a)


def build_shard_points(length: float, width: float, bend: float):
    top: list[tuple[float, float]] = []
    bottom: list[tuple[float, float]] = []
    segments = random.randint(4, 6)

    for index in range(segments + 1):
        t = -1.0 + (2.0 * index / segments)
        bulge = 1.0 - abs(t) ** 1.65
        x = t * length * 0.5
        spine_y = bend * math.sin(t * math.pi) * width * 0.24
        inner_jitter = random.uniform(-width * 0.045, width * 0.045)
        outer_jitter = random.uniform(-width * 0.045, width * 0.045)
        edge_offset = width * (0.18 + 0.78 * bulge)

        top.append((x + random.uniform(-length * 0.03, length * 0.03), spine_y - edge_offset + inner_jitter))
        bottom.append((x + random.uniform(-length * 0.03, length * 0.03), spine_y + edge_offset + outer_jitter))

    return top + list(reversed(bottom))


def paint_vertical_gradient() -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    stops = [
        (0.0, (1, 2, 3)),
        (0.22, (4, 7, 10)),
        (0.5, (7, 10, 14)),
        (0.78, (3, 5, 8)),
        (1.0, (1, 2, 3)),
    ]

    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        for left, right in zip(stops, stops[1:]):
            if left[0] <= t <= right[0]:
                local_t = (t - left[0]) / (right[0] - left[0])
                color = blend_rgb(left[1], right[1], local_t)
                draw.line((0, y, WIDTH, y), fill=color + (255,))
                break

    return image


def add_ambient_fields(base: Image.Image):
    ambient = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ambient, "RGBA")

    for _ in range(18):
        x0 = random.randint(-300, WIDTH - 200)
        y0 = random.randint(-400, HEIGHT - 200)
        w = random.randint(700, 1500)
        h = random.randint(500, 1200)
        color = random.choice(
            [
                (190, 220, 255, random.randint(12, 24)),
                (255, 255, 255, random.randint(8, 18)),
                (40, 58, 82, random.randint(22, 36)),
            ]
        )
        draw.ellipse((x0, y0, x0 + w, y0 + h), fill=color)

    ambient = ambient.filter(ImageFilter.GaussianBlur(120))
    base.alpha_composite(ambient)

    noise = Image.effect_noise((WIDTH, HEIGHT), 9).convert("L")
    noise = noise.point(lambda value: max(0, min(255, int((value - 128) * 1.8 + 128))))
    noise = ImageOps.colorize(noise, "#020304", "#2b3440").convert("RGBA")
    noise.putalpha(32)
    base.alpha_composite(noise)

    sparkle = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    sparkle_draw = ImageDraw.Draw(sparkle, "RGBA")
    for _ in range(1400):
        x = random.randint(0, WIDTH - 1)
        y = random.randint(0, HEIGHT - 1)
        alpha = random.randint(10, 38)
        size = random.choice((1, 1, 1, 2))
        sparkle_draw.ellipse((x, y, x + size, y + size), fill=(226, 236, 248, alpha))

    sparkle = sparkle.filter(ImageFilter.GaussianBlur(0.3))
    base.alpha_composite(sparkle)


def create_streak_layer(size: tuple[int, int], mask: Image.Image, angle: float, length: float, width: float):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    center = (size[0] * 0.5, size[1] * 0.5)
    vx = math.cos(angle)
    vy = math.sin(angle)
    nx = -vy
    ny = vx

    for _ in range(random.randint(120, 180)):
        offset = random.uniform(-width * 0.3, width * 0.3)
        start = -length * random.uniform(0.42, 0.56)
        end = length * random.uniform(0.44, 0.62)
        curve = random.uniform(-18, 18)
        alpha = random.randint(8, 44)
        line_width = random.randint(1, 4)
        points: list[tuple[float, float]] = []

        for step in range(5):
            t = step / 4
            along = lerp(start, end, t)
            wave = math.sin(t * math.pi) * curve
            jitter = random.uniform(-3.5, 3.5)
            x = center[0] + vx * along + nx * (offset + wave + jitter)
            y = center[1] + vy * along + ny * (offset + wave + jitter)
            points.append((x, y))

        tone = random.randint(190, 245)
        draw.line(points, fill=(tone, tone, tone + 6, alpha), width=line_width)

    layer = layer.filter(ImageFilter.GaussianBlur(1.6))
    clipped = Image.new("RGBA", size, (0, 0, 0, 0))
    clipped = Image.composite(layer, clipped, mask)
    return clipped


def create_highlight_layer(
    size: tuple[int, int],
    polygon: list[tuple[float, float]],
    top_edge: list[tuple[float, float]],
    bottom_edge: list[tuple[float, float]],
):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")

    primary_edge = random.choice((top_edge, bottom_edge))
    secondary_edge = bottom_edge if primary_edge is top_edge else top_edge

    draw.line(primary_edge, fill=(247, 250, 255, random.randint(70, 118)), width=random.randint(3, 5), joint="curve")
    draw.line(secondary_edge, fill=(160, 180, 205, random.randint(22, 44)), width=random.randint(2, 3), joint="curve")

    for _ in range(random.randint(5, 10)):
        start = random.randrange(len(polygon))
        end = min(len(polygon) - 1, start + random.randint(1, 2))
        draw.line(
            polygon[start : end + 1],
            fill=(255, 255, 255, random.randint(46, 84)),
            width=random.randint(1, 2),
        )

    return layer.filter(ImageFilter.GaussianBlur(1.2))


def render_shard(center_x: int, center_y: int):
    length = random.randint(460, 980)
    width = random.randint(150, 420)
    angle = math.radians(random.uniform(-72, 72))
    bend = random.uniform(-0.9, 0.9)
    polygon = build_shard_points(length, width, bend)
    rotated = [rotate_point(x, y, angle) for x, y in polygon]
    pad = 80

    min_x = math.floor(min(point[0] for point in rotated) - pad)
    max_x = math.ceil(max(point[0] for point in rotated) + pad)
    min_y = math.floor(min(point[1] for point in rotated) - pad)
    max_y = math.ceil(max(point[1] for point in rotated) + pad)

    patch_width = max_x - min_x
    patch_height = max_y - min_y

    shifted = [(point[0] - min_x, point[1] - min_y) for point in rotated]

    edge_count = len(shifted) // 2 + 1
    top_edge = shifted[:edge_count]
    bottom_edge = list(reversed(shifted[edge_count - 1 :]))

    mask = Image.new("L", (patch_width, patch_height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(shifted, fill=255)

    shard = Image.new("RGBA", (patch_width, patch_height), (0, 0, 0, 0))
    shard_draw = ImageDraw.Draw(shard, "RGBA")
    dark_tone = random.randint(6, 18)
    fill = (dark_tone, dark_tone + random.randint(3, 12), dark_tone + random.randint(5, 16), 255)
    shard_draw.polygon(shifted, fill=fill)

    streaks = create_streak_layer((patch_width, patch_height), mask, angle, length, width)
    shard.alpha_composite(streaks)

    core_glow = Image.new("RGBA", (patch_width, patch_height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(core_glow, "RGBA")
    glow_draw.ellipse(
        (
            patch_width * 0.18,
            patch_height * 0.18,
            patch_width * 0.82,
            patch_height * 0.82,
        ),
        fill=(210, 224, 245, random.randint(12, 26)),
    )
    core_glow = core_glow.filter(ImageFilter.GaussianBlur(48))
    core_glow = Image.composite(core_glow, Image.new("RGBA", core_glow.size, (0, 0, 0, 0)), mask)
    shard.alpha_composite(core_glow)

    highlights = create_highlight_layer((patch_width, patch_height), shifted, top_edge, bottom_edge)
    shard.alpha_composite(highlights)

    shadow_mask = mask.filter(ImageFilter.GaussianBlur(18))
    shadow = Image.new("RGBA", (patch_width, patch_height), (0, 0, 0, 0))
    shadow.putalpha(shadow_mask.point(lambda value: int(value * 0.48)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))

    patch = Image.new("RGBA", (patch_width, patch_height), (0, 0, 0, 0))
    patch.alpha_composite(shadow, (random.randint(-10, 10), random.randint(10, 18)))
    patch.alpha_composite(shard)

    return patch, (center_x + min_x, center_y + min_y)


def add_fracture_glints(base: Image.Image):
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")

    for _ in range(38):
        x = random.randint(-120, WIDTH + 120)
        y = random.randint(-120, HEIGHT + 120)
        angle = math.radians(random.uniform(-70, 70))
        length = random.randint(340, 920)
        points: list[tuple[float, float]] = []
        for step in range(6):
            t = step / 5
            along = lerp(-length * 0.5, length * 0.5, t)
            drift = math.sin(t * math.pi * random.uniform(0.8, 1.3)) * random.uniform(6, 22)
            px = x + math.cos(angle) * along - math.sin(angle) * drift
            py = y + math.sin(angle) * along + math.cos(angle) * drift
            points.append((px, py))

        draw.line(points, fill=(255, 255, 255, random.randint(18, 40)), width=random.randint(1, 2))

    layer = layer.filter(ImageFilter.GaussianBlur(1.4))
    base.alpha_composite(layer)


def main():
    random.seed(SEED)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    image = paint_vertical_gradient()
    add_ambient_fields(image)

    shard_positions = []
    rows = 9
    cols = 4
    for row in range(rows):
        for col in range(cols):
            base_x = int((col + 0.5) * WIDTH / cols)
            base_y = int((row + 0.45) * HEIGHT / rows)
            shard_positions.append(
                (
                    base_x + random.randint(-240, 240),
                    base_y + random.randint(-180, 180),
                )
            )

    shard_positions += [
        (random.randint(-200, WIDTH + 200), random.randint(-200, HEIGHT + 200))
        for _ in range(24)
    ]

    random.shuffle(shard_positions)

    for center_x, center_y in shard_positions:
        patch, origin = render_shard(center_x, center_y)
        image.alpha_composite(patch, origin)

    add_fracture_glints(image)

    vignette = Image.new("L", (WIDTH, HEIGHT), 255)
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse(
        (-WIDTH * 0.05, -HEIGHT * 0.06, WIDTH * 1.05, HEIGHT * 1.06),
        fill=170,
    )
    vignette = vignette.filter(ImageFilter.GaussianBlur(180))
    dark = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    dark.putalpha(ImageChops.invert(vignette).point(lambda value: int(value * 0.6)))
    image.alpha_composite(dark)

    image = image.filter(ImageFilter.UnsharpMask(radius=2.2, percent=135, threshold=3))
    image.convert("RGB").save(OUTPUT, quality=92, method=6)
    print(OUTPUT)


if __name__ == "__main__":
    main()
