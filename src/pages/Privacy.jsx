const policySections = [
  {
    title: '1. Scope and who we are',
    body:
      'JTech Forums LLC, a New Jersey limited liability company ("JTech Forums", "JTech", "we", "us"), operates jtechforums.org and related services. This policy explains how we collect, use, share, and protect personal information when you use the site and community.',
  },
  {
    title: '2. Information we collect',
    list: [
      'Information you provide: account details, posts, attachments, contact requests, preferences.',
      'Automatically collected: IP, browser/OS, referrer, timestamps, page views, session data, cookies.',
      'Third-party sources: limited data from connected services to operate the integration.',
    ],
  },
  {
    title: '3. How we use information',
    list: [
      'Provide, maintain, and improve the forum.',
      'Personalize experiences and surface relevant content.',
      'Respond to support, enforce community rules, and send system updates.',
      'Conduct optional marketing with consent and comply with legal obligations.',
    ],
  },
  {
    title: '4. Legal bases (GDPR)',
    list: [
      'Contractual necessity: operating your account and forum access.',
      'Legitimate interests: security, abuse prevention, service improvements.',
      'Consent: analytics cookies, optional marketing.',
      'Legal obligations: retaining records where required.',
    ],
  },
  {
    title: '5. Sharing & disclosure',
    list: [
      'Vendors and hosting providers under confidentiality.',
      'Legal or law-enforcement requests when required.',
      'Business transfers such as a merger or acquisition.',
      'Content posted publicly remains visible to everyone.',
    ],
  },
  {
    title: '6. Cookies & tracking',
    body: 'Cookies keep you logged in, power analytics, and protect the service. You may disable cookies in your browser but some features may break.',
  },
  {
    title: '7. Data retention',
    body: 'We retain data for as long as needed for the purposes outlined and to meet legal obligations. Deletion requests are honored where possible, though certain records may persist for compliance.',
  },
  {
    title: '8. Security',
    body: 'Encryption, access controls, and backups reduce risk, but no online system is perfectly secure.',
  },
  {
    title: '9. Your rights',
    list: [
      'Access, portability, correction, deletion, and restriction requests.',
      'Withdraw consent without affecting prior processing.',
      'California users: disclosure of data categories and no discrimination for exercising rights.',
      'Email privacy@jtechforums.org to open a request.',
    ],
  },
  {
    title: "10. Children's privacy",
    body: 'JTech is not directed at children under 13 and we do not knowingly collect such data. We delete it promptly if discovered.',
  },
  {
    title: '11. International transfers',
    body: 'Data may be processed outside your country. We rely on safeguards such as EU Standard Contractual Clauses to ensure adequate protection.',
  },
  {
    title: '12. Do Not Track',
    body: 'Browser DNT signals are not yet standardized; we will revisit if binding requirements are adopted.',
  },
  {
    title: '13. Changes',
    body: 'We may update this policy and will refresh the “Last updated” date for significant revisions.',
  },
  {
    title: '14. Governing law',
    body: 'JTech Forums LLC is organized in New Jersey and operates the Service from New Jersey. This policy is governed by the laws of the State of New Jersey, United States, without regard to conflict-of-laws rules, consistent with our Terms of Service. This does not remove any mandatory data-protection rights you have under the law of your country or state of residence.',
  },
  {
    title: '15. Contact',
    list: [
      'Email: privacy@jtechforums.org',
      'Postal mail: JTech Forums LLC, 12 Shefa Chaim Ave, Lakewood, NJ 08701, United States',
    ],
  },
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-16">
      <div className="text-center">
        <p className="section-label text-xs uppercase text-sky-200">Policy</p>
        <h1 className="text-5xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-3 text-base text-slate-300">Last updated: July 22, 2026</p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-8">
        <div className="space-y-8">
          {policySections.map((section) => (
            <section key={section.title} className="border-b border-white/5 pb-6 last:border-none last:pb-0">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              {section.body && <p className="mt-3 text-sm text-slate-300">{section.body}</p>}
              {section.list && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
