#pragma once

#include <cstddef>
#include <cstdint>

template <typename T, uint8_t Capacity, typename SumT = uint64_t>
class RingBuffer {
  static_assert(Capacity > 0, "RingBuffer capacity must be greater than zero");

  T values[Capacity] = {};
  uint8_t nextIndex = 0;
  uint8_t count = 0;
  SumT runningSum = 0;

public:
  void push(T value) {
    if (count == Capacity) {
      runningSum -= static_cast<SumT>(values[nextIndex]);
    } else {
      count++;
    }

    values[nextIndex] = value;
    runningSum += static_cast<SumT>(value);

    nextIndex++;
    if (nextIndex >= Capacity) {
      nextIndex = 0;
    }
  }

  uint8_t size() const { return count; }

  T average() const {
    if (count == 0) {
      return T{};
    }

    return static_cast<T>(runningSum / count);
  }
};

class IRValue {
  static constexpr uint8_t averagePeriod = 4;

  uint32_t value = 0;
  uint8_t counter = 0;
  RingBuffer<uint32_t, averagePeriod> averageBuffer;
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
    }

    counter = 0;

    averageBuffer.push(v);
    value = averageBuffer.average();
    return value;
  }

  uint32_t get() const { return value; }
};
