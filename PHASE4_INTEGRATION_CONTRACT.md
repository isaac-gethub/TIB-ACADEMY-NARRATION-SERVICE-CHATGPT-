# Phase 4 — Full Sweep Integration Contract

**Scope:** Lab 47 integrated into Full Sweep navigation, preserving Labs 1–46, existing MP3 files, assessments and exports. **Branch:** `phase4-integration-20261013`.

- Lab 47 route: `/lab47-interactive.html`; linked from `/index.html`.
- Existing static build's `lab\\d{2}(?:-interactive)?\\.html` matcher already includes `lab47-interactive.html`, so no change to the build command is required.
- Lab 47 learner notes and answers are stored in browser localStorage key `tib-full-sweep-lab47-v1`; export produces `TIB_Lab47_Workpaper.txt`.
- Lab 47 narration uses browser text-to-speech and is **not** a new MP3 recording. All 220 existing MP3 files are preserved.
- The external academy portal currently links to the Full Sweep **production homepage**, not to this development branch. Existing Supabase enrollment is untouched. Do not claim new lab-level authorization enforcement without authenticated preview tests.
- Final integration checks: static output includes Lab 47, homepage link resolves in development preview, notes/quiz/export work, original 46 labs and audio pass regression, portal handoff is checked in authenticated test environment.
- No merge to main, production promotion, portal rewrite, or cross-course coupling.
