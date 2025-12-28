import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCar } from "react-icons/fa";
import vehicleService from "../../api/vehicle"; // Correct import

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleService.getAllVehicles(); // Corrected here
      setVehicles(response.results || response);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Available Vehicles</h1>
      {vehicles.length === 0 ? (
        <p className="text-gray-600">No vehicles available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition-all"
            >
              <div className="h-40 w-full bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                <FaCar className="text-gray-400 text-6xl" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{vehicle.name}</h2>
              <p className="text-gray-500 mb-2">{vehicle.model}</p>
              <p className="text-gray-700 font-semibold mb-4">NPR {vehicle.price?.toLocaleString()}</p>
              <Link
                to={`/customer/vehicles/${vehicle.id}`}
                className="inline-block w-full text-center px-4 py-2 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
