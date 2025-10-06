# KBBuilder_Prompt_Playbook

> Internal prompts are not shown to users. Keep them short, structured, and step-scoped.
> 

### 0) Engines

- **Perplexity** (Search + Chat) for **textual web research** (brand, market, competitors, tone context).
- **OpenAI Vision** for **image analysis** leading to the Visual Brand Guideline.
- Optional: **GPT-Image** (or Flux) for test images.

### 1) Variables

- `{company_url}`, `{company_name?}`, `{locale}`, `{session_id}`, `{max_words}`, `{style}`
- `{inputs.images[]}`: list of Storage URLs for user images.

### 2) Step prompts (Perplexity)

**Brand Overview (short, with citations)**

```
Task: Extract a concise brand overview from {company_url} and public sources.
Output in {locale}. Max 4 sentences.
Include: mission/essence, target audience, positioning, 3 differentiators.
Return 3–5 sources (URL + short snippet). Avoid generic language.

```

**Market & Trends**

```
Task: Identify 2–3 current trends affecting {industry/locality if derivable from site}.
Explain each trend in 2 lines. Add 2–3 actionable takeaways for social media strategy.
Return 3–5 recent sources with dates and URLs.

```

**Services (one paragraph each)**

```
Task: From the site and public info, list services with 1 paragraph each (benefit + who it's for).
Keep it concrete and non-generic. Output in {locale}.

```

**Competitors & Differentiators**

```
Task: Find 3 relevant competitors in {region if inferable}. For each: what they do well.
Then: how {company} differentiates (2–3 bullets). Add sources.

```

**Tone & Voice**

```
Task: Infer brand voice traits from site copy and public materials.
Output bullets for tone (human, warm, expert, etc.) and 3 example sentences in {locale}.

```

### 3) Visual guideline (OpenAI Vision)

**Image analysis to visual spec**

```
Analyse the provided brand images (URLs). Extract:
- Colour palette (primary, secondary, neutrals; hex or approximate).
- Lighting (e.g., soft daylight, window light), composition, textures, subjects.
- Mood words; Do's and Don'ts.
- 3 base prompts and negative prompts for consistent image generation.
Output a structured JSON and a short Markdown guide in {locale}.
Limit subjectivity; ground findings on visible patterns across images.

```

### 4) Fusion rule

- Merge **textual brand context** (Perplexity) with **visual features** (Vision) → single **visual_guide** object.
- If conflicts, prioritise **user-provided images** over web assumptions.

### 5) Output schemas

- `brand`, `services[]`, `market`, `competitors[]`, `tone`, `visual_guide`, `sources[]`.
- Enforce max lengths per field (keeps outputs tight and useful).

### 6) Safety & quality

- No hallucinated facts; always include **sources** for research steps.
- Locale accuracy: spelling and phrasing must follow {locale}.
- Token budget: keep prompts concise; prefer bullets.