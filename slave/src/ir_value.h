#pragma once

#include <cstddef>
#include <cstdint>

class IRValue {
  uint32_t value = 0;
  uint8_t counter = 0;
  uint8_t maxCounter = 5;
  uint32_t minThreshold = 20;

public:
  IRValue() {}
  IRValue(uint8_t maxCounter) : maxCounter(maxCounter) {}

  uint32_t update(uint32_t v) {
    // Ignore short runs of low samples (e.g. temporary IR dropouts).
    if (v < minThreshold) {
      if (counter < maxCounter) {
        counter++;
        return value;
      }
    } else {
      counter = 0;
    }

    value = v;
    return value;
  }

  uint32_t get() const { return value; }
};
