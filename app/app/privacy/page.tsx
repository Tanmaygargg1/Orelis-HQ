import Link from 'next/link'

export default function PrivacyPage() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-[16px] font-bold mb-3 blue-text">{title}</h2>
      <div className="text-[14px] text-t2 space-y-3" style={{lineHeight:1.8}}>{children}</div>
    </div>
  )
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="label-blue mb-2">Legal</div>
        <h1 className="text-[28px] font-bold mb-2 gradient-blue">Privacy Policy</h1>
        <p className="text-t3 text-[13px]">Last updated: April 2025 · Effective: April 2025</p>
      </div>
      <Section title="1. What We Collect">
        <p><strong className="text-t1">Account data:</strong> Your name, email address, and password hash when you register.</p>
        <p><strong className="text-t1">Business profile data:</strong> Information you voluntarily enter about your business (stage, revenue, industry, etc.). This is stored securely on our servers.</p>
        <p><strong className="text-t1">Uploaded documents:</strong> PDFs and other files you upload for AI analysis. These are stored in encrypted form on our servers.</p>
        <p><strong className="text-t1">Usage data:</strong> Basic server logs (IP address, browser type, pages visited) for security and debugging purposes.</p>
      </Section>
      <Section title="2. How We Use Your Data">
        <p>We use your data solely to provide the Orelis Hub service: to power AI analysis, personalise responses, and maintain your business profile across sessions. We do not sell your data to third parties. We do not use your documents or business data to train AI models.</p>
      </Section>
      <Section title="3. AI Processing">
        <p>When you interact with AI features, your inputs (including extracted document content) are sent to Groq's API for processing. Groq operates under their own privacy policy. We minimise data sent and do not include personally identifiable information beyond what is necessary for the query.</p>
      </Section>
      <Section title="4. Data Storage & Security">
        <p>Your data is stored on AWS servers located in Singapore (ap-southeast-1). We implement industry-standard security measures including encrypted storage, HTTPS-only access, and secure session tokens.</p>
        <p>Passwords are never stored in plain text — we use bcrypt hashing with a cost factor of 12.</p>
      </Section>
      <Section title="5. Data Retention">
        <p>Account and profile data is retained for as long as your account is active. Uploaded documents are retained until you delete them or close your account. Upon account deletion, all your data is permanently deleted within 30 days.</p>
      </Section>
      <Section title="6. Your Rights">
        <p>You have the right to: access a copy of your personal data, correct inaccurate data, delete your account and all associated data, export your data, and withdraw consent at any time.</p>
        <p>To exercise these rights, email: <span className="blue-text">privacy@orelis.io</span></p>
      </Section>
      <Section title="7. Cookies">
        <p>We use a single session cookie (<code style={{color:'#C8A96E',fontSize:12}}>orelis_session</code>) to keep you logged in. This is a secure, HTTP-only cookie and contains no personal data — only an encrypted session token. We do not use tracking or advertising cookies.</p>
      </Section>
      <Section title="8. Third-Party Services">
        <p>We use Groq (AI inference) and AWS (hosting). These services may process data as part of delivering our service. We do not use Google Analytics, Facebook Pixel, or any advertising networks.</p>
      </Section>
      <Section title="9. Children's Privacy">
        <p>Orelis Hub is not intended for users under 16 years of age. We do not knowingly collect data from minors.</p>
      </Section>
      <Section title="10. Changes to This Policy">
        <p>We may update this policy periodically. We will notify registered users of material changes via email at least 14 days in advance.</p>
      </Section>
      <Section title="11. Contact">
        <p>For privacy questions or requests: <span className="blue-text">privacy@orelis.io</span><br/>
        Orelis Hub · Singapore</p>
      </Section>
      <div className="pt-6 border-t" style={{borderColor:'#1C1C1C'}}>
        <Link href="/terms" className="gold-text text-[13px] hover:opacity-80 transition-opacity">Read our Terms of Service →</Link>
      </div>
    </div>
  )
}
