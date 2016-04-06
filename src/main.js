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
        this.input = new InputManager();
        this.assets = new GameAssets();
        this.assets.load(this.onAssetsLoaded.bind(this));
    };

    G.prototype.onAssetsLoaded = function() {
        console.log("Assets loaded");

        this.fontRenderer = new BitmapFontRenderer(this.assets.font, this.assets.fontInfo.data);

        this.renderer = new PixelRenderer();
        this.renderer.init(document.getElementById('gameCanvas'));

        this.input.init(this.renderer.canvas);

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

        this.input.update();
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

var Button = (function() {
    function B(game, x, y, width, height, opt) {
        this.game = game;

        opt = _.extend({
            text: '',
            halign: 'center',
            valign: 'center'
        }, opt);

        var dimension = this.game.renderer.ratioToScreenCoord(width, height);
        this.width = dimension.x;
        this.height = dimension.y;

        var pos = this.game.renderer.ratioToScreenCoord(x, y);

        if (opt.halign === 'center') {
            this.x = pos.x - this.width/2;
        } else if (opt.halign === 'left') {
            this.x = pos.x;
        }

        if (opt.valign === 'center') {
            this.y = pos.y - this.height/2;
        } else if (opt.valign === 'top') {
            this.y = pos.y;
        } else if (opt.valign === 'bottom') {
            this.y = pos.y - this.height;
        }

        this.status = 'up';

        if (opt.text.length > 0) {
            this.textCanvas = this.game.fontRenderer.createStaticString(opt.text);
        }
    }

    B.prototype.onUpdate = function() {
        var input = this.game.input;
        var isHovering = input.mouse.isColliding(this.x, this.y, this.x+this.width, this.y+this.height);

        if (isHovering) {
            if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                this.status = 'down';
            }

            if (this.status === 'upactive') {
                this.status = 'down';
            }

            if (this.status !== 'down') {
                this.status = 'hover';
            }
        } else {
            if (this.status === 'down' || this.status === 'upactive') {
                this.status = 'upactive';
            } else {
                this.status = 'up';
            }
        }

        this.handleMouseRelease();
    };

    // Handles the actions that occur when you release the mouse button.
    B.prototype.handleMouseRelease = function() {
        var input = this.game.input;
        if (input.mouse.isReleased(input.MOUSE_LEFT)) {
            var isHovering = input.mouse.isColliding(this.x, this.y, this.x+this.width, this.y+this.height);
            if (this.status === 'down') {
                if (this.onClick) {
                    this.onClick();
                }
            }
            this.status = isHovering ? 'hover' : 'up';
        }
    };

    B.prototype.onRender = function() {
        var renderer = this.game.renderer;
        switch(this.status) {
            case 'up':
            case 'upactive':
                renderer.gc.fillStyle = '#AAAAAA';
                break;
            case 'down':
                renderer.gc.fillStyle = '#505050';
                break;
            case 'hover':
                renderer.gc.fillStyle = '#BBBBBB';
                break;

        }
        renderer.gc.fillRect(this.x, this.y, this.width, this.height);
        if (this.textCanvas !== undefined) {
            var textDimension = renderer.pixelCoordToScreen(this.textCanvas.width, this.textCanvas.height);
            renderer.drawImage(this.textCanvas, this.x + this.width/2 - textDimension.x/2, this.y + this.height/2 - textDimension.y/2);
        }
    };

    return B;
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

        this.buttonCounter = 0;
        this.button = new Button(this.game, 0.5, 1.0, 1, 0.25, {
            text: 'Develop',
            valign: 'bottom'
        });
        this.button.onClick = (function() {
            this.buttonCounter++;
            this.stringCanvas = this.game.fontRenderer.createStaticString(this.buttonCounter.toString());
        }).bind(this);

        this.camX = 0;
        this.camY = 0;
        this.mouseClickPos = null;
        this.cameraBounds = {x1: -20, y1: -20, x2: 64, y2: 32};
    };

    T.prototype.update = function() {
        this.button.onUpdate();

        var input = this.game.input;
        if (input.mouse.isPressed(input.MOUSE_LEFT)) {
            this.mouseClickPos = {x:input.mouse.getX(), y:input.mouse.getY()};
        }
        if (this.mouseClickPos !== null) {
            if (input.mouse.isMoving()) {
                var x = this.mouseClickPos.x - input.mouse.getX();
                var y = this.mouseClickPos.y - input.mouse.getY();
                this.camX += Math.round(x/8);
                this.camY += Math.round(y/8);
                if (this.camX < this.cameraBounds.x1) this.camX = this.cameraBounds.x1;
                if (this.camX > this.cameraBounds.x2) this.camX = this.cameraBounds.x2;
                if (this.camY < this.cameraBounds.y1) this.camY = this.cameraBounds.y1;
                if (this.camY > this.cameraBounds.y2) this.camY = this.cameraBounds.y2;
                this.mouseClickPos = {x:input.mouse.getX(), y:input.mouse.getY()};
            }

            if (input.mouse.isReleased(input.MOUSE_LEFT)) {
                this.mouseClickPos = null;
            }
        }
    };

    T.prototype.render = function() {
        var renderer = this.game.renderer;
        renderer.gc.fillStyle = '#1B3A50';
        renderer.fillRect(0,0,renderer.RESOLUTION,renderer.RESOLUTION);

        renderer.gc.fillStyle = '#FF0000';
        renderer.fillRect(5-this.camX, 5-this.camY,32,16);

        renderer.gc.fillStyle = '#00FF00';
        renderer.fillRect(32-this.camX, 32-this.camY,32,8);

        renderer.gc.fillStyle = '#0000FF';
        renderer.fillRect(70-this.camX, 5-this.camY,32,8);

        renderer.drawImage(this.stringCanvas, 0, 0);

        this.button.onRender();

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
