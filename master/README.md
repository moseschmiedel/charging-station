# Charging Station Master Firmware

Firmware for the charging-station master node on an ESP32-S3.  
It coordinates charging requests from slave nodes using the Dezibot autocharge library.

## Build

```sh
cd charging-station/master
pio run -e esp32dev
```

## Flash and Run

```sh
cd charging-station/master
pio run -e esp32dev -t upload
```

After upload, the board resets and starts the firmware automatically.

## UART Output (Dezibot)

The firmware prints logs with `Serial.begin(115200)` and uses USB CDC on boot.

1. Connect the ESP32-S3 board via USB.
2. Find the serial port:
    ```sh
    pio device list
    ```
3. Open the UART monitor at 115200 baud:
    ```sh
    pio device monitor -p /dev/cu.usbmodemXXXX -b 115200
    ```

Alternative (uses `platformio.ini` monitor settings):

```sh
cd charging-station/master
pio run -e esp32dev -t monitor
```
