#include "beacon_tracker.h"
#include <Arduino.h>
#include <Dezibot.h>
#include <autocharge/Autocharge.hpp>
#include <cmath>

auto dezibot = Dezibot();
BeaconTrackerConfig trackerConfig;
BeaconTracker tracker;

constexpr uint32_t LOOP_PERIOD_MS = 20;
constexpr float RADIANS_TO_DEG = 57.29577951308232f;

constexpr float TRACKER_SIGNAL_MIN = 800.0f;
constexpr float TRACKER_ANGLE_ALPHA = 0.18f;
constexpr float TRACKER_MAX_ANGLE_STEP_RAD = 0.35f;
constexpr float TRACKER_SIGNAL_DROP_GUARD_RATIO = 0.22f;
constexpr uint16_t TRACKER_SATURATION_RAW_THRESHOLD = 4080;
constexpr uint16_t TRACKER_GUARD_HOLD_MS = 120;

uint32_t nextLoopAtMs = 0;

void setup() {
  delay(2000);
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println("+---------------------------+");
  Serial.println("| Charging Station IR Meter |");
  Serial.println("+---------------------------+");
  Serial.println();
  dezibot.begin();
  trackerConfig.signalMin = TRACKER_SIGNAL_MIN;
  trackerConfig.angleAlpha = TRACKER_ANGLE_ALPHA;
  trackerConfig.maxAngleStepRad = TRACKER_MAX_ANGLE_STEP_RAD;
  trackerConfig.signalDropGuardRatio = TRACKER_SIGNAL_DROP_GUARD_RATIO;
  trackerConfig.saturationRawThreshold = TRACKER_SATURATION_RAW_THRESHOLD;
  trackerConfig.guardHoldMs = TRACKER_GUARD_HOLD_MS;
  tracker = BeaconTracker(trackerConfig);
  nextLoopAtMs = millis();
  Serial.println(
      "t_ms,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,vx,vy,theta_rad,theta_deg,S,"
      "detected");
  Serial.println("Setup complete");
}

void loop() {
  const uint32_t now = millis();
  if (static_cast<int32_t>(now - nextLoopAtMs) < 0) {
    return;
  }

  nextLoopAtMs += LOOP_PERIOD_MS;
  if (static_cast<int32_t>(now - nextLoopAtMs) > static_cast<int32_t>(LOOP_PERIOD_MS)) {
    nextLoopAtMs = now + LOOP_PERIOD_MS;
  }

  const uint32_t rawFront = dezibot.lightDetection.getValue(IR_FRONT);
  const uint32_t rawBack = dezibot.lightDetection.getValue(IR_BACK);
  const uint32_t rawLeft = dezibot.lightDetection.getValue(IR_LEFT);
  const uint32_t rawRight = dezibot.lightDetection.getValue(IR_RIGHT);
  const BeaconTrackerState &state =
      tracker.update(rawFront, rawBack, rawLeft, rawRight, now);

  Serial.printf(
      "%lu,%lu,%lu,%lu,%lu,%.1f,%.1f,%.1f,%.1f,%.1f,%.1f,%.4f,%.2f,%.1f,%u\n",
      static_cast<unsigned long>(state.timestampMs),
      static_cast<unsigned long>(state.rawFront),
      static_cast<unsigned long>(state.rawBack),
      static_cast<unsigned long>(state.rawLeft),
      static_cast<unsigned long>(state.rawRight), state.front, state.back,
      state.left, state.right, state.vx, state.vy, state.filteredTheta,
      state.filteredTheta * RADIANS_TO_DEG, state.totalSignal,
      static_cast<unsigned>(state.detected ? 1 : 0));
}
