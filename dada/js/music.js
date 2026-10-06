/* ==================================================
   START GRY
================================================== */

function getYouTubeVideoId(value) {

    let url;

    try {
        url = new URL(value);
    } catch {
        return null;
    }

    const host =
        url.hostname.toLowerCase().replace(/^www\./, "");

    let videoId = null;

    if (host === "youtu.be") {
        videoId =
            url.pathname.split("/").filter(Boolean)[0];
    } else if (
        host === "youtube.com" ||
        host === "m.youtube.com" ||
        host === "music.youtube.com"
    ) {
        if (url.pathname === "/watch") {
            videoId =
                url.searchParams.get("v");
        } else {
            const pathParts =
                url.pathname.split("/").filter(Boolean);

            if (
                ["embed", "shorts", "live"].includes(pathParts[0])
            ) {
                videoId = pathParts[1];
            }
        }
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
        ? videoId
        : null;
}

const RECENT_SONGS_STORAGE_KEY =
    "trikiRecentSongs";

const MAX_RECENT_SONGS =
    10;

let recentSongLinks = [];

function renderRecentSongs() {
    recentSongs.replaceChildren(
        new Option(
            "Wybierz zapisaną piosenkę...",
            ""
        )
    );

    recentSongLinks.forEach(song => {
        const videoId =
            getYouTubeVideoId(song.url);

        recentSongs.add(
            new Option(
                song.title ||
                    `YouTube (${videoId})`,
                song.url
            )
        );
    });
}

function saveRecentSongs() {
    try {
        localStorage.setItem(
            RECENT_SONGS_STORAGE_KEY,
            JSON.stringify(recentSongLinks)
        );
    } catch (error) {
        console.error(
            "Nie udało się zapisać ostatnio używanych piosenek:",
            error
        );
    }
}

async function loadYouTubeTitle(song) {
    try {
        const response =
            await fetch(
                "https://www.youtube.com/oembed?url=" +
                    encodeURIComponent(song.url) +
                    "&format=json"
            );

        if (!response.ok) {
            throw new Error(
                `YouTube zwrócił status ${response.status}.`
            );
        }

        const data =
            await response.json();

        if (
            typeof data.title !== "string" ||
            !data.title.trim()
        ) {
            throw new Error(
                "YouTube nie zwrócił nazwy piosenki."
            );
        }

        const currentSong =
            recentSongLinks.find(
                item => item.url === song.url
            );

        if (currentSong) {
            currentSong.title =
                data.title.trim();

            saveRecentSongs();
            renderRecentSongs();
        }
    } catch (error) {
        console.error(
            `Nie udało się pobrać nazwy filmu ${song.url}:`,
            error
        );
    }
}

try {
    const savedSongs =
        localStorage.getItem(
            RECENT_SONGS_STORAGE_KEY
        );

    if (savedSongs) {
        const parsedSongs =
            JSON.parse(savedSongs);

        if (!Array.isArray(parsedSongs)) {
            throw new TypeError(
                "Zapisana lista piosenek ma nieprawidłowy format."
            );
        }

        recentSongLinks =
            parsedSongs
                .map(item => {
                    if (typeof item === "string") {
                        return {
                            url: item,
                            title: ""
                        };
                    }

                    if (
                        item &&
                        typeof item === "object" &&
                        typeof item.url === "string"
                    ) {
                        return {
                            url: item.url,
                            title:
                                typeof item.title === "string"
                                    ? item.title.trim()
                                    : ""
                        };
                    }

                    return null;
                })
                .filter(
                    song =>
                        song &&
                        getYouTubeVideoId(song.url)
                )
                .filter(
                    (song, index, songs) =>
                        songs.findIndex(
                            item => item.url === song.url
                        ) === index
                )
                .slice(0, MAX_RECENT_SONGS);
    }
} catch (error) {
    console.error(
        "Nie udało się odczytać ostatnio używanych piosenek:",
        error
    );
}

renderRecentSongs();

recentSongLinks
    .filter(song => !song.title)
    .forEach(song => {
        loadYouTubeTitle(song);
    });

recentSongs.addEventListener(
    "change",
    () => {
        if (recentSongs.value) {
            youtubeInput.value =
                recentSongs.value;
        }
    }
);

startButton.addEventListener(
    "click",
    () => {

        if (
            !bpmInput.reportValidity()
        ) {

            return;
        }

        const youtubeUrl =
            youtubeInput.value.trim();

        const youtubeVideoId =
            youtubeUrl
                ? getYouTubeVideoId(youtubeUrl)
                : null;

        if (youtubeUrl && !youtubeVideoId) {
            musicStatus.textContent =
                "❌ Podaj prawidłowy link do filmu YouTube.";

            return;
        }

        if (
            youtubeVideoId &&
            !["http:", "https:"].includes(location.protocol)
        ) {
            musicStatus.textContent =
                "❌ YouTube wymaga uruchomienia gry przez HTTP/HTTPS, nie jako pliku lokalnego.";

            return;
        }

        if (youtubeVideoId) {
            const previousSong =
                recentSongLinks.find(
                    song => song.url === youtubeUrl
                );

            const currentSong = {
                url: youtubeUrl,
                title: previousSong?.title || ""
            };

            recentSongLinks =
                [
                    currentSong,
                    ...recentSongLinks.filter(
                        song => song.url !== youtubeUrl
                    )
                ].slice(0, MAX_RECENT_SONGS);

            saveRecentSongs();

            renderRecentSongs();
            recentSongs.value =
                youtubeUrl;

            if (!currentSong.title) {
                loadYouTubeTitle(currentSong);
            }
        }

        selectedBpm =
            Number(bpmInput.value);

        beatInterval =
            60000 / selectedBpm;

        bpmText.textContent =
            String(
                selectedBpm *
                (shiftHeld ? 2 : 1)
            );

        menu.style.display =
            "none";


        game.style.display =
            "block";

        if (youtubeVideoId) {
            youtubePlayer.src =
                "https://www.youtube.com/embed/" +
                encodeURIComponent(youtubeVideoId) +
                "?autoplay=1&controls=1&playsinline=1&rel=0";

            youtubePlayer.hidden =
                false;
        }


        score =
            0;

        successfulHitCount =
            0;

        normalHitsSinceHold =
            0;

        holdNotePending =
            false;

        pendingHoldNoteLength =
            0;

        keyboardButtonHeld =
            false;

        deviceButtonHeld =
            false;

        buttonHeld =
            false;

        visualizerHitPulse =
            0;


        scoreElement.textContent =
            "0";


        /*
           Czyszczenie punktów.
        */

        points.forEach(
            point => {

                point.element.remove();
            }
        );


        points =
            [];


        /*
           Reset sterowania.
        */

        currentLane =
            "left";


        filteredGyroZ =
            0;


        movementReady =
            true;


        lastSwitch =
            0;


        arrow.style.left =
            "80px";


        laneText.textContent =
            "LEWY";


        nextSpawn =
            performance.now() +
            beatInterval /
            (shiftHeld ? 2 : 1);


        running =
            true;


        startGame();
    }
);
