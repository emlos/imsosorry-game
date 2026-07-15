export function resolveAnimationId(visual, candidateIds) {
    if (!visual.animations) return null;

    for (const candidateId of candidateIds) {
        if (typeof candidateId !== "string") continue;
        if (Object.hasOwn(visual.animations, candidateId)) {
            return candidateId;
        }
    }

    return null;
}

export function resolveAnimationFrame(visual, animationId, elapsedMs) {
    if (!visual.animations || animationId === null) return null;

    const animation = visual.animations[animationId];
    if (!animation) {
        throw new Error(`Unknown animation "${String(animationId)}".`);
    }

    const frameDurationMs = 1000 / animation.fps;
    const frameIndex = Math.floor(elapsedMs / frameDurationMs) % animation.frames.length;
    const [frameCol, frameRow] = animation.frames[frameIndex];
    const [frameWidth, frameHeight] = visual.frameSize;

    return {
        sourceX: frameCol * frameWidth,
        sourceY: frameRow * frameHeight,
        sourceWidth: frameWidth,
        sourceHeight: frameHeight,
    };
}

export function drawImageVisual(ctx, image, visual, frame, drawX, drawY) {
    const [width, height] = visual.size;

    if (frame === null) {
        ctx.drawImage(image, drawX, drawY, width, height);
        return;
    }

    ctx.drawImage(
        image,
        frame.sourceX,
        frame.sourceY,
        frame.sourceWidth,
        frame.sourceHeight,
        drawX,
        drawY,
        width,
        height,
    );
}
