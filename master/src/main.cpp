#include <Arduino.h>
#include <Dezibot.h>
#include <autocharge/Autocharge.hpp>

namespace {
constexpr uint16_t BEACON_CARRIER_HZ = 10000;
constexpr uint16_t BEACON_DUTY = 128;
} // namespace

// put function declarations here:
void start_chg(Master *master, SlaveData *slave) {
  Serial.printf("Execute 'start_chg for slave %u'\n", slave->id);
  master->enjoinCharge(slave);
}
void end_chg(Master *master, SlaveData *slave) {
  Serial.printf("Execute 'end_chg for slave %u'\n", slave->id);
  master->cancelCharge(slave);
}

auto chargingSlaves = Fifo<SlaveData *>();

Master master = Master(chargingSlaves, start_chg, end_chg);

void setup() {
  // put your setup code here, to run once:
  delay(2000);
  Serial.begin(115200);
  Serial.println("+-------------------------+");
  Serial.println("| Charging Station Master |");
  Serial.println("+-------------------------+");
  Serial.println();
  master.begin();
  Serial.printf("NodeID '%u'\n", master.communication.getNodeId());
  master.infraredLight.front.sendFrequency(BEACON_CARRIER_HZ);
  master.infraredLight.front.setDutyCycle(BEACON_DUTY);
  Serial.printf("Beacon config: front=%u Hz duty=%u/1023\n", BEACON_CARRIER_HZ,
                BEACON_DUTY);
  Serial.println(
      "wireless_log,from,t_ms,mode,raw_f,raw_b,raw_l,raw_r,A_F,A_B,A_L,A_R,"
      "theta_deg,S,detected,duty_l,duty_r");
}

void loop() { master.step(); }
