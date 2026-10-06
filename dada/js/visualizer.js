function setButtonInput(source, pressed) {

    const wasHeld =
        buttonHeld;

    if (
        source === "keyboard"
    ) {

        keyboardButtonHeld =
            pressed;
    } else {
        deviceButtonHeld =
            pressed;
    }

    buttonHeld =
        keyboardButtonHeld ||
        deviceButtonHeld;

    if (
        buttonHeld &&
        !wasHeld
    ) {

        tryHit();
    }

    if (
        wasHeld &&
        !buttonHeld
    ) {

        releaseHoldNote();
    }
}

function playWaterRipple() {

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const ripple =
            document.createElement("span");

        ripple.className =
            "water-ripple";

        ripple.style.animationDelay =
            (i * 90) + "ms";

        ripple.addEventListener(
            "animationend",
            () => ripple.remove(),
            { once: true }
        );

        arrow.appendChild(ripple);
    }

    arrow.classList.remove(
        "water-hit"
    );

    void arrow.offsetWidth;

    arrow.classList.add(
        "water-hit"
    );
}

let visualizerWidth =
    0;

let visualizerHeight =
    0;

let visualizerParticles =
    [];

let visualizerHitPulse =
    0;

function resizeVisualizer() {

    const pixelRatio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    visualizerWidth =
        window.innerWidth;

    visualizerHeight =
        window.innerHeight;

    visualizer.width =
        Math.round(
            visualizerWidth *
            pixelRatio
        );

    visualizer.height =
        Math.round(
            visualizerHeight *
            pixelRatio
        );

    visualizerContext.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
    );

    visualizerParticles =
        Array.from(
            {
                length: Math.min(
                    90,
                    Math.max(
                        35,
                        Math.floor(
                            visualizerWidth / 16
                        )
                    )
                )
            },
            () => ({
                x: Math.random() * visualizerWidth,
                y: Math.random() * visualizerHeight,
                size: 1 + Math.random() * 2.5,
                speed: 8 + Math.random() * 20,
                phase: Math.random() * Math.PI * 2
            })
        );
}

function drawVisualizer(now) {

    const context =
        visualizerContext;

    const beatDuration =
        beatInterval
        ? beatInterval /
            (shiftHeld ? 2 : 1)
        : 500;

    const beatProgress =
        (now % beatDuration) /
        beatDuration;

    const beatPulse =
        Math.exp(
            -beatProgress * 7
        );

    context.clearRect(
        0,
        0,
        visualizerWidth,
        visualizerHeight
    );

    const glow =
        context.createRadialGradient(
            visualizerWidth * .5,
            visualizerHeight * .68,
            0,
            visualizerWidth * .5,
            visualizerHeight * .68,
            visualizerWidth * .72
        );

    glow.addColorStop(
        0,
        `rgba(0, 130, 255, ${.14 + beatPulse * .16})`
    );

    glow.addColorStop(
        .55,
        "rgba(20, 45, 160, .12)"
    );

    glow.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );

    context.fillStyle =
        glow;

    context.fillRect(
        0,
        0,
        visualizerWidth,
        visualizerHeight
    );

    const time =
        now / 1000;

    for (
        let wave = 0;
        wave < 6;
        wave++
    ) {

        const baseY =
            visualizerHeight *
            (.48 + wave * .075);

        context.beginPath();

        for (
            let x = 0;
            x <= visualizerWidth;
            x += 8
        ) {

            const ratio =
                x / visualizerWidth;

            const envelope =
                Math.sin(ratio * Math.PI);

            const hitWave =
                Math.sin(
                    ratio * 10 -
                    time * 3 +
                    wave
                ) *
                visualizerHitPulse *
                20 *
                envelope;

            const y =
                baseY +
                Math.sin(
                    ratio * 8 +
                    time *
                        (.45 + wave * .035) *
                        (1 + visualizerHitPulse * .65) +
                    wave
                ) *
                (18 + wave * 5 + beatPulse * 14) *
                (1 + visualizerHitPulse * .65) *
                envelope +
                Math.sin(
                    ratio * 17 -
                    time * .3 +
                    wave * .8
                ) *
                7 *
                envelope +
                hitWave;

            if (x === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }

        context.strokeStyle =
            wave % 2 === 0
                ? `rgba(36, 150, 255, ${.24 + beatPulse * .2})`
                : `rgba(115, 85, 255, ${.16 + beatPulse * .14})`;

        context.lineWidth =
            (wave === 0 ? 2.5 : 1.5) +
            visualizerHitPulse * .6;

        context.shadowColor =
            wave % 2 === 0
                ? "#168bff"
                : "#6855ff";

        context.shadowBlur =
            18 +
            beatPulse * 22 +
            visualizerHitPulse * 14;

        context.stroke();
    }

    context.shadowBlur =
        0;

    for (
        const particle of visualizerParticles
    ) {

        particle.y -=
            particle.speed *
            (shiftHeld ? 2 : 1) *
            .016;

        particle.x +=
            Math.sin(
                time * .55 +
                particle.phase
            ) *
            .25;

        if (particle.y < -4) {
            particle.y =
                visualizerHeight + 4;

            particle.x =
                Math.random() *
                visualizerWidth;
        }

        const alpha =
            .25 +
            (Math.sin(
                time * 1.5 +
                particle.phase
            ) + 1) *
            .2 +
            beatPulse * .25;

        context.beginPath();

        context.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        context.fillStyle =
            `rgba(125, 205, 255, ${alpha})`;

        context.fill();
    }

    const vignette =
        context.createLinearGradient(
            0,
            visualizerHeight * .55,
            0,
            visualizerHeight
        );

    vignette.addColorStop(
        0,
        "rgba(0, 0, 0, 0)"
    );

    vignette.addColorStop(
        .45,
        "rgba(0, 0, 0, .22)"
    );

    vignette.addColorStop(
        1,
        "rgba(0, 0, 0, .82)"
    );

    context.fillStyle =
        vignette;

    context.fillRect(
        0,
        0,
        visualizerWidth,
        visualizerHeight
    );
}

resizeVisualizer();

window.addEventListener(
    "resize",
    resizeVisualizer
);

function setShiftMode(held) {

    if (
        held === shiftHeld
    ) {

        return;
    }

    shiftHeld =
        held;

    if (
        running
    ) {

        const currentBeatInterval =
            beatInterval /
            (shiftHeld ? 2 : 1);

        nextSpawn =
            performance.now() +
            currentBeatInterval;

        bpmText.textContent =
            String(
                selectedBpm *
                (shiftHeld ? 2 : 1)
            );
    }
}


