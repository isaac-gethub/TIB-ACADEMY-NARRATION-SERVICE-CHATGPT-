# Phase 4 release approval record
Sponsor confirmed the latest narration repair on 2026-10-13 and instructed PROCEED. This is recorded as acceptance of that repair and authorization to prepare the release, not production deployment approval.
Release branch: phase4-release-ready-20261013. Production/main remains unchanged.

## Included
All agreed Phase 2 enhancements, Phase 3 Chapter 8/Lab 47, Phase 4 integration and server-side course/asset authorization; repaired origin/sign-in flow and narration routes. Original content and all 220 MP3s retained. Labs 1–2 use browser speech, not new recorded MP3s.
Portal and courses use separate sign-ins. Course cookies are Secure/HttpOnly and host-scoped. Portal sign-out does not sign out another course origin.
Negative enrollment/server scenarios use fixtures. Real protected downloads, post-sign-out requests and audible playback have depended on sponsor acceptance because automated browser access was restricted.

## Release routing
Production builds must use the stable production course URLs. Preview builds preserve the accepted preview course links. No production deployment or main merge occurs in this preparation step.

## Approval and rollout
Explicit sponsor production approval is required before merging any of the three draft PRs or releasing production.
After approval:
1. Release Full Sweep first; wait for READY and check Lab 1–3 narration pages, recorded audio and authorized/unauthorized access.
2. Release GRC; wait for READY and check Chapter 8, original documents and the repaired Full Sweep companion link.
3. Release portal last; verify production course destinations, enrolled dashboard, course login and sign-out.
4. Confirm notes, quizzes, exports and audible playback on the sponsor device.

## Rollback
Record the existing main SHA and current production deployment ID before each approved release. Roll back only the affected project if a release check fails. Application build changes do not require schema migration and do not alter enrollment records.
Older public production/preview builds remain publicly accessible until separately retired within an approved scope. Releasing protected current builds does not retract copies already downloaded.

## Validation evidence
GRC accepted narration repair: https://github.com/isaac-gethub/tib-grc-master-course/actions/runs/38462160254
Full Sweep accepted narration repair: https://github.com/isaac-gethub/TIB-ACADEMY-NARRATION-SERVICE-CHATGPT-/actions/runs/38462103084
Release branch regressions and production-routing checks are recorded in the draft PRs. A production-mode build check is local/CI preparation, not a deployment.
