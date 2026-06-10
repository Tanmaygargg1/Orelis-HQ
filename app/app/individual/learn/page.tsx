'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COURSES = [
  {
    id: 'unit-econ',
    icon: '📊',
    title: 'Unit Economics',
    subtitle: 'Make money on every customer',
    color: '#C8A96E',
    xp: 120,
    lessons: [
      { title: 'What is LTV and why it decides everything', body: 'Lifetime Value (LTV) is the total revenue one customer generates before they stop paying. If your average customer pays $50/month and stays for 14 months, LTV = $700. This single number determines whether your business is viable at scale. Most founders ignore it until they run out of money.' },
      { title: 'How to calculate CAC without lying to yourself', body: 'Customer Acquisition Cost (CAC) = total sales & marketing spend ÷ number of new customers acquired in the same period. The mistake: including only ad spend and forgetting salaries, tools, content production, and your own time. A real CAC is almost always 2-3× what founders first estimate.' },
      { title: 'The 3× rule and why it matters', body: 'Healthy unit economics means LTV:CAC ≥ 3×. For every $1 you spend acquiring a customer, you should earn at least $3 back. Below 1× you lose money on every customer. Between 1-3× you break even but have no margin for error. Above 3× you have a business worth scaling.' },
      { title: 'Payback period — your real cash constraint', body: 'Payback period = CAC ÷ monthly revenue per customer. If CAC = $300 and ARPU = $50/month, payback = 6 months. This matters because until you recover CAC, every new customer is a cash drain. In SEA, investors want payback under 12 months for SaaS, under 6 for e-commerce.' },
    ],
    quiz: [
      { q: 'Your CAC is $240 and ARPU is $40/month with 10% monthly churn. Is this business viable?', opts: ['Yes — LTV:CAC exceeds 3×', 'No — LTV:CAC is below 3×', 'Borderline — LTV:CAC is exactly 3×', 'Cannot determine without more data'], answer: 0, exp: 'LTV = $40 / 0.10 = $400. LTV:CAC = $400/$240 = 1.67×. This is below the 3× threshold — the business is marginally viable but has no room for error. CAC needs to drop or retention needs to improve.' },
      { q: 'A founder says their CAC is $50 because that\'s what they spend on Facebook ads per customer. What\'s wrong?', opts: ['Nothing, this is correct', 'They forgot to include their salary and time', 'They should use lifetime spend not monthly', 'CAC should only count organic channels'], answer: 1, exp: 'Real CAC includes all costs: ad spend, salaries of sales/marketing staff, tools, content, events. Founders who only count ad spend consistently underestimate CAC by 2-5×, which makes their unit economics look far better than reality.' },
      { q: 'Which of these has the best unit economics?', opts: ['LTV $500, CAC $400', 'LTV $200, CAC $50', 'LTV $1000, CAC $600', 'LTV $300, CAC $150'], answer: 1, exp: 'LTV:CAC ratios: A=1.25×, B=4×, C=1.67×, D=2×. Option B has the highest ratio at 4×, well above the 3× minimum. Absolute numbers matter less than the ratio — a $200 LTV business with $50 CAC is healthier than a $1000 LTV business with $600 CAC.' },
    ]
  },
  {
    id: 'pmf',
    icon: '🎯',
    title: 'Finding Product-Market Fit',
    subtitle: 'How to know when you have it',
    color: '#4CAF7D',
    xp: 140,
    lessons: [
      { title: 'PMF is measurable, not a feeling', body: 'The Sean Ellis test: survey your active users with one question — "How would you feel if you could no longer use this product?" If 40%+ say "very disappointed," you likely have PMF. Below 40%, something is wrong. This is a leading indicator, not a lagging one. Revenue growth can be bought. Genuine disappointment at losing a product cannot.' },
      { title: 'The retention curve test', body: 'Plot your user retention over time. If the curve flattens above zero — even at 20-30% — you have a core of users who find real value. If the curve trends to zero, you don\'t have PMF yet regardless of total user numbers. Most products that fail show a retention curve that reaches zero within 3 months.' },
      { title: 'Leading indicators before PMF', body: 'Signs you\'re getting closer: users come back without being prompted, you see word-of-mouth referrals without incentives, users are upset when you make changes, usage grows organically in a specific segment. Signs you\'re not there: users need constant re-engagement, churn is high across all segments, you can\'t describe your best user in one sentence.' },
      { title: 'The one-sentence customer test', body: 'You have PMF in a segment when you can say: "[Specific person] uses [your product] to [specific outcome] and would pay [specific price] rather than lose it." If any of those blanks are vague, you don\'t have PMF yet. Narrowing to a specific segment is not failure — it\'s the only path to PMF.' },
    ],
    quiz: [
      { q: 'You survey 80 active users. 28 say "very disappointed," 35 say "somewhat disappointed," 17 say "not disappointed." Do you have PMF?', opts: ['Yes — majority are disappointed to lose it', 'No — less than 40% said very disappointed', 'Yes — combined disappointed is over 75%', 'Cannot tell from this data'], answer: 1, exp: '28/80 = 35% said "very disappointed." The Sean Ellis threshold is 40%. You\'re close but not there. The "somewhat disappointed" group doesn\'t count — they won\'t fight to keep the product. Focus on why the 35% number isn\'t higher.' },
      { q: 'Your retention curve starts at 100% at month 0 and stabilises at 22% by month 6. What does this tell you?', opts: ['No PMF — retention should be higher', 'PMF exists for a subset of users', 'The product is failing — all users eventually leave', 'You need more marketing to fix this'], answer: 1, exp: 'A retention curve that flattens (even at 22%) means a core cohort finds real value. This is the signal that PMF exists for a specific segment. The question now is: who are the 22% and can you acquire more of them? Marketing cannot fix a curve trending to zero.' },
      { q: 'Which is the strongest evidence of product-market fit?', opts: ['1,000 signups in the first week', 'Users organically referring friends without incentives', 'Good reviews on the App Store', 'Revenue growing 10% month-over-month'], answer: 1, exp: 'Organic referrals without incentives are the gold standard — users only refer friends when they genuinely believe the product solves a real problem. Signups can be bought, reviews can be gamed, and early revenue growth can come from the founder\'s network. Unprompted word-of-mouth cannot be faked.' },
    ]
  },
  {
    id: 'sea-market',
    icon: '🌏',
    title: 'SEA Market Fundamentals',
    subtitle: '680M people, 11 different countries',
    color: '#6E8EDA',
    xp: 130,
    lessons: [
      { title: 'SEA is not one market', body: 'Singapore has a $65k GDP per capita and English-first business culture. Indonesia has 270M people but a $4.5k GDP per capita and 700 local languages. What works in Singapore at $99/month may need to be $9/month in Indonesia — or need a completely different distribution channel. Never assume what works in one country ports to another.' },
      { title: 'The right go-to-market per country', body: 'Singapore: LinkedIn, English content, direct sales works. Indonesia: WhatsApp-first, local language content, referral networks, Tokopedia/Shopee distribution. Malaysia: bilingual (Malay + English), strong social proof culture. Philippines: Facebook-dominant, strong community-driven growth, price-sensitive. Vietnam: Zalo + Facebook, fast-growing but regulatory complexity.' },
      { title: 'Pricing for SEA price sensitivity', body: 'Rule of thumb: price at purchasing-power parity. If your Singapore price is $99/month, consider $15-25/month in Indonesia, $30-40 in Malaysia, $20-30 in Philippines. Localised pricing with local payment methods (GoPay, GrabPay, Maya) typically increases conversion by 3-5× over USD-only pricing. Annual billing with 2 months free dramatically reduces churn in all SEA markets.' },
      { title: 'Regulatory landscape basics', body: 'Singapore: MAS for fintech (very structured, clear path), PDPA for data. Indonesia: OJK for fintech, requires local entity and often local partner. Malaysia: BNM for fintech, relatively business-friendly. Philippines: BSP for fintech, fastest-growing market but slower regulatory clarity. Vietnam: most restrictive on foreign ownership — typically needs JV. Always get local legal advice before expanding.' },
    ],
    quiz: [
      { q: 'You built a $79/month B2B SaaS in Singapore. You want to expand to Indonesia. What should you charge?', opts: ['$79 — same product, same price', '$15-25 — adjust for purchasing power parity', '$50 — split the difference', '$5 — Indonesia is too price sensitive for more'], answer: 1, exp: 'Indonesia\'s GDP per capita is ~15× lower than Singapore\'s. Purchasing power parity pricing typically puts the Indonesia price at $15-25 for a $79 Singapore product. Keeping USD pricing kills conversion. Local pricing with GoPay/OVO payment options can multiply conversions 3-5×.' },
      { q: 'Which channel is most effective for B2C growth in Indonesia?', opts: ['LinkedIn organic content', 'WhatsApp referral networks', 'English-language blog SEO', 'Cold email campaigns'], answer: 1, exp: 'WhatsApp has 170M+ users in Indonesia and is the primary communication channel for both personal and business use. Referral-driven growth through WhatsApp groups and communities consistently outperforms all other channels for consumer products. LinkedIn is primarily for Singapore/Malaysia professional markets.' },
      { q: 'A founder says "SEA is one big market so we\'ll launch everywhere at once." What\'s the main risk?', opts: ['Too much revenue too fast', 'Spreading resources across 11 different regulatory, cultural, and payment environments', 'Running out of customers', 'Competitors will copy them'], answer: 1, exp: 'Launching across SEA simultaneously means dealing with 11 different regulatory frameworks, 20+ major languages, 6+ dominant payment systems, and wildly different consumer behaviors — all at once. The playbook that works in Singapore will fail in Indonesia. Sequenced expansion, one market at a time with local expertise, is how successful SEA companies actually scale.' },
    ]
  },
  {
    id: 'fundraising',
    icon: '💰',
    title: 'Fundraising for First-Time Founders',
    subtitle: 'Raise right or don\'t raise at all',
    color: '#A78BFA',
    xp: 150,
    lessons: [
      { title: 'When to raise (and when not to)', body: 'Raise when: you have proof of demand and need capital to accelerate something that\'s working. Do not raise when: you\'re trying to figure out what to build (that\'s what revenue is for), your unit economics are broken, or you haven\'t talked to 50+ customers. The fastest way to kill a startup is raising money too early — it delays the reckoning that comes from having to generate revenue.' },
      { title: 'Pre-seed vs seed — what actually changes', body: 'Pre-seed ($50k-$500k): betting on the team and the idea. Investors know there\'s no product or traction. Valuations range $500k-$3M. Often friends/family/angels. Seed ($500k-$3M): betting on early traction. Need to show customers, revenue, or very strong demand signals. Valuations $3M-$15M in SEA. Institutional angels and micro-VCs. Series A ($3M+): betting on a working model. Need $500k-$2M ARR, proven unit economics, clear path to $10M ARR.' },
      { title: 'What SEA investors actually look for', body: 'In order of importance: 1. Team (do they understand this problem better than anyone?), 2. Market size (is SEA + adjacent markets big enough?), 3. Traction (any evidence people want this?), 4. Business model (is there a path to profitability?). In SEA specifically, investors want to see evidence you understand local market dynamics — not a pitch built on US benchmarks.' },
      { title: 'Term sheet basics you cannot ignore', body: 'Key terms: Pre-money valuation (your company\'s value before investment — negotiate this). Liquidation preference (1× non-participating is standard and founder-friendly; 2× participating is not). Anti-dilution (broad-based weighted average is standard; full ratchet is predatory). Pro-rata rights (investor can maintain % in future rounds). Vesting (4 years, 1-year cliff is standard for founders). Never sign without a lawyer.' },
    ],
    quiz: [
      { q: 'An angel offers $200k for 20% of your company 3 weeks after you had the idea. Should you take it?', opts: ['Yes — $200k is $200k', 'No — 20% is too expensive before any validation', 'Yes, but negotiate to 15%', 'Only if they have strong connections'], answer: 1, exp: '$200k for 20% implies a $1M pre-money valuation. Three weeks in, you have no product and no customers. This means: you give away 20% of your company for proof-of-nothing, and every subsequent round dilutes from an already diluted cap table. Raise when you have leverage — even 3 paying customers dramatically changes your negotiating position.' },
      { q: 'What does "1× non-participating liquidation preference" mean for a founder?', opts: ['Investors get 1% of the company on exit', 'Investors get their money back first, then share remaining proceeds with founders', 'Founders get paid first on exit', 'Investors get 1× their money and nothing more'], answer: 1, exp: 'Liquidation preference means investors get their money back before founders see anything in an exit. "1× non-participating" means they get their investment back (1×) and then convert to equity to participate — this is standard and founder-friendly. "2× participating" means they get 2× their money AND participate in remaining proceeds — this is predatory and can leave founders with almost nothing in a modest exit.' },
      { q: 'You have $8k MRR growing 18% MoM and an investor offers a $2M pre-money valuation for $500k. Is this fair?', opts: ['Yes — $2M for an early stage company is reasonable', 'No — undervalued given your traction', 'Yes — take it before they change their mind', 'Cannot determine without knowing the industry'], answer: 1, exp: 'At $8k MRR × 12 = ~$96k ARR, growing at 18% MoM. At that growth rate you\'ll be at $500k+ ARR in 12 months. SaaS companies at seed typically raise at 10-20× ARR. $2M pre-money on $96k ARR is only 20× — reasonable but the growth rate justifies pushing for $4-5M. Counter-offer with evidence of growth trajectory.' },
    ]
  }
]

