import Link from "next/link";

/** Footer links to the legal pages and FAQ, shown on every public and secondary page. */
export default function LegalLinks({ className = "" }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <nav aria-label="Legal" className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <span>© {year} PigMaster</span>
      <Link href="/privacy-policy" className="hover:text-gray-900 hover:underline dark:hover:text-gray-100">Privacy Policy</Link>
      <Link href="/terms" className="hover:text-gray-900 hover:underline dark:hover:text-gray-100">Terms of Service</Link>
      <Link href="/faq" className="hover:text-gray-900 hover:underline dark:hover:text-gray-100">FAQ</Link>
    </nav>
  );
}
