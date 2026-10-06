/* ==================================================
   TRIKI — BLUETOOTH NUS
================================================== */

const NUS_SERVICE =
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

const NUS_RX =
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const NUS_TX =
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e";


/*
   Komenda uruchamiająca IMU
*/

const START_COMMAND =
    new Uint8Array([
        0x20,
        0x10,
        0x00,
        0xD0,
        0x07,
        0x68,
        0x00,
        0x03
    ]);


/* ==================================================
   ELEMENTY
================================================== */

const menu =
    document.getElementById(
        "menu"
    );

const game =
    document.getElementById(
        "game"
    );

const visualizer =
    document.getElementById(
        "visualizer"
    );

const visualizerContext =
    visualizer.getContext("2d");

const connectButton =
    document.getElementById(
        "connectButton"
    );

const startButton =
    document.getElementById(
        "startButton"
    );

const bpmInput =
    document.getElementById(
        "bpmInput"
    );

const youtubeInput =
    document.getElementById(
        "youtubeInput"
    );

const recentSongs =
    document.getElementById(
        "recentSongs"
    );

const musicStatus =
    document.getElementById(
        "musicStatus"
    );

const youtubePlayer =
    document.getElementById(
        "youtubePlayer"
    );

const bpmText =
    document.getElementById(
        "bpmText"
    );

const status =
    document.getElementById(
        "status"
    );

const sensor =
    document.getElementById(
        "sensor"
    );

const arrow =
    document.getElementById(
        "arrow"
    );

const laneText =
    document.getElementById(
        "laneText"
    );

const scoreElement =
    document.getElementById(
        "score"
    );

const bestScoreElement =
    document.getElementById(
        "bestScore"
    );

const menuBestScoreElement =
    document.getElementById(
        "menuBestScore"
    );

const message =
    document.getElementById(
        "message"
    );

const feedback =
    document.getElementById(
        "feedback"
    );

const BEST_SCORE_STORAGE_KEY =
    "trikiBestScore";

let bestScore = 0;

try {
    const savedBestScore =
        Number(
            localStorage.getItem(
                BEST_SCORE_STORAGE_KEY
            )
        );

    if (
        Number.isSafeInteger(savedBestScore) &&
        savedBestScore >= 0
    ) {
        bestScore =
            savedBestScore;
    }
} catch (error) {
    console.error(
        "Nie udało się odczytać rekordu:",
        error
    );
}

bestScoreElement.textContent =
    "REKORD: " + bestScore;

menuBestScoreElement.textContent =
    "REKORD: " + bestScore;


/* ==================================================
   BLUETOOTH
================================================== */

let device = null;
let gatt = null;
let rx = null;
let tx = null;

let buffer =
    new Uint8Array(0);


/* ==================================================
   STEROWANIE
================================================== */

let currentLane =
    "left";


let filteredGyroZ =
    0;


let movementReady =
    true;


let lastSwitch =
    0;


/*
   CZUŁOŚĆ

   50 = czułe sterowanie
*/

const MOTION_THRESHOLD =
    50;


/*
   Poniżej tej wartości
   uznajemy ruch za zakończony.
*/

const RESET_THRESHOLD =
    20;


/*
   Minimalny odstęp między
   zmianami toru.
*/

const SWITCH_COOLDOWN =
    160;


/* ==================================================
   PRZYCISK
================================================== */

let keyboardButtonHeld =
    false;

let deviceButtonHeld =
    false;

let buttonHeld =
    false;


/* ==================================================
   GRA
================================================== */

let running =
    false;


let score =
    0;


let points =
    [];


let nextPointId =
    0;


let nextSpawn =
    0;

let beatInterval =
    0;

let selectedBpm =
    120;

let shiftHeld =
    false;

let successfulHitCount =
    0;

let normalHitsSinceHold =
    0;

let holdNotePending =
    false;

let pendingHoldNoteLength =
    0;


/* Pozycja kółka przy dolnej krawędzi toru. */

const arrowY =
    88;


/*
   Prędkość punktów.
*/

const POINT_SPEED =
    180;


/*
   Odległość potrzebna
   do trafienia.
*/

const HIT_DISTANCE =
    40;

const POINT_DIAMETER =
    24;
