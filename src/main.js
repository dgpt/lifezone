const { LODE } = require('../lib/lode');
var ship, font, fontInfo, fontRenderer, stringCanvas, renderer, shipX, shipY;

// Override default requestAnimationFrame for maximum compatibility.
var requestAnimationFrame = window.requestAnimationFrame
                       || window.mozRequestAnimationFrame
                       || window.webkitRequestAnimationFrame
                       || window.msRequestAnimationFrame
                       || function(func) { setTimeout(func, 1000/60) };

window.onBodyLoad = () => {
    var game = new Game();
    game.setWorld(new TestWorld(game));
    game.init();
}

var Game = (function() {
    function G() {
        this.world = null;
    }

    G.prototype.init = function() {
        this.time = new TimeManager();
        this.assets = new GameAssets();
        this.assets.load(this.onAssetsLoaded.bind(this));
    };

    G.prototype.onAssetsLoaded = function() {
        console.log("Assets loaded");

        this.fontRenderer = new BitmapFontRenderer(this.assets.font, this.assets.fontInfo.data);

        this.renderer = new PixelRenderer();
        this.renderer.init(document.getElementById('gameCanvas'));

        if (this.world) {
            this.world.onInit();
        }

        this.onUpdate();
    };

    G.prototype.onUpdate = function() {
        if (this.world) {
            this.world.onUpdate();
        }

        this.renderer.clear();
        if (this.world) {
            this.world.onRender();
        }

        this.time.updateTime();

        var self = this;
        requestAnimationFrame(function() { self.onUpdate() });
    };

    G.prototype.setWorld = function(world) {
        this.world = world;
    };

    return G;
})();

var GameAssets = (function() {
    function A() {
        this.loader = LODE.createLoader();
        this.ship = this.loader.loadImage('assets/ship.png');
        this.font = this.loader.loadImage('assets/font.png');
        this.fontInfo = this.loader.loadFile('assets/font.json');
    };
    A.prototype.load = function(onAssetsLoaded) {
        this.loader.load({
            onLoadComplete: onAssetsLoaded
        });
    };
    return A;
})();

var World = (function() {
    function W(game) {
        this.game = game;
    }

    W.prototype.onInit = function() {
        if (this.init) this.init();
    };

    W.prototype.onUpdate = function() {
        if (this.update) this.update();
    };

    W.prototype.onRender = function() {
        if (this.render) this.render();
    };

    return W;
})();

var TestWorld = (function() {
    function T(game) {
        World.call(this, game);
    }
    T.prototype = Object.create(World.prototype);

    T.prototype.init = function() {
        this.stringCanvas = this.game.fontRenderer.createStaticString('Hello world!');
        this.game.renderer.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    };

    T.prototype.render = function() {
        var renderer = this.game.renderer;
        renderer.gc.fillStyle = '#1B3A50';
        renderer.fillRect(0,0,renderer.RESOLUTION,renderer.RESOLUTION);

        renderer.drawImage(this.stringCanvas, 5, 5);

        var ship = this.game.assets.ship;
        var shipOffset = renderer.pixelCoordToScreen(ship.width/2, ship.height/2);
        renderer.drawImage(ship, this.shipX - shipOffset.x, this.shipY - shipOffset.y);
    };

    T.prototype.onMouseMove = function(e) {
        this.shipX = e.layerX;
        this.shipY = e.layerY;
    };

    return T;
})();
