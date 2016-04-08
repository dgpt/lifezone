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

        // The current active ui elements
        // e.g. A button currently being hovered over
        this.activeUiElements = [];

        this.population = 0;
        this.populationMax = 1000;
        this.money = 10000;
        this.research = 0;
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

    G.prototype.addActiveUi = function(ui) {
        if (!_.contains(this.activeUiElements, ui)) {
            this.activeUiElements.push(ui);
        }
        console.log(this.activeUiElements);
    };

    G.prototype.removeActiveUi = function(ui) {
        var index = this.activeUiElements.indexOf(ui);
        if (index >= 0) {
            this.activeUiElements.splice(index, 1);
        }
        console.log(this.activeUiElements);
    };

    // Returns the first item in the active ui array that has the smallest layer value
    G.prototype.getActiveUi = function() {
        var smallestElement = null;
        for (var i=0; i<this.activeUiElements.length; ++i) {
            var element = this.activeUiElements[i];
            if (smallestElement === null || element.opt.layer < smallestElement.opt.layer) {
                smallestElement = element;
            }
        }
        return smallestElement;
    };

    return G;
})();

var GameAssets = (function() {
    function A() {
        this.loader = LODE.createLoader();
        this.ship = this.loader.loadImage('assets/ship.png');
        this.font = this.loader.loadImage('assets/font.png');
        this.fontInfo = this.loader.loadFile('assets/font.json');
        this.personIcon= this.loader.loadImage('assets/person-icon.png');
        this.moneyIcon= this.loader.loadImage('assets/money-icon.png');
        this.researchIcon= this.loader.loadImage('assets/research-icon.png');
    };
    A.prototype.load = function(onAssetsLoaded) {
        this.loader.load({
            onLoadComplete: onAssetsLoaded
        });
    };
    return A;
})();

var UiElement = (function() {
    function U(game, x, y, width, height, opt) {
        this.game = game;
        this.uiActive = false;

        this.opt = _.extend({
            text: '',
            halign: 'center',
            valign: 'center',
            layer: 0
        }, opt);

        this.setDimensions(width, height);
        this.setPos(x, y);
        this.ratioX = x;
        this.ratioY = y;
        this.ratioW = width;
        this.ratioH = height;
    }

    // Set position as ratio
    U.prototype.setPos = function(x, y) {
        var pos = this.game.renderer.ratioToScreenCoord(x, y);
        if (this.opt.halign === 'center') {
            this.x = pos.x - this.width/2;
        } else if (this.opt.halign === 'left') {
            this.x = pos.x;
        } else if (this.opt.halign === 'right') {
            this.x = pos.x - this.width;
        }

        if (this.opt.valign === 'center') {
            this.y = pos.y - this.height/2;
        } else if (this.opt.valign === 'top') {
            this.y = pos.y;
        } else if (this.opt.valign === 'bottom') {
            this.y = pos.y - this.height;
        }

        this.ratioX = x;
        this.ratioY = y;
    };

    U.prototype.getRight = function() {
        return this.ratioX + this.ratioW;
    };

    U.prototype.getBottom = function() {
        return this.ratioY + this.ratioH;
    };

    // Set dimensions as ratio
    U.prototype.setDimensions = function(width, height) {
        var dimensions = this.game.renderer.ratioToScreenCoord(width, height);
        this.width = dimensions.x;
        this.height = dimensions.y;
        this.ratioW = width;
        this.ratioH = height;
    };

    U.prototype.activateUi = function() {
        if (this.uiActive === false) {
            this.game.addActiveUi(this);
            this.uiActive = true;
        }
    };

    U.prototype.deactivateUi = function() {
        if (this.uiActive === true) {
            this.game.removeActiveUi(this);
            this.uiActive = false;
        }
    };

    U.prototype.isMouseHovering = function() {
        return this.game.input.mouse.isColliding(this.x, this.y, this.x+this.width, this.y+this.height);
    };

    return U;
})();

var UiGroup = (function() {
    function U() {
        this.elements = [];
        this.active = true;
    }

    U.prototype.setActive = function(active) {
        this.active = active;
    };

    // Adds a list of elements to the group
    U.prototype.addElements = function() {
        for (var i=0; i<arguments.length; ++i) {
            this.elements.push(arguments[i]);
        }
    };

    U.prototype.update = function() {
        if (this.active) {
            for (var i=0; i<this.elements.length; ++i) {
                if (this.elements[i].onUpdate) this.elements[i].onUpdate();
            }
        } else {
            for (var i=0; i<this.elements.length; ++i) {
                this.elements[i].deactivateUi();
            }
        }
    };

    U.prototype.render = function() {
        if (this.active) {
            for (var i=0; i<this.elements.length; ++i) {
                this.elements[i].onRender();
            }
        }
    };

    return U;
})();

var UiImage = (function() {
    function I(game, img, x, y, opt) {
        UiElement.apply(this, [game, x, y, 0, 0, opt]);
        this.img = img;

        var pDimension = this.game.renderer.pixelCoordToScreen(this.img.width, this.img.height);
        var ratioDimension = this.game.renderer.screenCoordToRatio(pDimension.x, pDimension.y);
        this.setDimensions(ratioDimension.x, ratioDimension.y);
        this.setPos(this.ratioX, this.ratioY);
    }
    I.prototype = Object.create(UiElement.prototype);

    I.prototype.onRender = function() {
        this.game.renderer.drawImage(this.img, this.x, this.y);
    };

    return I;
})();

