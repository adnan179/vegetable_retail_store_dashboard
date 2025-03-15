import React, {useState, useEffect } from 'react'
import axios from "axios";
import LoadingSpinner from './loadingSpinner';
import { useAuth } from '../context/AuthContext';
import { io } from "socket.io-client";

const socket = io("https://vegetable-retail-store-backend.vercel.app", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
})

const CreditCards = ({fromDate,fromTime,toDate,toTime}) => {
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
        // Function to convert AM/PM time to 24-hour format
        const convertTo24Hour = (time) => {
          if (!time) return null;
          const [hours, minutes, period] = time.match(/(\d+):(\d+) (AM|PM)/).slice(1);
          let hour = parseInt(hours, 10);
          if (period === "PM" && hour !== 12) hour += 12;
          if (period === "AM" && hour === 12) hour = 0;
          return `${hour.toString().padStart(2, "0")}:${minutes}`;
        };
        // Convert selected times
        const fromTimeFormatted = convertTo24Hour(fromTime);
        const toTimeFormatted = convertTo24Hour(toTime);
        
         // Filtering logic only applies if all four values are selected
         if (fromDate && fromTimeFormatted && toDate && toTimeFormatted) {
            const fromDateTime = new Date(`${fromDate}T${fromTimeFormatted}:00`);
            const toDateTime = new Date(`${toDate}T${toTimeFormatted}:59`);
            data = data.filter((sale) => {
            const saleDateTime = new Date(sale.createdAt);
            return saleDateTime >= fromDateTime && saleDateTime <= toDateTime;
          });
          } else {
            // Default: Show today's sales
            const today = new Date().toISOString().split("T")[0];
            data = data.filter((sale) => sale.createdAt.startsWith(today));
          }
          setCredits(data);
          setFilteredCredits(data);
      }
    } catch (err) {
      setError("Error fetching Credits");
      console.error("Error fetching Credits", err);
    } finally {
      setIsLoading(false);
    }
  };

   useEffect(() => {
      fetchCredits();
    }, [fromDate, fromTime, toDate, toTime]);
  
    useEffect(() => {
      const handleNewCredit = () => {
        fetchCredits();
      };
    
      socket.on("newCredit", handleNewCredit);
    
      return () => {
        socket.off("newCredit", handleNewCredit);
      };
    }, []);
  
  
  return (
    <div className="flex flex-col w-full h-full p-3 rounded-md overflow-auto bg-white">
        <h1 className="text-black text-xl font-semibold">Jamalu</h1>
        {/* table */}
        <table className="w-full mt-5 border-separate border border-black rounded-lg">
          <thead>
            <tr className="text-left text-[16px] text-black">
            <th className="border border-black p-2">Customer name</th>
            <th className="border border-black pl-2">Amount</th>
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
                    <td className="border border-black p-2 ">{credit.customerName}</td>
                    <td className="border border-black p-2 text-[#FF0000]">{credit.creditAmount}</td>
                  </tr>
                ))}
              </tbody>
            )} 
        </table>
    </div>
  )
}

export default CreditCards;