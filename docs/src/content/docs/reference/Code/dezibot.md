---
title: Dezibot
description: Auto-generated API summary from Doxygen XML.
---

> Auto-generated. Do not edit manually.

- Module: `dezibot`
- Doxygen XML: `/Volumes/Programming/htwk/charging-station/docs/generated/doxygen/dezibot/xml`
- Generated at: `2026-02-26T01:40:44Z`

## Functions

### `AbstractSet`

- `insert(T item)=0` (`dezibot/src/autocharge/master/abstractSet/AbstractSet.hpp:5`)
- `isEmpty() const =0` (`dezibot/src/autocharge/master/abstractSet/AbstractSet.hpp:7`)
- `pick()=0` (`dezibot/src/autocharge/master/abstractSet/AbstractSet.hpp:6`)
- `~AbstractSet()=default` (`dezibot/src/autocharge/master/abstractSet/AbstractSet.hpp:8`)

### `ColorDetection`

- `beginAutoMode()` (`dezibot/src/colorDetection/ColorDetection.h:61`) - Start RBGW sensor with default configuration.
- `configure(VEML_CONFIG config)` (`dezibot/src/colorDetection/ColorDetection.h:68`) - Begin RGBW sensor with passed configuration values.
- `getAmbientLight()` (`dezibot/src/colorDetection/ColorDetection.h:83`) - Get the ambient light in lux.
- `getColorValue(color color)` (`dezibot/src/colorDetection/ColorDetection.h:76`) - Get color value of RGBW sensor.

### `Communication`

- `begin(void)` (`dezibot/src/communication/Communication.h:19`) - initialize the Mesh Compnent, must be called before the other methods are used.
- `broadcast(String msg)` (`dezibot/src/communication/Communication.h:23`)
- `getNodeId()` (`dezibot/src/communication/Communication.h:31`)
- `onReceiveGroup(void(*callbackFunc)(uint32_t from, String &msg))` (`dezibot/src/communication/Communication.h:27`)
- `onReceiveSingle(void(*callbackFunc)(uint32_t from, String &msg))` (`dezibot/src/communication/Communication.h:29`)
- `receivedCallback(uint32_t from, String &msg)` (`dezibot/src/communication/Communication.h:36`)
- `setGroupNumber(uint32_t number)` (`dezibot/src/communication/Communication.h:21`)
- `unicast(uint32_t targetId, String msg)` (`dezibot/src/communication/Communication.h:25`)

### `Dezibot`

- `begin(void)` (`dezibot/src/Dezibot.h:36`)
- `Dezibot()` (`dezibot/src/Dezibot.h:28`)

### `Display`

- `begin(void)` (`dezibot/src/display/Display.h:52`) - initializes the display datastructures and sents the required cmds to start the display. Should only be called once.
- `clear(void)` (`dezibot/src/display/Display.h:58`) - delets all content from the display, resets the linecounter, new print will start at the top left. Orientationflip is not resetted
- `flipOrientation(void)` (`dezibot/src/display/Display.h:116`) - flips the horizontal orientation of all content on the display
- `invertColor(void)` (`dezibot/src/display/Display.h:123`) - inverts the pixelcolors, so pixels on will be set to off and currently off pixels will be turned off. affects already printed content as well as future prints.
- `print(String value)` (`dezibot/src/display/Display.h:81`) - prints the passed string right behind the current displaycontent the sequence "\n" can be used to make a linebreak on the display
- `print(char *value)` (`dezibot/src/display/Display.h:66`) - prints the passed string right behind the current displaycontent the sequence "\n" can be used to make a linebreak on the display
- `print(int value)` (`dezibot/src/display/Display.h:96`) - prints the passed string right behind the current displaycontent the sequence "\n" can be used to make a linebreak on the display
- `println(String value)` (`dezibot/src/display/Display.h:88`) - same as the print method, but after the string a line break is inserted
- `println(char *value)` (`dezibot/src/display/Display.h:73`) - same as the print method, but after the string a line break is inserted
- `println(int value)` (`dezibot/src/display/Display.h:103`) - same as the print method, but after the string a line break is inserted
- `sendDisplayCMD(uint8_t cmd)` (`dezibot/src/display/Display.h:37`) - sends the passed cmd to the display, cmd_byte is added as prefix by the function
- `stringToCharArray(String value)` (`dezibot/src/display/Display.h:110`) - string to char
- `updateLine(uint charAmount)` (`dezibot/src/display/Display.h:44`) - should be called whenever characters where printed to the display. Updates the data of the class to handle linebreaks correctly

