import { drawImageVisual } from "./animation.js";

export const MOVEMENT_SUBDIVISIONS = 4;

const POSITION_EPSILON = 1e-9;

export class Player {
    constructor(tileSize, state, footprint = null) {
        this.tileSize = tileSize;
        this.subcellSize = tileSize / MOVEMENT_SUBDIVISIONS;
        this.state = state;
        this.footprint = footprint ?? {
            width: tileSize,
            height: tileSize,
            offsetX: 0,
            offsetY: 0,
        };

        this.x = 0;
        this.y = 0;
        this.fromX = 0;
        this.fromY = 0;
        this.toX = 0;
        this.toY = 0;
        this.subCol = 0;
        this.subRow = 0;
        this.targetSubCol = 0;
        this.targetSubRow = 0;

        this.isMoving = false;
        this.moveElapsedMs = 0;
        this.moveDurationMs = 0;

        this.setPosition(state.col, state.row);
    }

    get col() {
        return this.state.col;
    }

    get row() {
        return this.state.row;
    }

    get facing() {
        return this.state.facing;
    }

    setFootprint(footprint) {
        this.footprint = footprint;
    }

    setPosition(col, row) {
        const subCol = Math.round(col * MOVEMENT_SUBDIVISIONS);
        const subRow = Math.round(row * MOVEMENT_SUBDIVISIONS);

        if (
            Math.abs(subCol / MOVEMENT_SUBDIVISIONS - col) > POSITION_EPSILON ||
            Math.abs(subRow / MOVEMENT_SUBDIVISIONS - row) > POSITION_EPSILON
        ) {
            throw new Error("Player position must align to the movement subgrid.");
        }

        this.subCol = subCol;
        this.subRow = subRow;
        this.targetSubCol = subCol;
        this.targetSubRow = subRow;

        this.state.col = subCol / MOVEMENT_SUBDIVISIONS;
        this.state.row = subRow / MOVEMENT_SUBDIVISIONS;

        this.x = subCol * this.subcellSize;
        this.y = subRow * this.subcellSize;
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = this.x;
        this.toY = this.y;
        this.isMoving = false;
        this.moveElapsedMs = 0;
        this.moveDurationMs = 0;
    }

    setFacing(dc, dr) {
        this.state.facing = { dc, dr };
    }

    getFootboxAt(x = this.x, y = this.y) {
        return {
            x: x + this.footprint.offsetX,
            y: y + this.footprint.offsetY,
            width: this.footprint.width,
            height: this.footprint.height,
        };
    }

    getCurrentTile() {
        const footbox = this.getFootboxAt();
        return {
            col: Math.floor((footbox.x + footbox.width / 2) / this.tileSize),
            row: Math.floor((footbox.y + footbox.height / 2) / this.tileSize),
        };
    }

    getStepTarget(dc, dr) {
        return {
            subCol: this.subCol + dc,
            subRow: this.subRow + dr,
            x: (this.subCol + dc) * this.subcellSize,
            y: (this.subRow + dr) * this.subcellSize,
        };
    }

    beginStep(dc, dr) {
        if (this.isMoving) {
            throw new Error("Cannot start a player step while another step is active.");
        }
        if (
            !Number.isInteger(dc) ||
            !Number.isInteger(dr) ||
            Math.abs(dc) > 1 ||
            Math.abs(dr) > 1 ||
            (dc === 0 && dr === 0)
        ) {
            throw new Error("Player movement steps must use a non-zero unit input vector.");
        }

        const target = this.getStepTarget(dc, dr);
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = target.x;
        this.toY = target.y;
        this.targetSubCol = target.subCol;
        this.targetSubRow = target.subRow;
        this.moveElapsedMs = 0;
        this.moveDurationMs =
            (1000 * Math.hypot(dc, dr)) / (this.state.movementSpeed * MOVEMENT_SUBDIVISIONS);
        this.isMoving = true;
    }

    update(deltaMs) {
        if (!this.isMoving) {
            return {
                completed: false,
                remainingMs: deltaMs,
                tileChanged: false,
                previousTile: null,
                currentTile: null,
            };
        }

        const previousTile = this.getCurrentTile();
        const remainingMoveMs = this.moveDurationMs - this.moveElapsedMs;
        const consumedMs = Math.min(deltaMs, remainingMoveMs);
        this.moveElapsedMs += consumedMs;

        const t = Math.min(this.moveElapsedMs / this.moveDurationMs, 1);
        this.x = this.fromX + (this.toX - this.fromX) * t;
        this.y = this.fromY + (this.toY - this.fromY) * t;

        if (t < 1) {
            return {
                completed: false,
                remainingMs: 0,
                tileChanged: false,
                previousTile: null,
                currentTile: null,
            };
        }

        this.subCol = this.targetSubCol;
        this.subRow = this.targetSubRow;
        this.state.col = this.subCol / MOVEMENT_SUBDIVISIONS;
        this.state.row = this.subRow / MOVEMENT_SUBDIVISIONS;
        this.x = this.toX;
        this.y = this.toY;
        this.isMoving = false;

        const currentTile = this.getCurrentTile();
        return {
            completed: true,
            remainingMs: Math.max(0, deltaMs - consumedMs),
            tileChanged:
                currentTile.col !== previousTile.col || currentTile.row !== previousTile.row,
            previousTile,
            currentTile,
        };
    }

    getActionInteraction(interactionMap) {
        if (this.isMoving) return null;

        for (const { col, row } of this.getActionCandidateCells()) {
            const target = interactionMap.get(`${col},${row}`);

            if (target && target.interaction.triggers.includes("action")) {
                return target;
            }
        }

        return null;
    }

    getActionCandidateCells(currentTile = this.getCurrentTile()) {
        const { dc, dr } = this.facing;

        return [{ col: currentTile.col + dc, row: currentTile.row + dr }];
    }

    render(ctx, camera, sprite, image, frame) {
        if (sprite.kind === "image") {
            const [width, height] = sprite.size;
            const drawX = Math.round(this.x + (this.tileSize - width) / 2 - camera.x);
            const drawY = Math.round(this.y + this.tileSize - height - camera.y);
            drawImageVisual(ctx, image, sprite, frame, drawX, drawY);
            return;
        }

        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);
        const inset = Math.round(this.tileSize * 0.18);
        const size = this.tileSize - inset * 2;
        const shapeX = drawX + inset;
        const shapeY = drawY + inset;

        ctx.fillStyle = sprite.fillStyle;
        ctx.fillRect(shapeX, shapeY, size, size);

        ctx.strokeStyle = sprite.strokeStyle;
        ctx.lineWidth = 3;
        ctx.strokeRect(shapeX, shapeY, size, size);

        const centerX = shapeX + size / 2;
        const centerY = shapeY + size / 2;
        const length = size * 0.35;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + this.facing.dc * length, centerY + this.facing.dr * length);
        ctx.stroke();
    }
}
