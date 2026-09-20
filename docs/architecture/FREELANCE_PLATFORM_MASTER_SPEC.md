# FREELANCE PLATFORM — MASTER PRODUCT, ENGINEERING, SECURITY & DELIVERY SPECIFICATION

**Document type:** Single source of truth for product, engineering, UX/UI, security, legal/compliance implementation, testing, risk management and coding-agent execution  
**Document status:** Implementation-ready baseline  
**Prepared for:** Coding agent / senior engineering execution  
**Baseline date:** 2026-09-06  
**Primary market:** Türkiye  
**Languages:** Turkish (`tr`) and English (`en`)  
**Product model:** Text-only technology-focused freelance discovery and matching platform; no platform payment, escrow, contract execution, delivery, review/rating or dispute-resolution service  

> **MANDATORY AGENT DIRECTIVE**  
> This file is the governing specification. The coding agent MUST read it fully before changing code. If existing code conflicts with this document, this document wins unless an explicit later human instruction overrides it. The agent MUST NOT invent alternative business rules, add unrequested product surfaces, weaken security controls, silently omit requirements, or replace required functionality with placeholders. Every work package must end with tests and evidence. The project is not complete until all release gates in this document pass.

---

# 0. Executive Decision Summary

The product is a professional, premium, minimalist freelance platform primarily for software, computers, AI and technology work. A single account can both publish listings and submit offers; there are no separate permanent “client” and “freelancer” account types.

The platform performs only four core functions:

1. Help a registered user create a high-quality text-only project listing through a guided wizard.
2. Distribute active listings through category-based feeds and discovery.
3. Allow other registered users to submit private one-to-one offers that only the listing owner can see.
4. When one offer is accepted, create a private match and reveal approved contact channels so the two users can continue negotiations and all financial/contractual activity outside the platform.

The platform MUST NOT collect money, hold money, process payouts, calculate commissions, issue invoices on behalf of users, provide escrow, guarantee payment, guarantee delivery, guarantee user identity, guarantee legality or quality of services, determine who is right in commercial disputes, host project files, host user images, provide public comments, provide public ratings, or expose competing offers.

The platform's acceptance action is a **matching/contact-handoff event**, not a representation that a final service contract has been legally concluded through the platform. User-facing copy must state this clearly.

## 0.1 Mandatory correction to the originally requested identity-data scope

The initial idea included mandatory T.C. identity number, gender and birthplace collection “for security.” This specification intentionally changes that requirement because collecting more identity data is not, by itself, a security control and creates disproportionate privacy and breach impact.

**MVP/production baseline:**

- Required and private: legal first name, legal last name, verified email, verified mobile phone, date of birth, country of residence, city of residence, password/authentication data, legal acceptance records.
- Required age rule: user must be 18+.
- Not collected in MVP: T.C. identity number, gender, birthplace, exact street address.
- T.C. identity number may only be introduced later behind a disabled-by-default `IDENTITY_VERIFICATION` feature flag after a documented legal basis, data-protection impact/risk assessment, approved verification provider, retention policy, encryption model and legal review exist.
- Gender and birthplace MUST NOT be added merely as fraud-prevention fields. If a future feature creates a legitimate need, they require separate purpose/legal-basis review.

Security is instead achieved through email verification, phone verification, rate limiting, bot controls, abuse detection, session security, audit events, admin controls and optional MFA.

## 0.2 Legal-language constraint

The site may explain that it does not provide payment/escrow/contract/dispute services and does not guarantee counterparties or outcomes. It MUST NOT use an absolute statement such as “we have no responsibility for anything.” Statutory responsibilities that cannot legally be excluded must not be purportedly waived. All limitation-of-liability language must include an equivalent of **“to the maximum extent permitted by applicable law.”**

## 0.3 Default technical baseline

As of the baseline date, use:

- Node.js `24.20.x` LTS line.
- Next.js `16.3.3` or a later security-patched `16.3.x` Active LTS release available at implementation time.
- React `19.2.7` or later security-patched `19.2.x` compatible with the selected Next.js release.
- TypeScript in strict mode.
- PostgreSQL `18.6` or latest supported PostgreSQL 18 minor security release.
- Better Auth `1.7.3` or later compatible security-patched `1.7.x`; email/password, email verification, phone verification adapter, session management and 2FA support.
- Drizzle ORM + explicit SQL migrations.
- Tailwind CSS current stable + accessible headless primitives; no generic template appearance.
- Playwright for E2E, Vitest for unit/integration, axe-core for automated accessibility checks.
- Package manager: `pnpm`; lockfile committed; no floating production dependency versions.

If a security release supersedes a pinned patch before implementation, security-patched releases take precedence. The agent MUST record the exact resolved versions in `docs/build-manifest.md` and the lockfile.

---

# 1. Product Vision and Product Principles

## 1.1 Vision

Create the highest-quality low-friction technology freelance matching experience: free registration, free listing publication, private offers, transparent listing freshness, minimal profile noise, deterministic category feeds and a clear separation between “finding each other” and “doing business with each other.”

## 1.2 Product principles

1. **One identity, two capabilities:** every user can publish work and take work.
2. **Free core marketplace access:** account creation, listing creation and offer submission are free in the baseline product.
3. **Privacy by default:** competing offers, followed categories, legal identity data and contact details are private.
4. **No noisy social layer:** no comments, follower counts, likes, reactions, public offer counts by bidder identity, public ratings or public negotiation.
5. **No file risk:** no user image or file upload of any kind.
6. **Plain text only:** user-generated prose is plain text; no HTML, Markdown rendering, embeds or rich text.
7. **No emoji anywhere:** UI copy, seed data and user-generated content must reject emoji/pictographic characters.
8. **Fresh listings:** an activation window is at most seven days.
9. **Historical transparency:** first publication date never changes, even after reactivation.
10. **No opaque ranking:** default feeds sort primarily by recency; filters are explicit.
11. **No platform financial custody:** money and final commercial terms remain between users outside the platform.
12. **Security is a product feature:** verified communication channels, controlled data exposure, strong authentication and abuse controls are mandatory.
13. **Accessible premium design:** visual polish must not reduce keyboard accessibility, contrast, semantics or reduced-motion support.
14. **Internationalization from day one:** no hard-coded user-facing strings outside locale resources.
15. **Auditability:** important state transitions and administrative actions are traceable.

---

# 2. Scope, Non-Goals and Product Boundaries

## 2.1 In scope

- Anonymous marketing/landing surface.
- Public active/inactive listing detail pages subject to visibility rules.
- Public minimalist user profiles.
- Registration, authentication, email verification, phone verification, password reset and account security.
- 18+ gate.
- Profile editing.
- Category taxonomy and follow/unfollow management.
- Personalized feed based on followed categories.
- All-categories discovery and filtering.
- Guided listing creation wizard.
- Listing edit, deactivate, reactivate and delete/archive flows.
- Automatic seven-day expiry.
- Private offer submission.
- Sent-offer dashboard.
- Received-offer dashboard.
- One accepted offer per listing.
- Match/contact handoff.
- Mutual completion confirmation.
- Completed-work display on public profiles.
- In-app notifications and transactional email notifications.
- Report/abuse system.
- Block system.
- Admin moderation console.
- Versioned legal documents and acceptance logging.
- Turkish and English localization.
- Light, dark and true-black themes.
- Security, monitoring, backup and audit controls.

## 2.2 Explicitly out of scope for MVP

- Platform payment processing.
- Escrow.
- Wallet/balance.
- Commission collection.
- Subscription billing.
- Invoicing or tax calculation.
- Contract generator/e-signature.
- In-platform direct messaging/chat.
- Voice/video calling.
- File uploads or attachments.
- Profile photos.
- Portfolio media uploads.
- Comments.
- Ratings/stars.
- Public reviews/testimonials submitted through platform.
- Public bidder lists.
- Public offer values.
- Public “number of offers” unless later approved; default is hidden.
- AI-generated listing text in MVP.
- Automated AI adjudication/moderation as a sole decision-maker.
- Social login in MVP.
- Native mobile application.
- Multi-currency payment handling.
- Ad network integrations.
- Marketing email automation.
- Identity-document upload.

## 2.3 Future-compatible but not implemented unless separately authorized

- Verified identity/KYC provider.
- Organizations/teams.
- Paid promoted listings.
- Premium subscriptions.
- Native mobile apps.
- In-platform messaging.
- Reputation/endorsement system.
- API access.
- AI-assisted listing drafting.

The architecture may leave clean extension points but MUST NOT expose unfinished UI for future features.

---

# 3. Roles and Permissions

## 3.1 `GUEST`

Can:
- view landing page;
- view public active listing pages;
- view public inactive listing archive pages unless owner deleted/privatized them;
- view public profiles;
- view legal pages;
- switch language/theme;
- register/login.

Cannot:
- follow categories;
- create listings;
- submit offers;
- see private user data;
- see offers;
- report unless authenticated (to limit abuse).

## 3.2 `USER`

Single normal role. Can act as listing owner and offeror simultaneously across different listings.

Requires verified email and phone before:
- publishing first listing;
- submitting an offer;
- revealing match contact information.

## 3.3 `MODERATOR`

Can review reports, hide content, apply reversible listing/user restrictions and review audit data relevant to moderation. Cannot read unnecessary private identity fields.

## 3.4 `ADMIN`

Can manage categories, templates, users, reports, legal document versions, moderation, feature flags and system configuration within least-privilege boundaries.

## 3.5 `SECURITY_ADMIN`

Optional high-privilege administrative permission set for security events and sensitive operational actions. Mandatory MFA. Must be separated from normal moderation where practicable.

---

# 4. Core Domain Invariants

These are database/application invariants, not UI suggestions.

1. A listing has exactly one owner.
2. A user cannot submit an offer to their own listing.
3. Only `ACTIVE` listings accept offers.
4. Each listing activation lasts at most exactly 7 × 24 hours from `last_activated_at` unless manually deactivated, matched or deleted earlier.
5. `first_published_at` is immutable after first publication.
6. Reactivation changes `last_activated_at` and `active_until`, never `first_published_at`.
7. A listing can have at most one accepted offer/match.
8. Offers are visible only to the offeror, listing owner and authorized admins/moderators when necessary.
9. One user may have at most one `PENDING` offer for a specific listing.
10. A rejected offer may be followed by a new offer while the listing remains active.
11. A pending offer blocks another offer from the same user to the same listing.
12. A user may withdraw a pending offer, but cannot resubmit during the same listing activation cycle. Reactivation creates a new activation cycle and permits a new offer.
13. When an offer is accepted, all other pending offers are atomically transitioned to `REJECTED_OTHER_SELECTED`.
14. Accepted offer -> match; listing becomes `MATCHED` and stops accepting offers.
15. Platform acceptance is not represented as final legal service-contract formation.
16. A completed engagement appears publicly only after **both parties** confirm completion.
17. Accepted but not mutually completed engagements never appear in the public completed-work section.
18. Followed categories are visible only to the account owner and authorized system logic; never public.
19. User legal/private identity data is never returned by public APIs.
20. User-uploaded binary files do not exist anywhere in the product.
21. User-generated content cannot contain HTML markup that is interpreted as HTML, Markdown rendering or emojis.
22. Deleted user-facing content may be retained only according to explicit legal/security retention policy; it must immediately stop being publicly accessible.
23. Admin actions that affect accounts/content must create immutable audit events.
24. All state transitions must be server-authorized and transactionally safe.

---

# 5. Listing Lifecycle State Machine

## 5.1 Listing states

- `DRAFT`
- `ACTIVE`
- `INACTIVE_EXPIRED`
- `INACTIVE_OWNER`
- `MATCHED`
- `COMPLETED`
- `CANCELLED_MATCH`
- `DELETED`
- `HIDDEN_MODERATION`

## 5.2 Transitions

`DRAFT -> ACTIVE`  
First publish. Set `first_published_at = now`, `last_activated_at = now`, `active_until = now + 7 days`, `activation_seq = 1`.

`ACTIVE -> INACTIVE_EXPIRED`  
Automatic scheduled transition when `active_until <= now` and no accepted offer.

`ACTIVE -> INACTIVE_OWNER`  
Owner manually deactivates.

`INACTIVE_EXPIRED|INACTIVE_OWNER -> ACTIVE`  
Owner reactivates; increment `activation_seq`, set `last_activated_at = now`, `active_until = now + 7 days`. Preserve first publication date.

`ACTIVE -> MATCHED`  
One offer accepted transactionally.

`MATCHED -> COMPLETED`  
Both participants have confirmed completion.

`MATCHED -> CANCELLED_MATCH`  
Both users mutually cancel the match, or admin applies a documented technical/moderation correction. No public completed-work record.

`DRAFT|INACTIVE_EXPIRED|INACTIVE_OWNER -> DELETED`  
Owner deletes. Active listing should first deactivate atomically. Matched/completed listing cannot be fully deleted from integrity records; user-facing listing content can be redacted/archived subject to policy.

`* -> HIDDEN_MODERATION`  
Admin/moderator hides content; preserve prior state for potential restoration.

## 5.3 Expiry effect on offers

When listing transitions from `ACTIVE` to inactive due to expiry or owner deactivation:
- all `PENDING` offers become `EXPIRED_LISTING`;
- users are notified;
- those expired offers do not block future offers after the listing is reactivated;
- historical offer records remain visible in the involved users' private dashboards.

---

# 6. Offer and Match State Machines

## 6.1 Offer states

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `REJECTED_OTHER_SELECTED`
- `WITHDRAWN`
- `EXPIRED_LISTING`
- `VOID_MODERATION`

## 6.2 Offer rules

Required offer fields:
- offer message: plain text, 50–3000 characters;
- proposed budget: optional; if provided, fixed numeric amount or range + currency;
- estimated delivery: optional numeric + unit (`DAYS`, `WEEKS`, `MONTHS`);
- `created_at`, `updated_at` internal timestamps.

Offer editing:
- A `PENDING` offer may be edited until the owner accepts/rejects it.
- Editing does not create a second offer row; it creates an offer revision event and updates current values.
- The owner sees “updated” timestamp.

Offer rejection:
- Owner may reject with an optional private reason from a predefined list plus optional 500-character text.
- Rejection allows the same user to submit a new offer if listing is still active.

Offer withdrawal:
- Offeror may withdraw while pending.
- Withdrawal prevents another offer from that user during the same `activation_seq`; this is an anti-spam rule.

Offer acceptance:
- Must run in a DB transaction with row lock/unique constraints.
- Verify listing is active, not expired, owner matches current user, no accepted match exists.
- Mark selected offer `ACCEPTED`.
- Mark listing `MATCHED`.
- Create engagement/match.
- Reject all other pending offers atomically.
- Emit notifications after transaction commit.

