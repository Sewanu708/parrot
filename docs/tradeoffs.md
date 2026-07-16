# Tradeoffs

## Database Choice

Choosing a database for a project like this isn't a decision made in isolation — it's worth learning from systems that have faced this problem at scale before. I spent time studying Discord's database architecture, specifically why they moved from Cassandra to ScyllaDB.

Cassandra had served Discord well and scaled them from billions to trillions of stored messages — a genuinely massive number. But at that scale, memory overhead became a real constraint, which is ultimately what pushed the migration to Scylla.

That case study is instructive, but it's also a scale problem I don't have yet. Reaching for Cassandra as a first choice for this project would be over-engineering. Cassandra offers superior read/write throughput at high scale, no doubt — but at my current scale, Postgres and MongoDB would deliver read/write performance close enough that end users wouldn't notice the difference. If and when the user base grows large enough to justify it, migrating to Cassandra (or a comparable wide-column store) becomes the right conversation to have — not now.

So the real decision isn't Cassandra vs. everything else. It's Postgres vs. MongoDB — and I chose Postgres.

### Why Postgres

* **Schema enforced at write, not at read**: This keeps data integrity guarantees at the database layer instead of pushing validation logic into every application code path that touches the data.
* **Relational joins handled by the database engine, not the application layer**: Letting Postgres's query planner handle joins is significantly faster than stitching related data together in application code, and it keeps that logic in one place.
* **Flexibility where needed**: The one place NoSQL's flexibility would genuinely help — chat and messages — doesn't require abandoning Postgres. Those tables are the least well-defined up front; I'll likely need to add fields as the feature set evolves, without downtime. A metadata JSONB column gives me that same schema-on-read flexibility without leaving the relational model.
* **Inherently relational data**: Everywhere else in the application, the data is inherently relational. Introducing MongoDB just for chat would mean running and operating two separate database systems in production — extra operational overhead, extra cost, and two things to reason about instead of one. Not worth it for the flexibility gained in a single feature area when Postgres's JSONB already covers that need.

## Language & Framework Choice

For language, the decision came down to the two I'm actually proficient in: Python and JavaScript. JavaScript wins here because it sits closer to the web layer than Python does — and pairing it with TypeScript makes type validation significantly easier to reason about, since types are checked at build time rather than runtime, unlike Python's dynamic typing. That combination made JavaScript (with TypeScript) the clear choice over Python for this project.

### Why Express over NestJS

This is really the more deliberate choice. I haven't used Express in a large-scale project before — most of my recent backend work leans on NestJS, which is objectively the easier path here. NestJS's structure (modules, dependency injection, decorators) does a lot of the architectural thinking for you.

That's exactly why I'm choosing Express instead. NestJS is built on top of abstractions — routing, middleware, DI, request lifecycle — that Express requires you to construct yourself. Building this project in Express forces me to understand what NestJS is actually doing under the hood, rather than working productively within it without knowing why it works. Once I've built those abstractions manually, going back to NestJS (or any similarly opinionated framework) will be a more informed choice, not just a comfortable one.
