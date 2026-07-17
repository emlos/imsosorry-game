#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from PIL import Image


IDENTIFIER_RE = re.compile(r'^[A-Za-z_$][A-Za-z0-9_$]*$')
PNG_SUFFIX = '.png'


@dataclass
class AssetSpec:
    filename: str
    key: str
    const_name: str
    label: str
    category: str
    image: Image.Image
    packed_width: int
    packed_height: int
    frame_width: int
    frame_height: int
    draw_width: int
    draw_height: int
    size_explicit: bool
    default_animation: str | None
    animations: dict[str, dict[str, Any]] = field(default_factory=dict)
    x: int = 0
    y: int = 0

    @property
    def is_animated(self) -> bool:
        return self.frame_width != self.packed_width or self.frame_height != self.packed_height or bool(self.animations)


def fail(message: str) -> None:
    print(f'Error: {message}', file=sys.stderr)
    raise SystemExit(1)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Pack a folder of PNGs into a simple atlas and generate pasteable JS snippets.')
    parser.add_argument('input_folder', help='Source folder containing PNG files')
    parser.add_argument('--kind', required=True, choices=['tiles', 'sprites'])
    parser.add_argument('--atlas-key', required=True, help='Property name used in ATLAS_PATHS')
    parser.add_argument('--output', required=True, help='Atlas PNG output path')
    parser.add_argument('--runtime-path', required=True, help='Runtime/browser path used in snippets')
    parser.add_argument('--snippets', required=True, help='Text snippets output path')
    parser.add_argument('--width', required=True, type=int, help='Maximum atlas width in pixels')
    parser.add_argument('--start-id', type=int, help='Optional starting tile ID for --kind tiles')
    parser.add_argument('--manifest', help='Optional explicit manifest path (defaults to <input>/atlas.json)')
    args = parser.parse_args()

    if args.width <= 0:
        fail('--width must be a positive integer.')
    if args.kind == 'sprites' and args.start_id is not None:
        fail('--start-id is only valid for --kind tiles.')
    if not IDENTIFIER_RE.match(args.atlas_key):
        fail('--atlas-key must be a valid unquoted JavaScript property name (for example: forest).')
    return args


def load_manifest(input_folder: Path, explicit_manifest: str | None) -> dict[str, Any]:
    manifest_path = Path(explicit_manifest) if explicit_manifest else input_folder / 'atlas.json'
    if not manifest_path.exists():
        return {}
    try:
        with manifest_path.open('r', encoding='utf-8') as handle:
            data = json.load(handle)
    except json.JSONDecodeError as exc:
        fail(f'Could not parse manifest {manifest_path}: {exc}')
    except OSError as exc:
        fail(f'Could not read manifest {manifest_path}: {exc}')

    if not isinstance(data, dict):
        fail(f'Manifest {manifest_path} must contain a top-level object.')
    for filename, meta in data.items():
        if not isinstance(filename, str):
            fail(f'Manifest keys in {manifest_path} must be filenames.')
        if not isinstance(meta, dict):
            fail(f'Manifest entry for {filename} must be an object.')
    return data


def slugify_filename(stem: str) -> str:
    slug = stem.strip().lower()
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'[^a-z0-9-]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    if not slug:
        fail(f'Could not derive a valid key from filename stem {stem!r}.')
    return slug


def label_from_key(key: str) -> str:
    label = key.replace('-', ' ')
    return label[:1].upper() + label[1:] if label else label


def ensure_positive_pair(value: Any, field_name: str, filename: str) -> tuple[int, int]:
    if not isinstance(value, list) or len(value) != 2 or not all(isinstance(v, int) and v > 0 for v in value):
        fail(f'{field_name} for {filename} must be [positiveInt, positiveInt].')
    return value[0], value[1]