### `Fifo`

- `insert(T item) override` (`dezibot/src/autocharge/master/abstractSet/Fifo.hpp:13`)
- `isEmpty() const override` (`dezibot/src/autocharge/master/abstractSet/Fifo.hpp:27`)
- `pick() override` (`dezibot/src/autocharge/master/abstractSet/Fifo.hpp:17`)

### `InfraredLED`

- `begin(void)` (`dezibot/src/infraredLight/InfraredLight.h:20`)
- `InfraredLED(uint8_t pin, ledc_timer_t timer, ledc_channel_t channel)` (`dezibot/src/infraredLight/InfraredLight.h:19`)
- `sendFrequency(uint16_t frequency)` (`dezibot/src/infraredLight/InfraredLight.h:45`) - starts flashing the IRLed with a specific frequency Won't stop automatically, must be stopped by calling any other IR-Method
- `setDutyCycle(uint16_t dutyCycle)` (`dezibot/src/infraredLight/InfraredLight.h:52`) - sets the duty cycle of the selected LED
- `setState(bool state)` (`dezibot/src/infraredLight/InfraredLight.h:38`) - changes state of selected LED depending on the state
- `turnOff(void)` (`dezibot/src/infraredLight/InfraredLight.h:31`) - disables selected LED
- `turnOn(void)` (`dezibot/src/infraredLight/InfraredLight.h:25`) - enables selected LED

### `InfraredLight`

- `begin(void)` (`dezibot/src/infraredLight/InfraredLight.h:67`)

### `LightDetection`

- `begin(void)` (`dezibot/src/lightDetection/LightDetection.h:50`) - initialize the Lightdetection Compnent, must be called before the other methods are used.
- `beginDaylight(void)` (`dezibot/src/lightDetection/LightDetection.h:92`)
- `beginInfrared(void)` (`dezibot/src/lightDetection/LightDetection.h:91`)
- `getAverageValue(photoTransistors sensor, uint32_t measurments, uint32_t timeBetween)` (`dezibot/src/lightDetection/LightDetection.h:77`) - Get the Average of multiple measurments of a single PT.
- `getBrightest(ptType type)` (`dezibot/src/lightDetection/LightDetection.h:67`) - can be used to determine which sensor is exposed to the greatest amount of light Can distingish between IR and Daylight
- `getValue(photoTransistors sensor)` (`dezibot/src/lightDetection/LightDetection.h:58`) - reads the Value of the specified sensor
- `readDLPT(photoTransistors sensor)` (`dezibot/src/lightDetection/LightDetection.h:94`)
- `readIRPT(photoTransistors sensor)` (`dezibot/src/lightDetection/LightDetection.h:93`)

### `Master`

