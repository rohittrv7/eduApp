import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">allEdu</Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-[#1a56db]">← Home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: January 2025</p>

        <div className="mt-8 space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as your name, mobile number, email address, and profile information when you create an account or use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications about classes and updates, and communicate with you about your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except as described in this policy. We may share information with trusted third parties who assist us in operating our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. Your data is transmitted using SSL encryption and stored securely on our servers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookies</h2>
            <p>We use cookies and similar tracking technologies to enhance your experience on our platform. Authentication cookies are used to keep you logged in securely.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information. Contact us at support@biharidhanu.com to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@biharidhanu.com" className="text-[#1a56db] hover:underline">support@biharidhanu.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
