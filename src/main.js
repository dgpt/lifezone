const { LODE } = require('../lib/lode');
var ship, font, fontInfo, fontRenderer, stringCanvas, renderer, shipX, shipY;

// Override default requestAnimationFrame for maximum compatibility.
var requestAnimationFrame = window.requestAnimationFrame
                       || window.mozRequestAnimationFrame
                       || window.webkitRequestAnimationFrame
                       || window.msRequestAnimationFrame
                       || function(func) { setTimeout(func, 1000/60) };

window.onBodyLoad = () => {
    var loader = LODE.createLoader();
    ship = loader.loadImage('ship.png');
    font = loader.loadImage('font.png');
    fontInfo = loader.loadFile('font.json');

    loader.load({
        onLoadComplete: function() {
            onResourcesLoad();
        }
    });
}

function onResourcesLoad() {
    fontRenderer = new BitmapFontRenderer(font, fontInfo.data);

    renderer = new PixelRenderer();
    renderer.init(document.getElementById('gameCanvas'));
    renderer.canvas.addEventListener('mousemove', onMouseMove);

    stringCanvas = fontRenderer.createStaticString('H.ELLO, WORLD');

    requestAnimationFrame(onUpdate);
}

function onMouseMove(e) {
    shipX = e.layerX;
    shipY = e.layerY;
}

function onUpdate() {
    renderer.clear();

    renderer.gc.fillStyle = '#FF0000';
    renderer.drawPixel(0,0);
    renderer.gc.fillStyle = '#00FF00';
    renderer.drawPixel(1,0);
    renderer.drawPixel(63,63);

    renderer.drawText('debug text', 0, 0);
    renderer.drawImage(stringCanvas, 0, 0);

    var shipOffset = renderer.pixelCoordToScreen(ship.width/2, ship.height/2);
    renderer.drawImage(ship, shipX - shipOffset.x, shipY - shipOffset.y);

    requestAnimationFrame(onUpdate);
}

var PixelRenderer = (function() {
    function R() {}

    R.prototype.init = function(canvas) {
        this.RESOLUTION = 64;
        this.canvas = canvas;
        this.gc = canvas.getContext('2d');
        this.pixelSize = canvas.width / this.RESOLUTION;

        // Disable smoothing for crisp edges when scaling images
        this.gc.mozImageSmoothingEnabled = false;
        this.gc.msImageSmoothingEnabled = false;
        this.gc.imageSmoothingEnabled = false;
    }

    // xi, yi = pixel position index
    R.prototype.drawPixel = function(xi, yi) {
        var p = this.pixelSize;
        this.gc.fillRect(xi * p, yi * p, p, p);
    }

    // Draws an image
    // x, y = screen coordinates
    R.prototype.drawImage = function(img, x, y) {
        var p = this.pixelSize;
        var pos = this.screenCoordToPixel(x, y);
        this.gc.drawImage(img, pos.x * p, pos.y * p, img.width * p, img.height * p);
    }

    // Draws not pixel text, for debugging purposes
    // x, y = screen coordinates
    R.prototype.drawText = function(text, x, y, size) {
        this.gc.save();
        this.gc.fillStyle = 'white';
        this.gc.strokeStyle = 'black';
        this.gc.textBaseline = 'hanging';
        if (size === undefined) size = this.pixelSize * 4;
        this.gc.font = size + 'px verdana';
        this.gc.fillText(text, x, y);
        this.gc.strokeText(text, x, y);
        this.gc.restore();
    }

    // Converts a screen position into pixel indices
    R.prototype.screenCoordToPixel = function(x, y) {
        x = Math.round(x / this.pixelSize);
        y = Math.round(y / this.pixelSize);
        return {x:x, y:y};
    }

    // Converts pixel indices into screen position
    R.prototype.pixelCoordToScreen = function(x, y) {
        x = x * this.pixelSize;
        y = y * this.pixelSize;
        return {x:x, y:y};
    }

    R.prototype.clear = function() {
        this.gc.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    return R;
})();

var Glyph = (function() {
    function G(fontImg, character, x, y, w, h, orientation) {
        this.fontImg = fontImg;
        this.character = character.toString();
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.orientation = orientation

        this.canvasSlice = document.createElement('canvas');
        this.canvasSlice.width = w;
        this.canvasSlice.height = h;
        this.canvasSlice.id = this.character;
        var gc = this.canvasSlice.getContext('2d');
        gc.drawImage(this.fontImg, x, this.fontImg.height - h - y, w, h, 0, 0, w, h);
    }

    return G;
})();

var BitmapFontRenderer = (function() {
    function F(fontImg, fontInfo) {
        fontInfo = JSON.parse(fontInfo);
        this.spaceSize = fontInfo.spaceSize;
        this.paddingSize = fontInfo.paddingSize;
        this.glyphHeight = fontInfo.glyphHeight;

        // Create glyph map
        this.glyphs = {};
        for (var i=0; i<fontInfo.glyphs.length; ++i) {
            var glyphInfo = fontInfo.glyphs[i];
            var orientation = glyphInfo.orientation;
            if (orientation === undefined) {
                orientation = 'top';
            }
            var glyph = new Glyph(fontImg, glyphInfo.name, glyphInfo.rect.x, glyphInfo.rect.y, glyphInfo.rect.width, glyphInfo.rect.height, orientation);
            this.glyphs[glyph.character] = glyph;
        }
    }

    F.prototype.createStaticString = function(string) {
        var canvas = document.createElement('canvas');
        var gc = canvas.getContext('2d');
        var cumulativeWidth = 0;
        for (var i=0; i<string.length; ++i) {
            var character = string[i];
            var glyph = this.glyphs[character];
            if (glyph === undefined) {
                if (character === ' ') {
                    cumulativeWidth += this.spaceSize;
                } else {
                    cumulativeWidth += this.paddingSize;
                }
            } else {
                var height = 0;
                if (glyph.orientation === 'bottom') {
                    height = this.glyphHeight - glyph.height;
                }
                gc.drawImage(glyph.canvasSlice, cumulativeWidth, height);
                cumulativeWidth += glyph.width + this.paddingSize;
            }
        }
        return canvas;
    }

    return F;
})();
