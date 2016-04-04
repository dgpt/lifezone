var ship, renderer, shipX, shipY;

// Override default requestAnimationFrame for maximum compatibility.
var requestAnimationFrame = window.requestAnimationFrame
                       || window.mozRequestAnimationFrame
                       || window.webkitRequestAnimationFrame
                       || window.msRequestAnimationFrame
                       || function(func) { setTimeout(func, 1000/60) };

function onBodyLoad() {
    var loader = LODE.createLoader();
    ship = loader.loadImage('ship.png');
    loader.load({
        onLoadComplete: function() {
            onResourcesLoad();
        }
    });
}

function onResourcesLoad() {
    renderer = new PixelRenderer();
    renderer.init(document.getElementById('gameCanvas'));
    renderer.canvas.addEventListener('mousemove', onMouseMove);

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
