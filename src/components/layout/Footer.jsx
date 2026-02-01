export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] px-4 sm:px-6 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[#64748B] text-xs sm:text-sm text-center md:text-left">
          © 2026 PAUD Yayasan Suci Sutjipto. All rights reserved.
        </p>

        <div className="flex items-center gap-4 text-[#64748B] text-xs sm:text-sm">
          <button className="hover:text-[#E94640] transition-colors">
            Help
          </button>
          <span>•</span>
          <button className="hover:text-[#E94640] transition-colors">
            Privacy
          </button>
          <span>•</span>
          <button className="hover:text-[#E94640] transition-colors">
            Terms
          </button>
        </div>
      </div>
    </footer>
  )
}
