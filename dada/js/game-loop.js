/* ==================================================
   PĘTLA GRY
================================================== */

let lastTime =
    performance.now();


function startGame() {

    lastTime =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );
}


function gameLoop(now) {

    if (
        !running
    ) {

        return;
    }


    const dt =
        Math.min(
            (now - lastTime) /
            1000,
            0.05
        );


    lastTime =
        now;

    visualizerHitPulse *=
        Math.exp(-dt * 3.5);

    drawVisualizer(now);


    /* ================================================
       SPAWN PUNKTÓW
    ================================================ */

    if (
        now >= nextSpawn
    ) {

        const currentBeatInterval =
            beatInterval /
            (shiftHeld ? 2 : 1);

        const elapsedBeats =
            Math.floor(
                (now - nextSpawn) /
                currentBeatInterval
            ) + 1;

        spawnPoint();

        nextSpawn +=
            elapsedBeats *
            currentBeatInterval;
    }


    /* ================================================
       RUCH PUNKTÓW
    ================================================ */

    const track =
        document.getElementById(
            "track"
        );


    for (
        let i = points.length - 1;
        i >= 0;
        i--
    ) {

        const point =
            points[i];


        if (
            point.hit
        ) {

            continue;
        }


        point.y +=
            POINT_SPEED *
            (shiftHeld ? 2 : 1) *
            dt;


        point.element.style.top =
            point.holdNote
                ? (point.y - point.holdLength) + "px"
                : point.y + "px";

        if (point.holding) {

            if (
                currentLane !== point.lane
            ) {

                missPoint(point, i);
                continue;
            }

            if (
                point.y -
                point.holdLength >
                arrowYToPixels() +
                HIT_DISTANCE
            ) {

                missPoint(point, i);
            }

            continue;
        }


        /*
           Punkt wyleciał
           poza ekran.
        */

        if (
            point.y >
            arrowYToPixels() + HIT_DISTANCE ||
            point.y >
            track.clientHeight + 30
        ) {

            missPoint(point, i);
        }
    }


    requestAnimationFrame(
        gameLoop
    );
}


/* ==================================================
   KLAWIATURA — TEST
================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Shift"
        ) {

            setShiftMode(true);
        }


        /*
           Strzałka w lewo.
        */

        if (
            event.key ===
            "ArrowLeft"
        ) {

            changeLane(
                "left"
            );
        }


        /*
           Strzałka w prawo.
        */

        if (
            event.key ===
            "ArrowRight"
        ) {

            changeLane(
                "right"
            );
        }


        /*
           Spacja =
           przycisk Triki.
        */

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            setButtonInput(
                "keyboard",
                true
            );
        }
    }
);

document.addEventListener(
    "keyup",
    event => {

        if (
            event.code ===
            "Space"
        ) {

            setButtonInput(
                "keyboard",
                false
            );
        }

        if (
            event.key ===
            "Shift"
        ) {

            setShiftMode(false);
        }
    }
);

window.addEventListener(
    "blur",
    () => {

        setButtonInput(
            "keyboard",
            false
        );

        setShiftMode(false);
    }
);


/* ==================================================
   STARTOWY STAN
================================================== */

arrow.style.left =
    "80px";


laneText.textContent =
    "LEWY";