- `begin() override` (`dezibot/src/autocharge/master/Master.hpp:22`)
- `cancelCharge(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:25`)
- `enjoinCharge(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:24`)
- `handleExitChargeInfo(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:51`)
- `handleInChargeInfo(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:50`)
- `handleInWaitInfo(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:48`)
- `handleWalkIntoChargeInfo(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:49`)
- `handleWalkToChargeInfo(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:47`)
- `handleWorkInfo(SlaveData *slave)` (`dezibot/src/autocharge/master/Master.hpp:46`)
- `Master(AbstractSet< SlaveData * > &chargingSlaves, const std::function< void(Master *master, SlaveData *slave)> &handle_slave_charge_request, const std::function< void(Master *master, SlaveData *slave)> &handle_slave_stop_charge_request)` (`dezibot/src/autocharge/master/Master.hpp:12`)
- `onReceiveSingle(uint32_t from, String &message)` (`dezibot/src/autocharge/master/Master.hpp:53`)
- `step()` (`dezibot/src/autocharge/master/Master.hpp:23`)
- `stepAttachGear()` (`dezibot/src/autocharge/master/Master.hpp:43`)
- `stepClosed()` (`dezibot/src/autocharge/master/Master.hpp:42`)
- `stepLiftGear()` (`dezibot/src/autocharge/master/Master.hpp:41`)
- `stepLowerGear()` (`dezibot/src/autocharge/master/Master.hpp:40`)
- `stepOpen()` (`dezibot/src/autocharge/master/Master.hpp:39`)
- `stepSlaveCharge()` (`dezibot/src/autocharge/master/Master.hpp:44`)

### `Motion`

- `begin(void)` (`dezibot/src/motion/Motion.h:88`) - Initialize the movement component.
- `leftMotorTask(void *args)` (`dezibot/src/motion/Motion.h:66`)
- `move(uint32_t moveForMs=0, uint baseValue=DEFAULT_BASE_VALUE)` (`dezibot/src/motion/Motion.h:100`) - Move forward for a certain amount of time. Call with moveForMs 0 will start movement, that must be stopped explicit by call to stop(). The function applys a basic algorithm to improve the straigthness of the movement. Lifting the robot from the desk may corrupt the results and is not recommended.
- `moveTask(void *args)` (`dezibot/src/motion/Motion.h:65`)
- `moveWithoutCorrection(uint32_t moveForMs=0, uint baseValue=DEFAULT_BASE_VALUE)` (`dezibot/src/motion/Motion.h:130`) - Does the same as the move function, but this function does not apply any kind of algorithm to improve the result.
- `rightMotorTask(void *args)` (`dezibot/src/motion/Motion.h:67`)
- `rotateAntiClockwise(uint32_t rotateForMs=0, uint baseValue=DEFAULT_BASE_VALUE)` (`dezibot/src/motion/Motion.h:116`) - Rotate anticlockwise for a certain amount of time. Call with moveForMs 0 will start movement, that must be stopped explicit by call to stop().
- `rotateClockwise(uint32_t rotateForMs=0, uint baseValue=DEFAULT_BASE_VALUE)` (`dezibot/src/motion/Motion.h:108`) - Rotate clockwise for a certain amount of time. Call with moveForMs 0 will start movement, that must be stopped explicit by call to stop().
- `stop(void)` (`dezibot/src/motion/Motion.h:122`) - stops any current movement, no matter if timebased or endless

### `MotionDetection`

