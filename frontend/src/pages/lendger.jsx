import { Autocomplete, TextField } from '@mui/material';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import dayjs from "dayjs";
import LoadingSpinner from '../components/loadingSpinner';

const Ledger = () => {
    const { backendURL } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerName, setSelectedCustomerName] = useState("");
    const [customerData, setCustomerData] = useState(null);
    const [sales, setSales] = useState([]);
    const [credits, setCredits] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fromDate, setFromDate] = useState("");

    // Fetch all customers
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${backendURL}/customers`);
                setCustomers(response.data);
            } catch (err) {
                console.error("Error fetching customers:", err);
                toast.error("Error fetching customers");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, [backendURL]);

    // Fetch customer details
    const fetchCustomerDetails = useCallback(async (customerName) => {
        setIsLoading(true);
        try {
            console.log(customerName)
            const response = await axios.get(`${backendURL}/customers/${customerName}`);
            const { customer, sales, credits } = response.data;
            setCustomerData(customer);
            setSales(sales);
            setCredits(credits);
        } catch (err) {
            console.error("Error fetching customer details:", err);
            toast.error("Error fetching customer details");
        } finally {
            setIsLoading(false);
        }
    }, [backendURL]);

    // Handle selection change
    const handleCustomerChange = useCallback((_, newValue) => {
        if (newValue) {
            setSelectedCustomerName(newValue);
            fetchCustomerDetails(newValue);
        } else {
            setSelectedCustomerName("");
            setCustomerData(null);
            setSales([]);
            setCredits([]);
        }
    }, [fetchCustomerDetails]);

    // Memoized grouping of sales and credits
    const { groupedData, totals } = useMemo(() => {
        if (!sales.length && !credits.length) return { groupedData: [], totals: { totalSales: 0, totalCredits: 0 } };

        const grouped = new Map();
        let totalSales = 0;
        let totalCredits = 0;

        sales
            .filter(s => !fromDate || dayjs(s.createdAt).isAfter(fromDate) || dayjs(s.createdAt).isSame(fromDate))
            .forEach(s => {
                const date = dayjs(s.createdAt).format("YYYY-MM-DD");
                if (!grouped.has(date)) grouped.set(date, { sales: [], credits: [] });
                grouped.get(date).sales.push(s);
                totalSales += s.totalAmount;
            });

        credits
            .filter(c => !fromDate || dayjs(c.createdAt).isAfter(fromDate) || dayjs(c.createdAt).isSame(fromDate))
            .forEach(c => {
                const date = dayjs(c.createdAt).format("YYYY-MM-DD");
                if (!grouped.has(date)) grouped.set(date, { sales: [], credits: [] });
                grouped.get(date).credits.push(c);
                totalCredits += c.totalAmount;
            });

        const sortedGrouped = Array.from(grouped.entries())
            .sort(([a], [b]) => dayjs(a).isAfter(b) ? 1 : -1)
            .map(([date, data]) => ({ date, ...data }));

        return { groupedData: sortedGrouped, totals: { totalSales, totalCredits } };
    }, [sales, credits, fromDate]);

    return (
        <section className='w-full min-h-screen p-10 ml-[100px]'>
            <div className='flex gap-3 mb-6 fixed top-4 left-[140px]'>
                <Autocomplete
                    className="mui-white-text w-[200px] rounded-md bg-blue-500"
                    options={customers.map((c) => c.customerName)}
                    value={selectedCustomerName || null}
                    onChange={handleCustomerChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Customer Name"
                            variant="outlined"
                            fullWidth
                            className="mui-white-text"
                        />
                    )}
                />

                <TextField
                    label="From Date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {customerData && (
                        <div className='flex gap-4 mb-4 mt-10'>
                            <div className='px-8 py-4 border rounded-lg shadow-lg bg-white'>
                                <h2 className='text-lg'>Customer Name: <strong>{customerData.customerName}</strong></h2>
                                <p>Phone: <strong>{customerData.phoneNumber}</strong> </p>
                                <p>Village:<strong>{customerData.villageName}</strong></p>
                                <p>Group: <strong>{customerData.groupName}</strong></p>
                                <p>Balance: <strong>{customerData.balance}</strong></p>
                            </div>
                            {(groupedData.length > 0) && (
                                <div className='p-4 text-lg border bg-white rounded-lg shadow-md font-semibold'>
                                    <p>Total Sales: <span className='text-blue-500'>{totals.totalSales}</span></p>
                                    <p>Total Credits:<span className='text-blue-500'>{totals.totalCredits}</span></p>
                                </div>
                            )}
                        </div> 
                    )}

                    {groupedData.map(({ date, sales, credits }) => (
                        <div key={date} className="mb-4 p-4 border rounded bg-white shadow-sm">
                            <h3 className="font-semibold text-blue-700 mb-2">{dayjs(date).format("DD MMM YYYY")}</h3>

                            {sales.length > 0 ? (
                                <>
                                    <h4 className="font-semibold mb-1">Sales:</h4>
                                    <table className="w-full mb-4 text-left border border-gray-300">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border px-2 py-1">Number of kgs</th>
                                                <th className="border px-2 py-1">Price per kg</th>
                                                <th className="border px-2 py-1">Total amount</th>
                                                <th className="border px-2 py-1">Lot name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map((s, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="border px-2 py-1">{s.numberOfKgs}</td>
                                                    <td className="border px-2 py-1">₹{s.pricePerKg}</td>
                                                    <td className="border px-2 py-1">₹{s.totalAmount}</td>
                                                    <td className="border px-2 py-1">{s.lotName.split('-').slice(0,3).join('-')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p className="mb-4 text-red-500 font-semibold">No Sales Data</p>}

                            {credits.length > 0 ? (
                                <>
                                    <h4 className="font-semibold mb-1">Jamalu:</h4>
                                    <table className="w-full text-left border border-gray-300">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border px-2 py-1">Jamalu Amount</th>
                                                <th className="border px-2 py-1">Less</th>
                                                <th className="border px-2 py-1">Total amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {credits.map((c, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="border px-2 py-1">₹{c.creditAmount}</td>
                                                    <td className="border px-2 py-1">₹{c.less}</td>
                                                    <td className="border px-2 py-1">₹{c.totalAmount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p className='text-red-500 font-semibold'>No Credit Data</p>}

                        </div>
                    ))}
                </>
            )}
        </section>
    );
};

export default Ledger;
