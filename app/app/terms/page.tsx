import Link from 'next/link'

export default function TermsPage() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-[16px] font-bold mb-3 gold-text">{title}</h2>
      <div className="text-[14px] text-t2 space-y-3" style={{lineHeight:1.8}}>{children}</div>
    </div>
  )
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="label-gold mb-2">Legal</div>
        <h1 className="text-[28px] font-bold mb-2">Terms of Service</h1>
        <p className="text-t3 text-[13px]">Last updated: April 2025 · Effective: April 2025</p>
      </div>
      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Orelis Hub ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms apply to all users, including founders, individuals, and teams.</p>
      </Section>
      <Section title="2. Description of Service">
        <p>Orelis Hub is an AI-powered business intelligence platform for founders and individuals in Southeast Asia. Features include an AI Advisor, Growth Trajectory modelling, Market Simulation, Idea Launchpad, and educational content.</p>
        <p>The Platform uses AI (including Groq-powered language models) to provide analysis, advice, and forecasts. All AI-generated content is for informational purposes only and does not constitute professional financial, legal, or business advice.</p>
      </Section>
      <Section title="3. User Accounts">
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials. Notify us immediately of any unauthorised access. Each account is for individual use only unless otherwise agreed.</p>
      </Section>
      <Section title="4. Acceptable Use">
        <p>You agree not to: (a) use the Platform for any unlawful purpose; (b) attempt to reverse-engineer or extract proprietary models or systems; (c) submit false, misleading, or harmful content; (d) share your account with others; (e) use automated tools to scrape or abuse the service.</p>
      </Section>
      <Section title="5. User Content & Documents">
        <p>You retain ownership of any documents, data, or content you upload. By uploading content, you grant Orelis a limited licence to process that content solely to provide the service to you. We do not use your uploaded documents to train AI models.</p>
        <p>You must only upload documents you have the right to share. Do not upload confidential third-party materials without authorisation.</p>
      </Section>
      <Section title="6. AI-Generated Content Disclaimer">
        <p>AI outputs are generated automatically and may contain errors, inaccuracies, or outdated information. Orelis Hub makes no warranties regarding the accuracy, completeness, or fitness for purpose of any AI-generated analysis, forecast, or recommendation. Always verify important business decisions with qualified professionals.</p>
      </Section>
      <Section title="7. Intellectual Property">
        <p>The Platform, its design, code, and non-user content are owned by Orelis or its licensors and protected by applicable intellectual property laws. You may not copy, redistribute, or create derivative works without explicit written permission.</p>
      </Section>
      <Section title="8. Limitation of Liability">
        <p>To the maximum extent permitted by law, Orelis shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to business losses, data loss, or decisions made based on AI-generated content.</p>
      </Section>
      <Section title="9. Termination">
        <p>We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time. Upon termination, your data will be deleted within 30 days unless required to be retained by law.</p>
      </Section>
      <Section title="10. Changes to Terms">
        <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance. We will notify registered users of material changes via email.</p>
      </Section>
      <Section title="11. Governing Law">
        <p>These Terms are governed by the laws of Singapore. Any disputes shall be subject to the exclusive jurisdiction of the courts of Singapore.</p>
      </Section>
      <Section title="12. Contact">
        <p>For questions about these Terms, contact us at: <span className="gold-text">legal@orelis.io</span></p>
      </Section>
      <div className="pt-6 border-t" style={{borderColor:'#1C1C1C'}}>
        <Link href="/privacy" className="blue-text text-[13px] hover:opacity-80 transition-opacity">Read our Privacy Policy →</Link>
      </div>
    </div>
  )
}
