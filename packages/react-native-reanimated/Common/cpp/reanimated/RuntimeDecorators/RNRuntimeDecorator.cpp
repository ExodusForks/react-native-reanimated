#include <reanimated/RuntimeDecorators/RNRuntimeDecorator.h>
#include <reanimated/Tools/ReaJSIUtils.h>
#include <reanimated/Tools/ReanimatedVersion.h>

#include <memory>

namespace reanimated {

void RNRuntimeDecorator::decorate(
    jsi::Runtime &rnRuntime,
    jsi::Runtime &uiRuntime,
    const std::shared_ptr<ReanimatedModuleProxy> &reanimatedModuleProxy) {
  // Security: _WORKLET_RUNTIME pointer leak removed (0056)

#ifndef NDEBUG
  checkJSVersion(rnRuntime);
#endif // NDEBUG

#ifdef IS_REANIMATED_EXAMPLE_APP
  installDebugBindings(rnRuntime, reanimatedModuleProxy);
#endif // IS_REANIMATED_EXAMPLE_APP

  injectReanimatedCppVersion(rnRuntime);

  rnRuntime.global().setProperty(rnRuntime, "_REANIMATED_IS_REDUCED_MOTION", reanimatedModuleProxy->isReducedMotion());

  rnRuntime.global().setProperty(
      rnRuntime, "__reanimatedModuleProxy", jsi::Object::createFromHostObject(rnRuntime, reanimatedModuleProxy));
}

#ifdef IS_REANIMATED_EXAMPLE_APP
void RNRuntimeDecorator::installDebugBindings(
    jsi::Runtime &rnRuntime,
    const std::shared_ptr<ReanimatedModuleProxy> &reanimatedModuleProxy) {
#if TARGET_OS_X
  jsi_utils::installJsiFunction(
      rnRuntime, "__getTagFromShadowNodeWrapper", [](jsi::Runtime &rt, const jsi::Value &shadowNodeWrapper) {
        auto node = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(rt, shadowNodeWrapper);
        return jsi::Value(rt, static_cast<double>(node->getTag()));
      });
#endif // TARGET_OS_X

  jsi_utils::installJsiFunction(rnRuntime, "_registriesLeakCheck", reanimatedModuleProxy->createRegistriesLeakCheck());
}
#endif // IS_REANIMATED_EXAMPLE_APP

} // namespace reanimated
