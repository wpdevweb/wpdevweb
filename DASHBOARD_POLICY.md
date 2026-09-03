# Public Profile Dashboard Policy

The GitHub profile README is a **static public projection**, not a live control plane.

## Display path

`dashboard.snapshot.json → scripts/render-profile.mjs → README.md`

Opening the profile must trigger **zero API/network requests from repository code**. No remote badges, dynamic images, client JavaScript, GitHub API calls, Vercel endpoints or third-party telemetry are used in the README.

## Truth rules

- Public dashboard data is precomputed and committed.
- Private repository names, private task details and private topology are not published.
- Inventory coverage is not product completion.
- Percentages appear only when a denominator is explicit and mechanically defined.
- Unknown readiness stays `?` / `NOT_RUN`; it is never guessed from commit activity or repository size.
- Source observations are timestamped; stale snapshots remain visibly dated rather than silently presented as live.

## Sync ritual

1. Build/update a public-safe aggregate snapshot from authenticated portfolio evidence outside the profile render path.
2. Review redaction and claim boundaries.
3. Run `node scripts/render-profile.mjs` locally.
4. Review README diff.
5. Commit/PR/merge.

No scheduled workflow is required for profile rendering; this avoids GitHub Actions/API budget spent merely to display the profile.
