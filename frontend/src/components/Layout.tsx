import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Ticket, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home,
  BarChart3,
  Users,
  Settings,
  Bookmark,
  QrCode,
  View
} from 'lucide-react';
import UserDropdown from '../ui/UserDropdown';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavigationItems = () => {
    if (!user) {
      return [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Events', href: '/events', icon: Calendar },
      ];
    }

    const baseItems = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Events', href: '/events', icon: Calendar },
    ];

    if (user.role === 'student') {
      baseItems.push(
        { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
        { name: 'Saved Events', href: '/my-saved-events', icon: Bookmark }
      );
    }

    if (user.role === 'organizer') {
      baseItems.push(
        { name: 'Dashboard', href: '/organizer/dashboard', icon: BarChart3 },
        { name: 'Manage Events', href: '/organizer/events', icon: View },
        { name: 'Create Event', href: '/organizer/events/create', icon: Calendar },
        // { name: 'QR Validator', href: '/organizer/qr-validator', icon: QrCode }
        //  no need, organizer will use their camera to scan a QR code
      );
    }

    if (user.role === 'admin') {
      baseItems.push(
        { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Moderation', href: '/admin/events', icon: Calendar },
        { name: 'Organizations', href: '/admin/organizations', icon: Settings }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-primary-600 " style={{textDecoration: 'none'}}>
                  CampusEvents
                </Link>
              </div>
              {/* Desktop navigation: hidden below lg */}
                <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href); // check if link is active

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        style={{ textDecoration: "none" }}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                          ${active 
                            ? 'border-primary-500 text-primary-500'  // text color matches theme
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
            </div>

            {/* User dropdown: hidden below lg */}
            <UserDropdown 
                className="hidden lg:flex"
                userValid={user ? true : false}
                role={user?.role ?? ""}
                userName={user?.firstName + " " + user?.lastName}
            />

            {/* Menu button: show below lg */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {user ? (
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-auto text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>

  );
};