export default function Learn() {
  const [openCourse, setOpenCourse] = useState<string | null>(null)
  const [openLesson, setOpenLesson] = useState<number | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizShowExp, setQuizShowExp] = useState(false)
  const [quizCorrect, setQuizCorrect] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [completed, setCompleted] = useState<Record<string, { lessons: number[]; quizPassed: boolean }>>({})
  const [totalXP, setTotalXP] = useState(0)

  useEffect(() => {
    const c = localStorage.getItem('orelis-learn-v2')
    const x = localStorage.getItem('orelis-learn-xp-v2')
    if (c) setCompleted(JSON.parse(c))
    if (x) setTotalXP(parseInt(x))
  }, [])

  function persist(next: typeof completed, xp: number) {
    setCompleted(next); setTotalXP(xp)
    localStorage.setItem('orelis-learn-v2', JSON.stringify(next))
    localStorage.setItem('orelis-learn-xp-v2', String(xp))
  }

  function markLesson(courseId: string, lessonIdx: number) {
    const prev = completed[courseId] || { lessons: [], quizPassed: false }
    if (prev.lessons.includes(lessonIdx)) return
    const next = { ...completed, [courseId]: { ...prev, lessons: [...prev.lessons, lessonIdx] } }
    const xpGain = 15
    persist(next, totalXP + xpGain)
  }

  function openQuiz(courseId: string) {
    setQuizMode(true); setQuizQ(0); setQuizSelected(null); setQuizShowExp(false); setQuizCorrect(0); setQuizDone(false)
  }

  function pickAnswer(courseId: string, idx: number) {
    if (quizSelected !== null) return
    setQuizSelected(idx)
    const course = COURSES.find(c => c.id === courseId)!
    if (idx === course.quiz[quizQ].answer) setQuizCorrect(p => p + 1)
    setQuizShowExp(true)
  }

  function nextQuestion(courseId: string) {
    const course = COURSES.find(c => c.id === courseId)!
    if (quizQ < course.quiz.length - 1) {
      setQuizQ(q => q + 1); setQuizSelected(null); setQuizShowExp(false)
    } else {
      setQuizDone(true)
      const passed = quizCorrect + (quizSelected === course.quiz[quizQ].answer ? 1 : 0) >= 2
      if (passed) {
        const prev = completed[courseId] || { lessons: [], quizPassed: false }
        const xpGain = prev.quizPassed ? 0 : COURSES.find(c => c.id === courseId)!.xp
        const next = { ...completed, [courseId]: { ...prev, quizPassed: true } }
        persist(next, totalXP + xpGain)
      }
    }
  }

  const course = openCourse ? COURSES.find(c => c.id === openCourse) : null
  const earnedXP = COURSES.reduce((sum, c) => {
    const prog = completed[c.id]
    return sum + (prog?.lessons || []).length * 15 + (prog?.quizPassed ? c.xp : 0)
  }, 0)
  const maxXP = COURSES.reduce((s, c) => s + c.lessons.length * 15 + c.xp, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="label-sm mb-1" style={{ color: '#6E8EDA' }}>Individual — Learn</div>
          <h2 className="text-[28px] sm:text-[32px] font-bold gradient-blue">4 Courses</h2>
          <p className="text-t3 text-[13px] mt-1">Real business education. No fluff.</p>
        </div>
        <div className="card px-4 sm:px-5 py-3 text-right">
          <div className="label-sm mb-1">Progress</div>
          <div className="text-[22px] sm:text-[26px] font-black" style={{ color: '#6E8EDA' }}>{earnedXP} <span className="text-[13px] font-normal text-t3">/ {maxXP} XP</span></div>
          <div className="w-28 sm:w-32 h-1.5 rounded-full mt-1.5 ml-auto" style={{ background: '#1A1A2E' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(earnedXP / maxXP) * 100}%`, background: 'linear-gradient(90deg,#6E8EDA,#A8C4F0)' }} />
          </div>
        </div>
      </div>

      {/* Course list */}
      {!openCourse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COURSES.map((c, i) => {
            const prog = completed[c.id]
            const lessonsCompleted = (prog?.lessons || []).length
            const quizDone = prog?.quizPassed
            const pct = Math.round(((lessonsCompleted * 15 + (quizDone ? c.xp : 0)) / (c.lessons.length * 15 + c.xp)) * 100)
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <button className="card card-hover p-6 text-left w-full" onClick={() => setOpenCourse(c.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{c.icon}</span>
                    <div className="flex items-center gap-2">
                      {quizDone && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(76,175,125,0.12)', color: '#4CAF7D' }}>Quiz ✓</span>}
                      <span className="text-[11px] text-t3">{pct}%</span>
                    </div>
                  </div>
                  <h3 className="text-[17px] font-bold mb-1" style={{ color: c.color }}>{c.title}</h3>
                  <p className="text-[13px] text-t2 mb-4">{c.subtitle}</p>
                  <div className="w-full h-1.5 rounded-full" style={{ background: '#1A1A2E' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `${c.color}` }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-t3">
                    <span>{lessonsCompleted}/{c.lessons.length} lessons</span>
                    <span>+{c.xp} XP for quiz</span>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Course view */}
      {course && (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <button className="flex items-center gap-2 text-[13px] text-t3 mb-6 hover:text-t1 transition-colors"
            onClick={() => { setOpenCourse(null); setOpenLesson(null); setQuizMode(false) }}>
            ← Back to courses
          </button>

          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl">{course.icon}</span>
            <div>
              <h2 className="text-[26px] font-black" style={{ color: course.color }}>{course.title}</h2>
              <p className="text-t3 text-[13px]">{course.subtitle}</p>
            </div>
          </div>

          {!quizMode ? (
            <>
              <div className="space-y-3 mb-6">
                {course.lessons.map((lesson, i) => {
                  const done = (completed[course.id]?.lessons || []).includes(i)
                  return (
                    <div key={i} className="card p-5">
                      <button className="w-full text-left flex items-start justify-between gap-3"
                        onClick={() => setOpenLesson(openLesson === i ? null : i)}>
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-[11px] font-mono pt-0.5 text-t3 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                          <span className="text-[14px] font-semibold text-t1">{lesson.title}</span>
                        </div>
                        <span className="text-t3 shrink-0">{openLesson === i ? '▲' : '▼'}</span>
                      </button>
                      <AnimatePresence>
                        {openLesson === i && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <p className="text-[14px] text-t2 mt-4 mb-4" style={{ lineHeight: 1.8 }}>{lesson.body}</p>
                            {!done && (
                              <button className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                                style={{ background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)', color: '#C8A96E' }}
                                onClick={() => markLesson(course.id, i)}>
                                Mark as read +15 XP
                              </button>
                            )}
                            {done && <span className="text-[12px] text-success">✓ Completed</span>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              <div className="card p-5" style={{ borderColor: `${course.color}44`, background: `${course.color}08` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="label-sm mb-1" style={{ color: course.color }}>Course Quiz</div>
                    <p className="text-[13px] text-t2">{course.quiz.length} questions · +{course.xp} XP for passing</p>
                  </div>
                  {completed[course.id]?.quizPassed
                    ? <span className="text-[12px] font-bold text-success">Passed ✓</span>
                    : <button className="px-5 py-2.5 rounded-xl text-[13px] font-bold" style={{ background: course.color, color: '#000' }} onClick={() => openQuiz(course.id)}>Take Quiz →</button>
                  }
                </div>
              </div>
            </>
          ) : (
            <div className="card p-6">
              {!quizDone ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="label-sm" style={{ color: course.color }}>Question {quizQ + 1} / {course.quiz.length}</div>
                    <div className="w-32 h-1.5 rounded-full" style={{ background: '#1A1A2E' }}>
                      <div className="h-full rounded-full" style={{ width: `${((quizQ) / course.quiz.length) * 100}%`, background: course.color }} />
                    </div>
                  </div>
                  <p className="text-[16px] font-semibold text-t1 mb-6" style={{ lineHeight: 1.65 }}>{course.quiz[quizQ].q}</p>
                  <div className="space-y-3 mb-4">
                    {course.quiz[quizQ].opts.map((opt, i) => {
                      const isSelected = quizSelected === i
                      const isCorrect = i === course.quiz[quizQ].answer
                      const show = quizSelected !== null
                      let border = '#1A1A2E', bg = 'transparent', color = '#F0F0F5'
                      if (show && isCorrect) { border = '#4CAF7D'; bg = 'rgba(76,175,125,0.08)'; color = '#4CAF7D' }
                      else if (show && isSelected && !isCorrect) { border = '#E05C5C'; bg = 'rgba(224,92,92,0.08)'; color = '#E05C5C' }
                      return (
                        <button key={i} className="w-full text-left p-4 rounded-xl transition-all text-[14px]"
                          style={{ border: `1px solid ${border}`, background: bg, color, cursor: show ? 'default' : 'pointer' }}
                          onClick={() => pickAnswer(course.id, i)}>
                          <span className="font-mono text-[11px] mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>{opt}
                        </button>
                      )
                    })}
                  </div>
                  {quizShowExp && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl mb-4" style={{ background: 'rgba(110,142,218,0.06)', border: '1px solid rgba(110,142,218,0.2)' }}>
                      <div className="label-sm mb-2" style={{ color: '#6E8EDA' }}>Explanation</div>
                      <p className="text-[13px] text-t2" style={{ lineHeight: 1.7 }}>{course.quiz[quizQ].exp}</p>
                    </motion.div>
                  )}
                  {quizShowExp && (
                    <button className="w-full py-3 rounded-xl text-[14px] font-bold"
                      style={{ background: `linear-gradient(135deg,${course.color},#E8C98E)`, color: '#000' }}
                      onClick={() => nextQuestion(course.id)}>
                      {quizQ < course.quiz.length - 1 ? 'Next Question →' : 'See Results →'}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-[56px] font-black mb-2" style={{ color: course.color, letterSpacing: '-2px' }}>
                    {quizCorrect}/{course.quiz.length}
                  </div>
                  <p className="text-t2 mb-2">{quizCorrect >= 2 ? `Quiz passed! +${course.xp} XP earned` : 'Not quite — review the lessons and try again'}</p>
                  <button className="btn-ghost px-5 py-2.5 text-[13px] mt-4"
                    onClick={() => { setQuizMode(false); setQuizDone(false) }}>
                    Back to Lessons
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
