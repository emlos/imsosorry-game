export class Player {
    constructor(tileSize, state) {
        this.tileSize = tileSize;
        this.state = state;

        this.x = state.col * tileSize;
        this.y = state.row * tileSize;
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = this.x;
        this.toY = this.y;

        this.isMoving = false;
        this.moveProgress = 1;
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

    setPosition(col, row) {
        this.state.col = col;
        this.state.row = row;

        this.x = col * this.tileSize;
        this.y = row * this.tileSize;
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = this.x;
        this.toY = this.y;
        this.isMoving = false;
        this.moveProgress = 1;
    }

    setFacing(dc, dr) {
        this.state.facing = { dc, dr };
    }

    tryMove(dc, dr, canEnter) {
        if (this.isMoving) return false;

        this.setFacing(dc, dr);

        const nextCol = this.col + dc;
        const nextRow = this.row + dr;

        if (!canEnter(nextCol, nextRow)) return false;

        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = nextCol * this.tileSize;
        this.toY = nextRow * this.tileSize;

        this.state.col = nextCol;
        this.state.row = nextRow;
        this.moveProgress = 0;
        this.isMoving = true;

        return true;
    }

    update(deltaMs) {
        if (!this.isMoving) return false;

        const moveDurationMs = 1000 / this.state.movementSpeed;
        this.moveProgress += deltaMs / moveDurationMs;
        const t = Math.min(this.moveProgress, 1);
        const eased = t * t * (3 - 2 * t);

        this.x = this.fromX + (this.toX - this.fromX) * eased;
        this.y = this.fromY + (this.toY - this.fromY) * eased;

        if (t < 1) return false;

        this.x = this.toX;
        this.y = this.toY;
        this.isMoving = false;
        return true;
    }

    getInteraction(interactionMap, triggerType) {
        if (this.isMoving) return null;

        const candidates =
            triggerType === "touch"
                ? [{ col: this.col, row: this.row }]
                : this.getActionCandidateCells();

        for (const { col, row } of candidates) {
            const target = interactionMap.get(`${col},${row}`);

            if (
                target &&
                (target.interaction.trigger === "both" ||
                    target.interaction.trigger === triggerType)
            ) {
                return target;
            }
        }

        return null;
    }

    getActionCandidateCells() {
        const { dc, dr } = this.facing;

        return [
            { col: this.col + dc, row: this.row + dr },
            { col: this.col, row: this.row },
            { col: this.col + dr, row: this.row - dc },
            { col: this.col - dr, row: this.row + dc },
            { col: this.col - dc, row: this.row - dr },
        ];
    }

    render(ctx, camera, sprite, image) {
        const drawX = Math.round(this.x - camera.x);
        const drawY = Math.round(this.y - camera.y);

        if (sprite.kind === "image") {
            const [width, height] = sprite.size;
            ctx.drawImage(image, drawX, drawY, width, height);
            return;
        }

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
