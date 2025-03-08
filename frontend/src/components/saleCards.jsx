import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const SaleCards = () => {
  const { backendURL } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState({});

  // Function to fetch sales
  const fetchSales = async () => {
    try {
      const response = await axios.get(`${backendURL}/sales`);
      const data = await response.data;

      // Get today's date in "DD-MM-YYYY" format
      const today = new Date();
      const todayStr = today.toLocaleDateString("en-GB").replace(/\//g, "-");

      // Function to extract sale datetime from createdBy
      const parseSaleDate = (createdBy) => {
        if (!createdBy) return null;

        const parts = createdBy.split("-");
        if (parts.length < 5) return null;

        const [name, day, month, year, time] = parts;
        const timeParts = time.split(" ");

        if (timeParts.length < 2) return null; // Ensure AM/PM is present

        let [timeValue, period] = timeParts;
        let [hours, minutes] = timeValue.split(":").map(Number);

        period = period.toLowerCase();
        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;

        // Ensure it's today's sales
        if (`${day}-${month}-${year}` !== todayStr) return null;

        return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
      };

      // Filter and sort today's sales
      const todaySales = data
        .map(sale => ({ ...sale, parsedDate: parseSaleDate(sale.createdBy) }))
        .filter(sale => sale.parsedDate !== null)
        .sort((a, b) => b.parsedDate - a.parsedDate); // Sort by recent time

      setSales(todaySales);
      groupSales(todaySales);
    } catch (error) {
      toast.error("Error fetching sales");
      console.error("Error fetching sales:", error);
    }
  };

  // Function to group sales by customerName
  const groupSales = (salesData) => {
    const grouped = salesData.reduce((acc, sale) => {
      if (!acc[sale.customerName]) {
        acc[sale.customerName] = [];
      }
      acc[sale.customerName].push(sale);
      return acc;
    }, {});

    setFilteredSales(grouped);
  };

  useEffect(() => {
    fetchSales(); // Fetch on mount
    // const interval = setInterval(fetchSales, 5 * 60 * 100); // Fetch every 5 mins

    // return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-5 p-3 rounded-md shadow bg-white">
      <h2 className="text-lg font-medium">Today's Sales</h2>

      {/* Sales Cards */}
      <div className="flex flex-col gap-3">
        {Object.entries(filteredSales).length > 0 ? (
          Object.entries(filteredSales).map(([customerName, salesList]) => (
            <div key={customerName} className="border p-3 rounded-md shadow-md bg-gray-50">
              <h3 className="text-md font-semibold text-gray-700">{customerName}</h3>
              <table>
                <thead>
                  <tr>
                    <th className="border border-black p-2">Sales Id</th>
                    <th className="border border-black p-2">Lot Name</th>
                    <th className="border border-black p-2">No.of Kgs</th>
                    <th className="border border-black p-2">Price/Kg</th>
                    <th className="border border-black p-2">Amount</th>
                    <th className="border border-black p-2">Payment Type</th>
                  </tr>
                </thead>
                <tbody>
                  {salesList.map((sale) => (
                    <tr key={sale.salesId}>
                      <td className="border border-black p-2">{sale.salesId}</td>
                      <td className="border border-black p-2">{sale.lotName}</td>
                      <td className="border border-black p-2">{sale.numberOfKgs}</td>
                      <td className="border border-black p-2">₹{sale.pricePerKg}</td>
                      <td className="border border-black p-2">₹{sale.totalAmount}</td>
                      <td className="border border-black p-2">{sale.paymentType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No sales for today.</p>
        )}
      </div>
    </div>
  );
};

export default SaleCards;
