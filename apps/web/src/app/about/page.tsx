import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">allEdu</Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-[#1a56db]">← Home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">About allEdu</h1>
        <p className="mt-4 text-gray-500 text-sm">Empowering students across India</p>

        <div className="mt-8 space-y-6 text-gray-700">
          <p>
            allEdu is a live education platform built to make quality education accessible to every student in India, especially those preparing for competitive exams like JEE, NEET, UPSC, and SSC.
          </p>
          <p>
            We connect students with India&apos;s best teachers through live interactive classes, recorded video lectures, quizzes, and doubt-solving sessions — all in one place.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Our Mission</h2>
          <p>
            To democratize education by providing affordable, high-quality learning experiences to students regardless of their location or economic background.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">What We Offer</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Live interactive classes with top educators</li>
            <li>Recorded video lectures for flexible learning</li>
            <li>Practice quizzes and mock tests</li>
            <li>Doubt-solving sessions</li>
            <li>Study materials and notes</li>
            <li>Performance analytics and progress tracking</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 pt-4">Our Numbers</h2>
          <div className="grid grid-cols-3 gap-4 rounded-xl bg-blue-50 p-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#1a56db]">50,000+</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a56db]">1,000+</p>
              <p className="text-sm text-gray-600">Classes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a56db]">500+</p>
              <p className="text-sm text-gray-600">Hours of Content</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6">
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
