import { STATE, CONFIG } from '../core/config.js';

export function setupInputHandlers(canvas, simulation) {
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
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const canvasX = cssX * scaleX;
        const canvasY = cssY * scaleY;

        return {
            x: canvasX,
            y: canvasY
        };
    }

    function mouseStopped() {
        STATE.mousePosition.x0 = STATE.mousePosition.x;
        STATE.mousePosition.y0 = STATE.mousePosition.y;
    }

    window.addEventListener('keydown', keypress, false);

    canvas.addEventListener('mousemove', function(e) {
        const newPos = getMousePos(canvas, e);
        STATE.mousePosition.x = newPos.x;
        STATE.mousePosition.y = newPos.y;

        clearTimeout(timer);
        timer = setTimeout(mouseStopped, 50);
    }, false);

}
