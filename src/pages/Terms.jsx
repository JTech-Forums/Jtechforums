const termsSections = [
  {
    title: '1. Who we are',
    body:
      'JTech Forums LLC, a New Jersey limited liability company ("JTech Forums", "JTech", "we", "us", or "our"), operates jtechforums.org, the community forum at forums.jtechforums.org, and related services (collectively, the "Service"). By accessing or using the Service, you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Service.',
  },
  {
    title: '2. Eligibility & accounts',
    list: [
      'You must be at least 13 years old (or the minimum age required in your jurisdiction) to use the Service.',
      'You are responsible for your account credentials and for all activity that occurs under your account.',
      'Provide accurate registration information and keep it current.',
      'We may suspend or terminate accounts that violate these Terms or applicable law.',
    ],
  },
  {
    title: '3. Acceptable use',
    body: 'You agree not to misuse the Service. In particular, you will not:',
    list: [
      'Post unlawful, infringing, harassing, defamatory, or malicious content.',
      'Attempt to gain unauthorized access to the Service, other accounts, or our systems.',
      'Scrape, crawl, or harvest data except as expressly permitted, or use the Service to train machine-learning models without our written permission.',
      'Disrupt or overload the Service, or circumvent security, rate-limiting, or access controls.',
      'Impersonate others or misrepresent your affiliation with any person or entity.',
    ],
  },
  {
    title: '4. User content',
    body:
      'You retain ownership of the content you post. By posting, you grant JTech Forums a worldwide, non-exclusive, royalty-free license to host, store, display, reproduce, and distribute that content for the purpose of operating and promoting the Service. You are solely responsible for the content you post and confirm you have the rights to post it. Content you post publicly remains visible to others and may be indexed by search engines.',
  },
  {
    title: '5. Moderation',
    body:
      'We may review, edit, remove, or restrict any content or account at our discretion, with or without notice, to enforce these Terms, our community guidelines, or applicable law. Moderation decisions do not create any obligation to monitor all content.',
  },
  {
    title: '6. Intellectual property',
    body:
      'The Service, including its software, design, logos, and trademarks, is owned by JTech Forums LLC or its licensors and is protected by intellectual-property laws. Except for your own content and rights expressly granted here, no rights are transferred to you.',
  },
  {
    title: '7. Third-party services',
    body:
      'The Service may link to or integrate third-party sites and services that are governed by their own terms and policies. We are not responsible for third-party content or practices.',
  },
  {
    title: '8. Disclaimers',
    body:
      'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement. Information on the Service is community-contributed and provided for general purposes; it is not professional, legal, or halachic advice, and we do not guarantee its accuracy or completeness.',
  },
  {
    title: '9. Limitation of liability',
    body:
      'To the fullest extent permitted by law, JTech Forums LLC and its members, managers, and contributors will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits or data, arising from your use of the Service. Our total liability for any claim relating to the Service will not exceed one hundred U.S. dollars (US$100).',
  },
  {
    title: '10. Indemnification',
    body:
      'You agree to indemnify and hold harmless JTech Forums LLC from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising out of your content, your use of the Service, or your violation of these Terms or applicable law.',
  },
  {
    title: '11. Governing law & disputes',
    body:
      'These Terms are governed by the laws of the State of New Jersey, United States, without regard to conflict-of-laws principles. You and JTech Forums LLC agree to seek injunctions only in the state or federal courts located in Ocean County, New Jersey, and consent to the jurisdiction and venue of those courts. Other than claims for injunctive relief or under the Computer Fraud and Abuse Act, any dispute will be resolved by binding individual arbitration in Ocean County, New Jersey, under the American Arbitration Association rules; you and the company waive participation in any class or representative proceeding. Nothing here deprives you of mandatory consumer-protection rights available under the law of your residence.',
  },
  {
    title: '12. Changes to these Terms',
    body:
      'We may update these Terms from time to time. Material changes will be indicated by updating the "Last updated" date below and, where appropriate, by additional notice. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
  },
  {
    title: '13. Contact',
    list: [
      'Email: admin@jtechforums.org',
      'Postal mail: JTech Forums LLC, 12 Shefa Chaim Ave, Lakewood, NJ 08701, United States',
      'Forum: https://forums.jtechforums.org',
    ],
  },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-16">
      <div className="text-center">
        <p className="section-label text-xs uppercase text-sky-200">Legal</p>
        <h1 className="text-5xl font-semibold text-white">Terms of Service</h1>
        <p className="mt-3 text-base text-slate-300">Last updated: July 22, 2026</p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-8">
        <div className="space-y-8">
          {termsSections.map((section) => (
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