## 6.3 Match/contact handoff

On successful acceptance:
- both parties see a private match page;
- the page contains listing summary, accepted offer snapshot and clear platform disclaimer;
- each party sees the other party's public profile identity plus approved contact channel(s);
- verified email is the baseline contact method;
- phone/WhatsApp may be revealed only if the owner of that phone enabled `reveal_phone_after_match` in settings;
- neither phone nor email is ever exposed on public profile/listing pages;
- user-facing copy explicitly says the platform does not process or secure payments and the parties should independently document scope, price, milestones, tax/invoice obligations and payment method.

---

# 7. Completion Model

An accepted match is private and does not appear as completed work.

Each side has `completion_status`:
- `NOT_MARKED`
- `MARKED_COMPLETE`
- `DISPUTES_COMPLETION`

Flow:
1. Either party clicks “Mark as completed.”
2. Other party receives notification.
3. Other party can confirm or indicate that the work is not complete.
4. Only `MARKED_COMPLETE + MARKED_COMPLETE` transitions engagement to `COMPLETED`.
5. No star rating, review, comment or quality score is requested.
6. If completion is disputed, the platform does not adjudicate the commercial dispute. It keeps the match private and shows guidance to resolve the issue directly.
7. Admin may intervene only for platform integrity (fraud, abuse, accidental state corruption, legal request), not to decide contract performance.

Public completed-work card contains only:
- listing title snapshot;
- category;
- completion month/year or date according to privacy decision below;
- counterparty public display name/link, unless either party has deleted their account, in which case show “Former user” / localized equivalent.

Do not expose accepted price unless a future explicit requirement authorizes it.

---

# 8. Account Registration, Identity and Onboarding

## 8.1 Required registration fields

### Step A — credentials
- email address;
- password;
- password confirmation.

### Step B — private identity
- legal first name;
- legal last name;
- date of birth;
- country of residence;
- city of residence;
- mobile phone with country code.

### Step C — public identity
- public display name, default generated from legal name but editable;
- unique handle (`3–30` chars, lowercase letters/numbers/underscore/hyphen, reserved-word protection);
- short About text optional during signup, max 1000 chars;
- professional focus categories (select 1–10) to initialize follows.

### Step D — verification
- verify email via short-lived signed token;
- verify phone via OTP;
- account cannot publish or offer until both verified.

### Step E — required acknowledgements
Separate checkboxes; no pre-checked values:
- Terms of Use accepted.
- Privacy/KVKK Notice acknowledged.
- Marketplace/Matching Disclaimer acknowledged.
- “I am at least 18 years old” confirmed.

Optional marketing consent MUST be separate and default off; marketing messaging is disabled in MVP.

## 8.2 Password policy

- minimum 12 characters;
- maximum 128;
- allow password managers and paste;
- do not require arbitrary periodic password changes;
- reject known compromised/common passwords when a privacy-preserving local/common-password list can be used;
- hash using Argon2id configuration compatible with current OWASP guidance or Better Auth's secure scrypt default if Argon2 native dependency is not operationally viable; if Argon2id is used, benchmark parameters in production environment and document them;
- never log plaintext passwords or reset tokens.

## 8.3 Account recovery

- generic responses to prevent email enumeration;
- reset tokens single-use and short-lived;
- password reset revokes all other sessions by default;
- notify user of password change;
- optional TOTP 2FA for users; mandatory for admin/security-admin.

## 8.4 Public avatar

No image upload. Generate deterministic textual avatar from initials:
- `Emir Dede` -> `ED`;
- 1–2 letters maximum;
- use accessible contrast tokens;
- never use external avatar services.

## 8.5 Private vs public data

Public by default:
- display name;
- handle;
- initials avatar;
- About;
- professional social/portfolio links;
- completed work;
- city/country may be displayed only if user explicitly enables `show_location`; default off.

Always private:
- legal name if different from display name;
- date of birth;
- email;
- phone;
- followed categories;
- login/security events;
- legal acceptance records;
- moderation/security metadata.

---

# 9. User Profile Requirements

Profile is intentionally minimal.

Sections:
1. identity header: initials avatar, display name, handle;
2. About: max 1000 chars;
3. professional links;
4. completed work.

No sections for:
- follower/following counts;
- reviews;
- star score;
- badges that imply platform guarantee;
- public email/phone;
- public category follows;
- public offer history;
- accepted but unfinished work.

## 9.1 Social/portfolio links

Allow maximum 10 links. Supported explicit types:
- personal website/portfolio;
- GitHub;
- GitLab;
- LinkedIn;
- Stack Overflow;
- Behance;
- Dribbble;
- X;
- YouTube;
- other professional URL.

Rules:
- HTTPS only except localhost in development;
- block `javascript:`, `data:`, IP-literal/private-network abuse and malformed schemes;
- render with `rel="noopener noreferrer nofollow ugc"` as appropriate;
- never fetch URL previews server-side;
- never embed external content;
- URL label may be user-defined plain text max 40 chars, no emoji.

---

# 10. Category Taxonomy and Follow System

The taxonomy is admin-managed and translation-aware. Categories use immutable stable keys and localized labels.

## 10.1 Seed top-level categories

1. `web-development` — Web Development
2. `mobile-development` — Mobile Development
3. `desktop-development` — Desktop Development
4. `backend-api` — Backend & API
5. `frontend-ui` — Frontend Engineering
6. `ai-ml` — AI & Machine Learning
7. `data-engineering` — Data Engineering & Analytics
8. `devops-cloud` — DevOps & Cloud
9. `cybersecurity` — Cybersecurity
10. `qa-testing` — QA & Testing
11. `ui-ux-design` — UI/UX Design
12. `automation-integrations` — Automation & Integrations
13. `database` — Database Engineering
14. `game-development` — Game Development
15. `it-systems-network` — IT, Systems & Network
16. `computer-hardware` — Computer Hardware & Technical Support
17. `embedded-iot` — Embedded & IoT
18. `blockchain` — Blockchain Engineering
19. `technical-consulting` — Technical Consulting
20. `other-technology` — Other Technology

Admin can create/deactivate/reorder categories; deleting a category with historical data is forbidden. Deactivation hides it from new listing/follow selection while preserving history.

## 10.2 Following

- Users can follow any number from 0 to all active categories.
- Category management page supports “Follow all,” “Unfollow all,” select many and per-category toggle.
- Followed categories are private.
- Onboarding may initialize follows based on selected interests.
- If user follows 0 categories, their `Following` feed shows an empty-state explaining how to follow categories; the `All` feed remains available.

---

# 11. Feed, Discovery and Search

## 11.1 Authenticated home feed

Route: `/{locale}/feed`

Top-level modes:
- `Following`
- `All`

Category filter panel:
- desktop: compact left/upper filter surface;
- mobile: accessible drawer/sheet;
- searchable category list;
- multi-select;
- clear filters.

Default sort:
1. `first`: `last_activated_at DESC` for freshness;
2. tie-breaker `id DESC`.

No opaque algorithmic personalization beyond category follows/explicit filters in MVP.

## 11.2 Listing card

Display:
- title;
- category;
- 1–2 line plain-text summary;
- budget label if supplied;
- approximate timeline if supplied;
- owner display name + initials;
- **first published date**;
- when reactivated, may additionally show “Reactivated X ago” while always preserving first date;
- expiry relative label, e.g. “Active for 3 more days.”

Do not display:
- identities of offerors;
- offer texts;
- public comments;
- bid competition metrics.

## 11.3 Search

MVP search is text/category based:
- listing title;
- summary;
- category;
- technology tags.

Use PostgreSQL full-text search/trigram indexes; do not introduce external search infrastructure for MVP.

Input max 100 chars; debounced client UX but server-authoritative query; cursor pagination.

---

# 12. Guided Listing Creation Wizard

Route: `/{locale}/listings/new`

Goal: turn vague user intent into a complete, useful text-only listing without requiring AI.

## 12.1 Wizard principles

- autosave draft after validated step changes;
- clear step progress;
- no huge single form;
- conditional questions based on category;
- defaults supplied when safe;
- examples shown as helper text, not prefilled deceptive claims;
- user must explicitly review final listing before publishing;
- draft can be resumed;
- no user files/images;
- all text plain text;
- emoji rejected at field validation level.

## 12.2 Core steps

### Step 1 — Category
Required primary category and optional subcategory/technology tags (max 8).

### Step 2 — What needs to be achieved?
Required:
- title: 20–120 chars;
- short summary: 80–280 chars;
- detailed scope: 200–6000 chars.

Prompt users toward outcome language, not vague “need app.”

### Step 3 — Project context
Required/conditional fields:
- project type: new build / improvement / bug fix / migration / integration / consulting / audit / maintenance;
- current stage: idea / requirements ready / design ready / existing code/product / production system;
- target platforms relevant to category;
- known technologies optional;
- required integrations optional.

### Step 4 — Deliverables
Schema-driven checklist + custom plain-text field. Examples vary by category.

### Step 5 — Constraints and quality expectations
- must-have requirements;
- nice-to-have requirements optional;
- security/privacy constraints optional;
- performance constraints optional;
- deployment environment optional.

### Step 6 — Time
Required timeline mode:
- specific target date;
- duration estimate;
- flexible/negotiable.

Reject dates in the past.

### Step 7 — Budget/engagement
Required budget mode:
- `FIXED_EXACT`
- `FIXED_RANGE`
- `HOURLY_EXACT`
- `HOURLY_RANGE`
- `NEGOTIABLE`
- `REQUEST_GUIDANCE`

If numeric mode:
- positive amount;
- ISO 4217 currency code;
- range min <= max;
- sane upper-bound validation against numeric overflow, not arbitrary business censorship.

Copy must say the platform does not collect or guarantee payment.

### Step 8 — Working preferences
Optional:
- remote/onsite/hybrid if relevant;
- preferred communication language(s): tr/en;
- timezone expectations;
- availability/meeting constraints.

### Step 9 — Review & publish
Show exact public rendering preview. Required confirmations:
- content contains no confidential secrets or personal contact information;
- listing complies with Acceptable Use Policy;
- user understands publication expires after seven days;
- user understands platform provides matching only.

Publish is a server transaction.

## 12.3 Category-specific question examples

### Web Development
- site/application type;
- authentication needed?;
- admin panel needed?;
- payments needed?;
- external APIs?;
- expected traffic band;
- deployment target known?;
- SEO importance.

### Mobile Development
- iOS/Android/both;
- native/cross-platform/no preference;
- backend exists?;
- push notifications?;
- store publication expected?;
- device capabilities required.

### AI & ML
- task type: classification/generation/RAG/vision/speech/recommendation/forecasting/other;
- data exists?;
- data sensitivity;
- model/API preference;
- evaluation metric;
- inference environment;
- privacy/local processing requirement.

### Cybersecurity
Only defensive/authorized work is allowed. Ask:
- system owner authorization confirmed?;
- scope type: review/hardening/pentest with written authorization/secure coding/compliance;
- target environment;
- testing window;
- excluded systems.

Listings requesting unauthorized access, credential theft, malware deployment or evasion are prohibited.

---

# 13. Listing Owner Dashboard

Route: `/{locale}/dashboard/listings`

Tabs:
- Active
- Inactive
- Matched
- Completed
- Drafts

Each row/card shows:
- title;
- status;
- first published date;
- current activation date;
- active-until countdown if active;
- private received-offer count;
- actions allowed by current state.

Actions:
- edit;
- deactivate;
- reactivate;
- delete where allowed;
- view offers;
- view match/completion.

Reactivation confirmation states:
- listing will be active for another seven days;
- first publication date will remain unchanged;
- previous expired offers will not automatically reactivate.

---

# 14. Sent and Received Offers Dashboards

## 14.1 Sent offers

Route: `/{locale}/dashboard/offers/sent`

Filters:
- Pending
- Accepted
- Rejected
- Withdrawn
- Expired

Each item:
- listing title/link;
- listing status;
- offer status;
- submitted date;
- updated date;
- offer message preview;
- budget/timeline if supplied.

## 14.2 Received offers

Route: `/{locale}/dashboard/offers/received`

Grouped by listing. Only listing owner can access.

Offer comparison UI may show each offer to owner but MUST NOT expose one offer to another offeror. Avoid gamified ranking. Sort default newest first; optional budget/timeline sort permitted.

Owner actions:
- view full offer;
- accept;
- reject;
- navigate to public profile.

Acceptance modal includes matching disclaimer and one-final-offer confirmation.

---

# 15. Notifications

## 15.1 In-app notification events

- email verified;
- phone verified;
- new offer received;
- offer updated;
- offer rejected;
- offer accepted;
- other offer rejected because another was selected;
- offer expired due listing inactivity;
- listing expires in 24 hours;
- listing expired;
- listing reactivated;
- completion requested;
- completion confirmed;
- completion disputed;
- match mutually cancelled;
- security event: new sign-in, password change, email/phone change, 2FA change;
- moderation action.

## 15.2 Email

Transactional email only in MVP. No marketing campaign system.

Email preferences may disable non-security/non-essential transactional notifications where legally/operationally acceptable, but security alerts and required legal notices cannot be disabled.

Email templates must exist in Turkish and English and use the user's selected locale.

---

# 16. Block and Report Features

## 16.1 Blocking

A user can block another user.

Effects:
- blocked user cannot submit new offers to blocker-owned listings;
- each side's listings can be hidden from the other's personalized feed;
- existing accepted match is not silently destroyed; contact visibility follows the historical match and account safety rules;
- admin still retains audit capability;
- blocking is private.

## 16.2 Reporting

Authenticated users can report:
- listing;
- profile;
- offer received by them.

Reasons:
- scam/fraud;
- spam;
- harassment/abuse;
- illegal/unauthorized activity;
- privacy/personal data exposure;
- intellectual property concern;
- misleading content;
- prohibited service;
- other.

Report text max 2000 chars, plain text, no file attachments.

Moderation outcomes:
- no action;
- warning;
- content hidden;
- listing deactivated;
- temporary user restriction;
- account suspension;
- permanent ban;
- legal/security escalation.

---

# 17. Acceptable Use and Prohibited Content

Prohibit at minimum:
- illegal services;
- unauthorized system access;
- credential theft/phishing;
- malware/ransomware creation or deployment intended for harm;
- bypassing security without authorization;
- trafficking stolen data;
- fraudulent financial schemes;
- impersonation;
- harassment/hate/threats;
- doxxing or publication of third-party sensitive personal data;
- copyright/IP infringement requests;
- academic cheating where the service is to submit another person's assessed work as their own;
- spam/SEO link schemes unrelated to legitimate work;
- contact information placed in listings to bypass the intended private matching flow;
- secrets/API keys/passwords/source credentials in user text.

