#include <AccelStepper.h>
#include <Arduino.h>
#include <MultiStepper.h>
#include <Wire.h>

static const uint8_t LEFT_PIN1 = 14;
static const uint8_t LEFT_PIN2 = 27;
static const uint8_t LEFT_PIN3 = 26;
static const uint8_t LEFT_PIN4 = 25;
static const uint8_t RIGHT_PIN1 = 5;
static const uint8_t RIGHT_PIN2 = 17;
static const uint8_t RIGHT_PIN3 = 16;
static const uint8_t RIGHT_PIN4 = 4;

static const float stepsPerRevolution = 200;
static float max_rpm = 80;
static float rpm_per_sec = 10;
static int microstepSetting = 1;
static const uint8_t I2C_SLAVE_ADDRESS = 0x12;
static const int I2C_SDA_PIN = 21;
static const int I2C_SCL_PIN = 22;
static const uint32_t I2C_FREQUENCY_HZ = 100000;
static const long BRIDGE_RAISED_STEPS = 10000;
static const long BRIDGE_LOWERED_STEPS = 9500;

const uint8_t STEPPER_AMOUNT = 2;

enum class BridgeMotion : uint8_t { IDLE, LOWERING, RAISING };

long position[STEPPER_AMOUNT] = {BRIDGE_RAISED_STEPS, BRIDGE_RAISED_STEPS};

static inline float convert_rotational_position_to_steps(float rotations) {
  return rotations * stepsPerRevolution * microstepSetting;
}

static inline float max_speed_steps_per_sec(float max_rpm) {
  return microstepSetting * stepsPerRevolution * max_rpm / 60;
}

static inline float accel_steps_per_sec(float rpm_per_sec) {
  return microstepSetting * stepsPerRevolution * rpm_per_sec / 60;
}

AccelStepper stepperLeft(AccelStepper::FULL4WIRE, LEFT_PIN1, LEFT_PIN2,
                         LEFT_PIN3, LEFT_PIN4);
AccelStepper stepperRight(AccelStepper::FULL4WIRE, RIGHT_PIN1, RIGHT_PIN2,
                          RIGHT_PIN3, RIGHT_PIN4);

MultiStepper stepperMgr;

static String rx_line;
static String bridge_status = "IDLE";
static BridgeMotion bridge_motion = BridgeMotion::IDLE;

static void append_rx_char(char ch) {
  if (ch == '\r') {
    return;
  }
  rx_line += ch;
}

static void uart_receive(void) {
  while (Serial.available() > 0) {
    append_rx_char(static_cast<char>(Serial.read()));
  }
}

static void i2c_receive(int bytes_available) {
  (void)bytes_available;
  while (Wire.available() > 0) {
    append_rx_char(static_cast<char>(Wire.read()));
  }
}

static void i2c_request() { Wire.print(bridge_status); }

static void init_i2c_slave() {
  pinMode(I2C_SDA_PIN, INPUT_PULLUP);
  pinMode(I2C_SCL_PIN, INPUT_PULLUP);
  delay(2);

  bool i2c_ready = false;
  for (uint8_t attempt = 1; attempt <= 5 && !i2c_ready; ++attempt) {
    i2c_ready =
        Wire.begin(I2C_SLAVE_ADDRESS, I2C_SDA_PIN, I2C_SCL_PIN, I2C_FREQUENCY_HZ);
    if (!i2c_ready) {
      Serial.printf(
          "I2C slave init attempt %u failed (line state sda=%d scl=%d)\n",
          attempt, digitalRead(I2C_SDA_PIN), digitalRead(I2C_SCL_PIN));
      delay(50);
    }
  }

  if (!i2c_ready) {
    Serial.println("I2C slave init failed: check wiring and pull-ups");
    return;
  }

  Wire.onReceive(i2c_receive);
  Wire.onRequest(i2c_request);
  Serial.printf("I2C slave ready at 0x%02X (SDA=%d, SCL=%d)\n",
                I2C_SLAVE_ADDRESS, I2C_SDA_PIN, I2C_SCL_PIN);
}

