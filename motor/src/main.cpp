#include <Arduino.h>
#include <vector>
#include <AccelStepper.h>
#include <MultiStepper.h>

static const uint8_t LEFT_PIN1 = 14;
static const uint8_t LEFT_PIN2 = 27;
static const uint8_t LEFT_PIN3 = 26;
static const uint8_t LEFT_PIN4 = 25;
static const uint8_t RIGHT_PIN1 = 4;
static const uint8_t RIGHT_PIN2 = 16;
static const uint8_t RIGHT_PIN3 = 17;
static const uint8_t RIGHT_PIN4 = 5;

static const float stepsPerRevolution = 200;
static float max_rpm = 80;
static float rpm_per_sec = 10;
static int microstepSetting = 1;

const uint8_t STEPPER_AMOUNT = 2;

long position[STEPPER_AMOUNT];

static inline float convert_rotational_position_to_steps(float rotations)
{
  return rotations * stepsPerRevolution * microstepSetting;
}

static inline float max_speed_steps_per_sec(float max_rpm)
{
  return microstepSetting * stepsPerRevolution * max_rpm / 60;
}

static inline float accel_steps_per_sec(float rpm_per_sec)
{
  return microstepSetting * stepsPerRevolution * rpm_per_sec / 60;
}

AccelStepper stepperLeft(AccelStepper::FULL4WIRE, LEFT_PIN1, LEFT_PIN2, LEFT_PIN3, LEFT_PIN4);
AccelStepper stepperRight(AccelStepper::FULL4WIRE, RIGHT_PIN1, RIGHT_PIN2, RIGHT_PIN3, RIGHT_PIN4);

MultiStepper stepperMgr;

static String rx_line;
static void uart_receive(void)
{
  String str = Serial.readStringUntil('\n');
  Serial.print(str);
  rx_line.concat(str);
}

void setup()
{
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

  stepperLeft.setCurrentPosition(position[0]);
  stepperRight.setCurrentPosition(position[1]);

  Serial.printf("Set current position = %d\n", position);

  stepperMgr.addStepper(stepperLeft);
  stepperMgr.addStepper(stepperRight);
  Serial.setRxFIFOFull(3);
  Serial.onReceive(uart_receive);

  position[0] = 1000;
  position[1] = -1000;

  Serial.printf("Setup complete!\n");
}

void loop()
{
  if (rx_line.endsWith("\n"))
  {
    max_rpm = rx_line.toFloat();
    rx_line.clear();
    Serial.printf("Change MAX RPM to %f\n", max_rpm);
    stepperLeft.setMaxSpeed(max_speed_steps_per_sec(max_rpm));
    stepperRight.setMaxSpeed(max_speed_steps_per_sec(max_rpm));
  }

  // put your main code here, to run repeatedly:
  position[0] *= -1;
  position[1] *= -1;
  Serial.printf("Stepper.moveTo(%d, %d)\n", position[0], position[1]);
  stepperMgr.moveTo(position);

  while (stepperMgr.run())
  {
  }
}