Defensive cybersecurity work is allowed only when the listing clearly asserts authorization.

---

# 18. Legal and Compliance Architecture

**This section is product/engineering guidance, not a substitute for Turkish legal counsel. Production launch requires counsel to review final entity-specific documents and platform classification.**

## 18.1 Required public legal pages

Routes under both locales:

- `/{locale}/legal/terms` — Terms of Use / Kullanım Koşulları
- `/{locale}/legal/privacy` — KVKK Privacy Notice / Privacy Notice
- `/{locale}/legal/cookies` — Cookie Policy
- `/{locale}/legal/matching-disclaimer` — Matching, Payment and Contract Disclaimer
- `/{locale}/legal/acceptable-use` — Acceptable Use Policy
- `/{locale}/legal/data-retention` — User-facing retention summary
- `/{locale}/legal/contact` — Legal/Corporate Contact Information

Internal documents not necessarily public:
- Personal Data Processing Inventory;
- Retention and Destruction Policy;
- Data Breach Response Plan;
- Access Control Policy;
- Supplier/Data Processor Register;
- Cross-Border Transfer Register;
- Incident Response Plan;
- Backup/Restore Policy.

## 18.2 Terms must cover

- operator legal entity details;
- eligibility and 18+;
- account accuracy/security responsibilities;
- one-account policy unless approved otherwise;
- listing and offer rules;
- matching-only role;
- acceptance does not itself constitute a platform-guaranteed final service contract;
- no platform payment/escrow;
- taxes/invoices/legal compliance remain users' responsibility;
- no guarantee of identity, payment, work quality, availability or outcome;
- prohibited content;
- moderation/suspension powers with reasonable process;
- IP ownership: users retain their content, grant limited hosting/display license;
- third-party links;
- service availability;
- limitation of liability only to maximum extent permitted by law;
- indemnity language only if counsel approves and applicable;
- termination/deletion;
- governing law/jurisdiction subject to mandatory consumer rules where applicable;
- document version/effective date.

## 18.3 Matching disclaimer — required meaning

Every signup and offer-acceptance flow must communicate substantially:

> The platform provides discovery and matching only. It does not receive, hold or transfer payment; does not provide escrow; does not become a party to the service relationship; does not guarantee users, payments, deliverables or outcomes; and does not resolve commercial disputes. Acceptance of an offer in the platform opens a private match/contact handoff and does not by itself represent a platform-guaranteed final service contract. Users are responsible for independently agreeing scope, price, milestones, payment, invoice/tax obligations and any written contract.

Turkish and English versions must be legally reviewed before launch.

## 18.4 KVKK/privacy requirements

Engineering MUST implement:
- purpose limitation;
- data minimization;
- access control;
- documented retention;
- deletion/anonymization workflows;
- data subject request workflow;
- security incident workflow;
- data processor inventory;
- cross-border transfer review.

T.C. identity number is specifically excluded from MVP. If future hosting/processor choices transfer personal data abroad, the legal transfer mechanism under KVKK Article 9 must be completed before production transfer.

## 18.5 International data transfer deployment rule

Production must not silently send personal data to foreign processors merely because a SaaS integration is convenient.

Before any foreign hosting, email, error-monitoring, analytics, auth, SMS or support processor is enabled:
1. identify data fields sent;
2. document processor role and location;
3. document lawful transfer mechanism;
4. execute required contracts/standard contractual mechanism where applicable;
5. update privacy notice and processor register;
6. obtain legal approval;
7. minimize/redact data sent.

Prefer Türkiye-resident infrastructure/processors for private identity data when commercially and technically viable.

## 18.6 ETBIS/e-commerce classification gate

The product is deliberately designed so commercial negotiation and final contract/payment occur outside the platform. Nonetheless, before launch legal counsel MUST decide whether the actual implemented flow makes the operator an electronic-commerce intermediary/service provider subject to ETBIS or related marketplace obligations. This cannot be decided by UI copy alone.

A production checklist item `LEGAL_ETBIS_CLASSIFICATION_APPROVED=true` is required before public launch.

## 18.7 Required operator config

Do not invent legal entity values. Production build/deployment must require:
- `PRODUCT_NAME`
- `LEGAL_ENTITY_NAME`
- `LEGAL_ENTITY_TYPE`
- `LEGAL_ADDRESS`
- `LEGAL_SUPPORT_EMAIL`
- `LEGAL_PRIVACY_EMAIL`
- `LEGAL_PHONE`
- `MERSIS_NO` if applicable
- `TAX_NO` if applicable
- `KEP_ADDRESS` if applicable
- `TERMS_EFFECTIVE_DATE`
- `PRIVACY_EFFECTIVE_DATE`

Production CI must fail if placeholder values remain.

---

# 19. Data Retention Baseline

Final retention durations require legal validation, but engineering must support configurable policies and deletion jobs.

Default engineering baseline:

- active sessions: session lifetime + immediate revoke support;
- email/phone verification tokens: <= 15 minutes for OTP, <= 1 hour for email verify, single use;
- password reset tokens: <= 30 minutes, single use;
- raw application/security access logs with IP: 90 days unless incident/legal hold requires longer;
- account security-event metadata: 12 months;
- notification content: 12 months then delete/aggregate;
- rejected/withdrawn/expired offer content: 24 months, then delete or minimize unless legal hold;
- deleted listing content: remove from public immediately; purge content within 30 days unless linked to active legal/security investigation or completed historical record requiring minimal preservation;
- completed engagement minimal record: retain while account exists plus policy period required for legitimate/legal purposes;
- legal acceptance records: retain for account lifetime plus applicable limitation/legal-defense period determined by counsel;
- backups: encrypted rolling backups, retention 35 days baseline; deletion propagates through backup expiry rather than unsafe surgical backup editing.

Implement legal hold flag that prevents automated purge only for documented authorized cases.

---
# 20. Software Requirements Specification (SRS)

## 20.1 Functional requirements — authentication

`FR-AUTH-001` User can register with email/password and required private/public profile fields.  
`FR-AUTH-002` Email must be verified before marketplace actions.  
`FR-AUTH-003` Phone must be verified before marketplace actions.  
`FR-AUTH-004` User can sign in/out and revoke sessions.  
`FR-AUTH-005` User can request password reset without account enumeration.  
`FR-AUTH-006` User can change password with current-password verification or verified recovery flow.  
`FR-AUTH-007` User can enable TOTP 2FA; admins must enable it.  
`FR-AUTH-008` Sensitive profile/contact changes require recent authentication.  
`FR-AUTH-009` User can view recent successful/failed sign-in security events where feasible.  
`FR-AUTH-010` Account suspension immediately blocks authenticated marketplace actions.

## 20.2 Functional requirements — profile

`FR-PROFILE-001` Public profile uses generated initials avatar only.  
`FR-PROFILE-002` About text max 1000 chars.  
`FR-PROFILE-003` User can manage up to 10 professional links.  
`FR-PROFILE-004` Public profile exposes only mutually completed work.  
`FR-PROFILE-005` Accepted but incomplete work is private.  
`FR-PROFILE-006` Category follows are never public.  
`FR-PROFILE-007` Private identity/contact fields are available only to account owner and strictly authorized backend/admin workflows.

## 20.3 Functional requirements — categories/feed

`FR-CAT-001` User can follow/unfollow any active category.  
`FR-CAT-002` User can follow all/unfollow all.  
`FR-CAT-003` Feed has Following and All modes.  
`FR-CAT-004` User can filter feed by one or more categories.  
`FR-CAT-005` Category translations exist for both locales.  
`FR-CAT-006` Admin can create, edit, order and deactivate categories without destroying historical references.

## 20.4 Functional requirements — listings

`FR-LIST-001` Verified user can create draft via guided wizard.  
`FR-LIST-002` Draft autosaves.  
`FR-LIST-003` User can publish listing free of charge.  
`FR-LIST-004` Active duration cannot exceed seven days per activation.  
`FR-LIST-005` System automatically expires listing.  
`FR-LIST-006` First publication date is immutable and public.  
`FR-LIST-007` Owner can reactivate inactive listing for another seven-day window.  
`FR-LIST-008` Owner can delete eligible listing.  
`FR-LIST-009` Owner can edit listing before match; material edits generate revision event.  
`FR-LIST-010` Listing cannot accept new offers after match/expiry/deactivation.  
`FR-LIST-011` No file/image upload exists.  
`FR-LIST-012` User content is plain text and emoji-free.

## 20.5 Functional requirements — offers

`FR-OFFER-001` Verified user can submit private offer to another user's active listing.  
`FR-OFFER-002` Other users cannot see offer.  
`FR-OFFER-003` Same user cannot have two pending offers on same listing.  
`FR-OFFER-004` Rejected offer may be followed by a new offer while listing remains active.  
`FR-OFFER-005` Pending offer may be edited and withdrawn.  
`FR-OFFER-006` Withdrawal blocks resubmit for same activation cycle.  
`FR-OFFER-007` Owner can accept exactly one offer.  
`FR-OFFER-008` Acceptance rejects remaining pending offers atomically.  
`FR-OFFER-009` Sent and received dashboards retain historical states.  
`FR-OFFER-010` Offer text is private plain text.

## 20.6 Functional requirements — completion

`FR-WORK-001` Accepted offer creates private engagement.  
`FR-WORK-002` Contact handoff becomes visible only to both matched parties.  
`FR-WORK-003` Either party can request completion.  
`FR-WORK-004` Both parties must confirm to publish completed work.  
`FR-WORK-005` Commercial dispute is not adjudicated by platform.  
`FR-WORK-006` Mutual cancellation prevents public completion record.

## 20.7 Functional requirements — moderation/admin

`FR-ADM-001` Reports can be triaged.  
`FR-ADM-002` Admin can hide listing/profile content and suspend account.  
`FR-ADM-003` Admin actions are auditable.  
`FR-ADM-004` Sensitive admin access uses least privilege and MFA.  
`FR-ADM-005` Admin can manage legal document versions.  
`FR-ADM-006` Admin can manage listing wizard schemas/categories without code change for simple taxonomy/text changes.

---

# 21. Non-Functional Requirements

## 21.1 Availability and resilience

- Target production availability: 99.9% monthly excluding announced maintenance.
- RPO target: <= 1 hour for primary transactional database where provider supports it.
- RTO target: <= 4 hours.
- Daily restore-point verification or provider evidence; quarterly manual restore drill minimum.
- Critical scheduled expiry job must be idempotent and safe to rerun.

## 21.2 Performance budgets

At p75 real-user mobile where measurable:
- LCP <= 2.5 s;
- INP <= 200 ms;
- CLS <= 0.1.

Backend targets under normal load:
- simple authenticated read p95 <= 400 ms;
- standard write p95 <= 700 ms excluding third-party email/SMS latency;
- feed/search p95 <= 700 ms;
- no synchronous email/SMS send on critical DB transaction path.

Page JS budget:
- server-render wherever possible;
- client components only for genuine interaction;
- no heavy animation libraries unless justified and bundle-tested;
- no analytics SDK in MVP that materially increases privacy or performance risk.

## 21.3 Accessibility

Target WCAG 2.2 AA.

Mandatory:
- semantic landmarks;
- complete keyboard support;
- visible focus;
- minimum contrast AA;
- touch targets meeting WCAG 2.2 expectations;
- form labels and described errors;
- status changes announced with ARIA live regions where needed;
- no color-only state communication;
- `prefers-reduced-motion` support;
- skip link;
- modal focus trapping/return;
- theme controls keyboard/screen-reader accessible.

## 21.4 Browser/device support

Support current and previous major versions of:
- Chrome/Chromium;
- Edge;
- Firefox;
- Safari;
- iOS Safari;
- Android Chrome.

Responsive widths must work from 320 px through large desktop.

## 21.5 Maintainability

- TypeScript strict with no `any` unless justified in code comment.
- Domain rules live in domain/service layer, not duplicated across UI.
- No god files over approximately 500 logical lines without documented reason.
- No route component containing database/business logic directly.
- Migrations are forward-only and reviewed.
- Dead code/features removed, not commented out.
- Public APIs/types documented.

---

# 22. System Architecture Document (SAD)

## 22.1 Architecture style

Start as a **modular monolith** with strong domain boundaries, not microservices.

Reasons:
- product scope is coherent;
- transactional offer/listing invariants benefit from one relational database;
- lower operational complexity;
- future extraction remains possible through service boundaries/events.

Modules:
- `auth`
- `identity`
- `profiles`
- `categories`
- `listings`
- `offers`
- `engagements`
- `notifications`
- `moderation`
- `legal`
- `security-audit`
- `admin`
- `i18n`

## 22.2 Runtime components

1. Next.js web application.
2. PostgreSQL primary database.
3. Background/scheduled worker process or trusted scheduler endpoint for expiry, notification outbox and retention jobs.
4. Transactional email provider adapter.
5. SMS/OTP provider adapter.
6. Error/observability backend with PII redaction.

No object storage is required for user content.

## 22.3 Application layering

```text
app/routes + UI
  -> application services/use cases
     -> domain policies/state machines
        -> repositories
           -> PostgreSQL

external providers
  <- adapter interfaces
     <- application services
```

Never allow UI components to issue arbitrary SQL or provider calls.

## 22.4 Repository structure

```text
/
  app/
    [locale]/
      (public)/
      (auth)/
      (app)/
    admin/
    api/
  src/
    modules/
      auth/
      identity/
      profiles/
      categories/
      listings/
      offers/
      engagements/
      notifications/
      moderation/
      legal/
      security/
      admin/
    components/
      ui/
      domain/
    lib/
      db/
      auth/
      crypto/
      validation/
      rate-limit/
      email/
      sms/
      observability/
      i18n/
    config/
    styles/
  db/
    schema/
    migrations/
    seeds/
  messages/
    tr.json
    en.json
  tests/
    unit/
    integration/
    e2e/
    security/
    accessibility/
  scripts/
  docs/
  public/
    brand/
  .github/workflows/
```

`public/` may contain application-owned static SVG/logo assets only; never user uploads.

## 22.5 Server rendering and authorization

- Public listing/profile pages may be server-rendered/cached with explicit invalidation.
- Private dashboards are dynamic and authenticated.
- Authorization is always enforced server-side.
- Client-hidden buttons are not authorization.
- Sensitive server actions validate session, CSRF/origin, input and ownership.

## 22.6 Transactions

Use explicit DB transactions for:
- listing publish/reactivate;
- offer submit with uniqueness check;
- offer accept + reject others + match create + listing state update;
- completion finalization;
- account deletion/anonymization state change;
- moderation actions affecting multiple records.

