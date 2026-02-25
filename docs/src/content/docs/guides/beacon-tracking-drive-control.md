---
title: Beacon Tracking + Drive Control
description: End-to-end approach for IR beacon tracking, bearing estimation, and motor control.
sidebar:
  order: 2
---

## Goal

Implement a closed-loop pipeline:

$$
\text{IR beacon} \rightarrow \text{demodulated amplitudes} \rightarrow \text{bearing estimate} \rightarrow \text{drive commands} \rightarrow \text{beacon centering}
$$

## Signal assumptions

Firmware assumes the receiver path already produces four slow amplitude values:

- $A_F$ (front)
- $A_B$ (back)
- $A_L$ (left)
- $A_R$ (right)

The expected analog chain is:

$$
\text{Photodiode} \rightarrow \text{TIA} \rightarrow \text{band-pass (around carrier)} \rightarrow \text{envelope detector} \rightarrow \text{low-pass} \rightarrow \text{ADC}
$$

Carrier is continuous at **10 kHz** in this phase.

## Tracker equations

For each sensor $i$, calibrated amplitude is:

$$
A_i = \max\!\left(0, \mathrm{gain}_i \cdot (\mathrm{raw}_i - \mathrm{offset}_i)\right)
$$

Bearing vector:

- $v_x = A_F - A_B$
- $v_y = A_L - A_R$

Angle and total signal:

- $\theta = \operatorname{atan2}(v_y, v_x)$
- $S = A_F + A_B + A_L + A_R$
- $\mathrm{detected} = (S \ge S_{\min})$

$\theta$ is low-pass filtered with wrapped-angle blending to reduce jitter.
The runtime tracker also adds a 3-sample median prefilter and a short guard hold
window during saturation or abrupt $S$ drops to suppress one-sample bearing spikes.

## Control law

When beacon is detected:

- $w = \operatorname{clamp}(K_p \cdot \theta_f,\,-w_{\max},\,w_{\max})$
- $u = u_{\max} \cdot \max(0, \cos(\theta_f))$
- if $|\theta_f| > \pi/2$, force $u = 0$
- $m_L = \operatorname{clamp}(u + w,\,0,\,1)$
- $m_R = \operatorname{clamp}(u - w,\,0,\,1)$

Motor commands include dead-zone compensation before PWM duty is applied.

When beacon is not detected, the slave executes a slow spin search and periodically flips spin direction.

## Arrival criteria

The slave reports arrival when all conditions are true:

- beacon detected
- $S \ge S_{\mathrm{arrive}}$
- front channel is dominant

This prevents side-lock while still allowing approach to converge.

## Validation flow

1. Flash and run `ir_meter`.
2. Verify $\theta$ sign and magnitude for front/left/right/back placements.
3. Tune compile-time gains/offsets and $S_{\min}$.
4. Tune anti-spike constants:
   $\alpha$, $\mathrm{maxAngleStepRad}$, $\mathrm{signalDropGuardRatio}$,
   $\mathrm{guardHoldMs}$, $\mathrm{saturationRawThreshold}$.
5. Flash and run `slave`.
6. Tune $K_p$, $u_{\max}$, dead-zone, and $S_{\mathrm{arrive}}$.
7. Confirm search behavior and reacquisition after temporary signal loss.

## CSV telemetry (`ir_meter`)

`ir_meter` prints one CSV line per sample (20 ms target):

`t_ms,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,vx,vy,theta_rad,theta_deg,S,detected`

Use this as the baseline for plotting and calibration.
