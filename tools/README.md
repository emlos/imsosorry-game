# Tools

## Atlas packer

The Quiet Line keeps the source PNGs for both atlases under `source-art/`. Rebuild them from the project root.

### Tiles

```powershell
python tools/pack_atlas.py source-art/quiet-line-tiles `
    --kind tiles `
    --atlas-key world `
    --output assets/atlases/world.png `
    --runtime-path ./assets/atlases/world.png `
    --snippets build/quiet-line-tiles.txt `
    --width 512 `
    --start-id 0
```

### Sprites

```powershell
python tools/pack_atlas.py source-art/quiet-line-sprites `
    --kind sprites `
    --atlas-key entities `
    --output assets/atlases/entities.png `
    --runtime-path ./assets/atlases/entities.png `
    --snippets build/quiet-line-sprites.txt `
    --width 512
```

Every run rebuilds the complete atlas. The source folders and their optional `atlas.json` files are authoritative.
