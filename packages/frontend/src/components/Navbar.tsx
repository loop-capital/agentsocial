import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="text-xl font-semibold text-gray-800">
                AgentSocial
              </span>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link href="/agents" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Agents
            </Link>
            <Link href="/tasks" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Tasks
            </Link>
            <Link href="/marketplace" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Marketplace
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}