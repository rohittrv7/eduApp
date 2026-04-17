import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">allEdu</Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-[#1a56db]">← Home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: January 2025</p>

        <div className="mt-8 space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using allEdu, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Use of Service</h2>
            <p>You may use our platform for lawful purposes only. You agree not to use the service to distribute harmful content, violate intellectual property rights, or engage in any activity that disrupts the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Account Responsibility</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Content and Intellectual Property</h2>
            <p>All content on allEdu, including videos, study materials, and course content, is protected by copyright. You may not reproduce, distribute, or create derivative works without explicit permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Payment and Refunds</h2>
            <p>Payments for paid batches are processed securely through Razorpay. Refund requests are handled on a case-by-case basis. Contact support within 7 days of purchase for refund inquiries.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. Users may also delete their accounts at any time by contacting support.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Limitation of Liability</h2>
            <p>allEdu is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@biharidhanu.com" className="text-[#1a56db] hover:underline">support@biharidhanu.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
