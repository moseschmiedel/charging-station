#include "beacon_tracker.h"
#include <Arduino.h>
#include <Dezibot.h>
#include <autocharge/Autocharge.hpp>
#include <cmath>

namespace {
constexpr uint32_t CONTROL_PERIOD_MS = 20;
constexpr uint32_t LED_TOGGLE_PERIOD_MS = 500;
constexpr uint32_t SEARCH_FLIP_PERIOD_MS = 1500;
constexpr uint32_t NAV_LOG_PERIOD_MS = 200;

constexpr float THETA_ALPHA = 0.18f;
constexpr float THETA_MAX_STEP_RAD = 0.35f;
constexpr float SIGNAL_MIN = 900.0f;
constexpr float SIGNAL_ARRIVE = 6000.0f;
constexpr float SIGNAL_DROP_GUARD_RATIO = 0.22f;
constexpr uint16_t SATURATION_RAW_THRESHOLD = 4080;
constexpr uint16_t TRACKER_GUARD_HOLD_MS = 120;
constexpr float KP_THETA = 0.70f;
constexpr float W_MAX = 0.65f;
constexpr float U_MAX = 0.75f;
constexpr float HALF_PI_RAD = 1.57079632679489661923f;

constexpr uint16_t DUTY_DEADZONE = 3300;
constexpr uint16_t DUTY_MAX = 4600;
constexpr uint16_t DUTY_SEARCH = 3560;
constexpr uint16_t DUTY_QUANTIZE_STEP = 40;

float clampf(float value, float low, float high) {
  if (value < low) {
    return low;
  }
  if (value > high) {
    return high;
  }
  return value;
}

uint16_t quantizeDuty(uint16_t duty) {
  if (duty == 0) {
    return 0;
  }

  if (duty > DUTY_MAX) {
    duty = DUTY_MAX;
  }

  uint16_t quantized =
      static_cast<uint16_t>(((duty + (DUTY_QUANTIZE_STEP / 2)) /
                             DUTY_QUANTIZE_STEP) *
                            DUTY_QUANTIZE_STEP);

  if (quantized < DUTY_DEADZONE) {
    quantized = DUTY_DEADZONE;
  }
  if (quantized > DUTY_MAX) {
    quantized = DUTY_MAX;
  }

  return quantized;
}

uint16_t mapNormalizedToDuty(float normalized) {
  if (normalized <= 0.0f) {
    return 0;
  }

  normalized = clampf(normalized, 0.0f, 1.0f);
  const float duty =
      static_cast<float>(DUTY_DEADZONE) +
      normalized * static_cast<float>(DUTY_MAX - DUTY_DEADZONE);
  return quantizeDuty(static_cast<uint16_t>(duty));
}

bool isFrontDominant(const BeaconTrackerState &state) {
  return state.front >= state.back && state.front >= state.left &&
         state.front >= state.right;
}
} // namespace

BeaconTrackerConfig trackerConfig;
BeaconTracker tracker;

bool navigationActive = false;
bool ledsOn = false;
bool searchClockwise = true;
uint16_t lastLeftDuty = 0;
uint16_t lastRightDuty = 0;
uint32_t nextControlAtMs = 0;
uint32_t lastLedToggleAtMs = 0;
uint32_t lastSearchFlipAtMs = 0;
uint32_t lastLogAtMs = 0;

void applyMotorDuties(Slave *slave, uint16_t leftDuty, uint16_t rightDuty) {
  leftDuty = quantizeDuty(leftDuty);
  rightDuty = quantizeDuty(rightDuty);

  if (leftDuty != lastLeftDuty) {
    slave->motion.left.setSpeed(leftDuty);
    lastLeftDuty = leftDuty;
  }

  if (rightDuty != lastRightDuty) {
    slave->motion.right.setSpeed(rightDuty);
    lastRightDuty = rightDuty;
  }
}

