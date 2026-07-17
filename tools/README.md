# Tools

## Atlas packer

Very simple deterministic atlas builder for the current sprite/tile pipeline.

### Usage

Tiles:

```bash
python tools/pack_atlas.py source-art/forest-atlas \
    --kind tiles \
    --atlas-key forest \
    --output assets/atlases/forest.png \
    --runtime-path ./assets/atlases/forest.png \
    --snippets build/forest-atlas-snippets.txt \
    --width 512 \
    --start-id 27
```

Sprites:

```bash
python tools/pack_atlas.py source-art/characters \
    --kind sprites \
    --atlas-key characters \
    --output assets/atlases/characters.png \
    --runtime-path ./assets/atlases/characters.png \
    --snippets build/characters-atlas-snippets.txt \
    --width 512
```

The source folder is authoritative. Every run rebuilds the entire atlas from the PNG files in that folder.
