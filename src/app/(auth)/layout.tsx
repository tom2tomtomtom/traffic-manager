export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black-ink bg-grid">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-hot uppercase tracking-wider">
            Alt/Shift
          </h1>
          <p className="text-white-muted text-sm uppercase tracking-wide mt-2">
            Traffic Manager
          </p>
        </div>

        {/* Auth content */}
        {children}
      </div>
    </div>
  )
}
