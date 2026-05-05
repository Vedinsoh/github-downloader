# githubdl

A friendly wrapper around GitHub releases. Paste any repo link and get the downloads, with the matching OS surfaced first. The glossary below is the **user-facing vocabulary** — code-level identifiers (`StoredRelease`, `Asset`, etc.) are implementation, not domain.

## Language

**Repo**:
A GitHub repository identified by `{owner}/{repo}`.
_Avoid_: project, package

**Version**:
A single GitHub release surfaced to the user.
_Avoid_: release

**Version tag**:
The immutable string identifier of a **Version** (e.g. `v1.2.3`). Used in URLs (`/v/{version-tag}`) and as the stable key. A **Version** has exactly one **Version tag**.
_Avoid_: tag, release tag, ref

**Beta**:
A version flagged as a pre-release on GitHub.
_Avoid_: pre-release, prerelease, RC

**Download**:
A binary file attached to a version that the user can fetch.
_Avoid_: asset, artifact, attachment

**Source code**:
The auto-generated `.zip`/`.tar.gz` archive of the repo at a version. Surfaced under a collapsed "for developers" section.
_Avoid_: source archive, tarball

**Renamed Repo**:
A **Repo** whose `{owner}/{repo}` path GitHub now serves as a 301 to a new canonical path. We follow the rename silently and redirect the visitor to the new path.
_Avoid_: moved repo, redirected repo

**Repo link**:
Any input the homepage accepts to identify a **Repo** — full GitHub URLs (including `/releases`, `/releases/latest`, `/releases/tag/{version-tag}` shapes) or the `{owner}/{repo}` shorthand. Parsed into a redirect target.
_Avoid_: URL, GitHub link, paste

**Visitor OS**:
The operating system we infer the visitor is using, from the `User-Agent` header. Drives which **Download** is surfaced as primary.
_Avoid_: user OS, client OS, detected platform

**Download platform**:
The OS + architecture a single **Download** is built for, classified from its filename. May be `unknown` when the filename gives no signal.
_Avoid_: asset OS, target, build target

**Primary Download**:
The **Download** whose **Download platform** matches the **Visitor OS** — surfaced as the big button on each **Version**. Falls through to "Other downloads" when no match exists.
_Avoid_: main download, default download

**Latest**:
A role held by exactly one **Version** of a **Repo** at any moment — the most recent non-**Beta** **Version**, falling back to the most recent **Beta** if every **Version** is **Beta**. The `/v/latest` URL resolves to the holder of this role.
_Avoid_: newest, current, stable

## Relationships

- A **Repo** has zero or more **Versions**
- A **Version** has exactly one **Version tag**
- A **Version** has zero or more **Downloads** plus an implicit **Source code** archive
- A **Version** is either stable or marked **Beta**
- Exactly one **Version** of a **Repo** holds the **Latest** role at any moment
- Each **Download** has exactly one **Download platform**
- At most one **Download** per **Version** is the **Primary Download** for a given **Visitor OS**

## Example dialogue

> **Dev:** "When the visitor hits `/{owner}/{repo}/v/v1.2.3`, are we looking up the **Version** by its **Version tag**?"
> **Product:** "Yes — `v1.2.3` is the **Version tag**. The page renders the **Version** it identifies."
>
> **Dev:** "And the big button on each card — that's whichever **Download** matches the **Visitor OS**?"
> **Product:** "Right. Match the **Visitor OS** against each **Download**'s **Download platform**, pick the hit, that's the **Primary Download**. The rest go under 'Other downloads'."
>
> **Dev:** "What does `/v/latest` resolve to if every **Version** is a **Beta**?"
> **Product:** "The **Latest** role still has to land somewhere — fall back to the most recent **Beta**. There's always exactly one holder."

## Flagged ambiguities

_(none yet)_
