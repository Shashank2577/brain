# Analytics

## Purpose

Multi-source analytics workspace: connects BigQuery / GA4 / HubSpot / Mixpanel / Amplitude / PostHog / Sentry / Slack / Gong / Jira / Pylon / Stripe / GitHub / Notion / Apollo / Twitter / SEO providers, and builds explorer + SQL dashboards plus reusable ad-hoc analyses. Also ingests its own first-party events via `/track`.

## Data model

`templates/analytics/server/db/schema.ts`:

- `dashboards` — ownable, shareable dashboards in two flavors (`kind: explorer | sql`) with JSON config.
- `dashboard_shares` — share grants.
- `dashboard_views` — saved filter views per dashboard (governed by parent's sharing).
- `analyses` — ownable, shareable ad-hoc analyses (question, instructions, dataSources, result markdown + structured data).
- `analysis_shares` — share grants.
- `bigquery_cache` — query result cache with `bytesProcessed` and `expiresAt`.
- `analytics_public_keys` — public write-only ingestion keys per user/org.
- `analytics_events` — first-party events captured via `/track` with common dimensions (`url`, `path`, `app`, `template`, `signedIn`, `userId`, `properties` JSON).

## Capabilities

- `analytics.view-screen` / `analytics.navigate`.
- `analytics.list-analyses` / `analytics.get-analysis` / `analytics.save-analysis` / `analytics.rename-analysis` / `analytics.delete-analysis`.
- `analytics.rename-dashboard` / `analytics.update-dashboard` / `analytics.archive-dashboard` / `analytics.generate-chart`.
- `analytics.data-source-status` / `analytics.check-form-schema` / `analytics.list-data-dictionary` / `analytics.save-data-dictionary-entry` / `analytics.delete-data-dictionary-entry`.
- `analytics.create-analytics-public-key` / `analytics.list-analytics-public-keys` / `analytics.revoke-analytics-public-key`.
- `analytics.query-agent-native-analytics` / `analytics.query-inbound-forms` / `analytics.onboarding-events`.
- Provider actions: `analytics.bigquery` / `analytics.bigquery-table-info` / `analytics.ga4-report` / `analytics.gcloud` / `analytics.amplitude-events` / `analytics.top-amplitude-events` / `analytics.mixpanel-events` / `analytics.posthog-events` / `analytics.hubspot-records` / `analytics.hubspot-deals` / `analytics.hubspot-deal-properties` / `analytics.hubspot-metrics` / `analytics.hubspot-pipelines` / `analytics.hubspot-properties` / `analytics.jira` / `analytics.jira-search` / `analytics.jira-analytics` / `analytics.gong-calls` / `analytics.sentry` / `analytics.slack-messages` / `analytics.pylon-issues` / `analytics.stripe` / `analytics.notion-page` / `analytics.apollo-search` / `analytics.commonroom-members` / `analytics.content-calendar` / `analytics.content-calendar-schema` / `analytics.github-prs` / `analytics.grafana` / `analytics.twitter-tweets` / `analytics.seo-blog-pages` / `analytics.seo-page-keywords` / `analytics.seo-top-keywords`.

## UI routes

- `/` — landing.
- `/overview` — high-level summary.
- `/about`.
- `/analyses` and `/analyses/:id` — analysis index + detail.
- `/adhoc/:id` — ad-hoc analysis runner.
- `/chart` — embeddable chart preview.
- `/data-sources` — connect/manage data sources.
- `/data-dictionary` — column/table documentation.
- `/settings`, `/team`, `/extensions`.

## Inter-app dependencies

None inside the template (no `appAction()` or `ctx.call()` invocations).

## Inter-app consumers

- **dispatch** — `dispatch.AGENTS.md` routes "pageviews / traffic / dashboard metrics" prompts to analytics via `call-agent`.

## Status

Production-ready (core: true).

## Known gaps

Every provider action requires its own credentials. `data-source-status` reports availability but does not gate provider actions. `bigqueryCache` is the only result cache. `analytics_events` is portable but no PII filters are enforced server-side.
