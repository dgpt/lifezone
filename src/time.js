export class TimeManager {
    constructor() {
        this.delta = 0; // Dynamic value containing the time (in seconds) that passed last frame.
        this.lastFrame = this.getTime();
    }

    getTime() {
        return (new Date()).getTime();
    }

    // Updates the delta time
    updateTime() {
        var time = this.getTime();
        this.delta = (time - this.lastFrame) / 1000;
        this.lastFrame = time;
    }
}
