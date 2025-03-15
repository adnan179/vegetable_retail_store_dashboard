import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import closeIcon from "../assets/icons8-close-48.png";

const CreditsHistory = ({ onClose }) => {
    const { backendURL } = useAuth();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [filter, setFilter] = useState("today");

    //fetching the sales history
    useEffect(() => {
        fetch(`${backendURL}/credits/history`)
            .then((res) => res.json())
            .then((data) => {
                setHistory(data);
                filterData(data, "today");
            })
            .catch((err) => console.error("Error fetching history:", err));
    }, []);


    //function to filter data 
    const filterData = (data, filterOption) => {
        const now = new Date();
        let filtered = [];
        
        switch (filterOption) {
            case "today":
                filtered = data.filter(record => new Date(record.modifiedAt).toDateString() === now.toDateString());
                break;
            case "yesterday":
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                filtered = data.filter(record => new Date(record.modifiedAt).toDateString() === yesterday.toDateString());
                break;
            case "last10days":
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(now.getDate() - 10);
                filtered = data.filter(record => new Date(record.modifiedAt) >= tenDaysAgo);
                break;
            case "lastmonth":
                const lastMonth = new Date();
                lastMonth.setMonth(now.getMonth() - 1);
                filtered = data.filter(record => new Date(record.modifiedAt) >= lastMonth);
                break;
            default:
                filtered = data;
        }
        
        setFilteredHistory(filtered);
    };

    useEffect(() => {
        filterData(history, filter);
    }, [filter]);

    return (
        <div className="p-6 bg-white overflow-y-auto w-full h-full">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold mb-4">Credits Edit History</h2>
                <img 
                    src={closeIcon} 
                    alt='close' 
                    className='w-6 h-6 object-contain cursor-pointer'
                    onClick={() => onClose()}
                />
            </div>
            
            <div className="mb-4">
                <label className="mr-2 font-medium">Filter by Date:</label>
                <select className="bg-blue-500 p-2 text-white focus:outline-none rounded-md" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last10days">Last 10 Days</option>
                    <option value="lastmonth">Last Month</option>
                </select>
            </div>
            
            <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                    <p className="text-center text-gray-500">No Credits history available</p>
                ) : (
                    filteredHistory.map((record, index) => {
                        const allFields = { ...record.previousData, ...record.newData };

                        delete allFields._id;
                        delete allFields.__v;
                        delete allFields.modifiedBy;
                        delete allFields.creditId;
                        delete allFields.createdAt;
                        delete allFields.updatedAt;
                        delete allFields.$set;
                        delete allFields.$setOnInsert;
                        delete allFields.createdBy;
                        return (
                            <div key={index} className="p-4 border rounded-lg shadow-md bg-gray-50">
                                <h2 className="text-[16px]">Sales Id: <span className="text-blue-500 font-medium">{record.creditId}</span></h2>
                                <div className="flex flex-row justify-between items-center text-[16px]">
                                    <h3 className="text-gray-500">Modified By: <span className="text-blue-500 font-medium">{record.modifiedBy}</span></h3>
                                    <h3 className="text-gray-500">Modified At: {new Date(record.modifiedAt).toLocaleString()}</h3>
                                </div>
                                <table className="w-full border-collapse border border-gray-200 rounded-lg mt-2">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-300 px-4 py-2">Field</th>
                                            <th className="border border-gray-300 px-4 py-2">Previous Value</th>
                                            <th className="border border-gray-300 px-4 py-2">New Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(allFields).map((key) => (
                                            <tr key={key} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2 font-semibold">{key}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-gray-500">
                                                    {typeof record.previousData[key] === "object" ? JSON.stringify(record.previousData[key]) : record.previousData[key] || "N/A"}
                                                </td>
                                                <td className={`border border-gray-300 px-4 py-2 ${record.previousData[key] !== record.newData[key] ? "text-red-600" : "text-gray-500"}`}>
                                                    {typeof record.newData[key] === "object" ? JSON.stringify(record.newData[key]) : record.newData[key] || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CreditsHistory;
