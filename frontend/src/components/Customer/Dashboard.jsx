import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaFileAlt, FaMoneyBillWave, FaBell, FaPlus } from 'react-icons/fa';
import authService from '../../services/auth';
import loanService from '../../services/loans';
import dashboardService from '../../services/dashboard';
import Navbar from '../Shared/Navbar';

const CustomerDashboard = () => {
  const [stats, setStats] = useState({});
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, loansData] = await Promise.all([
        dashboardService.getStats(),
        loanService.getAll()
      ]);
      setStats(statsData);
      setLoans(loansData.results || loansData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user.first_name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Manage your vehicle loans and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_applications || 0}
                </p>
              </div>
              <FaFileAlt className="text-4xl text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Approved Loans</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.approved_loans || 0}
                </p>
              </div>
              <FaCar className="text-4xl text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pending_applications || 0}
                </p>
              </div>
              <FaBell className="text-4xl text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">EMI Paid</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.total_emi_paid || 0}
                </p>
              </div>
              <FaMoneyBillWave className="text-4xl text-purple-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/customer/apply-loan"
              className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Apply for New Loan
            </Link>
            <Link
              to="/customer/vehicles"
              className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaCar className="mr-2" />
              Browse Vehicles
            </Link>
            <Link
              to="/customer/emi-tracker"
              className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaMoneyBillWave className="mr-2" />
              Track EMI
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Applications</h2>
          </div>
          <div className="p-6">
            {loans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No applications yet</p>
                <Link to="/customer/apply-loan" className="text-blue-600 hover:underline mt-2 inline-block">
                  Apply for your first loan →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.slice(0, 5).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {loan.application_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {loan.vehicle_name} - NPR {loan.loan_amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {new Date(loan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
                      {loan.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