Use DB uniqueness/check constraints so concurrency bugs cannot create duplicate accepted offers.

---

# 23. Database Model

Use UUIDv7 or equivalent time-sortable UUID generated server-side where supported. Store all timestamps in UTC `timestamptz`.

## 23.1 `users`

Auth framework base identity.

Key fields:
- `id uuid pk`
- `email citext unique not null`
- `email_verified boolean`
- `status enum ACTIVE|SUSPENDED|DELETED`
- auth-framework-managed fields
- `created_at`
- `updated_at`

Phone may be Better Auth plugin-managed or linked through private identity table. Do not duplicate authoritative verification state.

## 23.2 `user_private_identity`

Access only through identity service.

- `user_id uuid pk fk users`
- `legal_first_name_enc bytea not null`
- `legal_last_name_enc bytea not null`
- `date_of_birth_enc bytea not null`
- `country_code char(2) not null`
- `city_code/text not null`
- `phone_e164_enc bytea not null`
- `phone_hmac bytea unique not null` for equality/duplicate checks without decrypting all rows
- `phone_verified_at timestamptz`
- `created_at`
- `updated_at`

Application-level encryption keys MUST be external secrets, not DB-resident.

## 23.3 `profiles`

- `user_id uuid pk`
- `handle citext unique`
- `display_name varchar(80)`
- `about varchar(1000)`
- `show_location boolean default false`
- `reveal_phone_after_match boolean default false`
- `locale enum tr|en`
- `theme enum LIGHT|DARK|BLACK`
- `created_at`
- `updated_at`

## 23.4 `profile_links`

- `id uuid pk`
- `user_id fk`
- `type enum`
- `label varchar(40)`
- `url text`
- `sort_order smallint`
- unique `(user_id, sort_order)`
- max 10 enforced in application + transaction.

## 23.5 `categories`

- `id uuid pk`
- `key varchar(80) unique immutable`
- `parent_id uuid nullable`
- `is_active boolean`
- `sort_order integer`
- `created_at`
- `updated_at`

## 23.6 `category_translations`

- `category_id`
- `locale`
- `name`
- `description`
- pk `(category_id, locale)`

## 23.7 `category_follows`

- `user_id`
- `category_id`
- `created_at`
- pk `(user_id, category_id)`

Never expose as public profile relation.

## 23.8 `listing_templates`

- `id uuid pk`
- `category_id`
- `schema_version integer`
- `locale`
- `schema_json jsonb`
- `is_active`
- `created_at`

Schemas are validated against an internal JSON schema so admin cannot inject arbitrary executable content.

## 23.9 `listings`

- `id uuid pk`
- `owner_user_id fk`
- `slug text unique`
- `status listing_status`
- `category_id fk`
- `template_schema_version int`
- `title varchar(120)`
- `summary varchar(280)`
- `scope text`
- `answers_json jsonb`
- `tags text[]` normalized/validated, max 8
- `budget_mode enum`
- `budget_currency char(3) nullable`
- `budget_min numeric(18,2) nullable`
- `budget_max numeric(18,2) nullable`
- `timeline_mode enum`
- `target_date date nullable`
- `timeline_value int nullable`
- `timeline_unit enum nullable`
- `activation_seq int default 0`
- `first_published_at timestamptz nullable`
- `last_activated_at timestamptz nullable`
- `active_until timestamptz nullable`
- `matched_at timestamptz nullable`
- `completed_at timestamptz nullable`
- `deleted_at timestamptz nullable`
- `created_at`
- `updated_at`

Checks:
- title/summary lengths;
- active listing must have active timestamps;
- budget range validity;
- owner cannot be null;
- `active_until <= last_activated_at + interval '7 days'`.

Indexes:
- `(status, last_activated_at desc, id desc)`
- `(category_id, status, last_activated_at desc)`
- `(owner_user_id, status)`
- GIN/trigram/search index for approved searchable fields.

## 23.10 `listing_revisions`

Immutable snapshot/event for published-content changes:
- `id`
- `listing_id`
- `editor_user_id`
- `revision_no`
- `snapshot_json`
- `created_at`

Do not keep sensitive secrets if moderation removes them; provide redaction mechanism for security incidents.

## 23.11 `listing_status_events`

- `id`
- `listing_id`
- `from_status`
- `to_status`
- `reason`
- `actor_type USER|SYSTEM|ADMIN`
- `actor_id nullable`
- `activation_seq`
- `created_at`

## 23.12 `offers`

- `id uuid pk`
- `listing_id fk`
- `offeror_user_id fk`
- `listing_activation_seq int`
- `status offer_status`
- `message text`
- `budget_currency char(3) nullable`
- `budget_min numeric nullable`
- `budget_max numeric nullable`
- `estimated_duration_value int nullable`
- `estimated_duration_unit enum nullable`
- `rejection_code nullable`
- `rejection_note text nullable`
- `created_at`
- `updated_at`
- `resolved_at nullable`

Critical partial unique index:
- only one `PENDING` offer per `(listing_id, offeror_user_id)`.

Critical accepted-offer uniqueness:
- partial unique index on `listing_id` where `status='ACCEPTED'`.

## 23.13 `offer_revisions`

- `id`
- `offer_id`
- `revision_no`
- `snapshot_json`
- `created_at`

## 23.14 `engagements`

- `id uuid pk`
- `listing_id unique fk`
- `accepted_offer_id unique fk`
- `owner_user_id fk`
- `freelancer_user_id fk`
- `status MATCHED|COMPLETION_PENDING|COMPLETED|CANCELLED`
- `matched_at`
- `completed_at nullable`
- `cancelled_at nullable`
- immutable listing/offer public snapshot fields needed for historical display

## 23.15 `engagement_completion_marks`

- `engagement_id`
- `user_id`
- `status MARKED_COMPLETE|DISPUTES_COMPLETION`
- `updated_at`
- pk `(engagement_id, user_id)`

Ensure only the two engagement participants can create rows.

## 23.16 `blocks`

- `blocker_user_id`
- `blocked_user_id`
- `created_at`
- pk pair
- check blocker != blocked.

## 23.17 `reports`

- `id`
- `reporter_user_id`
- `target_type`
- `target_id`
- `reason_code`
- `details text`
- `status OPEN|REVIEWING|RESOLVED|DISMISSED`
- `assigned_admin_id nullable`
- `created_at`
- `resolved_at nullable`

## 23.18 `notifications`

- `id`
- `user_id`
- `type`
- `payload_json` containing IDs, never unnecessary sensitive text
- `read_at nullable`
- `created_at`

## 23.19 `legal_documents`

- `id`
- `document_key`
- `locale`
- `version`
- `content_hash`
- `effective_at`
- `published_at`
- `is_current`

Content may live in version-controlled source; DB stores published metadata/hash.

## 23.20 `legal_acceptances`

- `id`
- `user_id`
- `document_key`
- `document_version`
- `content_hash`
- `accepted_at`
- unique enough to prevent accidental duplicates.

## 23.21 `security_events`

- `id`
- `user_id nullable`
- `event_type`
- `ip_enc_or_tokenized` according to retention policy
- `user_agent_summary`
- `risk_metadata jsonb` redacted
- `created_at`
- `expires_at`

## 23.22 `admin_audit_log`

Append-only:
- `id`
- `admin_user_id`
- `action`
- `target_type`
- `target_id`
- `reason_code`
- `before_hash/safe_summary`
- `after_hash/safe_summary`
- `created_at`

Do not put decrypted private identity values in audit logs.

---

# 24. API / Server Action Contract

Prefer typed server actions/use-case endpoints for app-native mutations; REST-style route handlers for externally useful HTTP semantics and scheduled/internal jobs. Never expose raw DB models directly.

## 24.1 Public reads

- `GET /api/public/listings?cursor=&category=&q=`
- `GET /api/public/listings/:slug`
- `GET /api/public/profiles/:handle`
- `GET /api/public/categories`

Public response DTOs must be whitelisted field-by-field.

## 24.2 Authenticated reads

- `GET /api/me`
- `GET /api/me/feed`
- `GET /api/me/follows`
- `GET /api/me/listings`
- `GET /api/me/offers/sent`
- `GET /api/me/offers/received`
- `GET /api/me/engagements`
- `GET /api/me/notifications`
- `GET /api/me/security-events`

## 24.3 Mutations

- create/update profile;
- add/remove profile link;
- follow/unfollow category;
- create/update/publish/deactivate/reactivate/delete listing;
- submit/update/withdraw offer;
- accept/reject offer;
- mark/dispute completion;
- mutual cancel match;
- report/block/unblock;
- security/account changes.

All mutation schemas must be centralized in shared Zod/Valibot-style validation definitions and revalidated server-side.

## 24.4 Error contract

Do not return raw exceptions.

Standard shape:

```json
{
  "error": {
    "code": "OFFER_ALREADY_PENDING",
    "messageKey": "errors.offerAlreadyPending",
    "fieldErrors": {}
  }
}
```

User-facing translated message is resolved by locale. Security-sensitive errors must be generic.

---

# 25. Concurrency and Database Safety

The following must be proven with integration tests:

## 25.1 Two owners cannot accept two offers concurrently

Use transaction + row lock on listing and partial unique accepted-offer index. One succeeds, the other gets deterministic `LISTING_ALREADY_MATCHED`.

## 25.2 Two identical offer submissions

DB unique constraint prevents duplicate pending offers even if client double-clicks or retries.

## 25.3 Expiry vs acceptance race

Acceptance must verify `active_until > transaction_time`. Scheduled expiry and acceptance must produce only one valid terminal result. If expired first, accept fails. If accept commits first, expiry job skips matched listing.

## 25.4 Reactivation vs duplicate retry

Use idempotency key for publish/reactivate actions where network retry can duplicate transitions. `activation_seq` increments once.

---

# 26. Security Architecture

Target OWASP ASVS 5.0.0 Level 2 for the web application, with additional attention to privacy and administrative functions.

## 26.1 Threat model

Primary threats:
- account takeover;
- credential stuffing;
- bot/spam account creation;
- fake listings/scams;
- private offer leakage;
- IDOR/BOLA authorization failure;
- SQL injection;
- XSS via text/URLs;
- CSRF;
- SSRF via portfolio links/previews;
- session theft/fixation;
- brute-force OTP;
- abusive admin access;
- PII exfiltration;
- accidental logging of PII/tokens;
- supply-chain dependency compromise;
- race conditions around offers;
- malicious links;
- mass scraping;
- email/SMS abuse/cost attacks;
- legal-document acceptance integrity failure;
- backup leakage;
- cross-border data transfer by telemetry vendors.

## 26.2 Authentication controls

- Better Auth current secure patch line.
- Email verification required.
- Phone OTP required before marketplace actions.
- Rate limit login by IP + normalized account identifier with privacy-conscious storage.
- Progressive CAPTCHA/challenge after suspicious failures; do not require CAPTCHA on every normal login.
- MFA mandatory admin.
- Secure password hash.
- Generic auth responses where enumeration risk exists.
- New-login notification.
- Session list/revoke.
- Rotate sessions after privilege/authentication changes.

## 26.3 Session/cookie controls

- `Secure` production cookies.
- `HttpOnly` session cookie.
- `SameSite=Lax` minimum; stricter where compatible.
- narrow path/domain.
- no session tokens in localStorage.
- CSRF/origin validation for state-changing requests.
- inactivity/absolute session lifetime documented.
- re-auth for email, phone, password, account deletion and admin privilege changes.

## 26.4 Authorization

Every read/write use case explicitly checks:
- authentication;
- resource ownership/participation;
- resource current state;
- role/permission;
- block/moderation status.

Never accept `owner_user_id`/`offeror_user_id` from client as authority; derive actor from session.

Create dedicated authorization tests for attempts to:
- read another user's private offers;
- read another user's followed categories;
- read private identity;
- accept offer on another user's listing;
- complete engagement by non-participant;
- access admin routes as user.

## 26.5 Input and output handling

- Plain text only.
- No HTML rendering of UGC.
- Normalize Unicode to NFC before validation/storage where appropriate.
- Reject control characters except newline/tab policy.
- Reject emojis using a maintained shared validator covering `Extended_Pictographic`, regional indicators, keycap/variation sequences.
- Escape text at rendering layer.
- Validate URLs with allowlisted protocols.
- Never fetch user-provided URLs server-side.

## 26.6 Content Security Policy

