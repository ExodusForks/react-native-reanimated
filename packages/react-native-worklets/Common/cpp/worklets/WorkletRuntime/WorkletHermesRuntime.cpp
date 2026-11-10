#include <worklets/WorkletRuntime/WorkletHermesRuntime.h>

// Only include this file in Hermes-enabled builds as some platforms (like tvOS)
// don't support hermes and it causes the compilation to fail.
#if JS_RUNTIME_HERMES

#include <cxxreact/MessageQueueThread.h>
#include <jsi/decorator.h>
#include <jsi/jsi.h>

#include <memory>
#include <string>
#include <utility>

namespace worklets {

using namespace facebook;
using namespace react;
#if HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)
using namespace facebook::hermes::inspector_modern;
#endif // HERMES_ENABLE_DEBUGGER  && !defined(HERMES_V1_ENABLED)

#if HERMES_ENABLE_DEBUGGER

class HermesExecutorRuntimeAdapter
#if HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)
    : public RuntimeAdapter
#endif // HERMES_ENABLE_DEBUGGER  && !defined(HERMES_V1_ENABLED)
{
 public:
  explicit HermesExecutorRuntimeAdapter(
      facebook::hermes::HermesRuntime &hermesRuntime,
      const std::shared_ptr<MessageQueueThread> &thread)
      : hermesRuntime_(hermesRuntime), thread_(thread) {}

  virtual ~HermesExecutorRuntimeAdapter() {
    // This is required by iOS, because there is an assertion in the destructor
    // that the thread was indeed `quit` before
    thread_->quitSynchronous();
  }
#if HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)
  facebook::hermes::HermesRuntime &getRuntime() override {
    return hermesRuntime_;
  }

  // This is not empty in the original implementation, but we decided to tickle
  // the runtime by running a small piece of code on every frame as using this
  // required us to hold a refernce to the runtime inside this adapter which
  // caused issues while reloading the app.
  void tickleJs() override {}
#endif // HERMES_ENABLE_DEBUGGER  && !defined(HERMES_V1_ENABLED)

 public:
  facebook::hermes::HermesRuntime &hermesRuntime_;
  std::shared_ptr<MessageQueueThread> thread_;
};

#endif // HERMES_ENABLE_DEBUGGER

WorkletHermesRuntime::WorkletHermesRuntime(
    std::unique_ptr<facebook::hermes::HermesRuntime> runtime,
    const std::shared_ptr<MessageQueueThread> &jsQueue,
    const std::string &name)
    : jsi::WithRuntimeDecorator<WorkletsReentrancyCheck>(*runtime, reentrancyCheck_), runtime_(std::move(runtime)) {
#if HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)
  auto adapter = std::make_unique<HermesExecutorRuntimeAdapter>(*runtime_, jsQueue);
  debugToken_ = chrome::enableDebugging(std::move(adapter), name);
#endif // HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)

}

WorkletHermesRuntime::~WorkletHermesRuntime() {
#if HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)
  // We have to disable debugging before the runtime is destroyed.
  chrome::disableDebugging(debugToken_);
#endif // HERMES_ENABLE_DEBUGGER && !defined(HERMES_V1_ENABLED)
}

} // namespace worklets

#endif // JS_RUNTIME_HERMES