def normalize_frames(value: Any, columns: int, rows: int, anim_name: str, filename: str) -> list[list[int]]:
    if not isinstance(value, list) or not value:
        fail(f'Animation frames for {filename}:{anim_name} must be a non-empty array.')

    normalized: list[list[int]] = []
    for index, item in enumerate(value):
        if isinstance(item, int):
            frame = [item, 0]
        elif isinstance(item, list) and len(item) == 2 and all(isinstance(v, int) for v in item):
            frame = [item[0], item[1]]
        else:
            fail(f'Animation frame {index} for {filename}:{anim_name} must be an integer or [x, y].')

        frame_x, frame_y = frame
        if frame_x < 0 or frame_y < 0 or frame_x >= columns or frame_y >= rows:
            fail(f'Animation frame {frame} for {filename}:{anim_name} is outside the sheet bounds ({columns}x{rows} frames).')
        normalized.append(frame)
    return normalized


def validate_output_is_not_inside_source(input_folder: Path, output_path: Path) -> None:
    source = input_folder.resolve()
    try:
        output = output_path.resolve(strict=False)
    except TypeError:
        output = output_path.resolve()
    if source == output.parent or source in output.parents:
        fail(f'Output atlas {output_path} must not be inside the source folder {input_folder}.')


def discover_assets(input_folder: Path, manifest: dict[str, Any], atlas_width: int) -> list[AssetSpec]:
    png_files = [path for path in input_folder.iterdir() if path.is_file() and path.suffix.lower() == PNG_SUFFIX]
    if not png_files:
        fail(f'No PNG files found in {input_folder}.')

    names_on_disk = {path.name for path in png_files}
    for filename in manifest:
        if filename not in names_on_disk:
            fail(f'Manifest references {filename}, but that file was not found in {input_folder}.')

    ordered_files: list[Path] = []
    seen: set[str] = set()
    for filename in manifest:
        if filename.endswith(PNG_SUFFIX):
            ordered_files.append(input_folder / filename)
            seen.add(filename)
    for path in sorted(png_files, key=lambda p: p.name.lower()):
        if path.name not in seen:
            ordered_files.append(path)

    assets: list[AssetSpec] = []
    seen_keys: dict[str, str] = {}

    for path in ordered_files:
        filename = path.name
        meta = manifest.get(filename, {})

        try:
            with Image.open(path) as img:
                image = img.convert('RGBA')
        except Exception as exc:
            fail(f'Could not read PNG {path}: {exc}')

        packed_width, packed_height = image.size
        if packed_width <= 0 or packed_height <= 0:
            fail(f'Image {filename} has invalid size {packed_width}x{packed_height}.')
        if packed_width > atlas_width:
            fail(f'Image {filename} is wider than --width ({packed_width} > {atlas_width}).')

        key = slugify_filename(path.stem)
        if key in seen_keys:
            fail(f'Two filenames normalize to the same key: {seen_keys[key]} and {filename} -> {key}.')
        seen_keys[key] = filename

        const_name = key.upper().replace('-', '_')
        label = meta.get('label', label_from_key(key))
        if not isinstance(label, str) or not label.strip():
            fail(f'label for {filename} must be a non-empty string when provided.')
        category = meta.get('category', 'Uncategorized')
        if not isinstance(category, str) or not category.strip():
            fail(f'category for {filename} must be a non-empty string when provided.')

        frame_size_value = meta.get('frameSize')
        size_value = meta.get('size')
        animations_value = meta.get('animations', {})
        default_animation = meta.get('defaultAnimation')

        if frame_size_value is None:
            frame_width, frame_height = packed_width, packed_height
        else:
            frame_width, frame_height = ensure_positive_pair(frame_size_value, 'frameSize', filename)
            if packed_width % frame_width != 0:
                fail(f'Sheet width for {filename} is not divisible by frame width ({packed_width} % {frame_width} != 0).')
            if packed_height % frame_height != 0:
                fail(f'Sheet height for {filename} is not divisible by frame height ({packed_height} % {frame_height} != 0).')

        if size_value is None:
            if frame_size_value is None:
                draw_width, draw_height = packed_width, packed_height
            else:
                draw_width, draw_height = frame_width, frame_height
        else:
            draw_width, draw_height = ensure_positive_pair(size_value, 'size', filename)

        if default_animation is not None and (not isinstance(default_animation, str) or not default_animation.strip()):
            fail(f'defaultAnimation for {filename} must be a non-empty string when provided.')

        if frame_size_value is None and (default_animation is not None or animations_value):
            fail(f'{filename} defines animations/defaultAnimation but has no frameSize.')
        if not isinstance(animations_value, dict):
            fail(f'animations for {filename} must be an object.')

        animations: dict[str, dict[str, Any]] = {}
        columns = packed_width // frame_width
        rows = packed_height // frame_height
        for anim_name, anim_meta in animations_value.items():
            if not isinstance(anim_name, str) or not anim_name.strip():
                fail(f'Animation names for {filename} must be non-empty strings.')
            if not isinstance(anim_meta, dict):
                fail(f'Animation {anim_name} for {filename} must be an object.')
            fps = anim_meta.get('fps')
            if not isinstance(fps, (int, float)) or not math.isfinite(fps) or fps <= 0:
                fail(f'Animation fps for {filename}:{anim_name} must be a positive finite number.')
            frames = normalize_frames(anim_meta.get('frames'), columns, rows, anim_name, filename)
            animations[anim_name] = {
                'fps': int(fps) if isinstance(fps, int) or float(fps).is_integer() else fps,
                'frames': frames,
            }

        if default_animation is not None and default_animation not in animations:
            fail(f'defaultAnimation {default_animation!r} for {filename} does not exist in animations.')

        assets.append(
            AssetSpec(
                filename=filename,
                key=key,
                const_name=const_name,
                label=label.strip(),
                category=category.strip(),
                image=image,
                packed_width=packed_width,
                packed_height=packed_height,
                frame_width=frame_width,
                frame_height=frame_height,
                draw_width=draw_width,
                draw_height=draw_height,
                size_explicit=size_value is not None,
                default_animation=default_animation,
                animations=animations,
            )
        )

    return assets


