# Footlit privacy policy

_Last updated: 2026-10-12. Replace the contact line below before publishing._

Footlit is a browser extension that plays an animation when something happens on github.com. It is built to work entirely inside your browser.

## What Footlit does not do

- It does **not** send any data to any server. The extension makes no network requests of its own: no analytics, no telemetry, no crash reporting, no advertising, no remote code.
- It does **not** read, store or transmit your GitHub credentials, tokens, private code, issue or pull request contents, or anything you type.
- It does **not** run on any site other than github.com.

## What Footlit reads

To notice that you merged a pull request, finished a release, and so on, a script runs on github.com pages you have open and looks at the page address, the page title and a few status labels (for example the Open / Merged / Closed badge on a pull request, or the "checks passed" heading). It uses this only to decide whether to play an animation, and it plays the animation in the same tab.

## What Footlit stores, and where

| Data | Where | Why |
|---|---|---|
| Your settings (theme, which events are on, show length, appearance, quiet mode, whether you dismissed the welcome) | `chrome.storage.sync`, i.e. your browser profile. If you have browser sync turned on, your browser may sync it across your own devices, under the browser vendor's own privacy terms. | So your choices persist |
| A short activity log (up to 40 entries: when an event was noticed, its type, the repository or pull request name it concerned, and whether it was shown) and a count of shows | `chrome.storage.local`, on this device only | To power the "Recent activity" list that helps you troubleshoot |

You can clear the activity log at any time (Settings -> Activity & help -> Clear activity) and reset every setting (Reset all settings). Removing the extension deletes all of it.

## Permissions

- **Access to github.com**: required to detect events and draw the animation on GitHub pages. It is not used on other sites.
- **storage**: required to save the settings and activity log described above.

## Children

Footlit does not knowingly collect any personal information from anyone, including children.

## Changes

If this policy changes, the new version will be published with the extension update and the date above will change.

## Contact

[your name or organisation] - [your contact email]
