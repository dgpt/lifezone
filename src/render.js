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
    };

    // xi, yi = pixel position index
    R.prototype.drawPixel = function(xi, yi) {
        var p = this.pixelSize;
        this.gc.fillRect(xi * p, yi * p, p, p);
    };

    // Draws rectangle from pixel to screen coordinates
    R.prototype.fillRect = function(px, py, pw, ph) {
        var p = this.pixelSize;
        this.gc.fillRect(px * p, py * p, pw * p, ph * p);
    };

    // Draws an image
    // x, y = screen coordinates
    R.prototype.drawImage = function(img, x, y) {
        var p = this.pixelSize;
        var pos = this.screenCoordToPixel(x, y);
        this.gc.drawImage(img, pos.x * p, pos.y * p, img.width * p, img.height * p);
    };

    // Draws non pixel text, for debugging purposes
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
    };

    // Converts a screen position into pixel indices
    R.prototype.screenCoordToPixel = function(x, y) {
        x = Math.round(x / this.pixelSize);
        y = Math.round(y / this.pixelSize);
        return {x:x, y:y};
    };

    // Converts pixel indices into screen position
    R.prototype.pixelCoordToScreen = function(x, y) {
        x = x * this.pixelSize;
        y = y * this.pixelSize;
        return {x:x, y:y};
    };

    // Converts a ratio of the screen into a pixel-safe screen coordinate
    R.prototype.ratioToScreenCoord = function(x, y) {
        return this.roundScreenCoord(x * this.canvas.width, y * this.canvas.height);
    };

    // Converts screen coordinates to ratio
    R.prototype.screenCoordToRatio = function(x, y) {
        x = x / this.canvas.width;
        y = y / this.canvas.height;
        return {x:x, y:y};
    };

    // Convert screen coordinate into a pixel-safe screen coordinate
    R.prototype.roundScreenCoord = function(x, y) {
        x = Math.round(x / this.pixelSize) * this.pixelSize;
        y = Math.round(y / this.pixelSize) * this.pixelSize;
        return {x:x, y:y};
    };

    R.prototype.clear = function() {
        this.gc.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    return R;
})();

var Glyph = (function() {
    function G(fontImg, charCode, x, y, w, h, xoffset, yoffset, xadvance) {
        this.fontImg = fontImg;
        this.charCode = charCode;
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.xoffset = xoffset;
        this.yoffset = yoffset;
        this.xadvance = xadvance;

        this.canvasSlice = document.createElement('canvas');
        this.canvasSlice.width = w;
        this.canvasSlice.height = h;
        var gc = this.canvasSlice.getContext('2d');
        gc.drawImage(this.fontImg, x, y, w, h, 0, 0, w, h);
    }

    return G;
})();

var BitmapFontRenderer = (function() {
    // fontInfo = JSON data generated by BMFont
    function F(fontImg, fontInfo) {
        fontInfo = JSON.parse(fontInfo).font;

        function toInt(str) {
            return parseInt(str, 10);
        }

        this.lineHeight = toInt(fontInfo.common.lineHeight);
        this.baseline = toInt(fontInfo.common.base);

        // Create glyph map
        this.glyphs = {};
        for (var i=0; i<fontInfo.chars.count; ++i) {
            var cInfo = fontInfo.chars.char[i];
            var glyph = new Glyph(fontImg, cInfo.id, toInt(cInfo.x), toInt(cInfo.y), toInt(cInfo.width), toInt(cInfo.height), toInt(cInfo.xoffset), toInt(cInfo.yoffset), toInt(cInfo.xadvance));
            this.glyphs[glyph.charCode] = glyph;
        }
    }

    F.prototype.getStringWidth = function(string) {
        var width = 0;
        for (var i=0; i<string.length; ++i) {
            var charCode = string.charCodeAt(i);
            var glyph = this.glyphs[charCode];
            if (glyph !== undefined) {
                width += glyph.xadvance;
            }
        }
        return width;
    };

    F.prototype.getBaselineShift = function(type) {
        var baselineShift = 0;
        if (type === 'middle') {
            baselineShift = -(this.lineHeight - this.baseline)/2;
        } else if (type === 'top') {
            baselineShift = -(this.lineHeight - this.baseline);
        } else if (type === 'bottom') {
            baselineShift = 0;
        }
        return baselineShift
    };

    // Returns an array where each items is a new text line that fits inside the wordWrap size
    F.prototype.separateIntoWordWrapLines = function(string, wordWrap) {
        var words = string.split(' ');
        var lines = [];
        var currentLine = '';
        var length = 0;
        if (wordWrap > 0) {
            for (var i=0; i<words.length; ++i) {
                var word = words[i];
                // Length of the string with the new word
                var tmpLength = length + this.getStringWidth(word);
                if (tmpLength >= wordWrap) {
                    // The new word is too big, so start a new line with the new word
                    length = tmpLength-length;
                    lines.push(currentLine);
                    currentLine = word + ' ';
                } else {
                    // The new word fits, so append it to the current line
                    length = tmpLength + this.getStringWidth(' ');
                    currentLine += word + ' ';
                }
            }
        } else {
            currentLine = string;
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        return lines;
    };

    // Creates a pre-rendered canvas of text
    // wordWrap - If greater than 0, wraps the text around when it reaches a certain width in pixels
    F.prototype.createStaticString = function(string, opt) {
        var canvas = document.createElement('canvas');
        var gc = canvas.getContext('2d');

        opt = _.extend({
            baseline: 'top',
            wordWrap: 0
        }, opt);

        if (opt.wordWrap > 0) {
            var lines = this.separateIntoWordWrapLines(string, opt.wordWrap);
            canvas.width = opt.wordWrap;
            canvas.height = this.lineHeight * lines.length;
        } else {
            var lines = [string];
            canvas.width = this.getStringWidth(string);
            canvas.height = this.lineHeight;
        }

        var baselineShift = this.getBaselineShift(opt.baseline);
        var cumulativeHeight = 0;

        for (var i=0; i<lines.length; ++i) {
            this.renderString(lines[i], gc, 0, cumulativeHeight + baselineShift);
            cumulativeHeight += this.lineHeight;
        }
        return canvas;
    };

    F.prototype.renderString = function(string, gc, x, y) {
        var cumulativeWidth = 0;
        for (var i=0; i<string.length; ++i) {
            var charCode = string.charCodeAt(i);
            var glyph = this.glyphs[charCode];
            if (glyph !== undefined) {
                gc.drawImage(glyph.canvasSlice, x + cumulativeWidth, glyph.yoffset + y);
                cumulativeWidth += glyph.xadvance;
            }
        }
    };

    return F;
})();

module.exports = {
    PixelRenderer: PixelRenderer,
    Glyph: Glyph,
    BitmapFontRenderer: BitmapFontRenderer
};