void resetNavigation(Slave *slave) {
  if (navigationActive || lastLeftDuty != 0 || lastRightDuty != 0) {
    slave->motion.stop();
  }

  tracker.reset();
  navigationActive = false;
  ledsOn = false;
  searchClockwise = true;
  nextControlAtMs = 0;
  lastLedToggleAtMs = 0;
  lastSearchFlipAtMs = 0;
  lastLogAtMs = 0;
  lastLeftDuty = 0;
  lastRightDuty = 0;
}

void beginNavigation(Slave *slave, uint32_t now) {
  resetNavigation(slave);
  navigationActive = true;
  ledsOn = true;
  searchClockwise = true;
  nextControlAtMs = now;
  lastLedToggleAtMs = now;
  lastSearchFlipAtMs = now;
  lastLogAtMs = now;
  slave->multiColorLight.setTopLeds(YELLOW);
}

bool shouldRunControl(uint32_t now) {
  if (static_cast<int32_t>(now - nextControlAtMs) < 0) {
    return false;
  }

  nextControlAtMs += CONTROL_PERIOD_MS;
  if (static_cast<int32_t>(now - nextControlAtMs) >
      static_cast<int32_t>(CONTROL_PERIOD_MS)) {
    nextControlAtMs = now + CONTROL_PERIOD_MS;
  }

  return true;
}

void toggleNavigationLed(Slave *slave, uint32_t now) {
  if (now - lastLedToggleAtMs < LED_TOGGLE_PERIOD_MS) {
    return;
  }

  if (ledsOn) {
    slave->multiColorLight.turnOffLed(TOP);
  } else {
    slave->multiColorLight.setTopLeds(YELLOW);
  }
  ledsOn = !ledsOn;
  lastLedToggleAtMs = now;
}

void driveSearch(Slave *slave, uint32_t now) {
  if (now - lastSearchFlipAtMs >= SEARCH_FLIP_PERIOD_MS) {
    searchClockwise = !searchClockwise;
    lastSearchFlipAtMs = now;
  }

  if (searchClockwise) {
    applyMotorDuties(slave, 0, DUTY_SEARCH);
  } else {
    applyMotorDuties(slave, DUTY_SEARCH, 0);
  }
}

void driveTracking(Slave *slave, const BeaconTrackerState &state) {
  const float theta = state.filteredTheta;
  const float w = clampf(KP_THETA * theta, -W_MAX, W_MAX);

  float u = U_MAX * std::fmax(0.0f, std::cos(theta));
  if (std::fabs(theta) > HALF_PI_RAD) {
    u = 0.0f;
  }

  const float mLeft = clampf(u + w, 0.0f, 1.0f);
  const float mRight = clampf(u - w, 0.0f, 1.0f);

  applyMotorDuties(slave, mapNormalizedToDuty(mLeft), mapNormalizedToDuty(mRight));
}

bool reachedArrival(const BeaconTrackerState &state) {
  return state.detected && state.totalSignal >= SIGNAL_ARRIVE &&
         isFrontDominant(state);
}

void logNavigation(Slave *slave, const MasterData &master,
                   const BeaconTrackerState &state, bool searchMode) {
  char payload[224];
  snprintf(payload, sizeof(payload),
           "beacon_nav,%lu,%s,%lu,%lu,%lu,%lu,%.1f,%.1f,%.1f,%.1f,%.2f,%.1f,%u,%u,%u",
           static_cast<unsigned long>(state.timestampMs),
           searchMode ? "search" : "track",
           static_cast<unsigned long>(state.rawFront),
           static_cast<unsigned long>(state.rawBack),
           static_cast<unsigned long>(state.rawLeft),
           static_cast<unsigned long>(state.rawRight), state.front, state.back,
           state.left, state.right, state.filteredTheta * 57.29577951308232f,
           state.totalSignal, static_cast<unsigned>(state.detected ? 1 : 0),
           static_cast<unsigned>(lastLeftDuty), static_cast<unsigned>(lastRightDuty));

  Serial.printf(
      "%s\n", payload);

  String meshMessage = "log:";
  meshMessage += payload;
  slave->communication.unicast(master.id, meshMessage);
}

