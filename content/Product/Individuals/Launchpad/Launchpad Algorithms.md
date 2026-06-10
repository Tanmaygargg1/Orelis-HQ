# Orelis Hub — Idea Launchpad: Algorithm & System Design
**Status:** Active — production algorithm  
**AI provider (testing phase):** Groq API (free tier, `llama-3.3-70b-versatile` model)  
**Last updated:** 22nd May 2026

> This document is the single source of truth for all algorithms, scoring models, data sources, task logic, and AI behaviour in the Launchpad. Edit this file to change how the system behaves — code is derived from this document.

---

## 0. Coherence Gate (runs before anything else)

**Purpose:** Reject nonsense input before wasting tokens or misleading the user. A user typing "adfr2" or random letters must be told immediately — not given a 34/100 with a monetisation plan.

### Coherence Score (0–100)
The model first assigns a `coherenceScore` to the idea title + description:

| Score range | Meaning | System action |
|---|---|---|
| 0–10 | Gibberish / random text / test data | Reject immediately — show rejection UI |
| 11–29 | Fragments — too vague to analyse | Reject — prompt user to add more detail |
| 30–59 | Vague but real intent | Proceed but note low signal quality |
| 60–100 | Clear, specific, analysable | Full analysis |

**Rejection conditions (coherenceScore ≤ 29):**
- Title/description is random characters (e.g. "adfr2", "asdfgh")
- Single-word test inputs with no context (e.g. "test", "hello")
- Non-English gibberish with no discernible intent
- Ideas that describe no problem, no customer, no product

**System behaviour on rejection:**
- Show a rejection card explaining why the idea was flagged
- Invite the user to rewrite it with a real concept
- Do NOT show IVS score, do NOT show monetisation plan, do NOT show competitor analysis
- IVS is shown as 0 — not 34, not any positive number

**Critical prompt instruction to model:**
> "COHERENCE GATE: You must evaluate whether the input is a real, coherent business concept. If the title and description consist of random characters, test strings, single meaningless words, or gibberish (e.g. 'adfr2', 'test123', 'fjdks'), you MUST set coherenceScore to 0–5 and ivs to 0–5. NEVER score gibberish higher than 10. Be commercially rigorous — most ideas that claim to be 'AI-powered' without a clear problem are over-scored. Be sceptical."

---

## 1. Idea Validation Score (IVS) — Composite Score /100

The IVS is the headline score shown at the top of every idea report. It is a **weighted composite** of six sub-scores, each calculated by a dedicated algorithm. This is the same structure used by firms like McKinsey (Venture Assessment Matrix) and Y Combinator's internal scoring rubric.

| Sub-score | Weight | Algorithm used |
|---|---|---|
| Market Opportunity | 22% | TAM/SAM/SOM sizing |
| Problem Severity | 18% | Jobs-to-be-Done pain scoring |
| Solution Uniqueness | 16% | Competitive differentiation index |
| Monetisation Clarity | 16% | Revenue model scoring |
| Execution Feasibility | 15% | Lean Canvas feasibility |
| Demand Signal | 13% | Porter demand-side force scoring |

**Formula:**
```
IVS = (MarketOpp × 0.22) + (ProblemSeverity × 0.18) + (SolutionUniqueness × 0.16)
    + (MonetisationClarity × 0.16) + (ExecutionFeasibility × 0.15) + (DemandSignal × 0.13)
```

**Scoring philosophy:** Scores must reflect commercial reality. Most early-stage ideas score 35–60. A score of 75+ means the idea has strong fundamentals. Scores above 85 are rare and require a large market, clear differentiation, and proven demand. DO NOT give high scores as encouragement.

---

## 2. Market Opportunity Score — TAM/SAM/SOM Model

**Framework:** TAM/SAM/SOM (Total Addressable Market / Serviceable Addressable Market / Serviceable Obtainable Market).

### Score mapping
```
if SOM > $1B  → score = 95–100
if SOM > $500M → score = 85–94
if SOM > $100M → score = 70–84
if SOM > $10M  → score = 50–69
if SOM > $1M   → score = 30–49
else           → score = 10–29
```

---

## 3. Problem Severity Score — Jobs-to-be-Done (JTBD) Pain Framework

**Framework:** Clayton Christensen's Jobs-to-be-Done theory + Steve Blank's Customer Development pain scoring matrix.

**Frequency multiplier:**
```
daily      → 1.0
weekly     → 0.8
monthly    → 0.5
occasionally → 0.3
```

**Pain intensity** — scored 1–10 on:
- Urgency (how pressing is resolution)
- Pervasiveness (how many people share it)
- Inadequacy of existing solutions

---

## 4. Solution Uniqueness Score — Competitive Differentiation Index (CDI)

**Framework:** Porter's Five Forces (competitive rivalry + threat of substitutes) + Blue Ocean Strategy value innovation grid.

**Step 2 — Differentiation scoring per factor:**
- 0 = parity with competitors
- 1 = marginal advantage
- 2 = clear advantage

