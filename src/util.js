export class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Information required for pixel/screen coordinate conversion
    static setPixelInfo(resolution, canvasWidth, canvasHeight) {
        Vec.resolution = resolution;
        Vec.canvasWidth = canvasWidth;
        Vec.canvasHeight = canvasHeight;
        Vec.pixelSize = canvasWidth / resolution;
    }
}
Vec.resolution = 1;
Vec.canvasWidth = 1;
Vec.canvasHeight = 1;
Vec.pixelSize = 1;

export class ScreenVec extends Vec {
    constructor(x, y) {
        super(x, y);
    }
    asScreenVec() { return this; }
    asPixelVec() {
        return new PixelVec(Math.round(this.x / Vec.pixelSize), Math.round(this.y / Vec.pixelSize));
    }
    asRatioVec() {
        return new RatioVec(this.x / Vec.canvasWidth, this.y / Vec.canvasHeight);
    }

    // Converts the screen coordinate into a pixel-safe screen coordinate
    round() {
        return new ScreenVec(Math.round(this.x / Vec.pixelSize) * Vec.pixelSize, Math.round(this.y / Vec.pixelSize) * Vec.pixelSize);
    }
}

export class PixelVec extends Vec {
    constructor(x, y) {
        super(x, y);
    }
    asScreenVec() {
        return new ScreenVec(this.x * Vec.pixelSize, this.y * Vec.pixelSize);
    }
    asPixelVec() { return this; }
    asRatioVec() {
        return new RatioVec(this.x / Vec.resolution, this.y / Vec.resolution);
    }
}

export class RatioVec extends Vec {
    constructor(x, y) {
        super(x, y);
    }
    asScreenVec() {
        return new ScreenVec(this.x * Vec.canvasWidth, this.y * Vec.canvasHeight).round();
    }
    asPixelVec() {
        return new PixelVec(Math.round(this.x * Vec.resolution), Math.round(this.y * Vec.resolution));
    }
    asRatioVec() { return this; }
}
