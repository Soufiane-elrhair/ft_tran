class Ball {
    constructor(incrementedSpeed) {
        this.width = 18;
        this.height = 18;
        this.x = (canvas.width / 2) - 9;
        this.y = (canvas.height / 2) - 9;
        this.moveX = DIRECTION.IDLE;
        this.moveY = DIRECTION.IDLE;
        this.speed = incrementedSpeed || 7;
    }
}