def pack_assets(assets: list[AssetSpec], atlas_width: int) -> tuple[int, int]:
    x = 0
    y = 0
    row_height = 0

    for asset in assets:
        if x > 0 and x + asset.packed_width > atlas_width:
            x = 0
            y += row_height
            row_height = 0

        asset.x = x
        asset.y = y
        x += asset.packed_width
        row_height = max(row_height, asset.packed_height)

    atlas_height = y + row_height
    return atlas_width, atlas_height


def write_image_atomic(image: Image.Image, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=output_path.stem + '-', suffix=output_path.suffix, dir=str(output_path.parent))
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        image.save(temp_path)
        os.replace(temp_path, output_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def write_text_atomic(text: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=output_path.stem + '-', suffix=output_path.suffix or '.txt', dir=str(output_path.parent))
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        temp_path.write_text(text, encoding='utf-8', newline='\n')
        os.replace(temp_path, output_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def js_key(name: str) -> str:
    return name if IDENTIFIER_RE.match(name) else json.dumps(name)


def format_js_value(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_frames(frames: list[list[int]], indent: str) -> list[str]:
    lines = [f'{indent}frames: [']
    for frame in frames:
        lines.append(f'{indent}    [{frame[0]}, {frame[1]}],')
    lines.append(f'{indent}],')
    return lines


def render_visual_block(asset: AssetSpec, atlas_key: str, owner_expr: str, *, always_include_size: bool = False) -> list[str]:
    lines = [f'{owner_expr}: {{']
    lines.append(f'    path: ATLAS_PATHS.{atlas_key},')
    lines.append(f'    source: [{asset.x}, {asset.y}, {asset.frame_width}, {asset.frame_height}],')

    if always_include_size or asset.size_explicit or asset.is_animated or asset.draw_width != asset.frame_width or asset.draw_height != asset.frame_height:
        lines.append(f'    size: [{asset.draw_width}, {asset.draw_height}],')

    if asset.default_animation is not None:
        lines.append(f'    defaultAnimation: {json.dumps(asset.default_animation)},')

    if asset.animations:
        lines.append('    animations: {')
        for anim_name, anim_data in asset.animations.items():
            lines.append(f'        {js_key(anim_name)}: {{')
            lines.append(f'            fps: {format_js_value(anim_data["fps"] )},')
            lines.extend(render_frames(anim_data['frames'], '            '))
            lines.append('        },')
        lines.append('    },')

    lines.append('},')
    return lines


def generate_tile_snippets(assets: list[AssetSpec], atlas_key: str, runtime_path: str, start_id: int | None) -> str:
    lines: list[str] = []
    lines.append('// ATLAS_PATHS')
    lines.append(f'{js_key(atlas_key)}: {json.dumps(runtime_path)},')
    lines.append('')
    lines.append('// TILE_IDS')
    for index, asset in enumerate(assets):
        if start_id is None:
            value = '/* assign ID */'
        else:
            value = str(start_id + index)
        lines.append(f'{asset.const_name}: {value},')

    lines.append('')
    lines.append('// TILES')
    for asset in assets:
        lines.extend(render_visual_block(asset, atlas_key, f'[TILE_IDS.{asset.const_name}]'))
        lines.append('')

    lines.append('// TILE_EDITOR_META')
    for asset in assets:
        lines.append(f'[TILE_IDS.{asset.const_name}]: {{')
        lines.append(f'    label: {json.dumps(asset.label)},')
        lines.append(f'    category: {json.dumps(asset.category)},')
        lines.append('},')
        lines.append('')

    return '\n'.join(lines).rstrip() + '\n'


def generate_sprite_snippets(assets: list[AssetSpec], atlas_key: str, runtime_path: str) -> str:
    lines: list[str] = []
    lines.append('// ATLAS_PATHS')
    lines.append(f'{js_key(atlas_key)}: {json.dumps(runtime_path)},')
    lines.append('')
    lines.append('// SPRITES')
    for asset in assets:
        lines.extend(render_visual_block(asset, atlas_key, json.dumps(asset.key), always_include_size=True))
        lines.append('')

    lines.append('// SPRITE_EDITOR_META')
    for asset in assets:
        lines.append(f'{json.dumps(asset.key)}: {{')
        lines.append(f'    label: {json.dumps(asset.label)},')
        lines.append(f'    category: {json.dumps(asset.category)},')
        lines.append('},')
        lines.append('')

    return '\n'.join(lines).rstrip() + '\n'


def build_atlas_image(assets: list[AssetSpec], atlas_size: tuple[int, int]) -> Image.Image:
    atlas = Image.new('RGBA', atlas_size, (0, 0, 0, 0))
    for asset in assets:
        atlas.paste(asset.image, (asset.x, asset.y))
    return atlas


def main() -> None:
    args = parse_arguments()
    input_folder = Path(args.input_folder)
    if not input_folder.is_dir():
        fail(f'Input folder {input_folder} does not exist or is not a directory.')

    output_path = Path(args.output)
    snippets_path = Path(args.snippets)
    validate_output_is_not_inside_source(input_folder, output_path)

    manifest = load_manifest(input_folder, args.manifest)
    assets = discover_assets(input_folder, manifest, args.width)
    atlas_size = pack_assets(assets, args.width)
    atlas_image = build_atlas_image(assets, atlas_size)

    if args.kind == 'tiles':
        snippets = generate_tile_snippets(assets, args.atlas_key, args.runtime_path, args.start_id)
    else:
        snippets = generate_sprite_snippets(assets, args.atlas_key, args.runtime_path)

    write_image_atomic(atlas_image, output_path)
    write_text_atomic(snippets, snippets_path)

    print(f'Packed {len(assets)} asset(s) into {output_path} ({atlas_size[0]}x{atlas_size[1]}).')
    print(f'Wrote snippets to {snippets_path}.')


if __name__ == '__main__':
    main()