var UiText = (function() {
    function T(game, x, y, text, opt) {
        UiElement.apply(this, [game, x, y, 0, 0, opt]);
        this.setText(text);
    }
    T.prototype = Object.create(UiElement.prototype);

    T.prototype.setText = function(text) {
        this.text = this.game.fontRenderer.createStaticString(text);

        var pDimension = this.game.renderer.pixelCoordToScreen(this.text.width, this.text.height);
        var ratioDimension = this.game.renderer.screenCoordToRatio(pDimension.x, pDimension.y);
        this.setDimensions(ratioDimension.x, ratioDimension.y);

        this.setPos(this.ratioX, this.ratioY);
    };

    T.prototype.onRender = function() {
        this.game.renderer.drawImage(this.text, this.x, this.y);
    };

    return T;
})();

var Panel = (function() {
    function P(game, x, y, width, height, opt) {
        UiElement.apply(this, arguments);
    }
    P.prototype = Object.create(UiElement.prototype);

    P.prototype.onUpdate = function() {
        if (this.isMouseHovering()) {
            this.activateUi();
        } else {
            this.deactivateUi();
        }
    };

    P.prototype.onRender = function() {
        var renderer = this.game.renderer;
        renderer.gc.fillStyle = 'rgba(170, 170, 170, 0.5)';
        renderer.gc.fillRect(this.x, this.y, this.width, this.height);
    };
    return P;
})();

var Button = (function() {
    function B(game, x, y, width, height, opt) {
        UiElement.apply(this, arguments);

        this.status = 'up';

        if (opt.text.length > 0) {
            this.textCanvas = this.game.fontRenderer.createStaticString(opt.text, {baseline:'bottom'});
        }
    }
    B.prototype = Object.create(UiElement.prototype);

    B.prototype.onUpdate = function() {
        var input = this.game.input;
        var hovering = this.isMouseHovering();
        if (hovering) {
            this.activateUi();
        }
        if (this.game.getActiveUi() === this) {
            if (this.isMouseHovering()) {
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
                    this.deactivateUi();
                    this.status = 'up';
                }
            }

            this.handleMouseRelease();
        }
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
                renderer.gc.fillStyle = '#CCCCCC';
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
        this.game.renderer.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.buttonUi = new UiGroup();
        this.button = new Button(this.game, 1, 1.0, 0.5, 0.25, {
            text: 'Dev',
            valign: 'bottom',
            halign: 'right'
        });
        this.button.onClick = (function() {
            this.game.population++;
            this.devUi.setActive(true);
            this.popText.setText(this.game.population.toString() + '/' + this.game.populationMax.toString());
        }).bind(this);

        this.endTurnButton = new Button(this.game, 0, 0.875, 0.5, 0.125, {
            text: 'End',
            valign: 'bottom',
            halign: 'left'
        });
        this.endTurnButton.onClick = function() {
            console.log('end week');
        };

        this.statButton = new Button(this.game, 0, 1.0, 0.5, 0.125, {
            text: 'Stats',
            valign: 'bottom',
            halign: 'left'
        });
        this.statButton.onClick = (function() {
            this.statUi.setActive(!this.statUi.active);
        }).bind(this);
        this.buttonUi.addElements(this.button, this.endTurnButton, this.statButton);

        this.statUi = new UiGroup();
        var hPad = 0.02;
        this.personIcon = new UiImage(this.game, this.game.assets.personIcon, 0.01, 0, {halign:'left', valign:'top'});
        this.popText = new UiText(this.game, this.personIcon.getRight() + hPad, 0, this.game.population.toString() + '/' + this.game.populationMax.toString(), {halign: 'left', valign: 'top'});

        this.moneyIcon = new UiImage(this.game, this.game.assets.moneyIcon, 0.01, this.personIcon.getBottom() + 0.01, {halign:'left', valign:'top'});
        this.moneyText = new UiText(this.game, this.moneyIcon.getRight() + hPad, this.personIcon.getBottom() + 0.01, this.game.money.toString(), {halign: 'left', valign: 'top'});

        this.researchIcon = new UiImage(this.game, this.game.assets.researchIcon, 0.01, this.moneyIcon.getBottom() + 0.02, {halign:'left', valign:'top'});
        this.researchText = new UiText(this.game, this.moneyIcon.getRight() + hPad, this.moneyIcon.getBottom() + 0.02, this.game.research.toString(), {halign: 'left', valign: 'top'});
        this.statUi.setActive(false);
        this.statUi.addElements(this.popText, this.personIcon, this.moneyText, this.moneyIcon, this.researchText, this.researchIcon);

        this.devUi = new UiGroup();
        this.closeButton = new Button(this.game, 0.02, 0.02, 0.35, 0.25, {
            text: 'Close',
            valign: 'top',
            halign: 'left',
            layer: -2
        });
        this.closeButton.onClick = (function() {
            this.devUi.setActive(false);
        }).bind(this);
        this.panel = new Panel(this.game, 0,0,1,1, {layer:-1, valign: 'top', halign: 'left'});
        this.devUi.addElements(this.panel, this.closeButton);
        this.devUi.active = false;

        this.camX = 0;
        this.camY = 0;
        this.mouseClickPos = null;
        this.cameraBounds = {x1: -20, y1: -20, x2: 64, y2: 32};
    };

    T.prototype.update = function() {
        this.buttonUi.update();
        this.devUi.update();
        this.statUi.update();

        if (this.game.getActiveUi() === null) {
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
        }
        if (this.game.input.mouse.isReleased(this.game.input.MOUSE_LEFT)) {
            this.mouseClickPos = null;
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

        this.buttonUi.render();

        var ship = this.game.assets.ship;
        var shipOffset = renderer.pixelCoordToScreen(ship.width/2, ship.height/2);
        renderer.drawImage(ship, this.shipX - shipOffset.x, this.shipY - shipOffset.y);

        this.statUi.render();
        this.devUi.render();
    };

    T.prototype.onMouseMove = function(e) {
        this.shipX = e.layerX;
        this.shipY = e.layerY;
    };

    return T;
})();
