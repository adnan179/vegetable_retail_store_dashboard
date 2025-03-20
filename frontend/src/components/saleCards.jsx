import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("https://vegetable-retail-store-server.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
});


const SaleCards = ({ fromDate, fromTime, toDate, toTime }) => {
  const { backendURL } = useAuth();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState({});

  // Function to fetch sales
  const fetchSales = async () => {
    try {
      const response = await axios.get(`${backendURL}/sales`);
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

        setSales(data);
        groupSales(data);
      }
    } catch (err) {
      toast.error("Error fetching sales");
      console.error("Error fetching sales:", err);
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
    fetchSales();
  }, [fromDate, fromTime, toDate, toTime]);

  useEffect(() => {
    const handleNewSale = () => {
      fetchSales();
    };
  
    socket.on("newSale", handleNewSale);
  
    return () => {
      socket.off("newSale", handleNewSale);
    };
  }, []);
  

  return (
    <div className="w-full h-full flex flex-col gap-5 p-3 rounded-md shadow bg-white">
      <h2 className="text-lg font-medium">Today's Sales</h2>
      <div className="flex flex-col gap-3">
        {Object.entries(filteredSales).length > 0 ? (
          Object.entries(filteredSales).map(([customerName, salesList]) => {
            const isCredit = salesList.some((sale) => sale.paymentType.includes("credit"));
            const amount = salesList.reduce((acc, sale) => acc + sale.totalAmount, 0);
            return (
              <div
                key={customerName}
                className={`border p-3 rounded-md shadow-md flex flex-col gap-2 ${!isCredit ? "bg-[#e25c5a] text-white" : "bg-green-500 text-white"}`}
              >
                <h3 className="text-xl font-bold">{customerName}</h3>
                <table>
                  <thead>
                    <tr>
                      <th className="border border-white p-2">Lot Name</th>
                      <th className="border border-white p-2">No.of Kgs</th>
                      <th className="border border-white p-2">Price/Kg</th>
                      <th className="border border-white p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesList.map((sale) => (
                      <tr key={sale.salesId}>
                        <td className="border border-white p-2">{sale.lotName.split("-").slice(0, 3).join("-")}</td>
                        <td className="border border-white p-2">{sale.numberOfKgs}</td>
                        <td className="border border-white p-2">{sale.pricePerKg}</td>
                        <td className="border border-white p-2">{sale.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-white font-medium text-lg flex w-full justify-end">Total amount: {amount}</p>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">No sales for today.</p>
        )}
      </div>
    </div>
  );
};

export default SaleCards;
