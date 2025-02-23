import React from 'react';
import homeIcon from "../assets/icons8-home-48.png";
import salesIcon from "../assets/icons8-sales-50.png";
import creditIcon from "../assets/icons8-credit-64.png";
import peopleIcon from "../assets/icons8-group-50.png";
import inventoryIcon from "../assets/icons8-inventory-48.png";
import logoutIcon from "../assets/icons8-logout-50.png";
import vegetableIcon from "../assets/icons8-tomato-48.png";
import groupIcon from "../assets/icons8-category-48.png";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const navLinks = [
    {
        title: "Home",
        link: "/",
        icon: homeIcon,
    },
    {
        title:"Inventory",
        link:"/inventory",
        icon: inventoryIcon
    },
    {
        title:"Sales",
        link:"/sales",
        icon: salesIcon,
    },
    {
        title:"Jamalu",
        link:"/jamalu",
        icon: creditIcon,
    },
    {
        title:"Customers",
        link:"/customers",
        icon: peopleIcon,
    },
    {
        title:"Farmers",
        link:"/farmers",
        icon: peopleIcon
    },
    {
        title:"Vegetables",
        link:"/vegetables",
        icon: vegetableIcon,
    },
    
    {
        title:"Groups",
        link:"/groups",
        icon: groupIcon
    },
]
const Sidebar = () => {
    const navigate = useNavigate();
    const{ logout } = useAuth();
    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate("/");
    }
  return (
    <aside className="left-0 fixed w-[100px] min-h-screen bg-white shadow-md border-r ">
      <nav className="flex flex-col p-5 items-center">
        <div className="flex flex-col gap-4">
        {navLinks.map((l,idx) => (
            <button 
                key={idx} onClick={() => navigate(l.link)}
                className="flex flex-col items-center justify-center">
                <img src={l.icon} alt={l.title} className="w-8 h-8"/>
                <p className="font-bold text-black text-[16px]">{l.title}</p>
            </button>
        ))}
        <button onClick={handleLogout} className="flex flex-col gap-2 items-center justify-center">
            <img src={logoutIcon} alt="logout" className="w-8 h-8" />
            <p className="text-lg font-bold text-black">Logout</p>
        </button>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar;