Production CSP should start close to:
- `default-src 'self'`
- `script-src 'self'` plus framework-required nonce/hash approach; avoid `'unsafe-inline'` where possible
- `style-src 'self'` plus nonce/hash as needed
- `img-src 'self' data:` only for app-owned assets if data URIs truly needed
- `font-src 'self'`
- `connect-src 'self'` plus explicitly documented provider endpoints
- `frame-ancestors 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `object-src 'none'`

Set additional headers:
- HSTS production;
- `X-Content-Type-Options: nosniff`;
- Referrer Policy `strict-origin-when-cross-origin` or stricter;
- Permissions Policy denying unnecessary sensors/camera/mic/geolocation.

## 26.7 Rate limiting

Use distributed/shared rate limiter in production or database-backed limiter if single region. Suggested starting limits subject to load testing:
- registration: 5/IP/hour;
- email verify resend: 3/account/15 min, 10/day;
- SMS OTP request: 3/phone/hour, 10/IP/hour, daily cap;
- OTP verify: 5 attempts/challenge;
- login: adaptive, e.g. 10/IP/10 min plus account bucket;
- offer submit: 20/user/hour;
- listing publish/reactivate: 20/user/day;
- report: 10/user/hour;
- search: 120/user or IP/minute with burst handling.

Do not rely on rate limiting as sole authorization/security control.

## 26.8 Private data encryption

- TLS in transit.
- Provider/storage encryption at rest.
- Application-level encryption for high-impact private identity fields.
- Separate encryption key from DB credentials.
- Envelope/key-rotation design.
- HMAC blind index for phone equality/uniqueness.
- Do not encrypt fields needed for public search.
- Backups encrypted.

## 26.9 Secrets

- `.env.example` contains names only, no real values.
- secrets from deployment secret manager.
- no secrets in Git, source maps, client bundles, logs or screenshots.
- secret scanning in CI.
- key rotation documented.

## 26.10 Admin security

- separate `/admin` authorization middleware plus server checks;
- mandatory TOTP MFA;
- no shared admin accounts;
- audit all sensitive actions;
- require reason for suspension/hide/private-data access;
- private identity reveal only through explicit privileged action with audit event;
- avoid bulk export features in MVP;
- admin session shorter than normal user session.

## 26.11 Logging/observability

Never log:
- passwords;
- OTP codes;
- reset/verification tokens;
- session cookies/tokens;
- full legal names in security logs unless essential;
- full phone/email unnecessarily;
- offer text/listing content by default;
- decrypted private identity.

Use structured logs with correlation IDs and redaction.

## 26.12 Dependency/security pipeline

CI gates:
- lockfile integrity;
- dependency vulnerability scan;
- secret scan;
- SAST;
- lint/typecheck;
- tests;
- build;
- Playwright smoke;
- OWASP ZAP baseline against staging where available;
- container/image scan if containerized.

Critical/high exploitable findings block release unless documented and formally accepted.

## 26.13 Incident response

Maintain runbook:
1. detect/triage;
2. contain;
3. preserve evidence;
4. rotate credentials/keys if needed;
5. assess affected data/users;
6. restore/eradicate;
7. legal/privacy notification assessment;
8. user communication;
9. postmortem and control improvement.

KVKK breach workflow must support the applicable notification timeline; internal target is escalation immediately and legal assessment well inside 72 hours.

---

# 27. Privacy-by-Design Controls

1. No T.C. identity number in MVP.
2. No gender/birthplace collection.
3. No public email/phone.
4. No public followed categories.
5. No third-party social embeds.
6. No server-side URL previews.
7. No file uploads.
8. No ad trackers.
9. No marketing cookies in MVP.
10. Essential cookies only where possible.
11. No analytics until privacy review; prefer self-hosted, aggregated analytics if later added.
12. Data subject export excludes other users' private data.
13. Account deletion workflow separates immediate public disappearance from legal/retention purge.
14. Moderation logs use identifiers, not copied private content where unnecessary.
15. Production telemetry must redact PII.

---

# 28. Account Deletion and Data Subject Workflows

## 28.1 User account deletion

Flow:
- require recent authentication;
- explain consequences;
- require typed confirmation;
- immediately disable login/new marketplace activity;
- hide public profile/listings according to state;
- cancel active non-matched listings and expire offers;
- matched/completed historical integrity records are minimized rather than corruptly deleted;
- queue deletion/anonymization per retention policy;
- send confirmation email.

## 28.2 Data export

Authenticated export request generates structured JSON/CSV-like downloadable artifact only if/when feature is implemented securely. Since the product forbids user file uploads, this is system-generated data export, not user content upload.

Include only user's own data and data they are lawfully entitled to receive. Offers received from others require careful redaction/authorization treatment.

## 28.3 Correction

Allow user to correct public profile and eligible private identity fields with reverification when changing email/phone.

---

# 29. UI/UX Design Specification

## 29.1 Visual direction

Keywords:
- premium;
- restrained;
- highly legible;
- modern technology;
- editorial precision;
- generous whitespace;
- subtle depth;
- minimal borders;
- no decorative clutter;
- no gradients unless extremely restrained and brand-approved;
- no emoji;
- no stock illustrations;
- no user imagery.

The interface should feel like a mature professional product, not a generic marketplace template.

## 29.2 Themes

Exactly three user-selectable themes:

### `LIGHT`
- near-white canvas, e.g. `#F7F7F5`/design token equivalent;
- white elevated surfaces;
- near-black text;
- muted neutral borders.

### `DARK`
- charcoal canvas, not pure black;
- elevated dark-gray surfaces;
- off-white text.

### `BLACK`
- true/near-black canvas `#000` or design-token equivalent;
- surfaces almost black with subtle separation;
- optimized for OLED/maximum darkness.

Theme must persist per authenticated profile and local preference for guests. Theme switching causes no flash of wrong theme.

## 29.3 Accent color

Use one restrained brand accent, configurable through design tokens. Do not hard-code numerous category colors. Status colors can use semantic success/warning/danger tokens with accessible contrast.

## 29.4 Typography

Use one professional sans-serif family self-hosted or system-first. Recommended baseline: Geist/Inter-like family; self-host WOFF2 if license permits. Do not fetch Google Fonts at runtime in production.

Scale:
- Display: 48–64 desktop, responsive smaller mobile;
- H1: 36–48;
- H2: 28–36;
- H3: 22–28;
- body: 15–17;
- metadata: 12–14.

Maintain readable line lengths: roughly 60–75 characters for long text.

## 29.5 Spacing/grid

- 4/8 px base rhythm.
- Content max width around 1200–1280 px.
- Text-heavy detail width 760–860 px.
- Cards use 16–24 px internal spacing depending viewport.
- Avoid nesting cards inside cards unless information hierarchy genuinely requires it.

## 29.6 Radius and shadows

- restrained radius: 10–16 px primary surfaces;
- pills only for tags/status/filter controls;
- subtle shadows in light mode; primarily border/elevation contrast in dark themes;
- no excessive glassmorphism.

## 29.7 Motion

- 120–220 ms typical transitions;
- opacity/transform only where possible;
- no parallax or distracting decorative animation in core marketplace flows;
- reduced-motion disables nonessential movement.

## 29.8 Icons and logo

- SVG only.
- Use Lucide or equivalent professional outline SVG icons for common actions; tree-shake individual icons.
- Create an original custom wordmark/symbol for final brand; do not copy marketplace logos.
- No icon-as-emoji.
- Every icon-only button has accessible label/tooltip.

## 29.9 Header

Desktop authenticated:
- brand/logo;
- Feed;
- Categories;
- Create Listing primary action;
- notifications;
- theme/language under account/menu;
- user initials menu.

Mobile:
- compact top bar;
- accessible bottom navigation only if UX testing proves superior; otherwise drawer/menu;
- primary create action remains easy to reach.

## 29.10 Empty states

Text-first, no illustrations required. Explain next action clearly:
- no followed categories;
- no active listings;
- no sent offers;
- no received offers;
- no completed work.

## 29.11 Forms

- labels always visible, placeholders supplementary only;
- inline validation after blur/submit, not aggressive on first keystroke;
- character counters for About, listing fields, offer message;
- server errors map to field/global errors;
- destructive actions require confirmation.

---

# 30. Route and Information Architecture

Always use locale-prefixed public/app routes for deterministic i18n and canonical URLs.

## 30.1 Public

- `/tr`, `/en`
- `/{locale}/listings`
- `/{locale}/listings/{slug}`
- `/{locale}/u/{handle}`
- `/{locale}/login`
- `/{locale}/register`
- `/{locale}/forgot-password`
- legal routes defined earlier.

## 30.2 Authenticated

- `/{locale}/feed`
- `/{locale}/categories`
- `/{locale}/listings/new`
- `/{locale}/listings/{id}/edit`
- `/{locale}/dashboard`
- `/{locale}/dashboard/listings`
- `/{locale}/dashboard/offers/sent`
- `/{locale}/dashboard/offers/received`
- `/{locale}/dashboard/work`
- `/{locale}/work/{engagementId}`
- `/{locale}/notifications`
- `/{locale}/settings/profile`
- `/{locale}/settings/account`
- `/{locale}/settings/security`
- `/{locale}/settings/notifications`
- `/{locale}/settings/privacy`

## 30.3 Admin

Admin URLs need not be locale-prefixed if admin UI uses fixed operational language or has own i18n, but authorization must be explicit:
- `/admin`
- `/admin/users`
- `/admin/listings`
- `/admin/reports`
- `/admin/categories`
- `/admin/templates`
- `/admin/legal`
- `/admin/audit`
- `/admin/security`
- `/admin/system`

---

# 31. i18n Requirements

## 31.1 Engine

Use a mature Next.js-compatible i18n approach such as `next-intl` with server/client support.

Locales:
- `tr`
- `en`

Default locale can be selected from browser preference for first visit, but canonical route always includes locale.

## 31.2 Rules

- No user-facing hard-coded strings in components/services.
- No mixed-language fallback visible in production.
- Every message key must exist in both locale files.
- CI script compares locale key sets and fails on missing/extra keys unless explicitly allowlisted.
- Dates/numbers/currency use `Intl` APIs.
- Store enums as stable language-neutral values; translate labels at render time.
- User-generated content is not machine-translated.
- Legal documents have independent version per locale but equivalent legal meaning.
- Email templates localized.
- Validation/error messages localized via keys.
- SEO metadata localized.

## 31.3 Translation QA

Automated:
- key parity;
- no raw translation keys rendered;
- no unexpected Turkish strings on English routes except user-generated content/proper names;
- no unexpected English UI strings on Turkish routes except unavoidable technology names.

E2E screenshot suite for both locales on:
- landing;
- feed;
- listing detail;
- profile;
- listing wizard review;
- offers dashboard;
- settings;
- legal pages.

---

# 32. Emoji Prohibition

This is a hard product rule.

## 32.1 UI/source

CI script scans user-facing locale strings and seed content for emoji sequences. Exceptions only for technical test fixtures specifically testing rejection.

## 32.2 User-generated content

Reject emoji in:
- display name;
- handle naturally by charset;
- About;
- link labels;
- listing title/summary/scope/answers/tags;
- offer/rejection/report text.

Server-side validator is authoritative; client repeats same rule for UX.

Do not silently strip emoji on submit. Show localized error asking user to remove them.

---

# 33. SEO and GEO/Discovery

Even though the product is application-heavy, public listing/profile content should be discoverable safely.

## 33.1 SEO

- unique title/meta description for public active listings;
- canonical localized URLs;
- `hreflang` tr/en for platform-generated pages where content differs only by UI/legal translation; user-generated listing text itself is not translated, so do not falsely create translated duplicate content;
- sitemap for public indexable pages;
- robots policy;
- structured data only when semantically accurate; do not label as job employment posting if it is project/freelance work and schema would be misleading;
- inactive listing pages may remain indexable with clear inactive status for a limited archive strategy; deleted pages 410/404 as appropriate;
- private dashboard/admin pages `noindex`.

## 33.2 Privacy/search-engine rules

- never index private contact details;
- never put email/phone in HTML metadata;
- follow pages/dashboards private;
- completed-work cards avoid sensitive commercial data.

---

# 34. Caching Strategy

- Public category list: cache with tag invalidation on admin update.
- Public active listing detail: short cache/revalidate with immediate tag invalidation on edit/status change.
- Public profile: cache with invalidation on profile/completed-work change.
- Feed: authenticated personalized, do not globally cache across users.
- Private dashboards: no shared caching.
- Legal pages: long cache by version + invalidation on publish.

Never cache private responses in public CDN caches.

---

# 35. Background Jobs

Jobs are idempotent and observable.

1. `expire-listings` — every 10–15 minutes; transition due active listings and pending offers.
2. `listing-expiry-reminders` — daily/hourly enough to send 24h warning once.
3. `notification-outbox` — process transactional notification delivery.
4. `retention-purge` — daily; delete/minimize expired records.
5. `security-retention-purge` — daily.
6. `orphan-consistency-check` — daily/weekly read-only integrity monitor.
7. `backup-verification` — operational process, not necessarily app cron.

Each job uses distributed lock/advisory lock or idempotent selection to avoid double work.

---

# 36. Notification Outbox Pattern

Database transaction writes business state and an `outbox_events` row. A worker sends email/in-app notifications after commit.

Benefits:
- no email send before transaction commit;
- retries do not duplicate state;
- provider outages do not block offer acceptance.

`outbox_events`:
- `id`
- `type`
- `aggregate_type`
- `aggregate_id`
- `payload_json` minimal
- `status PENDING|PROCESSING|SENT|FAILED|DEAD`
- `attempt_count`
- `next_attempt_at`
- `created_at`

Use exponential backoff and dead-letter visibility.

---

# 37. Email and SMS Adapter Requirements

## 37.1 Email

Interface:

```ts
interface TransactionalEmailProvider {
  send(input: {
    to: string;
    template: EmailTemplateKey;
    locale: 'tr' | 'en';
    variables: Record<string, string>;
    idempotencyKey: string;
  }): Promise<ProviderResult>;
}
```

No vendor-specific code outside adapter.

## 37.2 SMS

```ts
interface SmsProvider {
  sendOtp(input: {
    phoneE164: string;
    code: string;
    locale: 'tr' | 'en';
    idempotencyKey: string;
  }): Promise<ProviderResult>;
}
```

Production provider choice must pass privacy/cross-border/legal review. Development uses a safe local mock that never sends real SMS and exposes codes only in development-only test tooling.

---

# 38. Validation Rules

Centralize shared constants.

- About: 0–1000.
- Listing title: 20–120.
- Listing summary: 80–280.
- Listing scope: 200–6000.
- Offer message: 50–3000.
- Rejection note: 0–500.
- Report details: 20–2000 when `other`, optional for predefined reasons otherwise.
- Link label: 1–40.
- Max profile links: 10.
- Max listing tags: 8.
- Max tag length: 32.
- Search query: 1–100.
- Display name: 2–80.
- Handle: 3–30.

All free-text:
- normalize line endings;
- trim outer whitespace;
- collapse pathological repeated invisible whitespace;
- reject null bytes/control characters;
- reject emojis;
- no HTML/Markdown interpretation.

---

# 39. Slugs and Identifiers

Listing slug:
- generated from title + short stable suffix, e.g. `premium-ios-finance-app-a1b2c3`;
- lowercase ASCII slugification;
- immutable after first publish to preserve URLs even if title changes;
- DB ID is never security secret.

Profile handle:
- mutable with cooldown, e.g. once every 30 days;
- keep redirect/history table to avoid broken links where practical;
- reserve `admin`, `api`, `support`, `legal`, `security`, `www`, `login`, `register`, brand names and offensive/system terms.

---

# 40. Design Tokens

Create CSS variables semantically, not component-specific magic numbers.

