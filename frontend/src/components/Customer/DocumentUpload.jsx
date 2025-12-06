import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileUpload, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../Shared/Navbar';
import loanService from '../../services/loans';
import { DOCUMENT_TYPES } from '../../utils/constants';

const DocumentUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const data = await loanService.getById(id);
      setApplication(data);
      setDocuments(data.documents || []);
    } catch (error) {
      toast.error('Failed to load application');
      navigate('/customer/dashboard');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) { // 5MB
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !selectedFile) {
      toast.error('Please select document type and file');
      return;
    }

    setUploading(true);
    try {
      await loanService.uploadDocument(id, {
        document_type: selectedType,
        file: selectedFile,
      });
      toast.success('Document uploaded successfully');
      setSelectedType('');
      setSelectedFile(null);
      loadApplication();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <FaCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Upload Documents</h1>
          <p className="text-gray-600 mt-2">
            Application Number: <span className="font-semibold">{application.application_number}</span>
          </p>
        </div>

        {/* Application Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Loan Application Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Vehicle</p>
              <p className="font-medium">{application.vehicle_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Loan Amount</p>
              <p className="font-medium">NPR {application.loan_amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-gray-600">Monthly EMI</p>
              <p className="font-medium">NPR {application.monthly_emi?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaFileUpload className="mr-2 text-blue-600" />
            Upload New Document
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select document type...</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File * (Max 5MB)
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedType || !selectedFile}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-2">Required Documents:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Citizenship Certificate (mandatory)</li>
              <li>Driving License (mandatory)</li>
              <li>Bank Statement - Last 6 months (mandatory)</li>
              <li>Salary Slip / Income Proof (mandatory)</li>
              <li>PAN Card (if available)</li>
              <li>Passport Size Photos (2 copies)</li>
            </ul>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaFileUpload className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium text-gray-800">
                        {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                      </p>
                      {doc.verification_notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Note: {doc.verification_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doc.status)}`}>
                    {doc.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
          
          {documents.length > 0 && documents.every(d => d.status === 'verified') && (
            <div className="text-green-600 flex items-center">
              <FaCheckCircle className="mr-2" />
              <span className="font-medium">All documents verified!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
