# Knowledge Base Flow

This document outlines the architecture, data schema, and user flows for the Knowledge Base integration in Parrot. 

## Flow Diagram

```mermaid
flowchart TD
    %% Data Models
    subgraph Schema [Knowledge Base Data Models]
        KBCat[KB Categories\nkb_category]
        KBArt[KB Articles\nkb_articles]
        KBVer[Versioning\nkb_article_version]

        KBCat -.->|tenant_id, property_id, id\nslug, name, parent_id\ncreated_at, updated_at| KBCat
        KBArt -.->|tenant_id, property_id, id\ncategory_id, title, status\ncontent, author_id, published_at| KBArt
    end

    %% Publishing Workflow
    subgraph Publishing [Authoring & Publishing Flow]
        SupportAgent["AGENT\n(role: support)"]
        DraftDB[/"DB -> KB table\n(status: draft)"/]
        AdminAgent["AGENT II\n(role: admin) approves"]
        PublicAvailable("Article publicly available")

        SupportAgent -->|writes article| DraftDB
        DraftDB --> AdminAgent
        AdminAgent -->|publishes| PublicAvailable
    end

    %% Visitor / Widget Integration
    subgraph WidgetFlow ["Widget Integration (RAG)"]
        Widget["Widget"]
        Questions[/"Pre-defined Questions:\n- How do I reset my password\n- What's the billing policy\n- How's my personal data handled"/]
        
        Widget --> Questions
        Questions -->|Visitor clicks| AutoResponse["Direct answer via KB Article"]
    end

    %% SEO & Public Access
    subgraph PublicSEO [Public SEO Access]
        GoogleUser["Random user on Google.\n'How do I make payment internationally on Acme'"]
        ArticleURL["/articles/[slug]/[randomid]/..."]
        
        GoogleUser -->|Next.js SEO routes| ArticleURL
    end

    %% Connections between domains
    PublicAvailable -.-> ArticleURL
    PublicAvailable -.-> AutoResponse
```

## Schema Details
The knowledge base relies on the following tables defined in `packages/db/src/schema.ts`:
- **`kb_category`**: Supports nesting via `parent_id` (e.g. `payment` -> `international payment`). Each property can have custom categories.
- **`kb_articles`**: Contains the actual content. Tracks `status` (`draft` | `published` | `archived`), `author_id`, and ties to a specific `category_id`.
- **`kb_article_version`** (Planned): Will handle versioning for articles to track edits over time.

## User Journeys
1. **Agents**: Support agents draft articles which are saved to the database as drafts. An admin agent reviews and approves the draft, transitioning it to a publicly available state.
2. **Widget Visitors**: When a visitor opens the widget, they are presented with contextually relevant questions (inferred from the integrating business's complexity). Clicking a question retrieves the KB article automatically. Going forward, this content feeds into a RAG (Retrieval-Augmented Generation) model to provide AI responses.
3. **Public Users**: Published articles generate static, SEO-optimized pages using Next.js. Users searching on Google can land directly on `/articles/[slug]/[id]`.
