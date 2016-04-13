export class UiElement {
    constructor(game, x, y, width, height, opt) {
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
        this.dead = false;
    }

    // Set position as ratio
    setPos(x, y) {
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
    }

    getRight() {
        return this.ratioX + this.ratioW;
    }

    getBottom() {
        return this.ratioY + this.ratioH;
    }

    // Set dimensions as ratio
    setDimensions(width, height) {
        var dimensions = this.game.renderer.ratioToScreenCoord(width, height);
        this.width = dimensions.x;
        this.height = dimensions.y;
        this.ratioW = width;
        this.ratioH = height;
    }

    activateUi() {
        if (this.dead) return;
        if (this.uiActive === false) {
            this.game.addActiveUi(this);
            this.uiActive = true;
        }
    }

    deactivateUi() {
        if (this.uiActive === true) {
            this.game.removeActiveUi(this);
            this.uiActive = false;
            if (this.onDeactivate) this.onDeactivate();
        }
    }

    update() {
        if (!this.dead) {
            if (this.onUpdate) this.onUpdate();
        }
    }

    render() {
        if (!this.dead) {
            if (this.onRender) this.onRender();
        }
    }

    // Disables all updating and rendering
    kill() {
        this.deactivateUi();
        this.dead = true;
    }
    revive() {
        this.dead = false;
        if (this.onRevive) this.onRevive();
    }

    isMouseHovering() {
        return this.game.input.mouse.isColliding(this.x, this.y, this.x+this.width, this.y+this.height);
    }
}

export class Group {
    constructor() {
        this.elements = [];
        this.active = true;
    }

    setActive(active) {
        this.active = active;
    }

    // Adds a list of elements to the group
    addElements() {
        for (var i=0; i<arguments.length; ++i) {
            this.elements.push(arguments[i]);
        }
    }

    kill() {
        for (var i=0; i<this.elements.length; ++i) {
            this.elements[i].kill();
        }
    }

    update() {
        if (this.active) {
            for (var i=0; i<this.elements.length; ++i) {
                if (this.elements[i].update) this.elements[i].update();
            }
        } else {
            for (var i=0; i<this.elements.length; ++i) {
                this.elements[i].deactivateUi();
            }
        }
    }

    render() {
        if (this.active) {
            for (var i=0; i<this.elements.length; ++i) {
                this.elements[i].render();
            }
        }
    }
}

export class UiImage extends UiElement {
    constructor(game, img, x, y, opt) {
        super(game, x, y, 0, 0, opt);
        this.img = img;

        var pDimension = this.game.renderer.pixelCoordToScreen(this.img.width, this.img.height);
        var ratioDimension = this.game.renderer.screenCoordToRatio(pDimension.x, pDimension.y);
        this.setDimensions(ratioDimension.x, ratioDimension.y);
        this.setPos(this.ratioX, this.ratioY);
    }

    onRender() {
        this.game.renderer.drawImage(this.img, this.x, this.y);
    }
}

export class Text extends UiElement {
    constructor(game, x, y, text, opt) {
        super(game, x, y, 0, 0, opt);
        this.setText(text);
    }

    setText(text) {
        this.text = this.game.fontRenderer.createStaticString(text);

        var pDimension = this.game.renderer.pixelCoordToScreen(this.text.width, this.text.height);
        var ratioDimension = this.game.renderer.screenCoordToRatio(pDimension.x, pDimension.y);
        this.setDimensions(ratioDimension.x, ratioDimension.y);

        this.setPos(this.ratioX, this.ratioY);
    }

    onRender() {
        this.game.renderer.drawImage(this.text, this.x, this.y);
    }
}

export class Panel extends UiElement {
    constructor(game, x, y, width, height, opt) {
        super(game, x, y, width, height, opt);
    }

    onUpdate() {
        if (this.isMouseHovering()) {
            this.activateUi();
        } else {
            this.deactivateUi();
        }
    }

    onRender() {
        var renderer = this.game.renderer;
        renderer.gc.fillStyle = 'rgba(50, 100, 150, 0.85)';
        renderer.gc.fillRect(this.x, this.y, this.width, this.height);
    }
}

export class Clickable extends UiElement {
    constructor(game, x, y, width, height, opt) {
        super(game, x, y, width, height, opt);

        this.status = 'up';
    }

    setStatus(status) {
        this.status = status;
        if (this.onStatusChange) {
            this.onStatusChange(this.status);
        }
    }

    onUpdate() {
        this.handleButtonInput();
    }

    handleButtonInput() {
        var input = this.game.input;
        if (this.isMouseHovering()) {
            if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                this.setStatus('down');
            }

            if (this.status === 'upactive') {
                this.setStatus('down');
            }

            if (this.status !== 'down') {
                this.setStatus('hover');
            }
        } else {
            if (this.status === 'down' || this.status === 'upactive') {
                this.setStatus('upactive');
            } else {
                this.setStatus('up');
            }
        }

        this.handleMouseRelease();
    }

    // Handles the actions that occur when you release the mouse button.
    handleMouseRelease() {
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
    }
}

export class Button extends Clickable {
    constructor(game, x, y, width, height, opt) {
        super(game, x, y, width, height, opt);

        this.opt = _.extend({
            text: '',
        }, this.opt, opt);

        if (this.opt.text.length > 0) {
            this.textCanvas = this.game.fontRenderer.createStaticString(opt.text, {baseline:'bottom'});
        }
    }

    onUpdate() {
        if (this.isMouseHovering()) {
            this.activateUi();
        }
        if (this.game.getActiveUi() === this) {
            this.handleButtonInput();
        }
    }

    onStatusChange(status) {
        if (status === 'up') {
            this.deactivateUi();
        }
    }

    onRevive() {
        this.status = 'up';
    }

    setText(text) {
        if (text.length > 0) {
            this.setIcon(null);
            this.textCanvas = this.game.fontRenderer.createStaticString(text, {baseline:'bottom'});
        } else {
            this.textCanvas = null;
        }
    }

    setIcon(img) {
        this.opt.img = img;
        if (img) this.setText('');
    }

    onRender() {
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
        if (this.textCanvas) {
            var textDimension = renderer.pixelCoordToScreen(this.textCanvas.width, this.textCanvas.height);
            renderer.drawImage(this.textCanvas, this.x + this.width/2 - textDimension.x/2, this.y + this.height/2 - textDimension.y/2);
        }
        if (this.opt.img) {
            var img = this.opt.img;
            var imgDimension = renderer.pixelCoordToScreen(img.width, img.height);
            renderer.drawImage(this.opt.img, this.x + this.width/2 - imgDimension.x/2, this.y + this.height/2 - imgDimension.y/2);
        }
    }
}
