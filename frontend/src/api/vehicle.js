// frontend/src/api/vehicle.js
import axios from "./axios"; // Ensure you have an axios instance configured at ./axios.js

// Fetch all vehicles
const getAllVehicles = async () => {
  try {
    const response = await axios.get("/vehicles/"); // Adjust endpoint if your backend URL differs
    return response.data; // Return data as received from backend
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return []; // Return empty array if error occurs
  }
};

// Fetch a single vehicle by ID
const getVehicleById = async (id) => {
  try {
    const response = await axios.get(`/vehicles/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching vehicle with ID ${id}:`, error);
    return null;
  }
};

// Vehicle service object
const vehicleService = {
  getAllVehicles,
  getVehicleById,
};

export default vehicleService;
