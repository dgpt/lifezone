// Override default requestAnimationFrame for maximum compatibility.
var requestAnimationFrame = window.requestAnimationFrame
                       || window.mozRequestAnimationFrame
                       || window.webkitRequestAnimationFrame
                       || window.msRequestAnimationFrame
                       || function(func) { setTimeout(func, 1000/60) };

const time = require('./time.js');
const input = require('./input.js');
const render = require('./render.js');
const ui = require('./ui.js');
const util = require('./util.js');

import { Vec, ScreenVec, PixelVec, RatioVec } from './util.js';

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

        Vec.setPixelInfo(this.renderer.RESOLUTION, this.renderer.canvas.width, this.renderer.canvas.height);

        this.input.init(this.renderer.canvas);

        if (this.world) {
            this.world.onInit();
        }

        this.update();
    }

    update() {
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
        requestAnimationFrame(function() { self.update() });
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

    // Returns if two rects are overlapping
    // rect = {x, y, w, h}
    isRectColliding(rect1, rect2) {
        rect1.x2 = rect1.x + rect1.w;
        rect1.y2 = rect1.y + rect1.h;
        rect2.x2 = rect2.x + rect2.w;
        rect2.y2 = rect2.y + rect2.h;
        return (rect1.x < rect2.x2
        && rect1.x2 > rect2.x
        && rect1.y < rect2.y2
        && rect1.y2 > rect2.y);
    }
}

class GameAssets {
    constructor() {
        this.loader = LODE.createLoader();
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
            mine: 'mine.png',
            pixelSelector: 'pixel-selector.png'
        });
    }

    load(onAssetsLoaded) {
        this.loader.load({
            onLoadComplete: onAssetsLoaded
        });
    }
}

class ModuleButton extends ui.Clickable {
    constructor(game, opt) {
        super(game, 0, 0, 0, 0, opt);
    }

    setImage(img) {
        this.img = img;
        var ratioDimension = this.game.renderer.pixelCoordToRatio(img.width, img.height);
        this.setDimensions(ratioDimension.x, ratioDimension.y);
    }

    update() {
        if (this.game.getActiveUi() === null) {
            this.handleButtonInput();
        }
    }