static void start_bridge_motion(BridgeMotion motion) {
  if (motion == BridgeMotion::LOWERING) {
    position[0] = BRIDGE_LOWERED_STEPS;
    position[1] = BRIDGE_LOWERED_STEPS;
    bridge_status = "BUSY:LOWER";
    Serial.println("Bridge lowering started");
  } else {
    position[0] = BRIDGE_RAISED_STEPS;
    position[1] = BRIDGE_RAISED_STEPS;
    bridge_status = "BUSY:RAISE";
    Serial.println("Bridge raising started");
  }

  bridge_motion = motion;
  stepperMgr.moveTo(position);
}

static void process_command(const String &command_in) {
  String command = command_in;
  command.trim();
  if (command.length() == 0) {
    return;
  }

  if (command.equalsIgnoreCase("LOWER")) {
    if (bridge_motion == BridgeMotion::IDLE) {
      start_bridge_motion(BridgeMotion::LOWERING);
    }
    return;
  }

  if (command.equalsIgnoreCase("RAISE")) {
    if (bridge_motion == BridgeMotion::IDLE) {
      start_bridge_motion(BridgeMotion::RAISING);
    }
    return;
  }

  const float maybe_rpm = command.toFloat();
  if (maybe_rpm != 0.0f || command == "0" || command == "0.0") {
    max_rpm = maybe_rpm;
    Serial.printf("Change MAX RPM to %f\n", max_rpm);
    stepperLeft.setMaxSpeed(max_speed_steps_per_sec(max_rpm));
    stepperRight.setMaxSpeed(max_speed_steps_per_sec(max_rpm));
  }
}

static void update_bridge_motion() {
  if (bridge_motion == BridgeMotion::IDLE) {
    return;
  }

  if (stepperMgr.run()) {
    return;
  }

  if (bridge_motion == BridgeMotion::LOWERING) {
    bridge_status = "DONE:LOWER";
    Serial.println("Bridge lowering finished");
  } else {
    bridge_status = "DONE:RAISE";
    Serial.println("Bridge raising finished");
  }
  bridge_motion = BridgeMotion::IDLE;
}

static void home_bridge_to_top_on_boot() {
  Serial.println("Startup homing: driving bridge up to top");

  // Assume boot can happen at or below the lower stop and run one full raise
  // stroke to reach the top stop before enabling runtime commands.
  position[0] = BRIDGE_LOWERED_STEPS;
  position[1] = BRIDGE_LOWERED_STEPS;
  stepperLeft.setCurrentPosition(position[0]);
  stepperRight.setCurrentPosition(position[1]);

  start_bridge_motion(BridgeMotion::RAISING);
  while (bridge_motion != BridgeMotion::IDLE) {
    update_bridge_motion();
    delay(1);
  }

  position[0] = BRIDGE_RAISED_STEPS;
  position[1] = BRIDGE_RAISED_STEPS;
  stepperLeft.setCurrentPosition(position[0]);
  stepperRight.setCurrentPosition(position[1]);

  Serial.println("Startup homing complete: bridge at top");
}

void setup() {
  Serial.begin(115200);

  Serial.println("+------------------+");
  Serial.println("| Motor Controller |");
  Serial.println("+------------------+");

  stepperLeft.setMaxSpeed(max_speed_steps_per_sec(max_rpm));
  stepperRight.setMaxSpeed(max_speed_steps_per_sec(max_rpm));

  Serial.printf("Set Max Speed = %f\n", max_speed_steps_per_sec(max_rpm));

  stepperLeft.setAcceleration(accel_steps_per_sec(rpm_per_sec));
  stepperRight.setAcceleration(accel_steps_per_sec(rpm_per_sec));

  Serial.printf("Set Acceleration = %f\n", accel_steps_per_sec(rpm_per_sec));

  stepperMgr.addStepper(stepperLeft);
  stepperMgr.addStepper(stepperRight);
  Serial.setRxFIFOFull(3);
  Serial.onReceive(uart_receive);

  home_bridge_to_top_on_boot();

  init_i2c_slave();

  position[0] = BRIDGE_RAISED_STEPS;
  position[1] = BRIDGE_RAISED_STEPS;

  Serial.printf("Setup complete!\n");
}

void loop() {
  int newline_idx = rx_line.indexOf('\n');
  while (newline_idx >= 0) {
    String command = rx_line.substring(0, newline_idx);
    rx_line.remove(0, newline_idx + 1);
    process_command(command);
    newline_idx = rx_line.indexOf('\n');
  }

  update_bridge_motion();
}
