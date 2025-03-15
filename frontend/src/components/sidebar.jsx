import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import homeIcon from "../assets/icons8-home-48.png";
import homeWhiteIcon from "../assets/home-white-icon.png";
import salesIcon from "../assets/icons8-sales-50.png";
import salesWhiteIcon from "../assets/sales-white-icon.png";
import creditIcon from "../assets/icons8-credit-64.png";
import creditWhiteIcon from "../assets/credit-white-icon.png";
import peopleIcon from "../assets/icons8-group-50.png";
import peopleWhiteIcon from "../assets/people-white-icon.png";
import inventoryIcon from "../assets/icons8-inventory-48.png";
import inventoryWhiteIcon from "../assets/inventory-white-icon.png";
import logoutIcon from "../assets/icons8-logout-50.png";
import vegetableIcon from "../assets/icons8-tomato-48.png";
import vegetableWhiteIcon from "../assets/vegetable-white-icon.png";
import groupIcon from "../assets/icons8-category-48.png";
import groupWhiteIcon from "../assets/group-white-icon.png";
import reportIcon from "../assets/report-icon.png";
import reportWhiteIcon from "../assets/report-white-icon.png";
import { useAuth } from '../context/AuthContext';

const navLinks = [
    { title: "Home", link: "/dashboard", icon: homeIcon, selectedIcon: homeWhiteIcon },
    { title: "Lots", link: "/inventory", icon: inventoryIcon, selectedIcon: inventoryWhiteIcon },
    { title: "Sales", link: "/sales", icon: salesIcon, selectedIcon: salesWhiteIcon },
    { title: "Credit", link: "/jamalu", icon: creditIcon, selectedIcon: creditWhiteIcon },
    { title: "Customers", link: "/customers", icon: peopleIcon, selectedIcon: peopleWhiteIcon },
    { title: "Farmers", link: "/farmers", icon: peopleIcon, selectedIcon: peopleWhiteIcon },
    { title: "Vegetables", link: "/vegetables", icon: vegetableIcon, selectedIcon: vegetableWhiteIcon },
    { title: "Groups", link: "/groups", icon: groupIcon, selectedIcon: groupWhiteIcon },
    { title: "Reports", link: "/reports", icon: reportIcon, selectedIcon: reportWhiteIcon },
];

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    
    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate("/");
    };

    return (
        <aside className="left-0 fixed w-[100px] min-h-screen bg-white shadow-md border-r ">
            <nav className="flex flex-col p-5 items-center">
                <div className="flex flex-col gap-2">
                    {navLinks.map((l, idx) => {
                        const isSelected = location.pathname.includes(l.link);
                        return (
                            <button 
                                key={idx} 
                                onClick={() => navigate(l.link)}
                                className={`${isSelected ? "bg-black text-white" : "text-black"} p-2 rounded-md flex flex-col items-center justify-center`}
                            >
                                <img src={isSelected ? l.selectedIcon : l.icon} alt={l.title} className="w-6 h-6"/>
                                <p className="font-medium text-[14px]">{l.title}</p>
                            </button>
                        );
                    })}
                    <button onClick={handleLogout} className="flex flex-col gap-2 items-center justify-center">
                        <img src={logoutIcon} alt="logout" className="w-6 h-6" />
                        <p className="text-[14px] font-medium text-black">Logout</p>
                    </button>
                </div>
            </nav>
        </aside>
    );
}

export default Sidebar;