import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaBell, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import authService from '../../services/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.user_type) {
      case 'customer':
        return '/customer/dashboard';
      case 'sales_rep':
        return '/sales/dashboard';
      case 'finance_manager':
        return '/finance/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={getDashboardLink()} className="flex items-center">
              <FaCar className="text-2xl text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-800">
                Vehicle Finance
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to={getDashboardLink()} className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              Dashboard
            </Link>
            
            {user?.user_type === 'customer' && (
              <>
                <Link to="/customer/vehicles" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                  Vehicles
                </Link>
                <Link to="/customer/apply-loan" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                  Apply Loan
                </Link>
                <Link to="/customer/emi-tracker" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                  EMI Tracker
                </Link>
              </>
            )}

            <button className="p-2 text-gray-700 hover:text-blue-600">
              <FaBell className="text-xl" />
            </button>

            <div className="flex items-center space-x-2 border-l pl-4">
              <FaUser className="text-gray-600" />
              <span className="text-gray-700">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-700 hover:text-red-600"
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to={getDashboardLink()}
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
            >
              Dashboard
            </Link>
            {user?.user_type === 'customer' && (
              <>
                <Link
                  to="/customer/vehicles"
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
                >
                  Vehicles
                </Link>
                <Link
                  to="/customer/apply-loan"
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
                >
                  Apply Loan
                </Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;