---
title: Motor
description: Auto-generated API summary from Doxygen XML.
---

> Auto-generated. Do not edit manually.

- Module: `motor`
- Doxygen XML: `charging-station/docs/generated/doxygen/motor/xml`
- Generated at: `2026-02-26T01:40:44Z`

## Functions

### `main.cpp`

- `accel_steps_per_sec(float rpm_per_sec)` (`motor/src/main.cpp:40`)
- `append_rx_char(char ch)` (`motor/src/main.cpp:55`)
- `convert_rotational_position_to_steps(float rotations)` (`motor/src/main.cpp:32`)
- `home_bridge_to_top_on_boot()` (`motor/src/main.cpp:171`)
- `i2c_receive(int bytes_available)` (`motor/src/main.cpp:68`)
- `i2c_request()` (`motor/src/main.cpp:75`)
- `init_i2c_slave()` (`motor/src/main.cpp:77`)
- `loop()` (`motor/src/main.cpp:227`)
- `max_speed_steps_per_sec(float max_rpm)` (`motor/src/main.cpp:36`)
- `process_command(const String &command_in)` (`motor/src/main.cpp:122`)
- `setup()` (`motor/src/main.cpp:195`)
- `start_bridge_motion(BridgeMotion motion)` (`motor/src/main.cpp:105`)
- `stepperLeft(AccelStepper::FULL4WIRE, LEFT_PIN1, LEFT_PIN2, LEFT_PIN3, LEFT_PIN4)` (`motor/src/main.cpp:44`)
- `stepperRight(AccelStepper::FULL4WIRE, RIGHT_PIN1, RIGHT_PIN2, RIGHT_PIN3, RIGHT_PIN4)` (`motor/src/main.cpp:46`)
- `uart_receive(void)` (`motor/src/main.cpp:62`)
- `update_bridge_motion()` (`motor/src/main.cpp:152`)