Minimum token families:
- `--bg-canvas`
- `--bg-surface`
- `--bg-elevated`
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--border-subtle`
- `--border-strong`
- `--accent`
- `--accent-contrast`
- `--success`
- `--warning`
- `--danger`
- `--focus-ring`
- radius scale
- spacing scale
- shadow scale

All three themes define every semantic token; components never branch on theme names for colors.

---

# 41. Required UI Components

Build reusable accessible primitives/domain components:

- Button variants.
- IconButton.
- TextInput.
- TextArea + character count.
- Select/Combobox.
- Checkbox/Switch.
- RadioGroup.
- Dialog/AlertDialog.
- Drawer/Sheet.
- Tooltip.
- Tabs.
- Badge/status chip.
- Toast.
- Pagination/cursor load-more.
- EmptyState.
- Skeleton.
- AvatarInitials.
- ListingCard.
- ListingStatusBadge.
- OfferCard.
- ProfileLink.
- CategoryPicker.
- CategoryFollowToggle.
- WizardStepper.
- LegalConsentGroup.
- SecurityEventRow.

Component stories/docs are encouraged; Storybook optional, not required if it bloats delivery.

---

# 42. Admin Console Specification

## 42.1 Dashboard

Show operational counts without exposing unnecessary PII:
- active listings;
- expired last 24h;
- offers last 24h;
- matches last 24h;
- open reports;
- suspended users;
- failed background jobs;
- notification dead letters.

## 42.2 User moderation

Search by public handle/email only when privileged; avoid showing decrypted identity by default.

Actions:
- warn;
- restrict listing publication;
- restrict offering;
- temporary suspend until date;
- permanent suspend;
- unsuspend;
- view moderation history.

Every action needs reason.

## 42.3 Listings

- filter status/category/reports;
- hide/unhide;
- inspect revisions;
- no content editing masquerading as user; moderation hides or requests correction rather than silently rewriting user text.

## 42.4 Categories/templates

- CRUD with deactivation rules;
- translations required before activation;
- schema validation preview;
- publish version;
- rollback to previous active template version for future drafts only; existing published listing keeps schema version.

## 42.5 Legal documents

- publish new version metadata/content from source-controlled file or admin flow;
- cannot mutate historical published version in place;
- record hash/effective time;
- optionally require users to re-acknowledge material new terms based on admin flag.

---

# 43. Moderation and Abuse Detection

MVP uses deterministic/rule-based signals, not opaque AI enforcement.

Signals:
- registration velocity;
- phone/email verification abuse;
- repeated identical listings/offers;
- banned phrases/known scam patterns;
- excessive outbound links;
- contact details inside listing content;
- prohibited credential/secret patterns;
- high report rate;
- repeated suspended-account indicators where legally and technically appropriate.

Automated actions should generally:
- throttle;
- require verification/challenge;
- queue moderation;
- temporarily prevent publication.

Do not permanently ban solely on one probabilistic heuristic without human review unless behavior is mechanically undeniable (e.g. exploit attempt).

---

# 44. Tests — Required Test Pyramid

## 44.1 Unit tests

Cover:
- listing state transition policy;
- seven-day date calculation;
- immutable first publication date;
- offer resubmission rules;
- completion policy;
- category follow logic;
- URL validator;
- emoji validator;
- budget validation;
- slug generation;
- privacy DTO mapping;
- legal document acceptance logic.

Target >= 90% branch coverage for domain-policy modules, not meaningless global coverage gaming.

## 44.2 Integration tests with real PostgreSQL

Use disposable test DB/container.

Must cover:
- schema constraints;
- migrations up from empty;
- publish/reactivate transaction;
- expiry job;
- duplicate offer concurrency;
- concurrent acceptance;
- unauthorized private offer read;
- block effects;
- mutual completion;
- account deletion state changes;
- legal acceptance persistence;
- notification outbox idempotency.

## 44.3 E2E Playwright

Critical journeys in both locales and primary themes where relevant:

1. register -> verify -> onboarding -> feed.
2. create listing wizard -> publish -> public detail.
3. second user follows category -> sees listing.
4. second user submits offer.
5. owner sees private received offer.
6. unrelated user cannot see offer.
7. owner rejects -> offeror resubmits.
8. owner accepts one offer -> others rejected.
9. match contact handoff.
10. both complete -> public completed work appears.
11. accepted incomplete work does not appear publicly.
12. listing expiry -> inactive -> reactivate -> first date unchanged.
13. owner deletes eligible listing.
14. report/block flow.
15. theme persistence.
16. language persistence/localized metadata.
17. account security/password reset.
18. admin moderation.

## 44.4 Security tests

Automated/manual:
- IDOR attempts on all private resources;
- CSRF tests;
- XSS payloads rendered inert;
- malicious URL schemes rejected;
- SQL injection payloads inert;
- duplicate/concurrency races;
- session fixation/regeneration;
- enumeration resistance;
- OTP brute force/rate limits;
- admin privilege escalation;
- CSP header validation;
- cookie flags;
- sensitive cache headers;
- log redaction.

## 44.5 Accessibility tests

- axe automated page checks;
- full keyboard critical flows;
- focus order;
- screen-reader labels;
- error announcement;
- modal focus;
- theme contrast;
- reduced motion.

## 44.6 Visual regression

Capture stable screenshots for key pages in:
- light;
- dark;
- black;
- mobile and desktop;
- tr/en.

Do not accept clipping, overflow, untranslated UI, layout shift or hidden focus.

## 44.7 Performance tests

- Lighthouse CI budgets for public landing/listing/profile and authenticated feed sample.
- k6/Artillery-style backend test for feed, listing read, offer submit and acceptance concurrency.
- DB query explain plans for feed/search/dashboard queries before release.

---

# 45. Test Data Strategy

- deterministic factories;
- no real personal data in test fixtures;
- Turkish and English Unicode names but no emoji;
- synthetic phone numbers reserved for testing;
- seeded users: owner, freelancerA, freelancerB, unrelated, moderator, admin;
- clock abstraction/fake time for expiry tests;
- test each listing state.

Production database MUST never be used for automated tests.

---

# 46. Risk Register and Mitigations

| ID | Risk | Severity | Mitigation |
|---|---|---:|---|
| R-01 | T.C. identity/private data breach | Critical | Do not collect TCKN in MVP; minimize PII; app encryption; access controls; logging redaction |
| R-02 | Private offers leaked to competitors | Critical | Ownership authorization tests; DTO allowlists; no shared cache; ASVS testing |
| R-03 | Two offers accepted due race | High | DB partial unique index + row lock transaction + concurrency test |
| R-04 | Scam/fraud users | High | Email+phone verify; reports; blocking; moderation; rate limits; warning copy |
| R-05 | Users assume platform guarantees payment | High | Repeated matching disclaimer; no wallet/payment UI; legal review |
| R-06 | “Accept offer” interpreted as final contract | High | Explicit contact-handoff meaning; legal copy; terms; counsel review |
| R-07 | ETBIS/platform classification wrong | High | Prelaunch legal classification gate; implement based on actual flow |
| R-08 | Foreign SaaS causes unlawful transfer | Critical | processor register; no provider enabled without transfer review; favor local processing |
| R-09 | Link SSRF/malware | High | never server-fetch user links; HTTPS validation; safe rel; reports |
| R-10 | XSS from plain text | High | no HTML/Markdown render; output escaping; CSP |
| R-11 | Credential stuffing | High | strong auth, rate limits, MFA option, challenge, security alerts |
| R-12 | OTP abuse cost spike | Medium/High | rate limits, quotas, provider abstraction, abuse monitoring |
| R-13 | Listing expiration job fails | Medium | idempotent job, monitoring, query fallback treating `active_until<=now` as not active even before state job runs |
| R-14 | Deleted data remains public/cache | High | status-first authorization; cache invalidation; purge jobs; 410/404 |
| R-15 | Legal terms changed without evidence | High | immutable versions + hash + acceptance record |
| R-16 | Admin abuse | Critical | MFA, least privilege, audit, reason codes, private-data reveal logging |
| R-17 | User posts secrets/contact info | Medium/High | warning, validators/detection, report, moderation, no previews |
| R-18 | Translation drift | Medium | key parity CI + E2E locale checks |
| R-19 | Dark themes inaccessible | Medium | semantic tokens + automated/manual contrast tests |
| R-20 | Generic/cheap-looking UI | Medium | custom design system, restrained components, visual QA, no off-the-shelf template |
| R-21 | Scope creep into messaging/payments | High | explicit non-goals; feature flags; agent rules |
| R-22 | Dependency vulnerabilities | High | LTS versions, lockfile, recurring scans, security patch policy |
| R-23 | Backup cannot restore | Critical | restore drills, RPO/RTO, encrypted backups |
| R-24 | Account deletion breaks completed history | Medium | anonymize/minimize identity while preserve relational integrity |
| R-25 | Public completed work falsely claimed | High | bilateral completion required |
| R-26 | Offer spam after withdraw | Medium | one offer per activation cycle after withdrawal |
| R-27 | User follows private category data accidentally exposed | High | separate private endpoint; explicit authorization test |
| R-28 | Excessive personal data collection justified as security | High | data inventory/review; purpose limitation; no TCKN/gender/birthplace baseline |
| R-29 | Contact handoff exposes unwanted phone | High | verified email baseline; phone reveal opt-in |
| R-30 | Moderation wrongly decides commercial disputes | Medium | moderation scope limited to platform abuse/integrity; no service-quality adjudication |

---

# 47. Coding Agent Rules

These rules are mandatory throughout implementation.

## 47.1 Execution discipline

1. Read this complete file first.
2. Create a task ledger mapped to Work Packages below.
3. Do not mark a work package complete until its acceptance criteria/tests pass.
4. Do not stop at scaffolding.
5. Do not leave TODO/FIXME/placeholders in production paths unless explicitly listed in `docs/known-limitations.md` and approved.
6. Never report “100% complete” without test/build evidence.
7. If a requirement is technically impossible, document exact blocker and implement the safest closest behavior; do not silently omit.
8. Preserve state/data through migrations; never delete production-like data to simplify schema changes.
9. Do not introduce services/libraries merely for convenience when native/simple solution suffices.
10. Prefer explicit, boring, testable code for business rules.

## 47.2 Security rules

- Never weaken authorization to make tests pass.
- Never disable TLS/cookie/CSP security in production config.
- Never log secrets/PII.
- Never create an admin backdoor.
- Never put private data in client bundles.
- Never trust client-calculated ownership/state.
- Never use `dangerouslySetInnerHTML` for UGC.
- Never server-fetch user portfolio URLs.
- Never accept file uploads through hidden/general endpoints.
- Never store T.C. identity number in MVP.

## 47.3 UX rules

- No emoji.
- No fake testimonials/users/listings in production seed.
- No stock avatars.
- No excessive modal chains.
- No horizontal scrolling at 320px.
- No hover-only essential action.
- No placeholder-only labels.
- No inaccessible custom select/dialog.
- No animation that ignores reduced motion.

## 47.4 Architecture rules

- No microservices in MVP.
- No repository/service abstraction ceremony that adds no value, but domain boundaries remain explicit.
- No business state machine duplicated in React components.
- No direct provider SDK calls scattered across modules; use adapters.
- No giant `utils.ts` dumping ground.
- No barrel exports that create circular dependency problems.

## 47.5 Database rules

- Every migration reviewed and testable from empty DB.
- Every destructive migration needs explicit strategy.
- Use constraints for invariants where possible.
- Index actual query patterns.
- No unbounded `SELECT *` feeds.
- Cursor pagination for growing collections.
- Timestamps UTC.

## 47.6 Production readiness rules

- `.env.example` complete.
- `README.md` complete.
- setup/migrate/seed/test/build commands deterministic.
- no dev-only secrets/URLs in production.
- health check present.
- background jobs documented.
- legal placeholders block production deployment.

---

# 48. Agent Skills / Competencies Required

The coding agent must behave as a senior cross-functional implementation agent and explicitly apply these capabilities:

1. Product/business-rule modeling.
2. TypeScript/React/Next.js architecture.
3. PostgreSQL relational design and concurrency control.
4. Authentication/session security.
5. OWASP web security review.
6. Privacy/KVKK-aware data minimization.
7. Accessible UI engineering (WCAG 2.2 AA).
8. Responsive premium design implementation.
9. i18n architecture and locale QA.
10. Automated unit/integration/E2E testing.
11. Performance profiling and SQL query optimization.
12. CI/CD and secure configuration.
13. Observability/log-redaction design.
14. Legal-document versioning implementation without pretending to provide final legal advice.

If the agent environment supports specialized skills/tools for Next.js, security scanning, browser automation or database migrations, it should use them while keeping this specification authoritative.

---

# 49. Work Package Plan

Work packages are sequential unless noted. Every WP requires code, tests, docs and evidence.

## WP-00 — Repository audit and execution plan

Deliverables:
- inspect repository;
- record existing stack/files;
- identify conflicts with this specification;
- create `docs/implementation-ledger.md` mapping every FR/NFR to implementation/test;
- establish package/version baseline;
- no destructive changes yet.

Acceptance:
- every requirement has planned owner/module/test;
- no unknown root files deleted.

## WP-01 — Foundation and quality gates

Deliver:
- Next.js/TS/pnpm foundation;
- strict TS;
- lint/format;
- unit/E2E test harness;
- env validation;
- CI workflow;
- security headers baseline;
- theme bootstrap preventing FOUC;
- project docs.

Acceptance:
- lint, typecheck, unit smoke, build and Playwright smoke pass in CI.

## WP-02 — Design system + three themes

Deliver:
- semantic tokens;
- Light/Dark/Black themes;
- accessible UI primitives;
- typography/layout;
- initials avatar;
- SVG icon policy;
- responsive shell/header/footer.

Acceptance:
- theme screenshots desktop/mobile;
- no contrast/focus violations in core primitives;
- no emoji in UI strings.

## WP-03 — i18n foundation

Deliver:
- locale routing;
- `tr` and `en` resources;
- Intl date/number/currency helpers;
- locale switcher;
- locale parity CI;
- localized metadata/error plumbing.

Acceptance:
- test page renders both locales with zero missing keys.

## WP-04 — Database foundation

Deliver:
- PostgreSQL schema/modules;
- migrations;
- seed taxonomy;
- indexes/constraints;
- test DB tooling;
- encryption utility/key interface.

Acceptance:
- migrate from zero passes;
- schema integration tests pass;
- constraints prove critical invariants.

## WP-05 — Authentication and private identity

Deliver:
- Better Auth integration;
- email/password;
- email verify;
- phone OTP provider abstraction;
- profile/private identity split;
- 18+ validation;
- session/security settings;
- password reset;
- TOTP 2FA;
- admin MFA enforcement.

Acceptance:
- auth E2E flows pass;
- enumeration tests pass;
- private identity absent from public DTOs/client payloads;
- TCKN/gender/birthplace fields do not exist.

## WP-06 — Legal acceptance/versioning

Deliver:
- legal routes/source files;
- version metadata/hash;
- signup checkboxes;
- acceptance persistence;
- required operator config gate;
- matching disclaimer components.

Acceptance:
- registration impossible without required acknowledgements;
- historical acceptance immutable;
- production env validation fails on legal placeholders.

## WP-07 — Profiles

Deliver:
- public profile;
- About 1000 chars;
- professional links;
- initials avatar;
- profile settings;
- location privacy toggle;
- contact handoff preference.

Acceptance:
- no public private fields;
- malicious URLs rejected;
- completed-work section empty unless mutual completion exists.

## WP-08 — Categories/follows

Deliver:
- category pages;
- follow all/unfollow all;
- private follows;
- onboarding category selection;
- admin taxonomy management.

Acceptance:
- another user/API cannot obtain follows;
- inactive category behavior tested;
- translations complete.

## WP-09 — Listing wizard/drafts

Deliver:
- template schema engine;
- steps described in §12;
- autosave draft;
- category-specific questions;
- validation;
- review preview;
- plain-text/emoji restrictions.

Acceptance:
- resume draft works;
- every seeded category has usable schema;
- no file input exists;
- E2E wizard passes tr/en.

## WP-10 — Listing publication/lifecycle

Deliver:
- publish transaction;
- public detail/card;
- owner dashboard;
- edit/revision;
- deactivate/reactivate/delete;
- first-date immutability;
- seven-day expiry job;
- expiry reminder.

Acceptance:
- fake-clock integration proves exact lifecycle;
- reactivation preserves first date;
- stale active row is treated inactive when `active_until` passed even if cron delayed.

## WP-11 — Feed/discovery/search

Deliver:
- Following/All feeds;
- category filters;
- cursor pagination;
- PostgreSQL search;
- mobile filter UX;
- empty states.

Acceptance:
- privacy-safe query;
- EXPLAIN plan acceptable with seeded scale;
- p95 target met in load fixture.

## WP-12 — Offers

Deliver:
- offer modal/page;
- private sent/received dashboards;
- update/reject/withdraw/resubmit rules;
- authorization;
- revision history.

Acceptance:
- unrelated user cannot access offer even by ID guessing;
- duplicate pending offer blocked DB + app;
- rejected-resubmit and withdrawn-no-resubmit-current-cycle tested.

## WP-13 — Accept offer and match/contact handoff

Deliver:
- transactional acceptance;
- reject others;
- match page;
- contact disclosure settings;
- matching disclaimer.

Acceptance:
- concurrency test with simultaneous accepts yields exactly one match;
- contact info visible only to two participants after match;
- listing no longer accepts offers.

## WP-14 — Completion/public work history

Deliver:
- completion request/confirm/dispute;
- mutual cancel;
- public completed cards;
- privacy behavior for deleted user.

Acceptance:
- one-sided completion never public;
- bilateral completion public on both profiles;
- no rating/review UI exists.

## WP-15 — Notifications/outbox

Deliver:
- in-app notifications;
- email adapter/templates tr/en;
- outbox worker/retries;
- notification settings;
- expiry/security alerts.

Acceptance:
- business transaction succeeds if provider down;
- retry is idempotent;
- no PII leakage in payload/logs.

## WP-16 — Block/report/moderation

Deliver:
- block;
- report;
- moderator/admin queues;
- hide/suspend actions;
- moderation audit.

Acceptance:
- blocked user cannot newly offer;
- moderation action audited;
- moderator cannot arbitrarily read private identity.

## WP-17 — Admin console

Deliver:
- dashboard;
- users/listings/reports/categories/templates/legal/audit/security surfaces;
- role permissions;
- MFA gate.

Acceptance:
- privilege escalation E2E/security tests pass;
- all sensitive actions reasoned/audited.

## WP-18 — Privacy lifecycle

Deliver:
- account deletion;
- purge/minimize jobs;
- data subject request hooks;
- security log retention;
- legal hold capability;
- backup deletion documentation.

Acceptance:
- deleted user disappears publicly immediately;
- relational completed history remains integrity-safe/minimized;
- retention tests with fake clock pass.

## WP-19 — Security hardening

Deliver:
- threat-model review;
- CSP/security headers final;
- rate limits;
- bot challenge integration point;
- secret scan/SAST/dependency scan;
- ZAP staging test;
- log redaction audit;
- admin security review.

Acceptance:
- no critical/high unresolved exploitable findings;
- security checklist evidence committed under `docs/security/` without secrets.

## WP-20 — Accessibility and UX QA

Deliver:
- keyboard pass;
- axe pass;
- contrast review all themes;
- mobile 320px review;
- reduced-motion review;
- focus/error polish.

Acceptance:
- no serious/critical axe violations;
- all critical flows keyboard-completable.

## WP-21 — Performance and reliability

Deliver:
- query profiling/index tuning;
- Lighthouse CI;
- load tests;
- backup/restore procedure;
- health checks;
- background-job monitoring;
- error boundaries.

Acceptance:
- agreed performance budgets pass or documented evidence explains unavoidable deviation;
- restore drill documented.

## WP-22 — SEO/public metadata

Deliver:
- metadata;
- robots;
- sitemap;
- canonical/hreflang rules;
- archive/deletion status handling;
- noindex private/admin.

Acceptance:
- no private URLs in sitemap;
- public pages have valid canonical metadata.

## WP-23 — Full release regression

Run:
- all unit/integration/E2E;
- tr/en screenshot pass;
- Light/Dark/Black pass;
- security scans;
- accessibility;
- build from clean checkout;
- migration from empty DB;
- production env validation;
- background job smoke;
- legal config gate.

Produce `docs/release-readiness-report.md` with commands, results and remaining accepted limitations.

---

# 50. Definition of Done

The project is done only when all are true:

- all mandatory FRs implemented;
- all WPs complete;
- no placeholder screens in mandatory flow;
- no emoji in production UI/seed and emoji UGC rejected;
- no user file/image upload capability;
- no comments/reviews/ratings/chat/payment/escrow code exposed;
- listing 7-day lifecycle proven by tests;
- first publication date immutable;
- private offers cannot be read by unauthorized users;
- one pending-offer rule and rejection resubmit work;
- exactly one accepted offer per listing under concurrency;
- contact handoff private;
- mutual completion required for public work history;
- category follows private;
- profile About max 1000;
- tr/en complete;
- all three themes complete;
- admin MFA/authorization complete;
- production legal placeholders blocked;
- security/privacy scans pass release threshold;
- accessibility critical flows pass;
- clean production build succeeds;
- DB backup/restore procedure tested;
- release-readiness report exists.

---

# 51. Release Checklist

## Product
- [ ] Free registration verified.
- [ ] Free listing publication verified.
- [ ] Same account can publish and offer.
- [ ] Category following private.
- [ ] Feed Following/All modes correct.
- [ ] Seven-day expiry correct.
- [ ] Reactivation correct.
- [ ] First publication date preserved.
- [ ] Offers private.
- [ ] Rejected offer can resubmit.
- [ ] Pending offer blocks duplicate.
- [ ] One accepted offer only.
- [ ] Contact handoff correct.
- [ ] Mutual completion correct.
- [ ] Only completed work public.
- [ ] No comments/ratings/chat/payment.

## Privacy/legal
- [ ] TCKN absent.
- [ ] Gender/birthplace absent.
- [ ] Email/phone private.
- [ ] Legal docs counsel-reviewed.
- [ ] Matching disclaimer counsel-reviewed.
- [ ] KVKK processing inventory completed.
- [ ] Retention policy approved.
- [ ] Processor register complete.
- [ ] Cross-border transfer mechanism complete for every foreign processor, or no such transfers.
- [ ] ETBIS/e-commerce classification reviewed.
- [ ] Operator corporate data complete.
- [ ] Legal acceptances versioned.

## Security
- [ ] Email verified.
- [ ] Phone verified.
- [ ] Admin MFA.
- [ ] Rate limits.
- [ ] CSP/headers.
- [ ] IDOR tests.
- [ ] CSRF tests.
- [ ] XSS tests.
- [ ] Secrets scan.
- [ ] Dependency scan.
- [ ] Logs redacted.
- [ ] Backups encrypted.
- [ ] Restore tested.
- [ ] Incident runbook.

## UI/UX
- [ ] Light.
- [ ] Dark.
- [ ] Black.
- [ ] 320px.
- [ ] desktop wide.
- [ ] keyboard.
- [ ] reduced motion.
- [ ] no emoji.
- [ ] SVG icon/logo only.
- [ ] no upload controls.

## i18n
- [ ] TR complete.
- [ ] EN complete.
- [ ] no raw keys.
- [ ] locale email templates.
- [ ] Intl date/currency.
- [ ] locale screenshots.

---
# 52. Required Signup and Transactional Copy Keys

The following is product copy baseline. Counsel may refine legal wording, but implementation must preserve the meaning and separation of acknowledgements.

## 52.1 Turkish required signup acknowledgements

`legal.terms.accept`  
“Kullanım Koşulları’nı okudum ve kabul ediyorum.”

`legal.privacy.acknowledge`  
“KVKK Aydınlatma Metni’ni okudum ve kişisel verilerimin açıklanan amaçlar ve hukuki sebepler kapsamında işleneceği konusunda bilgilendirildim.”

`legal.matching.acknowledge`  
“Platformun yalnızca ilan ve eşleştirme hizmeti sunduğunu; ödeme, escrow, hizmet sözleşmesi yönetimi, teslimat garantisi veya ticari uyuşmazlık çözümü sunmadığını anlıyorum.”

`legal.age.confirm`  
“18 yaşını doldurduğumu onaylıyorum.”

## 52.2 English required signup acknowledgements

`legal.terms.accept`  
“I have read and agree to the Terms of Use.”

`legal.privacy.acknowledge`  
“I have read the Privacy Notice and have been informed about how my personal data is processed for the stated purposes and legal bases.”

`legal.matching.acknowledge`  
“I understand that the platform provides listing and matching services only and does not provide payment processing, escrow, service-contract management, delivery guarantees, or commercial dispute resolution.”

`legal.age.confirm`  
“I confirm that I am at least 18 years old.”

## 52.3 Offer submission warning

TR:  
“Teklifiniz yalnızca ilan sahibi tarafından görülebilir. İletişim bilgisi, şifre, API anahtarı veya başka bir gizli bilgi paylaşmayın. Platform ödeme almaz veya ödemenizi garanti etmez.”

EN:  
“Your offer is visible only to the listing owner. Do not include contact details, passwords, API keys, or other secrets. The platform does not receive or guarantee payment.”

## 52.4 Offer acceptance/match warning

TR:  
“Bu işlem seçilen kullanıcıyla eşleşme oluşturur ve izin verilen iletişim bilgilerini taraflara açar. Platformdaki kabul, platformun garanti ettiği bir hizmet sözleşmesi veya ödeme taahhüdü değildir. Kapsam, ücret, teslimatlar, ödeme yöntemi, fatura/vergi ve diğer ticari koşulları karşı tarafla ayrıca yazılı olarak netleştirin.”

EN:  
“This action creates a match with the selected user and reveals approved contact details to both parties. Acceptance on the platform is not a platform-guaranteed service contract or payment commitment. Agree scope, fees, deliverables, payment method, invoicing/tax obligations, and other commercial terms separately in writing with the other party.”

## 52.5 Match page persistent notice

TR:  
“Bu eşleşmeden sonraki sözleşme, ödeme ve çalışma süreci tarafların sorumluluğundadır. Platform parayı tutmaz, ödeme aktarmaz, escrow sağlamaz ve ticari uyuşmazlığı karara bağlamaz.”

EN:  
“Any contract, payment, and work process after this match is handled by the parties. The platform does not hold or transfer funds, provide escrow, or adjudicate commercial disputes.”

---

# 53. Initial Listing Template Schema Requirements

Templates are data-driven. Each question definition must include:

```ts
type ListingQuestion = {
  key: string;
  type: 'single' | 'multi' | 'shortText' | 'longText' | 'boolean' | 'number' | 'date';
  required: boolean;
  labelKey: string;
  helpKey?: string;
  options?: Array<{ value: string; labelKey: string }>;
  min?: number;
  max?: number;
  maxSelections?: number;
  condition?: {
    field: string;
    operator: 'eq' | 'in' | 'truthy';
    value?: string | string[];
  };
};
```

The schema is configuration, never executable JavaScript.

## 53.1 Seed question sets by category

### Web Development
Required:
- project type;
- web product type: corporate/site/e-commerce/web app/dashboard/portal/other;
- new vs existing;
- responsive requirement default yes;
- authentication requirement;
- admin/back-office requirement;
- external integrations;
- SEO priority;
- deployment responsibility;
- expected traffic band or unknown.

### Mobile Development
Required:
- iOS/Android/both;
- native/cross-platform/no preference;
- app type;
- backend status;
- authentication;
- push notifications;
- payments/in-app purchases if relevant;
- hardware capability requirements;
- app-store publication responsibility.

### Desktop Development
Required:
- Windows/macOS/Linux/multi-platform;
- native/cross-platform/no preference;
- offline capability;
- local database;
- updater requirement;
- installer/signing expectations;
- OS integration requirements.

### Backend & API
Required:
- greenfield/existing;
- API type REST/GraphQL/RPC/no preference;
- authentication/authorization;
- integrations;
- expected request/load band;
- database status;
- deployment/cloud context;
- observability requirement.

### AI & Machine Learning
Required:
- problem class;
- existing data yes/no;
- data volume band;
- sensitive/personal data yes/no/unknown;
- cloud API/local/self-host preference;
- target evaluation metric or success criterion;
- inference latency expectation;
- integration target.

### Data Engineering & Analytics
Required:
- source systems;
- batch/stream/both;
- expected data scale;
- warehouse/lake status;
- dashboard/BI requirement;
- data-quality expectations;
- schedule/frequency.

### DevOps & Cloud
Required:
- cloud/on-prem/hybrid;
- provider if known;
- IaC requirement;
- CI/CD status;
- container/Kubernetes status;
- monitoring/logging requirement;
- migration vs new setup.

### Cybersecurity
Required:
- explicit authorization confirmation true;
- service type;
- system ownership/authorization context;
- in-scope targets plain text without secrets;
- test window;
- production impact tolerance;
- deliverable/report expectation.

The wizard MUST refuse publication if authorization confirmation is false for penetration/security testing categories.

### QA & Testing
Required:
- application type;
- manual/automation/both;
- test levels;
- current test framework if any;
- browsers/devices;
- CI integration;
- expected deliverables.

### UI/UX Design
Although no design-file upload exists, listing can request design work. Ask:
- product type;
- new/redesign;
- required screens/flows estimate;
- existing design system yes/no;
- research requirement;
- prototype requirement;
- developer handoff expectation.

### Automation & Integrations
Required:
- systems to connect;
- API/webhook availability known/unknown;
- trigger/action description;
- run frequency;
- expected volume;
- error/retry expectation.

### Database Engineering
Required:
- database engine;
- schema new/existing;
- performance/migration/design task;
- estimated size;
- downtime tolerance;
- backup/recovery expectation.

### Game Development
Required:
- platform;
- engine if known;
- 2D/3D;
- scope type;
- multiplayer requirement;
- backend requirement;
- performance target.

### IT / Systems / Network
Required:
- remote/on-site;
- environment size band;
- OS/network technology;
- setup/troubleshooting/migration;
- permitted access context;
- expected hours/window.

### Computer Hardware / Technical Support
Required:
- device type;
- issue/service type;
- remote/on-site;
- city if on-site;
- warranty/sensitive-data warning;
- no request to share passwords.

### Embedded & IoT
Required:
- hardware/platform;
- firmware status;
- connectivity;
- power constraints;
- prototype/production stage;
- certification constraints if known.

### Blockchain Engineering
Required:
- chain/network;
- smart contract/dApp/integration/audit;
- production/testnet;
- custody/payment scope warning;
- security audit expectation.

### Technical Consulting
Required:
- decision/problem to solve;
- current context;
- expected output;
- meeting/report format;
- desired expertise.

### Other Technology
Use the generic core wizard with stronger free-text guidance.

---

# 54. Content Quality Rules for Listings

The system should improve quality without pretending to know user intent.

Before publish, run deterministic quality checks:
- title is not all caps;
- title not repeated symbols;
- scope length minimum met;
- at least one explicit deliverable;
- timeline selected;
- budget mode selected;
- category selected;
- prohibited contact info absent;
- emoji absent;
- obvious secrets patterns absent;
- no HTML;
- no prohibited cybersecurity phrases/rules;
- duplicate listing similarity warning for same owner.

Warnings can be soft except hard policy/security violations. The product must not force users to claim technologies or requirements they do not know; “No preference/Unknown/Negotiable” is a valid structured answer where provided.

---

# 55. Public Landing Page Specification

Anonymous route `/{locale}`.

Purpose: explain platform clearly and convert to registration without marketing noise.

Sections:
1. Header with brand, browse listings, login, register, theme/language.
2. Hero:
   - concise value proposition;
   - two actions: Browse work / Create free account;
   - no fake user counts.
3. “How it works” in three steps:
   - publish/follow;
   - private offer/match;
   - continue business directly.
4. Focus areas: technology categories.
5. Transparency section:
   - listings free;
   - offers private;
   - listings expire after seven days;
   - no payment/escrow.
6. Recent active listing preview using real database data only; if none, show honest empty state.
7. Legal/footer links.

No fake logos, fake testimonials, fake metrics or invented client companies.

---

# 56. Public Listing Detail Specification

Structure:
- breadcrumb/category;
- title;
- status;
- first published date;
- reactivation metadata if relevant;
- owner compact profile link;
- summary;
- project scope;
- structured requirements from wizard rendered as human-readable sections;
- budget/timeline;
- plain disclaimer;
- offer CTA if active and viewer eligible.

CTA states:
- guest -> “Sign in to submit an offer”;
- owner -> owner management action, never offer;
- pending offer -> “Offer pending” + manage offer;
- rejected and active -> “Submit a new offer”;
- withdrawn same activation -> “Offer withdrawn; you can submit again if the listing is reactivated”;
- matched -> disabled “No longer accepting offers”;
- expired/inactive -> disabled.

Do not show offer count or bidder identities.

---

# 57. Public Profile Detail Specification

Header:
- initials avatar 56–72 px;
- display name;
- `@handle`;
- optional location only when enabled.

About:
- plain text, preserve line breaks;
- max 1000 chars.

Links:
- simple rows with SVG platform icon + label;
- open external tab safely.

Completed work:
- simple list/cards;
- no ratings;
- no unfinished work;
- no earnings/revenue totals;
- no private contact.

If suspended:
- public profile may be unavailable/limited based moderation policy.

If deleted:
- 404/410 or anonymized historical link behavior according to engagement integrity; never expose old private data.

---

# 58. Settings Specification

## Profile
- display name;
- handle with cooldown;
- About;
- profile links;
- show location toggle;
- contact handoff phone toggle.

## Account
- email change + reverify;
- phone change + OTP;
- locale;
- account deletion.

## Security
- password change;
- enable/disable TOTP 2FA;
- backup codes if auth library supports;
- active sessions/revoke;
- recent login/security events.

## Notifications
- new offer email on/off;
- offer status email on/off;
- listing expiry reminder on/off;
- completion email on/off;
- security notifications locked on;
- legal notices locked on.

## Privacy
- concise data visibility summary;
- followed categories private statement;
- contact disclosure policy;
- data request/contact method;
- legal links.

---

# 59. Environment Variables / Runtime Configuration

`env` validation must distinguish required-development, required-production and optional.

Core:
- `NODE_ENV`
- `APP_URL`
- `PRODUCT_NAME`
- `DATABASE_URL`
- `DATABASE_MIGRATION_URL` if provider requires separate direct connection
- `BETTER_AUTH_SECRET` / rotation equivalent
- `BETTER_AUTH_URL`

Encryption:
- `PII_ENCRYPTION_KEY_CURRENT`
- `PII_ENCRYPTION_KEY_PREVIOUS` optional during rotation
- `PII_HMAC_KEY`

Email adapter:
- `EMAIL_PROVIDER`
- provider-specific values isolated by adapter
- `EMAIL_FROM`

SMS adapter:
- `SMS_PROVIDER`
- provider-specific values

Rate limiting/challenge:
- `RATE_LIMIT_STORE_URL` if external
- `CAPTCHA_PROVIDER` optional
- provider secret/site key only if enabled

Legal:
- operator fields from §18.7
- `LEGAL_ETBIS_CLASSIFICATION_APPROVED`
- `LEGAL_PRIVACY_REVIEW_APPROVED`

Observability:
- provider DSN only after privacy review
- `OBSERVABILITY_PII_REDACTION=true` production mandatory

Feature flags:
- `FEATURE_IDENTITY_VERIFICATION=false`
- `FEATURE_MARKETING_EMAIL=false`
- `FEATURE_PUBLIC_OFFER_COUNT=false`

Production boot must refuse insecure values such as placeholder secrets, localhost app URL or disabled legal-review gates.

---

# 60. CI/CD Pipeline

Pull request pipeline:
1. install with frozen lockfile;
2. generated-file drift check;
3. lint;
4. typecheck;
5. locale parity;
6. emoji scan;
7. secret scan;
8. dependency/SCA scan;
9. unit tests;
10. PostgreSQL integration tests;
11. production build;
12. Playwright critical smoke;
13. accessibility smoke.

Main/staging pipeline adds:
- migration dry run;
- staging deploy;
- full Playwright;
- ZAP baseline;
- Lighthouse CI;
- visual regression.

Production deployment:
- manual/authorized promotion;
- DB backup/restore point before risky migration;
- migration apply;
- deploy;
- health/smoke;
- rollback instructions ready;
- legal config gate.

Never run destructive schema reset in production pipeline.

---

# 61. Observability and Operational Metrics

Track aggregate operational metrics without unnecessary identity data:

- registration success/failure count;
- verification success/rate-limit count;
- active listings;
- listing expiry job lag;
- offer submission success/error;
- match acceptance transaction conflict rate;
- background outbox queue age;
- email/SMS provider failure rate;
- API latency/error rate;
- DB connection saturation;
- report backlog;
- auth failure anomalies;
- cache hit metrics where useful.

Alerts:
- expiry job delayed >30 min;
- outbox oldest pending >15 min;
- DB error spike;
- authentication failure anomaly;
- error rate > threshold;
- backup failure;
- security scan critical finding.

Do not create business analytics that rank or profile users without a new product/privacy review.

---

# 62. Database Backup and Disaster Recovery

Requirements:
- managed PITR if available;
- encrypted backups;
- access restricted to operations/security roles;
- backup provider/location included in cross-border transfer review;
- documented restore to isolated environment;
- quarterly restore drill;
- post-restore integrity checks:
  - users/profile FK consistency;
  - listing status validity;
  - one accepted offer per listing;
  - engagement/offer/listing links;
  - legal acceptance hashes;
  - migration version.

Do not consider “backup enabled” sufficient without restoration evidence.

---

# 63. Security Verification Checklist Mapped to OWASP-style Controls

## Authentication
- password hashing secure;
- enumeration resistance;
- rate limiting;
- MFA admins;
- reset/recovery safe;
- sessions revocable.

## Access control
- default deny private routes;
- ownership checks;
- role checks;
- object-level auth tests;
- admin access audited.

## Validation
- centralized schemas;
- emoji ban;
- URL allowlist;
- no file parser/upload attack surface;
- no HTML/Markdown UGC.

## Cryptography
- TLS;
- secure RNG;
- PII encryption;
- key rotation;
- no hard-coded secrets.

## Error/logging
- generic external errors;
- structured internal errors;
- no secret/PII leakage;
- alerting.

## HTTP/client
- CSP;
- HSTS;
- secure cookies;
- clickjacking prevention;
- MIME sniff prevention;
- safe referrer/permissions policy.

## Business logic
- race-condition tests;
- listing expiry boundary;
- one-match invariant;
- offer privacy;
- completion bilateral.

---

# 64. Source-Controlled Legal Document Model

Recommended path:

```text
legal/
  terms/
    tr/v1.md
    en/v1.md
  privacy/
    tr/v1.md
    en/v1.md
  matching-disclaimer/
    tr/v1.md
    en/v1.md
  acceptable-use/
    tr/v1.md
    en/v1.md
  cookies/
    tr/v1.md
    en/v1.md
