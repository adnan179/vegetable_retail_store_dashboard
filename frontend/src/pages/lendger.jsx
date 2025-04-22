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
    const [ledger, setLedger] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fromDate, setFromDate] = useState("");

    //fetching customers
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${backendURL}/customers`);
                setCustomers(response.data);
            } catch (err) {
                toast.error("Error fetching customers");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, [backendURL]);

    //fetching customer details and ledger
    const fetchCustomerDetails = useCallback(async (customerName) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${backendURL}/customers/${customerName}`);
            const { customer, ledger } = response.data;
            setCustomerData(customer);
            setLedger(ledger);
        } catch (err) {
            toast.error("Error fetching customer ledger");
        } finally {
            setIsLoading(false);
        }
    }, [backendURL]);

    //handling customer change in the select dropdown
    const handleCustomerChange = useCallback((_, newValue) => {
        if (newValue) {
            setSelectedCustomerName(newValue);
            fetchCustomerDetails(newValue);
        } else {
            setSelectedCustomerName("");
            setCustomerData(null);
            setLedger([]);
        }
    }, [fetchCustomerDetails]);

    // Group ledger by date and type
    const groupedLedger = useMemo(() => {
        if (!ledger.length) return [];

        const grouped = new Map();

        ledger
            .filter(txn => !fromDate || dayjs(txn.createdAt).isAfter(fromDate) || dayjs(txn.createdAt).isSame(fromDate))
            .forEach(txn => {
                const date = dayjs(txn.createdAt).format("YYYY-MM-DD");
                if (!grouped.has(date)) {
                    grouped.set(date, { sales: [], credits: [] });
                }
                grouped.get(date)[txn.type === 'sale' ? 'sales' : 'credits'].push(txn);
            });

        return Array.from(grouped.entries())
            .sort(([a], [b]) => dayjs(a).isAfter(b) ? 1 : -1)
            .map(([date, data]) => ({ date, ...data }));
    }, [ledger, fromDate]);

    // Calculate totals
    const { totalSales, totalCredits } = useMemo(() => {
        let sales = 0, credits = 0;
        ledger
            .filter(txn => !fromDate || dayjs(txn.createdAt).isAfter(fromDate) || dayjs(txn.createdAt).isSame(fromDate))
            .forEach(txn => {
                if (txn.type === "sale") sales += txn.amount;
                else if (txn.type === "credit") credits += txn.amount;
            });
        return { totalSales: sales, totalCredits: credits };
    }, [ledger, fromDate]);

    return (
        <section className='w-[calc(100wh-110px)] min-h-screen p-10 ml-[100px]'>
            <div className='flex gap-3 mb-6 fixed top-4 left-[140px] z-10'>
                <Autocomplete
                    className="mui-white-text w-[200px] rounded-md bg-blue-500"
                    options={customers.map(c => c.customerName)}
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

            {isLoading ? <LoadingSpinner /> : (
                <>
                    {customerData && (
                        <div className='flex gap-4 mb-4 mt-10'>
                            <div className='px-8 py-4 border rounded-2xl shadow-lg bg-white'>
                                <h2 className='text-lg'>Customer Name: <strong>{customerData.customerName}</strong></h2>
                                <p>Phone: <strong>{customerData.phoneNumber}</strong></p>
                                <p>Village: <strong>{customerData.villageName}</strong></p>
                                <p>Group: <strong>{customerData.groupName}</strong></p>
                            </div>
                            <div className='p-4 text-lg border bg-white rounded-2xl shadow-md font-semibold'>
                                <p>Current Balance: <span className='text-red-500 font-semibold'>{customerData.balance}</span></p>
                                <p>Total Sales: <span className='text-blue-600 font-semibold'>{totalSales}</span></p>
                                <p>Total Credits: <span className='text-blue-600 font-semibold'>{totalCredits}</span></p>
                            </div>
                        </div>
                    )}

                    {groupedLedger.map(({ date, sales, credits }) => {
                        sales.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                        credits.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                        return(
                        <div key={date} className="mb-4 p-4 border rounded-2xl bg-white shadow-sm">
                            <h3 className="font-semibold text-blue-700 mb-4">{dayjs(date).format("DD MMM YYYY")}</h3>

                            {sales.length > 0 && (
                                <>
                                    <h4 className="text-green-600 font-semibold mb-2">Sales</h4>
                                    <table className="w-full text-left border border-gray-300 mb-4">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border px-2 py-1">Previous Balance</th>
                                                <th className="border px-2 py-1">Amount</th>
                                                <th className="border px-2 py-1">Current Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map((txn, idx) => (
                                                <tr key={`sale-${idx}`} className="hover:bg-gray-50">
                                                    <td className="border px-2 py-1">{txn.previousBalance}</td>
                                                    <td className="border px-2 py-1 font-semibold text-green-600">
                                                        {txn.previousBalance} + {txn.amount}
                                                    </td>
                                                    <td className="border px-2 py-1">{txn.updatedBalance}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {credits.length > 0 && (
                                <>
                                    <h4 className="text-red-600 font-semibold mb-2">Credits</h4>
                                    <table className="w-full text-left border border-gray-300">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border px-2 py-1">Previous Balance</th>
                                                <th className="border px-2 py-1">Amount</th>
                                                <th className="border px-2 py-1">Current Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {credits.map((txn, idx) => (
                                                <tr key={`credit-${idx}`} className="hover:bg-gray-50">
                                                    <td className="border px-2 py-1">{txn.previousBalance}</td>
                                                    <td className="border px-2 py-1 font-semibold text-red-600">
                                                        {txn.previousBalance} - {txn.amount}
                                                    </td>
                                                    <td className="border px-2 py-1">{txn.updatedBalance}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )})}
                </>
            )}
        </section>
    );
};

export default Ledger;
