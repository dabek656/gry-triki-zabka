/* ==================================================
   ZMIANA TORU
================================================== */

function changeLane(lane) {

    if (
        lane === currentLane
    ) {
        return;
    }


    currentLane =
        lane;


    /*
       Lewy tor.
    */

    if (
        lane === "left"
    ) {

        arrow.style.left =
            "80px";

        laneText.textContent =
            "LEWY";

    }


    /*
       Prawy tor.
    */

    else {

        arrow.style.left =
            "420px";

        laneText.textContent =
            "PRAWY";
    }
}


/* ==================================================
   WYKRYWANIE RUCHU NADGARSTKIEM
================================================== */

function detectWristMovement(z) {

    /*
       Bardziej czuły filtr.
    */

    filteredGyroZ =
        filteredGyroZ * 0.55 +
        z * 0.45;


    const now =
        performance.now();


    /*
       Po wykonaniu ruchu
       czekamy na uspokojenie.
    */

    if (
        !movementReady
    ) {

        if (
            Math.abs(
                filteredGyroZ
            ) <
            RESET_THRESHOLD
        ) {

            movementReady =
                true;
        }

        return;
    }


    /*
       Cooldown.
    */

    if (
        now - lastSwitch <
        SWITCH_COOLDOWN
    ) {

        return;
    }


    /*
       RUCH W LEWO

       Zachowane odwrócenie
       kierunków.
    */

    if (
        filteredGyroZ >
        MOTION_THRESHOLD
    ) {

        changeLane(
            "left"
        );

        movementReady =
            false;

        lastSwitch =
            now;

        return;
    }


    /*
       RUCH W PRAWO.
    */

    if (
        filteredGyroZ <
        -MOTION_THRESHOLD
    ) {

        changeLane(
            "right"
        );

        movementReady =
            false;

        lastSwitch =
            now;
    }
}


/* ==================================================
   TWORZENIE PUNKTU
================================================== */

function spawnPoint() {

    const activeHold =
        points.find(
            point =>
                point.holdNote &&
                !point.hit
        );

    const element =
        document.createElement(
            "div"
        );

    const isHoldNote =
        holdNotePending &&
        !activeHold;

    const holdBeats =
        isHoldNote
            ? pendingHoldNoteLength
            : 0;

    const holdLength =
        holdBeats *
        POINT_SPEED *
        (beatInterval / 1000);

    if (isHoldNote) {
        holdNotePending =
            false;

        pendingHoldNoteLength =
            0;
    }

    element.className =
        isHoldNote
            ? "point hold-note"
            : "point";


    /*
       Losujemy tor.
    */

    let lane;

    if (activeHold) {
        lane =
            activeHold.lane === "left"
                ? "right"
                : "left";
    } else {
        lane =
            Math.random() < 0.5
                ? "left"
                : "right";
    }

    let spawnY =
        -20;

    if (activeHold) {
        const beatDistance =
            POINT_SPEED *
            (beatInterval / 1000);

        spawnY =
            activeHold.y -
            activeHold.holdLength -
            POINT_DIAMETER / 2 -
            4 -
            activeHold.sideNotesSpawned *
                beatDistance;

        activeHold.sideNotesSpawned++;
    }

    const candidateLength =
        isHoldNote
            ? holdLength
            : 0;

    for (
        let attempt = 0;
        attempt < points.length;
        attempt++
    ) {

        const candidateTop =
            isHoldNote
                ? spawnY - candidateLength
                : spawnY - POINT_DIAMETER / 2;

        const candidateBottom =
            isHoldNote
                ? spawnY
                : spawnY + POINT_DIAMETER / 2;

        const overlappingPoint =
            points.find(point => {

                if (point.hit) {
                    return false;
                }

                const otherTop =
                    point.holdNote
                        ? point.y - point.holdLength
                        : point.y - POINT_DIAMETER / 2;

                const otherBottom =
                    point.holdNote
                        ? point.y
                        : point.y + POINT_DIAMETER / 2;

                return (
                    candidateBottom + 4 > otherTop &&
                    candidateTop - 4 < otherBottom
                );
            });

        if (!overlappingPoint) {
            break;
        }

        const otherTop =
            overlappingPoint.holdNote
                ? overlappingPoint.y - overlappingPoint.holdLength
                : overlappingPoint.y - POINT_DIAMETER / 2;

        spawnY =
            otherTop -
            4 -
            (isHoldNote ? 0 : POINT_DIAMETER / 2);
    }


    /*
       Pozycja pozioma.

       Ważne:
       mechanika nadal ma
       tylko dwa tory.
    */

    const x =
        lane === "left"
        ? 80
        : 420;


    element.style.left =
        x + "px";

    if (isHoldNote) {
        element.style.height =
            holdLength + "px";
    }

    element.style.top =
        isHoldNote
            ? (-20 - holdLength) + "px"
            : spawnY + "px";


    const point = {

        id:
            nextPointId++,

        element:
            element,

        lane:
            lane,

        x:
            x,

        y:
            spawnY,

        holdNote:
            isHoldNote,

        holdBeats:
            holdBeats,

        holdLength:
            holdLength,

        sideNotesSpawned:
            0,

        holding:
            false,

        hit:
            false
    };


    element.dataset.id =
        point.id;


    document
        .getElementById(
            "track"
        )
        .appendChild(
            element
        );


    points.push(
        point
    );

    if (isHoldNote) {
        message.textContent =
            "FIOLETOWA LINIA — PRZYTRZYMAJ PRZYCISK!";
    }

    return point;
}


