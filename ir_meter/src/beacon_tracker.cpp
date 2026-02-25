#include "beacon_tracker.h"

#include <cmath>

namespace {
constexpr float kPi = 3.14159265358979323846f;
constexpr float kTwoPi = 2.0f * kPi;

float wrapAngle(float angle) {
  while (angle > kPi) {
    angle -= kTwoPi;
  }
  while (angle < -kPi) {
    angle += kTwoPi;
  }
  return angle;
}

float calibrate(uint32_t raw, const SensorCalibration &calibration) {
  const float adjusted =
      (static_cast<float>(raw) - calibration.offset) * calibration.gain;
  return adjusted > 0.0f ? adjusted : 0.0f;
}
} // namespace

BeaconTracker::BeaconTracker(const BeaconTrackerConfig &config)
    : config_(config), state_() {}

uint32_t BeaconTracker::median3(uint32_t a, uint32_t b, uint32_t c) {
  if ((a <= b && b <= c) || (c <= b && b <= a)) {
    return b;
  }
  if ((b <= a && a <= c) || (c <= a && a <= b)) {
    return a;
  }
  return c;
}

float BeaconTracker::clampf(float value, float low, float high) {
  if (value < low) {
    return low;
  }
  if (value > high) {
    return high;
  }
  return value;
}

bool BeaconTracker::isBefore(uint32_t now, uint32_t deadline) {
  return static_cast<int32_t>(now - deadline) < 0;
}

uint32_t BeaconTracker::pushAndMedian(ChannelHistory &history, uint32_t value) {
  history.values[history.index] = value;
  history.index = (history.index + 1U) % 3U;
  if (history.count < 3U) {
    history.count++;
  }

  if (history.count < 3U) {
    return value;
  }

  return median3(history.values[0], history.values[1], history.values[2]);
}

bool BeaconTracker::extendGuard(uint32_t now, uint16_t holdMs) {
  const uint32_t deadline = now + static_cast<uint32_t>(holdMs);
  if (isBefore(guardUntilMs_, deadline)) {
    guardUntilMs_ = deadline;
  }
  return guardActive(now);
}

bool BeaconTracker::guardActive(uint32_t now) const {
  return isBefore(now, guardUntilMs_);
}

const BeaconTrackerState &BeaconTracker::update(uint32_t rawFront,
                                                uint32_t rawBack,
                                                uint32_t rawLeft,
                                                uint32_t rawRight,
                                                uint32_t timestampMs) {
  const uint32_t filteredRawFront = pushAndMedian(historyFront_, rawFront);
  const uint32_t filteredRawBack = pushAndMedian(historyBack_, rawBack);
  const uint32_t filteredRawLeft = pushAndMedian(historyLeft_, rawLeft);
  const uint32_t filteredRawRight = pushAndMedian(historyRight_, rawRight);

  state_.timestampMs = timestampMs;
  state_.rawFront = rawFront;
  state_.rawBack = rawBack;
  state_.rawLeft = rawLeft;
  state_.rawRight = rawRight;

  state_.front = calibrate(filteredRawFront, config_.front);
  state_.back = calibrate(filteredRawBack, config_.back);
  state_.left = calibrate(filteredRawLeft, config_.left);
  state_.right = calibrate(filteredRawRight, config_.right);

  state_.vx = state_.front - state_.back;
  state_.vy = state_.left - state_.right;
  state_.theta = std::atan2(state_.vy, state_.vx);
  state_.totalSignal = state_.front + state_.back + state_.left + state_.right;
  state_.detected = state_.totalSignal >= config_.signalMin;

  const bool saturated =
      rawFront >= config_.saturationRawThreshold ||
      rawBack >= config_.saturationRawThreshold ||
      rawLeft >= config_.saturationRawThreshold ||
      rawRight >= config_.saturationRawThreshold;

  bool dropped = false;
  if (previousSignal_ > 1.0f && state_.totalSignal < previousSignal_) {
    const float ratio = (previousSignal_ - state_.totalSignal) / previousSignal_;
    dropped = ratio >= config_.signalDropGuardRatio;
  }
  if (saturated || dropped) {
    extendGuard(timestampMs, config_.guardHoldMs);
  }
  const bool freezeHeading = guardActive(timestampMs);

  if (state_.detected) {
    if (!state_.initialized) {
      state_.filteredTheta = state_.theta;
      state_.initialized = true;
    } else if (!freezeHeading) {
      const float delta = wrapAngle(state_.theta - state_.filteredTheta);
      const float boundedDelta =
          clampf(delta, -config_.maxAngleStepRad, config_.maxAngleStepRad);
      state_.filteredTheta = wrapAngle(state_.filteredTheta +
                                       config_.angleAlpha * boundedDelta);
    }
  } else if (!state_.initialized) {
    state_.filteredTheta = 0.0f;
  }

  previousSignal_ = state_.totalSignal;

  return state_;
}

const BeaconTrackerState &BeaconTracker::state() const { return state_; }

void BeaconTracker::reset() {
  state_ = BeaconTrackerState();
  historyFront_ = ChannelHistory();
  historyBack_ = ChannelHistory();
  historyLeft_ = ChannelHistory();
  historyRight_ = ChannelHistory();
  previousSignal_ = 0.0f;
  guardUntilMs_ = 0;
}