- `begin(void)` (`dezibot/src/motionDetection/MotionDetection.h:86`) - initialized the IMU Component. Wakes the IMU from Standby Set configuration
- `calibrateZAxis(uint gforceValue)` (`dezibot/src/motionDetection/MotionDetection.h:176`)
- `cmdRead(uint8_t reg)` (`dezibot/src/motionDetection/MotionDetection.h:64`)
- `cmdRead(uint8_t regHigh, uint8_t regLow)` (`dezibot/src/motionDetection/MotionDetection.h:62`)
- `cmdWrite(uint8_t reg)` (`dezibot/src/motionDetection/MotionDetection.h:65`)
- `cmdWrite(uint8_t regHigh, uint8_t regLow)` (`dezibot/src/motionDetection/MotionDetection.h:63`)
- `end(void)` (`dezibot/src/motionDetection/MotionDetection.h:93`) - stops the component Sets the IMU to Low-Power-Mode
- `getAcceleration(void)` (`dezibot/src/motionDetection/MotionDetection.h:100`) - Triggers a new Reading of the accelerationvalues and reads them from the IMU.
- `getDataFromFIFO(FIFO_Package *buffer)` (`dezibot/src/motionDetection/MotionDetection.h:185`) - will read all availible packages from fifo, after 40ms Fifo is full
- `getRotation(void)` (`dezibot/src/motionDetection/MotionDetection.h:107`) - Triggers a new reading of the gyroscope and reads the values from the imu.
- `getTemperature(void)` (`dezibot/src/motionDetection/MotionDetection.h:114`) - Reads the current On Chip temperature of the IMU.
- `getTilt()` (`dezibot/src/motionDetection/MotionDetection.h:150`) - calculates how the robot is tilted. It is set, that when the robot is placed normally on a flat table, the result will be (0,0) Tilting the robot, so that the front leg is deeper than the other to results in an increasing degrees, tilting the front leg up will increase negativ degrees Tilting the robot to the right will increase the degrees until 180° (upside down), tilting it left will result in increasing negativ degrees (-1,-2,...,-180). On the top there is a jump of the values from 180->-180 and vice versa.
- `getTiltDirection(uint tolerance=10)` (`dezibot/src/motionDetection/MotionDetection.h:166`) - Checks in which direction (Front, Left, Right, Back) the robot is tilted.
- `getWhoAmI(void)` (`dezibot/src/motionDetection/MotionDetection.h:122`) - Returns the value of reading the whoAmI register When IMU working correctly, value should be 0x67.
- `initFIFO()` (`dezibot/src/motionDetection/MotionDetection.h:70`)
- `isShaken(uint32_t threshold=defaultShakeThreshold, uint8_t axis=xAxis\|yAxis\|zAxis)` (`dezibot/src/motionDetection/MotionDetection.h:135`) - Detects if at the time of calling is shaken. Therefore the sum over all accelerationvalues is calculated and checked against threshold. If sum > threshold a shake is detected, else not.
- `MotionDetection()` (`dezibot/src/motionDetection/MotionDetection.h:78`)
- `readDoubleRegister(uint8_t lowerReg)` (`dezibot/src/motionDetection/MotionDetection.h:68`)
- `readFromRegisterBank(registerBank bank, uint8_t reg)` (`dezibot/src/motionDetection/MotionDetection.h:58`)
- `readRegister(uint8_t reg)` (`dezibot/src/motionDetection/MotionDetection.h:67`)
- `resetRegisterBankAccess()` (`dezibot/src/motionDetection/MotionDetection.h:60`)
- `writeRegister(uint8_t reg, uint8_t value)` (`dezibot/src/motionDetection/MotionDetection.h:69`)
- `writeToRegisterBank(registerBank bank, uint8_t reg, uint8_t value)` (`dezibot/src/motionDetection/MotionDetection.h:59`)

### `Motor`

- `begin(void)` (`dezibot/src/motion/Motion.h:34`) - Initializes the motor.
- `getSpeed(void)` (`dezibot/src/motion/Motion.h:50`) - returns the currently activ speed
- `Motor(uint8_t pin, ledc_timer_t timer, ledc_channel_t channel)` (`dezibot/src/motion/Motion.h:29`)
- `setSpeed(uint16_t duty)` (`dezibot/src/motion/Motion.h:43`) - Set the Speed by changing the pwm. To avoid current peaks, a linear ramp-up is used.

### `MultiColorLight`

