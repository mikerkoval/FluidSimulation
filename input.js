import { STATE } from './config.js';

export function setupInputHandlers(canvas) {
    let timer;

    function keypress(e) {
        const key = e.key;
        if (key === "p") {
            STATE.pause = !STATE.pause;
        }
        if (key === "a") {
            STATE.textureDraw = !STATE.textureDraw;
        }
        if (key === "s") {
            if (STATE.drawState === CONFIG.DRAW_DENSITY) {
                STATE.drawState = CONFIG.DRAW_VELOCITY;
            } else {
                STATE.drawState = CONFIG.DRAW_DENSITY;
            }
        }
    }

    function getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function mouseStopped() {
        STATE.mousePosition.x0 = STATE.mousePosition.x;
        STATE.mousePosition.y0 = STATE.mousePosition.y;
    }

    window.addEventListener('keydown', keypress, false);

    canvas.addEventListener('mousemove', function(e) {
        const newPos = getMousePos(canvas, e);
        STATE.mousePosition.x0 = STATE.mousePosition.x;
        STATE.mousePosition.y0 = STATE.mousePosition.y;
        STATE.mousePosition.x = newPos.x;
        STATE.mousePosition.y = newPos.y;

        clearTimeout(timer);
        timer = setTimeout(mouseStopped, 50);
    }, false);
}
