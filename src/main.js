var ship, font, fontInfo, fontRenderer, stringCanvas, renderer, shipX, shipY;

// Override default requestAnimationFrame for maximum compatibility.
var requestAnimationFrame = window.requestAnimationFrame
                       || window.mozRequestAnimationFrame
                       || window.webkitRequestAnimationFrame
                       || window.msRequestAnimationFrame
                       || function(func) { setTimeout(func, 1000/60) };

var time = require('./time.js');
var input = require('./input.js');
var render = require('./render.js');
var ui = require('./ui.js');

window.onBodyLoad = () => {
    var game = new Game();
    game.setWorld(new MainWorld(game));
    game.init();
}

class Game {
    constructor() {
        this.world = null;

        // The current active ui elements
        // e.g. A button currently being hovered over
        this.activeUiElements = [];

        this.population = 0;
        this.populationMax = 1000;
        this.money = 10000;
        this.research = 0;

        this.developmentModules = 0;
    }

    init() {
        this.time = new time.TimeManager();
        this.input = new input.InputManager();
        this.assets = new GameAssets();
        this.assets.load(this.onAssetsLoaded.bind(this));
    }

    onAssetsLoaded() {
        console.log("Assets loaded");

        this.fontRenderer = new render.BitmapFontRenderer(this.assets.img.font, this.assets.fontInfo.data);

        this.renderer = new render.PixelRenderer();
        this.renderer.init(document.getElementById('gameCanvas'));

        this.input.init(this.renderer.canvas);

        if (this.world) {
            this.world.onInit();
        }

        this.onUpdate();
    }

    onUpdate() {
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
    }

    setWorld(world) {
        this.world = world;
    }

    addActiveUi(ui) {
        if (!_.contains(this.activeUiElements, ui)) {
            this.activeUiElements.push(ui);
        }
        console.log(this.activeUiElements);
    }

    removeActiveUi(ui) {
        var index = this.activeUiElements.indexOf(ui);
        if (index >= 0) {
            this.activeUiElements.splice(index, 1);
        }
        console.log(this.activeUiElements);
    }

    // Returns the first item in the active ui array that has the smallest layer value
    getActiveUi() {
        var smallestElement = null;
        for (var i=0; i<this.activeUiElements.length; ++i) {
            var element = this.activeUiElements[i];
            if (smallestElement === null || element.opt.layer < smallestElement.opt.layer) {
                smallestElement = element;
            }
        }
        return smallestElement;
    }
}

class GameAssets {
    constructor() {
        this.loader = LODE.createLoader();
        this.ship = this.loader.loadImage('assets/ship.png');
        this.fontInfo = this.loader.loadFile('assets/font.json');

        this.img = this.loader.loadImages('assets/', {
            font: 'font.png',
            personIcon: 'person-icon.png',
            moneyIcon: 'money-icon.png',
            researchIcon: 'research-icon.png',
            lab: 'lab.png',
            factory: 'factory.png',
            exploreModule: 'explore-module.png',
            housing: 'housing.png',
            mine: 'mine.png'
        });
    }

    load(onAssetsLoaded) {
        this.loader.load({
            onLoadComplete: onAssetsLoaded
        });
    }
}

class ModuleButton extends ui.Clickable {
    constructor(game, x, y, width, height, img, opt) {
        var ratioDimension = game.renderer.pixelCoordToRatio(img.width, img.height);
        super(game, x, y, ratioDimension.x, ratioDimension.y, opt);
        this.img = img;
    }

    onUpdate() {
        if (this.game.getActiveUi() === null) {
            this.handleButtonInput();
        }
    }

    onRender() {
        var renderer = this.game.renderer;
        renderer.drawImage(this.img, this.x, this.y);
    }
}

class World {
    constructor(game) {
        this.game = game;
    }

    onInit() {
        if (this.init) this.init();
    }

    onUpdate() {
        if (this.update) this.update();
    }

    onRender() {
        if (this.render) this.render();
    }
}

class MainWorld extends World {
    constructor(game) {
        super(game);
    }