```

Publication script:
- validate metadata;
- calculate SHA-256 content hash;
- insert immutable version record;
- mark current version;
- invalidate cache.

Do not let admin silently edit a published historical version in place.

---

# 65. Official Legal and Standards Research Basis

The coding agent must not treat these references as legal advice, but must use them as a current baseline and verify if rules changed before production launch.

Official sources reviewed for this specification:

1. Kişisel Verileri Koruma Kurumu — “Kişisel Verilerin İşlenmesine İlişkin Temel İlkeler” / Article 4 principles: purpose limitation, relevance, limitation and proportionality, retention limitation.  
   https://www.kvkk.gov.tr/Icerik/4189/Kisisel-Verilerin-Islenmesine-Iliskin-Temel-Ilkeler

2. Kişisel Verileri Koruma Kurumu — “Türkiye Cumhuriyeti Kimlik Numaralarının İşlenmesi Hakkında Rehber.” Emphasizes less intrusive alternatives and safeguards when processing T.C. identity numbers.  
   https://www.kvkk.gov.tr/Icerik/7798/Turkiye-Cumhuriyeti-Kimlik-Numaralarinin-Islenmesi-Hakkinda-Rehber

3. Kişisel Verileri Koruma Kurulu — 17/08/2023, 2023/1430 decision summary concerning T.C. identity number use in an application; identity number processing was found disproportionate where verification could be achieved through less intrusive data.  
   https://www.kvkk.gov.tr/Icerik/7782/2023-1430

4. Kişisel Verileri Koruma Kurumu — Data security obligations under Article 12 and technical/administrative safeguards.  
   https://www.kvkk.gov.tr/Icerik/2040/Veri-Guvenligine-Iliskin-Yukumlulukler

5. Kişisel Verileri Koruma Kurumu — User-security recommended technical/administrative measures including rate limiting, login-history visibility and strong authentication practices.  
   https://www.kvkk.gov.tr/Icerik/7177/Kullanici-Guvenligine-Iliskin-Veri-Sorumlulari-Tarafindan-Alinmasi-Tavsiye-Edilen-Teknik-ve-Idari-Tedbirlere-Iliskin-Kamuoyu-Duyurusu

6. Kişisel Verileri Koruma Kurumu — Data breach notification practice; Board decision requiring notification to the Authority without delay and no later than 72 hours after learning of breach.  
   https://www.kvkk.gov.tr/Icerik/8010/Kamuoyu-Duyurusu

7. Kişisel Verileri Koruma Kurumu — Cross-border transfer rules, standard contracts and related Article 9 mechanism.  
   https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim

8. Kişisel Verileri Koruma Kurumu — 27 July 2026 notice on standard contracts and notification details.  
   https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu

9. T.C. Ticaret Bakanlığı — Electronic commerce legislation overview and current marketplace/intermediary framework.  
   https://ticaret.gov.tr/ic-ticaret/elektronik-ticaret/mevzuat

10. T.C. Ticaret Bakanlığı / ETBİS FAQ — includes distinction for sites publishing listings where contracts are subsequently formed through individual communication channels and current ETBİS registration explanations.  
    https://ticaret.gov.tr/ic-ticaret/sikca-sorulan-sorular/elektronik-ticaret

11. OWASP — Application Security Verification Standard, latest stable 5.0.0 at baseline.  
    https://owasp.org/www-project-application-security-verification-standard/

12. W3C — Web Content Accessibility Guidelines (WCAG) 2.2.  
    https://www.w3.org/TR/WCAG22/

13. Next.js official release/security blog — Active LTS 16.3.3 security baseline at 2026-08-25.  
    https://nextjs.org/blog

14. Node.js official release schedule — Node 24 LTS baseline.  
    https://nodejs.org/en/about/previous-releases

15. PostgreSQL official support/versioning — PostgreSQL 18 supported; current minor 18.6 at baseline.  
    https://www.postgresql.org/support/versioning/

16. Better Auth official documentation — email/password, verification, phone plugin and 2FA capabilities.  
    https://better-auth.com/docs/introduction

The agent MUST recheck security patches immediately before release. Legal counsel MUST recheck Turkish law/regulatory classification immediately before production launch.

---

# 66. Final Agent Completion Protocol

At the end of implementation, the coding agent MUST produce a final evidence report containing:

1. Git commit/revision identifier.
2. Exact dependency/runtime versions.
3. Database migration list.
4. Environment variables required, without secret values.
5. Work Package table WP-00 through WP-23 with `PASS/FAIL/BLOCKED`.
6. Functional requirement traceability table.
7. Commands executed and exit codes for:
   - install;
   - lint;
   - typecheck;
   - unit tests;
   - integration tests;
   - E2E;
   - accessibility;
   - build;
   - security scans;
   - migration.
8. Screenshot index for tr/en, mobile/desktop and three themes.
9. Performance results.
10. Security findings and dispositions.
11. Known limitations.
12. Legal/configuration items requiring human operator values or counsel sign-off.
13. Confirmation that no user upload, payment, chat, comment, review, rating or public-offer feature was accidentally introduced.
14. Confirmation that TCKN, gender and birthplace are not collected.
15. Confirmation that first publication date survives reactivation.
16. Confirmation that an unauthorized user cannot access another user's offer/follows/private identity.
17. Confirmation that concurrency tests prove only one accepted offer per listing.
18. Confirmation that only bilateral completed engagements appear publicly.

The agent MUST NOT declare the project production-ready if any mandatory release gate is unresolved. It may declare code implementation complete but production blocked specifically by missing legal entity values, provider credentials or counsel approval; those blockers must be explicit and not hidden.

---

# 67. One-Sentence Product Contract

**A free, text-only, technology-focused platform where one verified account can publish seven-day project listings or privately bid on them, the platform privately matches one accepted offer and then gets out of the commercial transaction, while preserving strict privacy, security, freshness and completion-integrity rules.**

---

# END OF MASTER SPECIFICATION
