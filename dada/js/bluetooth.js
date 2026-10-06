/* ==================================================
   ODCZYT RAMKI TRIKI
================================================== */

function decodeFrame(frame) {

    if (
        frame.length !== 14
    ) {

        return;
    }


    /*
       Początek ramki IMU.
    */

    if (
        frame[0] !== 0x22
    ) {

        return;
    }


    /*
       Stan przycisku.
    */

    const buttonPressed =
        frame[1] === 1;


    setButtonInput(
        "device",
        buttonPressed
    );


    const view =
        new DataView(
            frame.buffer,
            frame.byteOffset,
            frame.byteLength
        );


    /*
       GYROSKOP
    */

    const gx =
        view.getInt16(
            2,
            true
        ) / 131;


    const gy =
        view.getInt16(
            4,
            true
        ) / 131;


    const gz =
        view.getInt16(
            6,
            true
        ) / 131;


    /*
       AKCELEROMETR
    */

    const ax =
        view.getInt16(
            8,
            true
        ) / 2048;


    const ay =
        view.getInt16(
            10,
            true
        ) / 2048;


    const az =
        view.getInt16(
            12,
            true
        ) / 2048;


    /*
       Debug.
    */

    sensor.textContent =
`BUTTON: ${
    buttonPressed
    ? "PRESSED"
    : "released"
}

GYRO
X: ${gx.toFixed(1)}
Y: ${gy.toFixed(1)}
Z: ${gz.toFixed(1)}

ACCEL
X: ${ax.toFixed(2)}
Y: ${ay.toFixed(2)}
Z: ${az.toFixed(2)}`;


    /*
       Sterowanie nadal
       korzysta wyłącznie z Z.
    */

    detectWristMovement(
        gz
    );
}


/* ==================================================
   PARSER BLE
================================================== */

function parseBLEChunk(chunk) {

    const merged =
        new Uint8Array(
            buffer.length +
            chunk.length
        );


    merged.set(
        buffer,
        0
    );


    merged.set(
        chunk,
        buffer.length
    );


    buffer =
        merged;


    while (
        buffer.length >= 14
    ) {

        let start =
            -1;


        /*
           Szukamy początku
           poprawnej ramki.
        */

        for (
            let i = 0;
            i < buffer.length;
            i++
        ) {

            if (
                buffer[i] === 0x22 &&
                i + 1 <
                buffer.length &&
                (
                    buffer[i + 1] === 0 ||
                    buffer[i + 1] === 1
                )
            ) {

                start =
                    i;

                break;
            }
        }


        /*
           Brak ramki.
        */

        if (
            start === -1
        ) {

            buffer =
                buffer.slice(
                    Math.max(
                        0,
                        buffer.length - 1
                    )
                );

            return;
        }


        /*
           Usuwamy śmieci
           przed ramką.
        */

        if (
            start > 0
        ) {

            buffer =
                buffer.slice(
                    start
                );
        }


        /*
           Czekamy na całą ramkę.
        */

        if (
            buffer.length < 14
        ) {

            return;
        }


        /*
           14 bajtów.
        */

        const frame =
            buffer.slice(
                0,
                14
            );


        buffer =
            buffer.slice(
                14
            );


        decodeFrame(
            frame
        );
    }
}


/* ==================================================
   ODBIÓR BLE
================================================== */

function onNotification(event) {

    const value =
        event.target.value;


    if (
        !value
    ) {

        return;
    }


    const bytes =
        new Uint8Array(
            value.buffer,
            value.byteOffset,
            value.byteLength
        );


    parseBLEChunk(
        bytes
    );
}


/* ==================================================
   POŁĄCZENIE TRIKI
================================================== */

connectButton.addEventListener(
    "click",
    async () => {

        try {

            if (
                !navigator.bluetooth
            ) {

                status.textContent =
                    "❌ Web Bluetooth nie jest dostępny.";

                return;
            }


            status.textContent =
                "🔍 Wybierz TRIKI...";


            device =
                await navigator.bluetooth
                    .requestDevice({

                        filters: [

                            {
                                namePrefix:
                                    "TRIKI"
                            },

                            {
                                namePrefix:
                                    "Triki"
                            }

                        ],

                        optionalServices: [
                            NUS_SERVICE
                        ]
                    });


            status.textContent =
                "🔗 Łączenie...";


            gatt =
                await device.gatt.connect();


            const service =
                await gatt
                    .getPrimaryService(
                        NUS_SERVICE
                    );


            rx =
                await service
                    .getCharacteristic(
                        NUS_RX
                    );


            tx =
                await service
                    .getCharacteristic(
                        NUS_TX
                    );


            await tx
                .startNotifications();


            tx.addEventListener(
                "characteristicvaluechanged",
                onNotification
            );


            buffer =
                new Uint8Array(0);


            setButtonInput(
                "device",
                false
            );


            /*
               Start IMU.
            */

            await rx.writeValue(
                START_COMMAND
            );


            status.textContent =
                "🟢 TRIKI POŁĄCZONE";


            device.addEventListener(
                "gattserverdisconnected",
                () => {

                    setButtonInput(
                        "device",
                        false
                    );

                    status.textContent =
                        "🔴 TRIKI ROZŁĄCZONE";
                }
            );


        }

        catch (
            error
        ) {

            console.error(
                error
            );


            status.textContent =
                "❌ " +
                error.message;
        }
    }
);