    init() {
        this.game.renderer.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.buttonUi = new ui.Group();
        this.actionButton = new ui.Button(this.game, 1, 1.0, 0.5, 0.25, {
            valign: 'bottom',
            halign: 'right'
        });
        this.actionButton.onClick = (function() {
            this.game.population++;
            this.devUi.setActive(true);
            this.popText.setText(this.game.population.toString() + '/' + this.game.populationMax.toString());
        }).bind(this);

        this.endTurnButton = new ui.Button(this.game, 0, 0.875, 0.5, 0.125, {
            text: 'End',
            valign: 'bottom',
            halign: 'left'
        });
        this.endTurnButton.onClick = function() {
            console.log('end week');
        };

        this.statButton = new ui.Button(this.game, 0, 1.0, 0.5, 0.125, {
            text: 'Stats',
            valign: 'bottom',
            halign: 'left'
        });
        this.statButton.onClick = (function() {
            this.statUi.setActive(!this.statUi.active);
        }).bind(this);
        this.buttonUi.addElements(this.actionButton, this.endTurnButton, this.statButton);

        this.statUi = new ui.Group();
        var hPad = 0.02;
        this.personIcon = new ui.UiImage(this.game, this.game.assets.img.personIcon, 0.01, 0, {halign:'left', valign:'top'});
        this.popText = new ui.Text(this.game, this.personIcon.getRight() + hPad, 0, this.game.population.toString() + '/' + this.game.populationMax.toString(), {halign: 'left', valign: 'top'});

        this.moneyIcon = new ui.UiImage(this.game, this.game.assets.img.moneyIcon, 0.01, this.personIcon.getBottom() + 0.01, {halign:'left', valign:'top'});
        this.moneyText = new ui.Text(this.game, this.moneyIcon.getRight() + hPad, this.personIcon.getBottom() + 0.01, this.game.money.toString(), {halign: 'left', valign: 'top'});

        this.researchIcon = new ui.UiImage(this.game, this.game.assets.img.researchIcon, 0.01, this.moneyIcon.getBottom() + 0.02, {halign:'left', valign:'top'});
        this.researchText = new ui.Text(this.game, this.moneyIcon.getRight() + hPad, this.moneyIcon.getBottom() + 0.02, this.game.research.toString(), {halign: 'left', valign: 'top'});
        this.statUi.setActive(false);
        this.statUi.addElements(this.popText, this.personIcon, this.moneyText, this.moneyIcon, this.researchText, this.researchIcon);

        this.createDevelopmentUi();

        this.camX = 0;
        this.camY = 0;
        this.mouseClickPos = null;
        this.cameraBounds = {x1: -20, y1: -20, x2: 64, y2: 32};

        this.moduleButtonsUi = new ui.Group();
        var img = this.game.assets.img;
        this.devModule = new ModuleButton(this.game, 0, 0, 0.5, 0.25, img.factory, {valign:'top', halign:'left'});
        this.devModule.onClick = () => {
            this.actionButton.setIcon(this.game.assets.img.moneyIcon);
        }
        this.manageModule = new ModuleButton(this.game, 0, 0, 0.5, 0.25, img.mine, {valign:'top', halign:'left'});
        this.manageModule.onClick = () => {
            this.actionButton.setIcon(this.game.assets.img.personIcon);
        }
        this.researchModule = new ModuleButton(this.game, 0, 0, 0.5, 0.25, img.lab,{valign:'top', halign:'left'});
        this.researchModule.onClick = () => {
            this.actionButton.setIcon(this.game.assets.img.researchIcon);
        }
        this.moduleButtonsUi.addElements(this.devModule, this.manageModule, this.researchModule);

        this.onCameraChange();
    }

    createDevelopmentUi() {
        this.devUi = new ui.Group();

        var titleText = new ui.Text(this.game, 0, 0, 'Dev Ops', {halign:'left', valign:'top'});
        var devModuleText = new ui.Text(this.game, 0, 0.25, 'Dev Module', {halign:'left', valign:'top'});
        var moneyIcon = new ui.UiImage(this.game, this.game.assets.img.moneyIcon, 0, devModuleText.getBottom(), {halign:'left'});
        var devModuleCost = new ui.Text(this.game, moneyIcon.getRight() + 0.01, devModuleText.getBottom() + 0.03, '150', {halign:'left'});
        var popIcon = new ui.UiImage(this.game, this.game.assets.img.personIcon, devModuleCost.getRight() + 0.05, devModuleText.getBottom(), {halign:'left'});
        var devModulePopCost = new ui.Text(this.game, popIcon.getRight() + 0.02, devModuleText.getBottom() + 0.03, '1', {halign:'left'});

        var purchaseButton = new ui.Button(this.game, 0.98, devModuleText.getBottom(), 0.25, 0.15, {
            text: 'Buy',
            halign: 'right',
            valign: 'bottom',
            layer: -2
        });

        this.closeButton = new ui.Button(this.game, 1, 0, 0.35, 0.125, {
            text: 'Close',
            valign: 'top',
            halign: 'right',
            layer: -2
        });
        this.closeButton.onClick = (function() {
            this.devUi.setActive(false);
        }).bind(this);
        this.panel = new ui.Panel(this.game, 0,0,1,1, {layer:-1, valign: 'top', halign: 'left'});

        this.devUi.addElements(this.panel, titleText, this.closeButton, devModuleText, devModuleCost, moneyIcon, popIcon, devModulePopCost, purchaseButton);
        this.devUi.active = false;
    }

    update() {
        this.buttonUi.update();
        this.devUi.update();
        this.statUi.update();
        this.moduleButtonsUi.update();

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
                    this.onCameraChange();
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
    }

    onCameraChange() {
        var pos = this.game.renderer.pixelCoordToRatio(5-this.camX, 5-this.camY);
        this.devModule.setPos(pos.x,pos.y);

        pos = this.game.renderer.pixelCoordToRatio(5-this.camX, 22-this.camY);
        this.manageModule.setPos(pos.x,pos.y);

        pos = this.game.renderer.pixelCoordToRatio(38-this.camX, 5-this.camY);
        this.researchModule.setPos(pos.x,pos.y);
    }

    render() {
        var renderer = this.game.renderer;
        renderer.gc.fillStyle = '#1B3A50';
        renderer.fillRect(0,0,renderer.RESOLUTION,renderer.RESOLUTION);

        this.moduleButtonsUi.render();
        this.buttonUi.render();

        var ship = this.game.assets.ship;
        var shipOffset = renderer.pixelCoordToScreen(ship.width/2, ship.height/2);
        renderer.drawImage(ship, this.shipX - shipOffset.x, this.shipY - shipOffset.y);

        this.statUi.render();
        this.devUi.render();
    }

    onMouseMove(e)  {
        this.shipX = e.layerX;
        this.shipY = e.layerY;
    }
}