/* ==================================================
   TRAFIENIE
================================================== */

function registerSuccessfulHit(target, holdCompleted) {

    target.hit =
        true;

    target.holding =
        false;

    target.element
        .classList
        .remove("holding");

    target.element
        .classList
        .add("hit");

    playWaterRipple();

    successfulHitCount++;

    if (holdCompleted) {
        normalHitsSinceHold = 0;
    } else {
        normalHitsSinceHold++;

        if (normalHitsSinceHold >= 5) {
            holdNotePending = true;
            pendingHoldNoteLength =
                normalHitsSinceHold;
            normalHitsSinceHold = 0;
        }
    }

    const effectiveBpm =
        selectedBpm *
        (shiftHeld ? 2 : 1);

    if (
        effectiveBpm <= 150 ||
        successfulHitCount % 2 === 0
    ) {

        visualizerHitPulse =
            .45;
    }

    const pointsEarned =
        shiftHeld ? 2 : 1;

    score +=
        pointsEarned;

    scoreElement.textContent =
        score;

    if (score > bestScore) {
        bestScore =
            score;

        bestScoreElement.textContent =
            "REKORD: " + bestScore;

        menuBestScoreElement.textContent =
            "REKORD: " + bestScore;

        try {
            localStorage.setItem(
                BEST_SCORE_STORAGE_KEY,
                String(bestScore)
            );
        } catch (error) {
            console.error(
                "Nie udało się zapisać rekordu:",
                error
            );
        }
    }

    message.textContent =
        "TRAFIENIE!";

    feedback.textContent =
        "+" + pointsEarned;

    feedback.classList.remove(
        "show"
    );

    void feedback.offsetWidth;

    feedback.classList.add(
        "show"
    );

    setTimeout(
        () => {

            if (
                target.element.parentNode
            ) {

                target.element.remove();
            }
        },
        180
    );
}

function missPoint(point, index) {

    point.holding =
        false;

    point.element.remove();
    points.splice(index, 1);
    normalHitsSinceHold = 0;
    holdNotePending = false;
    pendingHoldNoteLength = 0;
    message.textContent = "PUDŁO!";
}

function releaseHoldNote() {

    const holdPoint =
        points.find(
            point => point.holding
        );

    if (!holdPoint) {
        return;
    }

    const index =
        points.indexOf(holdPoint);

    const releaseEndY =
        holdPoint.y -
        holdPoint.holdLength;

    if (
        holdPoint.lane === currentLane &&
        Math.abs(
            releaseEndY -
            arrowYToPixels()
        ) <= HIT_DISTANCE
    ) {

        registerSuccessfulHit(
            holdPoint,
            true
        );
    } else {

        missPoint(
            holdPoint,
            index
        );
    }
}

function tryHit() {

    if (
        !running
    ) {

        return;
    }


    let target =
        null;


    let closest =
        Infinity;


    /*
       Szukamy najbliższego
       punktu na aktualnym torze.
    */

    for (
        const point of points
    ) {

        if (
            point.hit ||
            point.holding
        ) {

            continue;
        }


        if (
            point.lane !==
            currentLane
        ) {

            continue;
        }


        const distance =
            Math.abs(
                point.y -
                arrowYToPixels()
            );


        if (
            distance <
            closest
        ) {

            closest =
                distance;

            target =
                point;
        }
    }


    /*
       TRAFIENIE
    */

    if (
        target &&
        closest <=
        HIT_DISTANCE
    ) {

        if (target.holdNote) {
            target.holding = true;
            target.element.classList.add("holding");
            message.textContent =
                "TRZYMAJ — PUŚĆ, GDY FIOLETOWA KROPKA TRAFI W KÓŁKO!";
        } else {
            registerSuccessfulHit(target, false);
        }

    }

    else {

        message.textContent =
            "PUDŁO!";

        normalHitsSinceHold =
            0;

        holdNotePending =
            false;

        pendingHoldNoteLength =
            0;

    }
}


/* ==================================================
   POZYCJA STRZAŁKI
================================================== */

function arrowYToPixels() {

    const track =
        document.getElementById(
            "track"
        );


    return (
        track.clientHeight *
        arrowY /
        100
    );
}
