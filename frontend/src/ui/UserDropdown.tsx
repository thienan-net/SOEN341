import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    userValid: boolean;
    userName: string;
    role: string;
    className: string;
}
const UserDropdown = (props : Props) => {
  const { role, userName, userValid, className } = props
  const { logout } = useAuth()
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleDropdown = () => setOpen(!open);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`${className} relative flex items-center ml-3`} ref={dropdownRef}>
      {userValid ? (
        <button
          onClick={toggleDropdown}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition"
        >
          <User className="w-5 h-5 text-gray-700" />
        </button>
      ) : (
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-gray-500 hover:text-gray-700">
            Login
          </Link>
          <Link to="/register" className="btn-primary">
            Register
          </Link>
        </div>
      )}

      {open && userValid && (
        <div className="absolute right-0 mt-40 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden divide-y divide-gray-200 z-50">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-gray-900">
              {userName}
            </p>
            <p className="text-xs text-gray-500 mt-1">{role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
