import React, {useState, useEffect } from 'react'
import axios from "axios";
import LoadingSpinner from './loadingSpinner';
import { useAuth } from '../context/AuthContext';

const CreditCards = () => {
  const { backendURL } = useAuth();
  const [credits,setCredits] = useState([]);
  const [filteredCredits, setFilteredCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() =>{
    fetchCredits();
  },[]);

  //function to fetch all credits
  const fetchCredits = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURL}/credits`);
      if (response.status === 200) {
        let data = response.data;
  
        const today = new Date();
        const todayDateStr = today.toLocaleDateString("en-GB").replace(/\//g, "-"); // DD-MM-YYYY format
  
        // Function to extract and convert date-time from createdBy
        const parseCreatedByDate = (createdBy) => {
          if (!createdBy) return null;
  
          const parts = createdBy.split("-");
          if (parts.length < 5) return null; // Ensure format is valid
          
          const [name, day, month, year, time] = parts;
          
          // Extract time and AM/PM period
          let timeParts = time.split(" ");
          if (timeParts.length < 2) return null; // Ensure AM/PM is present
  
          let [timeValue, period] = timeParts;
          let [hours, minutes] = timeValue.split(":").map(Number);
          
          if (!period) return null; // Ensure AM/PM exists
          period = period.toLowerCase();
  
          if (period === "pm" && hours !== 12) hours += 12;
          if (period === "am" && hours === 12) hours = 0;
  
          // Ensure only today's records are taken
          if (`${day}-${month}-${year}` !== todayDateStr) return null;
  
          return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
        };
  
        // Filtering only today's data and sorting by time (most recent first)
        const todayCredits = data
          .map(credit => ({ ...credit, parsedDate: parseCreatedByDate(credit.createdBy) }))
          .filter(credit => credit.parsedDate !== null)
          .sort((a, b) => b.parsedDate - a.parsedDate);
  
        setCredits(todayCredits);
        setFilteredCredits(todayCredits);
      }
    } catch (err) {
      setError("Error fetching Credits");
      console.error("Error fetching Credits", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="flex flex-col w-full h-full p-3 rounded-md overflow-auto bg-white">
        <h1 className="text-black text-xl font-semibold">Jamalu</h1>
        {/* table */}
        <table className="w-full mt-5 border-separate border border-black rounded-lg">
          <thead>
            <tr className="text-left text-[16px] text-black">
            <th className="border border-black p-2">Credit Id</th>
            <th className="border border-black p-2">Customer name</th>
            <th className="border border-black pl-2">Amount</th>
            <th className="border border-black p-2">CreatedBy</th>
            </tr>
          </thead>
          {isLoading ? (
            <LoadingSpinner />) : error ? (
              <div className="w-full h-full justify-center items-center">
                <p className="text-red-500 font-medium text-[14px]">{error}</p>
              </div>
            ):(
              <tbody className="text-[16px]">
                {filteredCredits && filteredCredits.map((credit) => (
                  <tr key={credit._id} className="text-left">
                    <td className="border border-black p-2 ">{credit.creditId}</td>
                    <td className="border border-black p-2 ">{credit.customerName}</td>
                    <td className="border border-black p-2 text-[#FF0000]">{credit.creditAmount}</td>
                    <td className="border border-black p-2">{credit.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            )} 
        </table>
    </div>
  )
}

export default CreditCards;