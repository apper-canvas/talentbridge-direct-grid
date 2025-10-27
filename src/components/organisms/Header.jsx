import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@/layouts/Root";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Jobs from "@/components/pages/Jobs";
import { cn } from "@/utils/cn";
function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.user);
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Browse Jobs", href: "/jobs" },
    { name: "My Dashboard", href: "/candidates" },
    { name: "For Employers", href: "/employers" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" }
{ name: "Contact", href: "/contact" }
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handlePostJob = () => {
    navigate('/employers/post-job');
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
              TalentBridge
            </span>
          </Link>
{/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-gray-700 hover:text-primary transition-colors font-medium relative",
                  isActive(item.href) && "text-primary"
                )}
              >
                {item.name}
                {isActive(item.href) && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-700 rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button onClick={handlePostJob} variant="primary" size="sm">
              Post a Job
            </Button>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {user?.firstName || user?.emailAddress}
                </span>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <ApperIcon name="LogOut" className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/login')} variant="outline" size="sm">
                Login
              </Button>
            )}
</div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none"
          >
            <ApperIcon name={isMobileMenuOpen ? "X" : "Menu"} className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200",
                  isActive(item.href)
                    ? "text-primary bg-primary-50"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-3 py-2 space-y-2">
              <Button
                onClick={handlePostJob}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Post a Job
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 text-sm text-gray-700 border-t border-gray-200">
                    {user?.firstName || user?.emailAddress}
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <ApperIcon name="LogOut" className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Login
                </Button>
              )}
</div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;