    render() {
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

class Module {
    constructor(game, mainWorld, x, y, img) {
        this.game = game;
        this.mainWorld = mainWorld;
        // Pixel coordinate
        this.x = x;
        this.y = y;
        this.img = img;
        this.button = new ModuleButton(this.game, {valign:'top', halign:'left'});
        this.button.setImage(img);
        this.button.onClick = () => {
            this.mainWorld.activeModule = this;
            if (this.onClick) this.onClick();
        }
    }

    setPos(x, y) {
        var pos = this.game.renderer.pixelCoordToRatio(x, y);
        this.button.setPos(pos.x,pos.y);
        this.x = x;
        this.y = y;
    }

    onCameraChange(camX, camY) {
        var pos = this.game.renderer.pixelCoordToRatio(this.x-camX, this.y-camY);
        this.button.setPos(pos.x,pos.y);
    }

    isColliding(x, y, w, h) {
        var buttonPos = this.game.renderer.screenCoordToPixel(this.button.x, this.button.y);
        var buttonDimension = this.game.renderer.screenCoordToPixel(this.button.width, this.button.height);
        return this.game.isRectColliding({
            x:x, y:y, w:w, h:h
        }, {
            x: buttonPos.x, y: buttonPos.y, w: buttonDimension.x, h: buttonDimension.y
        });
    }

    update() {
        this.button.update();
    }

    render() {
        this.button.render();
        if (this.mainWorld.addingModule) {
            this.game.renderer.gc.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.game.renderer.gc.fillRect(this.button.x, this.button.y, this.button.width, this.button.height);
        } else if (this.mainWorld.activeModule === this) {
            this.game.renderer.gc.fillStyle = 'rgba(127, 127, 0, 0.5)';
            this.game.renderer.drawOutline(this.button.x, this.button.y, this.button.width, this.button.height);
        }
    }
}

class DevelopModule extends Module {
    constructor(game, mainWorld, x, y) {
        super(game, mainWorld, x, y, game.assets.img.factory);
    }
    onClick() {
        this.mainWorld.actionButton.setIcon(this.game.assets.img.moneyIcon);
    }
    openMenu() {
        return new DevelopModuleMenu(this.game);
    }
}

class ResearchModule extends Module {
    constructor(game, mainWorld, x, y) {
        super(game, mainWorld, x, y, game.assets.img.lab);
    }
    onClick() {
        this.mainWorld.actionButton.setIcon(this.game.assets.img.researchIcon);
    }
    openMenu() {
        return new ResearchModuleMenu(this.game);
    }
}

class ModuleMenu {
    constructor(game) {
        this.game = game;
        this.ui = new ui.Group();
        this.mainPanel = new ui.Panel(this.game, 0,0,1,1, {layer:-1, valign: 'top', halign: 'left'});
        this.ui.addElements(this.mainPanel);
    }
    update() {
        this.ui.update();
    }
    render() {
        this.ui.render();
    }
    // Call this before disposing of the menu
    kill() {
        this.ui.kill();
    }
}
class DevelopModuleMenu extends ModuleMenu {
    constructor(game) {
        super(game);
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

        this.ui.addElements(titleText, devModuleText, devModuleCost, moneyIcon, popIcon, devModulePopCost, purchaseButton);
    }
}
class ResearchModuleMenu extends ModuleMenu {
    constructor(game) {
        super(game);
        var titleText = new ui.Text(this.game, 0, 0, 'Research', {halign:'left', valign:'top'});
        this.ui.addElements(titleText);
    }
}

class MainWorld extends World {
    constructor(game) {
        super(game);
    }

    init() {
        this.buttonUi = new ui.Group();
        this.actionButton = new ui.Button(this.game, 1, 1.0, 0.5, 0.25, {
            valign: 'bottom',
            halign: 'right'
        });
        this.actionButton.onClick = (function() {
            this.activeModuleMenu = this.activeModule.openMenu();
            this.closeModuleMenuButton.revive();
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

        this.camX = 0;
        this.camY = 0;
        this.mouseClickPos = null;
        this.cameraBounds = {x1: -20, y1: -20, x2: 64, y2: 32};

        this.modules = [new DevelopModule(this.game, this, 5, 5),
                        new ResearchModule(this.game, this, 32, 5),
                        new ResearchModule(this.game, this, 5, 20)];

        this.addingModule = false;
        this.newModule = null;
        this.newModuleX = 0;
        this.newModuleY = 0;
        this.activeModule = null;
        this.activeModuleMenu = null;

        this.closeModuleMenuButton = new ui.Button(this.game, 1, 0, 0.35, 0.125, {
            text: 'Close',
            valign: 'top',
            halign: 'right',
            layer: -2
        });
        this.closeModuleMenuButton.onClick = () => {
            this.activeModuleMenu.kill();
            this.activeModuleMenu = null;
            this.closeModuleMenuButton.kill();
        };

        this.onCameraChange();
    }

    update() {
        this.buttonUi.update();
        if (this.activeModuleMenu !== null) {
            this.activeModuleMenu.update();
            this.closeModuleMenuButton.update();
        }
        this.statUi.update();

        for (let i=0; i<this.modules.length; ++i) {
            this.modules[i].update();
        }

        if (this.game.input.key.isPressed(this.game.input.ENTER)) {
            this.addingModule = true;
            this.newModule = new DevelopModule(this.game, this, 0, 0);
        }

        if (this.addingModule === true) {
            let dimension = this.game.renderer.pixelCoordToScreen(this.newModule.img.width, this.newModule.img.height);
            this.newModuleX = this.game.input.mouse.getX() - dimension.x/2;
            this.newModuleY = this.game.input.mouse.getY() - dimension.y/2;
            if (this.game.input.mouse.isPressed(this.game.input.MOUSE_LEFT)) {
                let canPlace = true;
                for (let module of this.modules) {
                    let pos = this.game.renderer.screenCoordToPixel(this.newModuleX, this.newModuleY);
                    if (module.isColliding(pos.x, pos.y, this.newModule.img.width, this.newModule.img.height)) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    let pos = this.game.renderer.screenCoordToPixel(this.newModuleX, this.newModuleY);
                    this.newModule.setPos(pos.x + this.camX, pos.y + this.camY);
                    this.newModule.onCameraChange(this.camX, this.camY);
                    this.modules.push(this.newModule);
                    this.addingModule = false;
                    this.newModule = null;
                }
            }
        }

        if (this.game.getActiveUi() === null) {
            var input = this.game.input;
            if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                this.mouseClickPos = {x:input.mouse.getX(), y:input.mouse.getY()};
            }
            if (this.mouseClickPos !== null) {
                if (input.mouse.isMoving()) {
                    let x = this.mouseClickPos.x - input.mouse.getX();
                    let y = this.mouseClickPos.y - input.mouse.getY();
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
        for (let i=0; i<this.modules.length; ++i) {
            this.modules[i].onCameraChange(this.camX, this.camY);
        }
    }

    render() {
        var renderer = this.game.renderer;
        renderer.gc.fillStyle = '#1B3A50';
        renderer.fillRect(0,0,renderer.RESOLUTION,renderer.RESOLUTION);

        for (var i=0; i<this.modules.length; ++i) {
            this.modules[i].render();
        }
        this.buttonUi.render();

        var selector = this.game.assets.img.pixelSelector;
        var selectorOffset = renderer.pixelCoordToScreen(selector.width/2, selector.height/2);
        renderer.drawImage(selector, this.game.input.mouse.getX() - selectorOffset.x, this.game.input.mouse.getY() - selectorOffset.y);

        if (this.addingModule === true) {
            renderer.drawImage(this.newModule.img, this.newModuleX, this.newModuleY);
        }

        this.statUi.render();
        if (this.activeModuleMenu !== null) {
            this.activeModuleMenu.render();
            this.closeModuleMenuButton.render();
        }
    }
}
