---
title: Slave
description: Auto-generated API summary from Doxygen XML.
---

> Auto-generated. Do not edit manually.

- Module: `slave`
- Doxygen XML: `/Volumes/Programming/htwk/charging-station/docs/generated/doxygen/slave/xml`
- Generated at: `2026-02-26T01:40:44Z`

## Functions

### `BeaconTracker`

- `BeaconTracker(const BeaconTrackerConfig &config=BeaconTrackerConfig())` (`slave/src/beacon_tracker.h:46`)
- `clampf(float value, float low, float high)` (`slave/src/beacon_tracker.h:63`)
- `extendGuard(uint32_t now, uint16_t holdMs)` (`slave/src/beacon_tracker.h:66`)
- `guardActive(uint32_t now) const` (`slave/src/beacon_tracker.h:67`)
- `isBefore(uint32_t now, uint32_t deadline)` (`slave/src/beacon_tracker.h:64`)
- `median3(uint32_t a, uint32_t b, uint32_t c)` (`slave/src/beacon_tracker.h:62`)
- `pushAndMedian(ChannelHistory &history, uint32_t value)` (`slave/src/beacon_tracker.h:65`)
- `reset()` (`slave/src/beacon_tracker.h:53`)
- `state() const` (`slave/src/beacon_tracker.h:52`)
- `update(uint32_t rawFront, uint32_t rawBack, uint32_t rawLeft, uint32_t rawRight, uint32_t timestampMs)` (`slave/src/beacon_tracker.h:48`)

### `IRValue`

- `get() const` (`slave/src/ir_value.h:31`)
- `IRValue()` (`slave/src/ir_value.h:13`)
- `IRValue(uint8_t maxCounter)` (`slave/src/ir_value.h:14`)
- `update(uint32_t v)` (`slave/src/ir_value.h:16`)

### `main.cpp`

- `applyMotorDuties(Slave *slave, uint16_t leftDuty, uint16_t rightDuty)` (`slave/src/main.cpp:99`)
- `beginNavigation(Slave *slave, uint32_t now)` (`slave/src/main.cpp:133`)
- `driveSearch(Slave *slave, uint32_t now)` (`slave/src/main.cpp:174`)
- `driveTracking(Slave *slave, const BeaconTrackerState &state)` (`slave/src/main.cpp:204`)
- `logNavigation(Slave *slave, const MasterData &master, const BeaconTrackerState &state, bool searchMode)` (`slave/src/main.cpp:228`)
- `loop()` (`slave/src/main.cpp:372`)
- `reachedArrival(const BeaconTrackerState &state)` (`slave/src/main.cpp:223`)
- `resetNavigation(Slave *slave)` (`slave/src/main.cpp:114`)
- `setup()` (`slave/src/main.cpp:349`)
- `shouldRunControl(uint32_t now)` (`slave/src/main.cpp:146`)
- `step_charge(Slave *slave, MasterData &master)` (`slave/src/main.cpp:322`)
- `step_exit_charge(Slave *slave, MasterData &master)` (`slave/src/main.cpp:333`)
- `step_into_charge(Slave *slave, MasterData &master)` (`slave/src/main.cpp:313`)
- `step_to_charge(Slave *slave, MasterData &master)` (`slave/src/main.cpp:261`)
- `step_wait_charge(Slave *slave, MasterData &master)` (`slave/src/main.cpp:304`)
- `step_work(Slave *slave)` (`slave/src/main.cpp:252`)
- `toggleNavigationLed(Slave *slave, uint32_t now)` (`slave/src/main.cpp:160`)
- `wallJitterTerm(const BeaconTrackerState &state)` (`slave/src/main.cpp:187`)
