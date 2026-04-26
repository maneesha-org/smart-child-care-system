# TODO - Smart Child Care System Fixes

## Task 1: Remove Custom Translation, Keep Only Google Translator
- [x] Remove `TRANSLATIONS` object (all 11 languages)
- [x] Remove `switchLanguage()` function
- [x] Remove `getLangName()` function
- [x] Remove language selector dropdown from login page
- [x] Remove all `data-lang` attributes from HTML
- [x] Remove `loadLanguage();` call from `go()` function
- [x] Remove duplicate early Google Translate script inside `.app`
- [x] Keep bottom Google Translate widget (`#global-translator`)

## Task 2: Fix Pulse Page (Remove Temp + Fix Server + Notifications + Long Sound)
- [x] Remove temperature UI from camera mode (`tempval`, `ttag`)
- [x] Remove temperature input from manual mode
- [x] Remove temperature from simulation mode
- [x] Update `finishReading()` to remove temp parameter & temp logic
- [x] Update all callers of `finishReading()` (camera, manual, sim)
- [x] Fix `finishReading()` to use `/api/vitals` endpoint correctly
- [x] Fix `loadPulseHistoryFromBackend()` to use `d.records`
- [x] Update history rendering to not show temperature
- [x] Add `showAlert()` + `pushNotif()` for high BPM (>140)
- [x] Add `showAlert()` + `pushNotif()` for low BPM (<80)
- [x] Make `notificationBeep()` longer (~3.5s) and louder
- [x] Fix `doRPPG()` async frame capture race condition (use `toDataURL`)

## Task 3: Verify & Complete
- [x] Review all changes for correctness
- [x] Ensure no broken references

**Status: ALL TASKS COMPLETE ✅**

