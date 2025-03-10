import React, {useState, useEffect } from 'react'
import AddFarmerForm from '../components/addFarmerForm';
import axios from "axios";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/loadingSpinner';
import { useAuth } from '../context/AuthContext';

const FarmersPage = () => {
  const { backendURL } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [farmers,setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [villageNames, setVillageNames] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() =>{
    fetchFarmers();
  },[]);

  //function to fetch all farmers
  const fetchFarmers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURL}/farmers`);
        if (response.status === 200) {
          let data = response.data;

          // Function to extract and convert date from createdBy
          const parseCreatedByDate = (createdBy) => {
            if (!createdBy) return null;
            
              const parts = createdBy.split("-");
              if (parts.length < 5) return null; // Ensure format is valid
              
              const [name, day, month, year, time] = parts;
              
              // Convert time to 24-hour format for Date parsing
              let [timeValue, period] = time.split(" ");
              let [hours, minutes] = timeValue.split(":").map(Number);

              if (period.toLowerCase() === "pm" && hours !== 12) {
                hours += 12;
              } else if (period.toLowerCase() === "am" && hours === 12) {
                hours = 0;
              }

              // Create a valid date object
              return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
            };

            // Sorting customers based on `createdBy` date extracted
            const sortedFarmers = data.sort((a, b) => {
              const dateA = parseCreatedByDate(a.createdBy) || new Date(0);
              const dateB = parseCreatedByDate(b.createdBy) || new Date(0);
              return dateB - dateA; // Sort in descending order (most recent first)
            });

          setFarmers(sortedFarmers);
          setFilteredFarmers(sortedFarmers);

          const uniqueVillages = [...new Set(sortedFarmers.map(farmer => farmer.villageName))];
          setVillageNames(uniqueVillages);
        }
    } catch (err) {
        setError("Error fetching Farmers", err);
        console.log("Error fetching Farmers", err);
    } finally {
        setIsLoading(false);
    }
  };

  //function to send farmer data to farmer form when clicked on edit button
  const handleEdit = (farmer) => {
    setIsEdit(true);
    setSelectedFarmer(farmer);
    setIsFormOpen(true);
  }

  //function to filter data based on selected village and group
  useEffect(() => {
    let filteredData = farmers;
    if(selectedVillage){
      filteredData = filteredData.filter(farmer => farmer.villageName === selectedVillage);
    }
    setFilteredFarmers(filteredData);
  },[selectedVillage,farmers]);

  //function to delete selected farmer when clicked on delete button
  const handleDelete = async (farmerName) => {
    setIsLoading(true);
    try{
      const response = await axios.delete(`${backendURL}/farmers/${farmerName}`);
      if(response.status === 200){
        toast.success("Farmer deleted successfully");
        fetchFarmers();
      }
    }catch(err){
      toast.error(`Error deleting farmer: ${err.message}`);
      console.log("Error deleting farmer",err);
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-col w-full min-h-screen p-5 ml-[100px] overflow-auto">
        {/* filters */}
        <div className="flex flex-row gap-5">
            <select value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
              className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
                <option value="">Village Name</option>
                {villageNames && villageNames.map((village,idx) => (
                  <option key={idx} value={village}>
                    {village}
                  </option>
                ))}
            </select>
            
           <button 
              onClick={() => setSelectedVillage("")} 
           className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              Remove Filters
            </button>
            <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 rounded-md text-black font-medium bg-white shadow-sm">
              Add New Farmer
            </button>
        </div>
        {/* filters */}
        {/* table */}
        <table className="bg-white w-full mt-5 border-separate border border-black rounded-lg">
          <thead>
            <tr className="text-left text-[16px] text-black">
              <th className="border border-black p-2">Farmer name</th>
              <th className="border border-black p-2">Village name</th>
              <th className="border border-black pl-2">Phone number</th>
              <th className="border border-black pl-2">Created By</th>
              <th className="border border-black pl-2">Modified By</th>
              <th className="border border-black p-2"></th>
              <th className="border border-black p-2"></th>
            </tr>
          </thead>
          {isLoading ? (
            <LoadingSpinner />) : error ? (
              <div className="w-full h-full justify-center items-center">
                <p className="text-red-500 font-medium text-xl">{error}</p>
              </div>
            ):(
              <tbody className="text-[16px]">
                {filteredFarmers && filteredFarmers.map((farmer) => (
                  <tr key={farmer._id} className="text-left">
                    <td className="border border-black p-2 ">{farmer.farmerName}</td>
                    <td className="border border-black p-2 ">{farmer.villageName}</td>
                    <td className="border border-black p-2">{farmer.phoneNumber}</td>
                    <td className="border border-black p-2">{farmer.createdBy}</td>
                    <td className="border border-black p-2">{farmer.modifiedBy ? farmer.modifiedBy : ""}</td>
                    <td className="border border-black p-2">
                      <button onClick={() => handleEdit(farmer)}className="bg-gray-200 text-[#1E90FF] font-bold cursor-pointer px-4 py-2 rounded">
                        Edit
                      </button>
                    </td>
                    <td className="border border-black p-2">
                      <button onClick={(e) =>{
                        e.stopPropagation();
                        handleDelete(farmer.farmerName);
                      }} className="text-[#D74848] font-bold cursor-pointer px-4 py-2 rounded bg-gray-200">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )} 
        </table>
        {isFormOpen && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddFarmerForm
            onClose={() => setIsFormOpen(false)}
            fetchFarmers={fetchFarmers}
            farmer={selectedFarmer}
            isEdit={isEdit}
            onCloseEdit={() => setIsEdit(false)}
          />
        </div>
        )}
    </section>
  )
}

export default FarmersPage