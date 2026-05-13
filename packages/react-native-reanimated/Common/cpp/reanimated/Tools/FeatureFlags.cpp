#include <reanimated/Tools/FeatureFlags.h>

#include <atomic>
#include <string>
#include <unordered_map>

namespace reanimated {

std::unordered_map<std::string, bool> DynamicFeatureFlags::flags_;

bool DynamicFeatureFlags::getFlag(const std::string &name) {
  return flags_.contains(name) && flags_[name];
}

void DynamicFeatureFlags::setFlag(const std::string &name, bool value) {
  flags_[name] = value;
}

std::atomic<bool> RuntimeFeatureFlags::forceReactRenderForSettledAnimations_{
    StaticFeatureFlags::getFlag("FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS")};

bool RuntimeFeatureFlags::forceReactRenderForSettledAnimations() {
  return forceReactRenderForSettledAnimations_.load(std::memory_order_relaxed);
}

void RuntimeFeatureFlags::setForceReactRenderForSettledAnimations(bool value) {
  forceReactRenderForSettledAnimations_.store(value, std::memory_order_relaxed);
}

} // namespace reanimated
