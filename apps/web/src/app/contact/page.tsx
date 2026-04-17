import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">allEdu</Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-[#1a56db]">← Home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-2 text-gray-500">We&apos;re here to help. Reach out to us anytime.</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-3">
              <Mail size={22} className="text-[#1a56db]" />
            </div>
            <p className="font-semibold text-gray-800">Email</p>
            <a href="mailto:support@biharidhanu.com" className="mt-1 text-sm text-[#1a56db] hover:underline">
              support@biharidhanu.com
            </a>
          </div>

          <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-3">
              <Phone size={22} className="text-[#1a56db]" />
            </div>
            <p className="font-semibold text-gray-800">Phone</p>
            <a href="tel:+918000000000" className="mt-1 text-sm text-[#1a56db] hover:underline">
              +91 80000 00000
            </a>
            <p className="mt-1 text-xs text-gray-500">Mon–Sat, 9am–6pm IST</p>
          </div>

          <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-3">
              <MapPin size={22} className="text-[#1a56db]" />
            </div>
            <p className="font-semibold text-gray-800">Address</p>
            <p className="mt-1 text-sm text-gray-600">Patna, Bihar, India</p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border bg-gray-50 p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-medium">How do I enroll in a batch?</p>
              <p className="mt-1 text-gray-500">Create an account, browse batches, and click &quot;Enroll Now&quot; on any batch page.</p>
            </div>
            <div>
              <p className="font-medium">Are there free batches available?</p>
              <p className="mt-1 text-gray-500">Yes! Many batches are completely free. Filter by &quot;Free&quot; on the batches page.</p>
            </div>
            <div>
              <p className="font-medium">How do I access recorded classes?</p>
              <p className="mt-1 text-gray-500">After enrolling, go to your dashboard and click on any batch to access all recorded videos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
