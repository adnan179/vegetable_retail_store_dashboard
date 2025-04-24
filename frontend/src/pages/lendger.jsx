import html2pdf from 'html2pdf.js';
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
    const [showReceiptPopup, setShowReceiptPopup] = useState(false);
    const [receiptFromDate, setReceiptFromDate] = useState("");
    const [receiptToDate, setReceiptToDate] = useState(""); // defaults to today


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
                {selectedCustomerName && (
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        onClick={() => setShowReceiptPopup(true)}
                    >
                        Print Receipt
                    </button>
                )}
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
                                    <h4 className="text-green-600 text-lg font-semibold">Sales</h4>
                                    <p className='mb-2 font-medium'>Opening Balance: {sales[0]?.previousBalance}</p>
                                    <table className="w-full text-left border border-gray-300 mb-4">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border px-2 py-1">Lot</th>
                                                <th className="border px-2 py-1">Vegetable</th>
                                                <th className="border px-2 py-1">Number of Kgs</th>
                                                <th className="border px-2 py-1">Price per Kg</th>
                                                <th className="border px-2 py-1">Amount</th>
                                                <th className="border px-2 py-1">Curr Bal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map((txn, idx) => (
                                                <tr key={`sale-${idx}`} className="hover:bg-gray-50">
                                                    <td className="border px-2 py-1">{txn.saleInfo?.lotName.split('-').slice(0,3).join('-') || "-"}</td>
                                                    <td className="border px-2 py-1">{txn.saleInfo?.vegetableName || "-"}</td>
                                                    <td className="border px-2 py-1">{txn.saleInfo?.numberOfKgs || "-"}</td>
                                                    <td className="border px-2 py-1">{txn.saleInfo?.pricePerKg || "-"}</td>
                                                    <td className="border px-2 py-1 text-green-600 font-semibold">{txn.amount}</td>
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
            {showReceiptPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white w-[380px] p-4 rounded-lg shadow-lg max-h-[80vh] overflow-auto text-sm font-mono">
                        <div className="print-hide flex gap-2 mb-3">
                            <TextField
                            label="From"
                            type="date"
                            value={receiptFromDate}
                            onChange={(e) => setReceiptFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            />
                            <TextField
                            label="To"
                            type="date"
                            value={receiptToDate}
                            onChange={(e) => setReceiptToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            />
                        </div>

                        {/* Printable Content */}
                        <div id="print-receipt" className="text-[12px]">
                            <div className='text-center w-full'>JSR</div>

                            <div className="border-black border-t border-b border-dashed mt-2 py-2">
                                <p className='justify-end flex'>{dayjs().format("DD/MM/YYYY")}</p>
                                <p>Sri {customerData?.customerName}</p>
                                {receiptFromDate && (
                                    <p>{receiptFromDate} to {receiptToDate ? receiptToDate : dayjs().format("DD/MM/YYYY")}</p> 
                                )}
                            </div>

                            <div className="mt-1 py-2">
                                {(() => {
                                    const filteredSales = ledger
                                        .filter(txn => {
                                            if (txn.type !== "sale") return false;
                                            const txnDate = dayjs(txn.createdAt).startOf("day");
                                            const from = receiptFromDate ? dayjs(receiptFromDate).startOf("day") : null;
                                            const to = receiptToDate ? dayjs(receiptToDate).startOf("day") : null;

                                            if (from && to) {
                                                return txnDate.isSame(from) || txnDate.isSame(to) || (txnDate.isAfter(from) && txnDate.isBefore(to));
                                            } else if (from) {
                                                return txnDate.isSame(from) || txnDate.isAfter(from);
                                            } else if (to) {
                                                return txnDate.isSame(to) || txnDate.isBefore(to);
                                            }
                                            return true;
                                        })
                                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                                    let runningBalance = filteredSales[0]?.previousBalance || 0;

                                    return (
                                        <>
                                            <p className="mt-1 flex justify-end">బాకీ: {runningBalance}</p>
                                            <table className="w-full text-left">
                                                <tbody>
                                                    {filteredSales.map((txn, idx) => {
                                                        runningBalance += txn.amount;
                                                        return (
                                                            <tr key={idx} className="align-top">
                                                                <td className="pr-1">{dayjs(txn.createdAt).format("DD/MM/YY")}</td>
                                                                <td className="pr-1">{txn.saleInfo?.vegetableName}</td>
                                                                <td className="pr-1">{txn.saleInfo?.numberOfKgs}kg</td>
                                                                <td className="pr-1">{txn.saleInfo?.pricePerKg}</td>
                                                                <td className="pr-1">{txn.amount}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <div className='mt-1 py-2 flex justify-end border-t border-dashed border-black text-[16px] font-semibold'>
                                                {runningBalance}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>


                        <div className="print-hide mt-4 flex justify-between gap-2">
                            <button
                            className="bg-red-500 text-white font-medium px-4 py-1 rounded-lg"
                            onClick={() => setShowReceiptPopup(false)}
                            >
                                Close
                            </button>
                            <button
                                className="bg-blue-600 text-white font-medium px-4 py-1 rounded-lg"
                                onClick={() => {
                                    const element = document.getElementById("print-receipt");
                                    const opt = {
                                    margin:       0.3,
                                    filename:     `${customerData?.customerName}_receipt_${dayjs().format("DD/MM/YYYY")}.pdf`,
                                    image:        { type: 'jpeg', quality: 0.98 },
                                    html2canvas:  { scale: 2 },
                                    jsPDF:        { unit: 'in', format: [3.5, 10], orientation: 'portrait' } // small paper size
                                    };

                                    html2pdf().set(opt).from(element).save();
                                }}
                                >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
                )}


        </section>
    );
};

export default Ledger;
