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

The tracker uses wrapped-angle low-pass filtering:

- `delta = wrap(theta - theta_f_prev)`
- `theta_f = wrap(theta_f_prev + alpha * delta)`

Filtering is only updated while `detected` is true.

## Default constants

Current defaults in firmware:

- `S_min = 800` (ir_meter baseline)
- `S_min = 900` (slave baseline)
- `alpha = 0.25`
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

`ir_meter` CSV output maps directly to tracker fields:

`t_ms,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,vx,vy,theta_rad,theta_deg,S,detected`
