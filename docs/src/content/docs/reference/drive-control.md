---
title: Drive Control
description: Reference for slave control law, motor mapping, and arrival/search behavior.
sidebar:
  order: 3
---

## Control update

Drive control runs at a fixed period in `slave` firmware (20 ms target).

Inputs are taken from `BeaconTrackerState`.

## Controller

With filtered angle `theta_f`:

- `w = clamp(Kp * theta_f, -w_max, w_max)`
- `u = u_max * max(0, cos(theta_f))`
- if `|theta_f| > pi/2`, `u = 0`
- `mL = clamp(u + w, 0, 1)`
- `mR = clamp(u - w, 0, 1)`

`mL` and `mR` are normalized motor commands in `[0, 1]`.

## Dead-zone compensation

Normalized commands are mapped to PWM duty:

- `0 -> 0` (off)
- `(0,1] -> [duty_deadzone, duty_max]`

Duties are quantized to avoid tiny duty steps and unstable low-level drive.

## Search behavior

If `detected == false`, slave enters search mode:

- slow spin on one side
- periodic direction flip to avoid deadlock

Search exits immediately when valid beacon detection returns.

## Arrival condition

Navigation step returns success when all are true:

- `detected == true`
- `S >= S_arrive`
- front channel is dominant

This condition feeds the existing autocharge state machine without protocol changes.

## Baseline tuning constants

Current firmware defaults:

- `Kp = 0.70`
- `w_max = 0.65`
- `u_max = 0.75`
- `S_arrive = 6000`
- `duty_deadzone = 3300`
- `duty_max = 4600`
- `search_duty = 3560`

Treat these as starting values and tune on hardware.
