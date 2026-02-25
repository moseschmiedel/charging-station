---
title: Beacon Tracking + Drive Control
description: End-to-end approach for IR beacon tracking, bearing estimation, and motor control.
sidebar:
  order: 2
---

## Goal

Implement a closed-loop pipeline:

`IR beacon -> demodulated amplitudes -> bearing estimate -> drive commands -> beacon centering`

## Signal assumptions

Firmware assumes the receiver path already produces four slow amplitude values:

- `A_F` (front)
- `A_B` (back)
- `A_L` (left)
- `A_R` (right)

The expected analog chain is:

`Photodiode -> TIA -> band-pass (around carrier) -> envelope detector -> low-pass -> ADC`

Carrier is continuous at **10 kHz** in this phase.

## Tracker equations

For each sensor `i`, calibrated amplitude is:

`A_i = max(0, gain_i * (raw_i - offset_i))`

Bearing vector:

- `vx = A_F - A_B`
- `vy = A_L - A_R`

Angle and total signal:

- `theta = atan2(vy, vx)`
- `S = A_F + A_B + A_L + A_R`
- `detected = (S >= S_min)`

`theta` is low-pass filtered with wrapped-angle blending to reduce jitter.
The runtime tracker also adds a 3-sample median prefilter and a short guard hold
window during saturation or abrupt `S` drops to suppress one-sample bearing spikes.

## Control law

When beacon is detected:

- `w = clamp(Kp * theta_f, -w_max, w_max)`
- `u = u_max * max(0, cos(theta_f))`
- if `|theta_f| > pi/2`, force `u = 0`
- `mL = clamp(u + w, 0, 1)`
- `mR = clamp(u - w, 0, 1)`

Motor commands include dead-zone compensation before PWM duty is applied.

When beacon is not detected, the slave executes a slow spin search and periodically flips spin direction.

## Arrival criteria

The slave reports arrival when all conditions are true:

- beacon detected
- `S >= S_arrive`
- front channel is dominant

This prevents side-lock while still allowing approach to converge.

## Validation flow

1. Flash and run `ir_meter`.
2. Verify `theta` sign and magnitude for front/left/right/back placements.
3. Tune compile-time gains/offsets and `S_min`.
4. Tune anti-spike constants:
   `alpha`, `maxAngleStepRad`, `signalDropGuardRatio`, `guardHoldMs`,
   `saturationRawThreshold`.
5. Flash and run `slave`.
6. Tune `Kp`, `u_max`, dead-zone, and `S_arrive`.
7. Confirm search behavior and reacquisition after temporary signal loss.

## CSV telemetry (`ir_meter`)

`ir_meter` prints one CSV line per sample (20 ms target):

`t_ms,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,vx,vy,theta_rad,theta_deg,S,detected`

Use this as the baseline for plotting and calibration.