void step_work(Slave *slave) {
  resetNavigation(slave);
  Serial.printf("Execute 'step_work' for slave %u\n",
                slave->communication.getNodeId());
  slave->requestCharge();
  slave->multiColorLight.setTopLeds(RED);
  delay(3000);
}

bool step_to_charge(Slave *slave, MasterData &master) {
  (void)master;

  const uint32_t now = millis();
  if (!navigationActive) {
    beginNavigation(slave, now);
  }

  toggleNavigationLed(slave, now);
  if (!shouldRunControl(now)) {
    return false;
  }

  const uint32_t rawFront = slave->lightDetection.getValue(IR_FRONT);
  const uint32_t rawBack = slave->lightDetection.getValue(IR_BACK);
  const uint32_t rawLeft = slave->lightDetection.getValue(IR_LEFT);
  const uint32_t rawRight = slave->lightDetection.getValue(IR_RIGHT);

  const BeaconTrackerState &state =
      tracker.update(rawFront, rawBack, rawLeft, rawRight, now);

  bool searchMode = false;
  if (state.detected) {
    driveTracking(slave, state);
  } else {
    driveSearch(slave, now);
    searchMode = true;
  }

  if (now - lastLogAtMs >= NAV_LOG_PERIOD_MS) {
    logNavigation(slave, master, state, searchMode);
    lastLogAtMs = now;
  }

  if (reachedArrival(state)) {
    resetNavigation(slave);
    slave->multiColorLight.turnOffLed(TOP);
    return true;
  }

  return false;
}

void step_wait_charge(Slave *slave, MasterData &master) {
  (void)master;
  resetNavigation(slave);
  slave->multiColorLight.setTopLeds(YELLOW);
  delay(3000);
}

bool requestedStop = false;

bool step_into_charge(Slave *slave, MasterData &master) {
  (void)master;
  resetNavigation(slave);
  slave->multiColorLight.blink(3, GREEN, TOP, 1000);
  slave->multiColorLight.turnOffLed(TOP);
  requestedStop = false;
  return true;
}

void step_charge(Slave *slave, MasterData &master) {
  (void)master;
  resetNavigation(slave);
  slave->multiColorLight.setTopLeds(GREEN);
  delay(15000); // the dezibot should wait here until it is charged full
  if (!requestedStop) {
    slave->requestStopCharge();
    requestedStop = true;
  }
}

bool step_exit_charge(Slave *slave, MasterData &master) {
  (void)master;
  resetNavigation(slave);
  slave->multiColorLight.blink(3, RED, TOP, 1000);
  slave->multiColorLight.turnOffLed(TOP);
  delay(3000);
  return true;
}

auto chargingSlaves = Fifo<SlaveData *>();
auto master = MasterData(4200495964);

Slave slave =
    Slave(SlaveState::WORK, master, step_work, step_to_charge, step_wait_charge,
          step_into_charge, step_charge, step_exit_charge);

void setup() {
  delay(2000);
  Serial.begin(115200);
  Serial.println("+------------------------+");
  Serial.println("| Charging Station Slave |");
  Serial.println("+------------------------+");
  Serial.println();

  slave.begin();
  trackerConfig.signalMin = SIGNAL_MIN;
  trackerConfig.angleAlpha = THETA_ALPHA;
  trackerConfig.maxAngleStepRad = THETA_MAX_STEP_RAD;
  trackerConfig.signalDropGuardRatio = SIGNAL_DROP_GUARD_RATIO;
  trackerConfig.saturationRawThreshold = SATURATION_RAW_THRESHOLD;
  trackerConfig.guardHoldMs = TRACKER_GUARD_HOLD_MS;
  tracker = BeaconTracker(trackerConfig);

  Serial.println(
      "beacon_nav,t_ms,mode,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,"
      "theta_deg,S,detected,duty_l,duty_r");
  Serial.println("Setup complete");
  slave.multiColorLight.setTopLeds(RED);
}

void loop() { slave.step(); }
