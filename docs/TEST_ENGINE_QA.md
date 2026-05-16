Test Engine QA guide

Quick manual tests (fast timers):

1. Start a test attempt with a section that has `durationMinutes` set (e.g. 2).
2. Open attempt page with debug timers enabled:
   - Append `?debugFastTimers=1` to the URL. This treats `durationMinutes` as seconds so you can observe timeouts quickly.
   - Example: `/dashboard/test-attempt/<attemptId>?debugFastTimers=1`

3. Verify per-section behavior:
   - When the section timer expires, the client auto-saves answers and navigates to the next section (or auto-submits if last).
   - Confirm saved answers appear in results.

4. Verify autosave:
   - Answer several questions, wait 3s.
   - Confirm a toast "Đã lưu tự động" appears and your answers persist after reload.

5. Verify fullscreen:
   - Click the fullscreen icon; confirm container enters fullscreen and exit works.

6. Verify anti-copy:
   - Try to select text, copy, or open context menu; browser should prevent these actions (note: not foolproof).

7. Verify randomization persistence:
   - Start multiple attempts; server persists `randomSeed` and `sectionsOrder` so question order is stable per attempt.

Developer notes:
- Prisma schema updated: `TestSection` gained `randomize_questions`, `randomize_answers`.
- `TestAttempt` gained `random_seed` and `sections_order` fields.
- You must run a Prisma migration locally to apply DB changes:

```bash
npx prisma migrate dev --name add-randomization-fields
```

- After migration, existing tests will not have `sections_order` until a new attempt is started.

Automated testing idea:
- Use Playwright to script answering questions and asserting auto-save and submission on timeouts. Add test when CI is available.
