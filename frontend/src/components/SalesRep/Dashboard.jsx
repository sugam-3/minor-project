import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaCheckCircle, FaClock, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import dashboardService from '../../services/dashboard';

const SalesRepDashboard = () => {
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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
      
      // Filter applications needing verification
      const pendingVerification = (loansData.results || loansData).filter(
        loan => loan.status === 'submitted' || loan.status === 'under_review'
      );
      setApplications(pendingVerification);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      documents_verified: 'bg-green-100 text-green-800',
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Sales Representative Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Verify documents and manage loan applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Verification</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pending_tasks || applications.length}
                </p>
              </div>
              <FaClock className="text-4xl text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Verified Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.verified_today || 0}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
          </div>

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
        </div>

        {/* Pending Verifications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Applications Pending Verification
            </h2>
          </div>
          
          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaCheckCircle className="text-6xl mx-auto mb-4 opacity-50" />
                <p>No applications pending verification</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">
                          {loan.application_number}
                        </h3>
                        <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customer</p>
                          <p className="font-medium">{loan.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Vehicle</p>
                          <p className="font-medium">{loan.vehicle_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Loan Amount</p>
                          <p className="font-medium">NPR {loan.loan_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Documents</p>
                          <p className="font-medium">{loan.documents?.length || 0} uploaded</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(loan.submitted_at || loan.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to={`/sales/verify/${loan.id}`}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FaEye className="mr-2" />
                      Verify
                    </Link>
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

export default SalesRepDashboard;