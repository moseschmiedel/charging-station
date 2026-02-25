---
title: Beacon Tracking
description: Reference for beacon estimator equations, constants, and state fields.
sidebar:
  order: 2
---

## Inputs

Tracker consumes four ADC channels each update:

- `rawFront`
- `rawBack`
- `rawLeft`
- `rawRight`

## Calibration model

Each channel has compile-time calibration constants:

- `gain`
- `offset`

Calibrated amplitude:

`A_i = max(0, gain_i * (raw_i - offset_i))`

## Derived values

- `vx = A_F - A_B`
- `vy = A_L - A_R`
- `theta = atan2(vy, vx)` (radians)
- `S = A_F + A_B + A_L + A_R`
- `detected = (S >= S_min)`

## Filtering

The tracker applies three filtering/guard stages:

1. 3-sample median prefilter on each raw channel before calibration.
2. Wrapped-angle low-pass filtering:
   - `delta = wrap(theta - theta_f_prev)`
   - `delta_bounded = clamp(delta, -maxAngleStepRad, +maxAngleStepRad)`
   - `theta_f = wrap(theta_f_prev + alpha * delta_bounded)`
3. Spike guard hold: freeze `theta_f` updates for a short window if:
   - any raw channel is near ADC full scale (`raw_i >= saturationRawThreshold`), or
   - `S` drops abruptly (`(S_prev - S) / S_prev >= signalDropGuardRatio`).

`theta_f` is only updated while `detected` is true and guard hold is inactive.

## Default constants

Current defaults in firmware:

- `S_min = 800` (ir_meter baseline)
- `S_min = 900` (slave baseline)
- `alpha = 0.18`
- `maxAngleStepRad = 0.35`
- `signalDropGuardRatio = 0.22`
- `saturationRawThreshold = 4080`
- `guardHoldMs = 120`
- per-channel `gain = 1.0`, `offset = 0.0`

These are intended as initial values for bench tuning.

## Tracker state fields

`BeaconTrackerState` contains:

- `timestampMs`
- raw channels: `rawFront`, `rawBack`, `rawLeft`, `rawRight`
- calibrated channels: `front`, `back`, `left`, `right`
- `vx`, `vy`
- `theta` (unfiltered)
- `filteredTheta`
- `totalSignal`
- `detected`

## Telemetry mapping

`ir_meter` CSV output fields:

`t_ms,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,vx,vy,theta_rad,theta_deg,S,detected`

Notes:

- `theta_rad` and `theta_deg` are emitted from `filteredTheta` (not raw `theta`).
- Raw `theta` remains available inside `BeaconTrackerState` for internal diagnostics.
