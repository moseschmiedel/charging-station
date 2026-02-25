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

$$
A_i = \max\!\left(0, \mathrm{gain}_i \cdot (\mathrm{raw}_i - \mathrm{offset}_i)\right)
$$

## Derived values

- $v_x = A_F - A_B$
- $v_y = A_L - A_R$
- $\theta = \operatorname{atan2}(v_y, v_x)$ (radians)
- $S = A_F + A_B + A_L + A_R$
- $\mathrm{detected} = (S \ge S_{\min})$

## Filtering

The tracker applies three filtering/guard stages:

1. 3-sample median prefilter on each raw channel before calibration.
2. Wrapped-angle low-pass filtering:
   - $\Delta = \operatorname{wrap}(\theta - \theta_{f,\mathrm{prev}})$
   - $\Delta_{\mathrm{bounded}} = \operatorname{clamp}(\Delta,\,-\mathrm{maxAngleStepRad},\,+\mathrm{maxAngleStepRad})$
   - $\theta_f = \operatorname{wrap}(\theta_{f,\mathrm{prev}} + \alpha \cdot \Delta_{\mathrm{bounded}})$
3. Spike guard hold: freeze $\theta_f$ updates for a short window if:
   - any raw channel is near ADC full scale ($\mathrm{raw}_i \ge \mathrm{saturationRawThreshold}$), or
   - $S$ drops abruptly ($\frac{S_{\mathrm{prev}} - S}{S_{\mathrm{prev}}} \ge \mathrm{signalDropGuardRatio}$).

$\theta_f$ is only updated while $\mathrm{detected}$ is true and guard hold is inactive.

## Default constants

Current defaults in firmware:

- $S_{\min} = 800$ (ir_meter baseline)
- $S_{\min} = 900$ (slave baseline)
- $\alpha = 0.18$
- $\mathrm{maxAngleStepRad} = 0.35$
- $\mathrm{signalDropGuardRatio} = 0.22$
- $\mathrm{saturationRawThreshold} = 4080$
- $\mathrm{guardHoldMs} = 120$
- per-channel $\mathrm{gain}=1.0$, $\mathrm{offset}=0.0$

These are intended as initial values for bench tuning.

## Tracker state fields

`BeaconTrackerState` contains:

- `timestampMs`
- raw channels: `rawFront`, `rawBack`, `rawLeft`, `rawRight`
- calibrated channels: `front`, `back`, `left`, `right`
- $v_x$, $v_y$
- $\theta$ (unfiltered)
- `filteredTheta`
- `totalSignal`
- `detected`

## Telemetry mapping

`ir_meter` CSV output fields:

`t_ms,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,vx,vy,theta_rad,theta_deg,S,detected`

Notes:

- `theta_rad` and `theta_deg` are emitted from `filteredTheta` (not raw $\theta$).
- Raw $\theta$ remains available inside `BeaconTrackerState` for internal diagnostics.
