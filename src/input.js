export class InputManager {
    constructor() {
        this.key = new Keyboard();
        this.mouse = new Mouse();

        //Keyboard codes. For letters and numbers on the keyboard use a string of the capital character.
        this.BACKSPACE = 8;
        this.TAB = 9;

        this.ENTER = 13;

        this.SHIFT = 16;
        this.CTRL = 17;
        this.ALT = 18;

        this.CAPSLOCK = 20;

        this.ESCAPE = 27;

        this.PAGEUP = 33;
        this.PAGEDOWN = 34;
        this.END = 35;
        this.HOME = 36;
        this.LEFT = 37;
        this.UP = 38;
        this.RIGHT = 39;
        this.DOWN = 40;

        this.INSERT = 45;
        this.DELETE = 46;

        this.ZERO = 96;
        this.ONE = 97;
        this.TWO = 98;
        this.THREE = 99;
        this.FOUR = 100;
        this.FIVE = 101;
        this.SIX = 102;
        this.SEVEN = 103;
        this.EIGHT = 104;
        this.NINE = 105;

        this.SEMICOLON = 186;
        this.EQUAL = 187;
        this.COMMA = 188;
        this.DASH = 189;
        this.PERIOD = 190;
        this.SLASH = 191;
        this.GRAVE = 192;

        this.OPENBRACKET = 219;
        this.BACKSLASH = 220;
        this.CLOSEBRACKET = 221;
        this.QUOTE = 222;

        this.MOUSE_LEFT = 1;
        this.MOUSE_MIDDLE = 2;
        this.MOUSE_RIGHT = 3;
    }

    init(element) {
        this.key.attach(element);
        this.mouse.attach(element);
    }

    update() {
        this.key.update();
        this.mouse.update();
    }
}

export class Keyboard {
    constructor() {
        this.down = [];
        this.downCount = 0,

        this.pressed = [];
        this.pressedCount = 0,

        this.released = [];
        this.releasedCount = 0;
    }

    onKeyDown(e) {
        if (!this.down[e.which]) {
            this.down[e.which] = true;
            this.downCount++;
            this.pressed[this.pressedCount] = e.which;
            this.pressedCount++;
        }
    }

    onKeyUp(e) {
        if (this.down[e.which]) {
            this.down[e.which] = false;
            this.downCount--;
            this.released[this.releasedCount] = e.which;
            this.releasedCount++;
        }
    }

    attach(element) { //Attach an element to this instance to check for key presses.
        element.addEventListener('keydown', this.onKeyDown.bind(this));
        element.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    update() { //This should be called last in your loop.
        while (this.pressedCount > 0) {
            this.pressedCount--;
            this.pressed[this.pressedCount] = -1;
        }

        while (this.releasedCount > 0) {
            this.releasedCount--;
            this.released[this.releasedCount] = -1;
        }
    }

    isDown(keys) {
        if (!Array.isArray(keys))
            keys = [keys]

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            for (var i = 0; i < this.down.length; i++) {
                if (this.down[(typeof key === "number" ? key : key.charCodeAt(0))]) {
                    return true;
                }
            }
            return false;
        }
    }

    isPressed(keys) {
        if (!Array.isArray(keys))
            keys = [keys]

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            for (var i = 0; i < this.pressed.length; i++) {
                if (this.pressed[i] === (typeof key === "number" ? key : key.charCodeAt(0))) {
                    return true;
                }
            }
            return false;
        }
    }

    isReleased(keys) {
        if (!Array.isArray(keys))
            keys = [keys]

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            for (var i = 0; i < this.released.length; i++) {
                if (this.released[i] === (typeof key === "number" ? key : key.charCodeAt(0))) {
                    return true;
                }
            }
        }
        return false;
    }
}

export class Mouse {
    constructor() {
        this.down = [];
        this.downCount = 0;

        this.pressed = [];
        this.pressedCount = 0;

        this.released = [];
        this.releasedCount = 0;

        this.layerX = 0,
        this.layerY = 0;

        this.mouseMoving = false;
    }

    onMouseMove(e) {
        this.layerX = e.clientX - e.target.offsetLeft;
        this.layerY = e.clientY - e.target.offsetTop;
        this.mouseMoving = true;
    }

    onMouseDown(e) {
        if (!this.down[e.which]) {
            this.down[e.which] = true;
            this.downCount++;
            this.pressed[this.pressedCount] = e.which;
            this.pressedCount++;
        }
    }

    onMouseUp(e) {
        if (this.down[e.which]) {
            this.down[e.which] = false;
            this.downCount--;
            this.released[this.releasedCount] = e.which;
            this.releasedCount++;
        }
    }

    attach(element) { //Attach an element to this instance to check for mouse events.
        element.addEventListener('mousemove', this.onMouseMove.bind(this));
        element.addEventListener('mousedown', this.onMouseDown.bind(this));
        element.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    update() { //This should be called last in your loop.
        while (this.pressedCount > 0) {
            this.pressedCount--;
            this.pressed[this.pressedCount] = -1;
        }

        while (this.releasedCount > 0) {
            this.releasedCount--;
            this.released[this.releasedCount] = -1;
        }

        this.mouseMoving = false;
    }

    getX() {
        return this.layerX;
    }

    getY() {
        return this.layerY;
    }

    isDown(button) {
        for (var i = 0; i < this.down.length; i++) {
            if (this.down[button]) {
                return true;
            }
        }
        return false;
    }

    isPressed(button) {
        for (var i = 0; i < this.pressed.length; i++) {
            if (this.pressed[i] === button) {
                return true;
            }
        }
        return false;
    }

    isReleased(button) {
        for (var i = 0; i < this.released.length; i++) {
            if (this.released[i] === button) {
                return true;
            }
        }
        return false;
    }

    isColliding(x1, y1, x2, y2) {
        if (this.layerX >= x1 && this.layerX <= x2) {
            if (this.layerY >= y1 && this.layerY <= y2) {
                return true;
            }
        }
        return false;
    }

    isMoving() {
        return this.mouseMoving;
    }
}
