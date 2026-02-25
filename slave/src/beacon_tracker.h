#pragma once

#include <cstdint>

struct SensorCalibration {
  float gain = 1.0f;
  float offset = 0.0f;
};

struct BeaconTrackerConfig {
  SensorCalibration front;
  SensorCalibration back;
  SensorCalibration left;
  SensorCalibration right;
  float signalMin = 800.0f;
  float angleAlpha = 0.18f;
  float maxAngleStepRad = 0.35f;
  float signalDropGuardRatio = 0.22f;
  uint16_t saturationRawThreshold = 4080;
  uint16_t guardHoldMs = 120;
};

struct BeaconTrackerState {
  uint32_t timestampMs = 0;
  uint32_t rawFront = 0;
  uint32_t rawBack = 0;
  uint32_t rawLeft = 0;
  uint32_t rawRight = 0;

  float front = 0.0f;
  float back = 0.0f;
  float left = 0.0f;
  float right = 0.0f;

  float vx = 0.0f;
  float vy = 0.0f;
  float theta = 0.0f;
  float filteredTheta = 0.0f;
  float totalSignal = 0.0f;
  bool detected = false;
  bool initialized = false;
};

class BeaconTracker {
public:
  explicit BeaconTracker(const BeaconTrackerConfig &config = BeaconTrackerConfig());

  const BeaconTrackerState &update(uint32_t rawFront, uint32_t rawBack,
                                   uint32_t rawLeft, uint32_t rawRight,
                                   uint32_t timestampMs);

  const BeaconTrackerState &state() const;
  void reset();

private:
  struct ChannelHistory {
    uint32_t values[3] = {0, 0, 0};
    uint8_t count = 0;
    uint8_t index = 0;
  };

  static uint32_t median3(uint32_t a, uint32_t b, uint32_t c);
  static float clampf(float value, float low, float high);
  static bool isBefore(uint32_t now, uint32_t deadline);
  uint32_t pushAndMedian(ChannelHistory &history, uint32_t value);
  bool extendGuard(uint32_t now, uint16_t holdMs);
  bool guardActive(uint32_t now) const;

  BeaconTrackerConfig config_;
  BeaconTrackerState state_;
  ChannelHistory historyFront_;
  ChannelHistory historyBack_;
  ChannelHistory historyLeft_;
  ChannelHistory historyRight_;
  float previousSignal_ = 0.0f;
  uint32_t guardUntilMs_ = 0;
};
