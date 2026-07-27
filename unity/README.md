# Unity / C# Integration

This folder is a placeholder for Unity game engine assets and C# simulation code. For complex simulations you can create a Unity project here and export WebGL build into `frontend/public/unity/` for integration.

## Added mission module

- `mission.cpp` is a lightweight native source for mission reward and hit damage logic.
- `mission.wasm` is generated into `frontend/public/unity/mission.wasm` for browser runtime use.

## Build notes

A proper build environment with Emscripten would normally compile `mission.cpp` to `mission.wasm`.

This repo currently contains a minimal generated `mission.wasm` binary so the unlockable mission can run in the browser.

Example C# script in `Assets/Scripts/GameCore.cs` demonstrates a simple MonoBehaviour.