- `begin(void)` (`dezibot/src/multiColorLight/MultiColorLight.h:41`) - initialize the multicolor component
- `blink(uint16_t amount, uint32_t color=0x00006400, leds leds=TOP, uint32_t interval=1000)` (`dezibot/src/multiColorLight/MultiColorLight.h:102`) - Let LEDs blink, returns after all blinks were executed.
- `color(uint8_t r, uint8_t g, uint8_t b)` (`dezibot/src/multiColorLight/MultiColorLight.h:121`) - wrapper to calulate the used colorformat from a rgb-value
- `MultiColorLight()` (`dezibot/src/multiColorLight/MultiColorLight.h:36`)
- `normalizeColor(uint32_t color, uint8_t maxBrigthness=maxBrightness)` (`dezibot/src/multiColorLight/MultiColorLight.h:136`) - normalizes every component of color to not exeed the maxBrightness
- `setLed(leds leds, uint32_t color)` (`dezibot/src/multiColorLight/MultiColorLight.h:60`) - Set the specified leds to the passed color value.
- `setLed(leds leds, uint8_t red, uint8_t green, uint8_t blue)` (`dezibot/src/multiColorLight/MultiColorLight.h:70`) - Set the specified leds to the passed color value.
- `setLed(uint8_t index, uint32_t color)` (`dezibot/src/multiColorLight/MultiColorLight.h:50`) - Set the specified led to the passed color.
- `setTopLeds(uint32_t color)` (`dezibot/src/multiColorLight/MultiColorLight.h:79`) - sets the two leds on the top of the robot to the specified color
- `setTopLeds(uint8_t red, uint8_t green, uint8_t blue)` (`dezibot/src/multiColorLight/MultiColorLight.h:88`) - sets the two leds on the top of the robot to the specified color
- `turnOffLed(leds leds=ALL)` (`dezibot/src/multiColorLight/MultiColorLight.h:109`) - turn off the given leds

### `Slave`

- `begin() override` (`dezibot/src/autocharge/slave/Slave.hpp:26`)
- `handleCancelChargeCommand()` (`dezibot/src/autocharge/slave/Slave.hpp:49`)
- `handleEnjoinChargeCommand()` (`dezibot/src/autocharge/slave/Slave.hpp:48`)
- `notifyExitCharge()` (`dezibot/src/autocharge/slave/Slave.hpp:46`)
- `notifyInCharge()` (`dezibot/src/autocharge/slave/Slave.hpp:45`)
- `notifyInWait()` (`dezibot/src/autocharge/slave/Slave.hpp:43`)
- `notifyWalkIntoCharge()` (`dezibot/src/autocharge/slave/Slave.hpp:44`)
- `notifyWalkToCharge()` (`dezibot/src/autocharge/slave/Slave.hpp:42`)
- `notifyWork()` (`dezibot/src/autocharge/slave/Slave.hpp:41`)
- `onReceiveSingle(uint32_t from, String &message)` (`dezibot/src/autocharge/slave/Slave.hpp:51`)
- `requestCharge()` (`dezibot/src/autocharge/slave/Slave.hpp:28`)
- `requestStopCharge()` (`dezibot/src/autocharge/slave/Slave.hpp:29`)
- `Slave(SlaveState state, MasterData &master, const std::function< void(Slave *slave)> stepWork, const std::function< bool(Slave *slave, MasterData &master)> stepToCharge, const std::function< void(Slave *slave, MasterData &master)> stepWaitCharge, const std::function< bool(Slave *slave, MasterData &master)> stepIntoCharge, const std::function< void(Slave *slave, MasterData &master)> stepCharge, const std::function< bool(Slave *slave, MasterData &master)> stepExitCharge)` (`dezibot/src/autocharge/slave/Slave.hpp:10`)
- `step()` (`dezibot/src/autocharge/slave/Slave.hpp:27`)

### `SlaveData`

- `SlaveData(uint32_t id)` (`dezibot/src/autocharge/master/SlaveData.hpp:12`)
- `SlaveData(uint32_t id, SlaveState state)` (`dezibot/src/autocharge/master/SlaveData.hpp:13`)

### `Communication.cpp`

- `changedConnectionCallback()` (`dezibot/src/communication/Communication.cpp:51`)
- `newConnectionCallback(uint32_t nodeId)` (`dezibot/src/communication/Communication.cpp:46`)
- `nodeTimeAdjustedCallback(int32_t offset)` (`dezibot/src/communication/Communication.cpp:56`)
- `vTaskUpdate(void *pvParameters)` (`dezibot/src/communication/Communication.cpp:61`)

### `MasterData`

- `MasterData(uint32_t id)` (`dezibot/src/autocharge/slave/MasterData.hpp:9`)
