var TimeManager = (function() {
    function T() {
        this.delta = 0; // Dynamic value containing the time (in seconds) that passed last frame.
        this.lastFrame = this.getTime();
    }

    T.prototype.getTime = function() {
        return (new Date()).getTime();
    };

    // Updates the delta time
    T.prototype.updateTime = function() {
        var time = this.getTime();
        this.delta = (time - this.lastFrame) / 1000;
        this.lastFrame = time;
    };

    return T;
})();
