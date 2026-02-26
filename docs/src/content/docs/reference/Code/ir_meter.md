---
title: IR Meter
description: Auto-generated API summary from Doxygen XML.
---

> Auto-generated. Do not edit manually.

- Module: `ir_meter`
- Doxygen XML: `charging-station/docs/generated/doxygen/ir_meter/xml`
- Generated at: `2026-02-26T01:40:44Z`

## Functions

### `BeaconTracker`

- `BeaconTracker(const BeaconTrackerConfig &config=BeaconTrackerConfig())` (`ir_meter/src/beacon_tracker.h:46`)
- `clampf(float value, float low, float high)` (`ir_meter/src/beacon_tracker.h:63`)
- `extendGuard(uint32_t now, uint16_t holdMs)` (`ir_meter/src/beacon_tracker.h:66`)
- `guardActive(uint32_t now) const` (`ir_meter/src/beacon_tracker.h:67`)
- `isBefore(uint32_t now, uint32_t deadline)` (`ir_meter/src/beacon_tracker.h:64`)
- `median3(uint32_t a, uint32_t b, uint32_t c)` (`ir_meter/src/beacon_tracker.h:62`)
- `pushAndMedian(ChannelHistory &history, uint32_t value)` (`ir_meter/src/beacon_tracker.h:65`)
- `reset()` (`ir_meter/src/beacon_tracker.h:53`)
- `state() const` (`ir_meter/src/beacon_tracker.h:52`)
- `update(uint32_t rawFront, uint32_t rawBack, uint32_t rawLeft, uint32_t rawRight, uint32_t timestampMs)` (`ir_meter/src/beacon_tracker.h:48`)

### `IRValue`

- `get() const` (`ir_meter/src/ir_value.h:72`)
- `IRValue()` (`ir_meter/src/ir_value.h:53`)
- `IRValue(uint8_t maxCounter)` (`ir_meter/src/ir_value.h:54`)
- `update(uint32_t v)` (`ir_meter/src/ir_value.h:56`)

### `RingBuffer`

- `average() const` (`ir_meter/src/ir_value.h:34`)
- `push(T value)` (`ir_meter/src/ir_value.h:16`)
- `size() const` (`ir_meter/src/ir_value.h:32`)

### `main.cpp`

- `loop()` (`ir_meter/src/main.cpp:46`)
- `setup()` (`ir_meter/src/main.cpp:23`)