**Penalty:** Each "high" threat competitor reduces CDI by 5 points (min 10).

---

## 5. Monetisation Clarity Score — a16z Revenue Model Framework

**LTV:CAC ratio scoring:**
```
LTV:CAC > 5   → 90–100
LTV:CAC 3–5   → 70–89
LTV:CAC 1–3   → 40–69
LTV:CAC < 1   → 10–39
```

**Revenue model bonus:**
- Subscription: +10 (recurring, predictable)
- Marketplace: +8
- Transactional: +5
- Advertising: -5 (requires massive scale)
- Services: +0

---

## 6. Execution Feasibility Score — Lean Canvas Feasibility Matrix

**Framework:** Ash Maurya's Lean Canvas, used by 500 Startups and Techstars.

Each factor scored 0–100:
- Technical complexity: low=90, medium=55, high=25
- Time to MVP: <1mo=90, 1-3mo=75, 3-6mo=55, 6+mo=30
- Capital required: <$5K=95, $5K-$50K=75, $50K-$500K=45, $500K+=20
- Regulatory: none=100, low=65, high=20

---

## 7. Demand Signal Score — Porter Demand-Side Analysis

**Framework:** Michael Porter's demand-side forces (buyer power + substitutes + market growth rate).

```
DemandScore = (growth_score × 0.4) + (awareness_score × 0.3) + (trend_score × 0.3)
```

---

## 8. Market Timing Analysis (NEW)

**Framework:** Geoffrey Moore's Technology Adoption Lifecycle (Crossing the Chasm) + market window analysis.

Returns:
- **verdict**: `Optimal | Good | Neutral | Early | Poor`
- **window**: Time window available (e.g. "12–18 month window before market saturates")
- **reason**: 2–3 sentences explaining the timing in the context of current market conditions

**Timing verdicts:**
| Verdict | Meaning |
|---|---|
| Optimal | Market is growing fast + gap exists + not yet crowded |
| Good | Conditions favour entry now |
| Neutral | Market is stable, can enter but no urgency |
| Early | Problem exists but market hasn't been educated yet |
| Poor | Market is saturated or declining |

---

## 9. Macro Context Analysis (NEW) — PESTLE + Global Trend Correlation

**Framework:** PESTLE analysis (Political, Economic, Social, Technological, Legal, Environmental) applied specifically to the idea.

Returns 3 macro trends that are **directly relevant to this idea**, each with:
- **trend**: The specific macro trend (e.g. "AI adoption in SMEs growing at 34% YoY")
- **direction**: `tailwind | headwind | neutral`
- **explanation**: How this specific trend helps or hurts this specific idea (not generic)

**Key requirement:** These must be IDEA-SPECIFIC, not generic market platitudes. If the idea is a restaurant inventory app in Southeast Asia, the macro context should be about Southeast Asian restaurant industry trends, labour costs, food waste regulations — not generic "AI is growing".

---

## 10. Competitive Moat Analysis (NEW) — Hamilton's 7 Powers Framework

**Framework:** Hamilton Helmer's "7 Powers" framework: Network Effects, Switching Costs, Economies of Scale, Counter-positioning, Cornered Resource, Process Power, Branding.

Returns:
- **primary**: The strongest defensible advantage available to this idea
- **strength**: `Strong | Moderate | Weak`
- **description**: 2 sentences on how to build and defend this moat
- **vulnerability**: The main threat that could erode this moat

**Scoring guidance:**
- Network effects / cornered resource / counter-positioning → typically Strong
- Switching costs / branding → typically Moderate
- Scale / process → typically Weak for early stage

---

## 11. Unit Economics (NEW)

Provides a realistic breakdown of per-unit financial metrics:

| Field | Definition |
|---|---|
| AOV | Average order/contract value |
| Gross margin | Revenue minus COGS as a % |
| Payback period | Months to recover CAC |
| LTV:CAC ratio | Target > 3:1 per industry standard |

**Benchmark thresholds:**
```
LTV:CAC > 5:1    → Excellent
LTV:CAC 3:1–5:1  → Healthy  
LTV:CAC 1:1–3:1  → Marginal (needs optimisation)
LTV:CAC < 1:1    → Unsustainable
```

---

## 12. Comparable Exits (NEW)

Lists 2–3 companies that have operated in the same or adjacent space, and what happened to them. This validates that the market exists and exits are possible.

| Field | Content |
|---|---|
| company | Real company name |
| exitType | `Acquired \| IPO \| Active \| Failed` |
| exitValue | Acquisition price / market cap / "N/A" |
| lesson | What this outcome specifically means for the user's idea |

**Purpose:** A user who proposes "a B2B SaaS for restaurant inventory management in Southeast Asia" should see that Toast ($4.9B IPO), MarketMan ($18M acquired) and similar companies validated this market. OR if a similar company failed, explain why and how the user's idea differs.

---

## 13. Validation Report Structure (Updated)

Full report sections in order:

```
1.  IVS Score + Executive Summary
2.  Market Timing              ← NEW: is now the right time?
3.  Macro Context              ← NEW: 3 market trends that affect THIS idea
4.  Market Opportunity (TAM/SAM/SOM)
5.  Competitive Moat           ← NEW: Hamilton's 7 Powers
6.  Competitors (3 real companies)
7.  Customer Profile
8.  Marketing Difficulty
9.  Ease of Starting
10. Unit Economics             ← NEW: AOV, margin, payback, LTV:CAC
11. Monetisation Plan
12. Comparable Exits           ← NEW: proof the market exists
13. Key Risks (3)
14. Next Steps (5)
15. Market Intelligence        ← Inline section: trending industries + gaps for the geography
```

---

## 14. Idea Input Questions (Unchanged)

### Stage 1 — Basics
1. Idea title (text)
2. Description + problem (text)
3. Target market / geography (dropdown)
4. Industry (dropdown)

### Stage 2 — Depth (MCQ + open-ended)
5. Customer type: B2B / B2C / B2B2C / Both
6. Problem frequency: Daily / Weekly / Monthly / Rarely
7. Revenue model: SaaS / Marketplace / One-time / Freemium / Services
8. Price point: Under $10 / $10–$50 / $50–$200 / $200+
9. Technical complexity: Low / Medium / High / Very High
10. Capital required: Bootstrap <$10k / Seed $10k–$100k / Pre-Seed $100k–$1M / $1M+
11. Time to MVP: 1–4 weeks / 1–3 months / 3–6 months / 6+ months
12. Regulatory: None / Low / Medium / High
13. First 10 customers (open-ended text)
14. Why customers would switch (open-ended text)

---

## 15. Individual Onboarding Integration (NEW)

The individual onboarding step 2 ("Your Report") now runs a **real AI validation** on the idea collected in steps 0–1.

**Flow:**
1. User fills in idea title + description (step 0)
2. User answers 7 MCQ + 2 open-ended questions (step 1)
3. User clicks "Generate my report" → triggers real Groq API call
4. Loading state shown while validation runs (~5–15 seconds)
5. Step 2 shows:
   - IVS score (real)
   - Executive summary (real)
   - Market timing verdict (real)
   - 3 macro context trends (real)
   - 3 key insights drawn from the full report
6. The idea is immediately added to LaunchpadContext as `status: 'validated'` with the full report
7. When user enters the Launchpad, the idea is already there — fully validated

**Coherence gate applies here too:** If the onboarding idea is random text, step 2 shows the rejection state instead of scores.

**No API key behaviour:** Shows simulated scores with "AI key not configured — connect your Groq API key for real analysis" banner.

---

## 16. Groq API Integration

```
Model: llama-3.3-70b-versatile
Temperature: 0.3 (factual sections), 0.45 (narrative)
Max tokens: 4000 (increased from 2500 to accommodate new sections)
Stream: true for chatbot only
```

### Coherence + Scoring philosophy in system prompt
The system prompt explicitly instructs:
1. Coherence gate first — never score gibberish above 10
2. Be commercially rigorous — most ideas score 35–60
3. Macro context must be IDEA-SPECIFIC, not generic
4. Comparable exits must be real companies
5. Return ONLY valid JSON — no markdown, no explanation

---

## 17. State Architecture

```ts
interface LaunchpadIdea {
  id: string
  title: string
  description: string
  targetMarket: string
  industry: string
  geography: string
  answers: Record<string, string>
  status: 'draft' | 'validating' | 'validated' | 'rejected'  // ← 'rejected' added
  rejectionReason?: string                                      // ← NEW
  report: IdeaReport | null
  chatHistory: ChatMessage[]
  createdAt: string
}

interface IdeaReport {
  coherenceScore: number           // ← NEW: 0–100
  ivs: number
  scores: { marketOpportunity, problemSeverity, solutionUniqueness, monetisationClarity, executionFeasibility, demandSignal }
  executiveSummary: string
  marketTiming: { verdict, window, reason }    // ← NEW
  macroContext: { trend, direction, explanation }[]  // ← NEW (3 items)
  marketOpportunity: { tam, sam, som, description }
  competitiveMoat: { primary, strength, description, vulnerability }  // ← NEW
  competitors: { name, description, weakness, threatLevel }[]
  customerProfile: { count, persona, channels }
  marketingDifficulty: { rating, cac, channels[] }
  easeOfStarting: { capital, timeToMvp, teamRequired }
  unitEconomics: { aov, grossMargin, paybackPeriod, ltvCacRatio }  // ← NEW
  monetisation: { model, ltv, cac, breakEven }
  comparableExits: { company, exitType, exitValue, lesson }[]  // ← NEW
  risks: { title, mitigation }[]
  nextSteps: string[]
}
```

---

## 18. What Is NOT Being Built Yet (Deferred)

- PDF export
- Idea lock-in → business roadmap generation (warning modal only)
- Real-time web scraping (Groq knowledge proxy used during testing)
- Business Dashboard transition after lock-in
