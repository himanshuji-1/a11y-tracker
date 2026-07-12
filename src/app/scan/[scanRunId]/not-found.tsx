export default function ScanNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-200 mb-2">Scan Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The scan you&apos;re looking for doesn&apos;t exist or may have been deleted.
        </p>
        <a
          href="/"
          className="px-4 py-2 rounded-md bg-white/10 text-sm text-gray-300 hover:bg-white/20 transition-colors"
        >
          ← Run a new scan
        </a>
      </div>
    </div>
  );
}
