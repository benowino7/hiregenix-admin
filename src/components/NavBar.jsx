import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, User, LogOut,
  ChevronRight, Moon, Sun, ChevronDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../themes/ThemeContext';
import logo from '../assets/logo.png';
import logodark from '../assets/logodark.png';

const NavBar = ({ toggleSidebar }) => {
  const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem('user')) || {});
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL || "";

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        let token;
        try { token = JSON.parse(sessionStorage.getItem("accessToken")); }
        catch { token = sessionStorage.getItem("accessToken"); }
        if (!token) return;
        const res = await fetch(`${BASE_URL}/messaging/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.result?.unreadCount || 0);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const initials = [userData?.firstName?.[0], userData?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo + Mobile Menu Button */}
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronRight size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
            <Link to="/" className="ml-2 flex items-center">
              <img src={isDark ? logodark : logo} alt="RatchetUp" className="w-[140px] sm:w-[160px] h-auto" />
            </Link>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search jobs, companies..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/dashboard/messages")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative transition-colors"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? <Sun size={20} className="text-gray-300" /> : <Moon size={20} className="text-gray-600" />}
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1 pr-1 sm:pr-3 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:block font-medium text-sm text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                  {userData?.firstName || '--'}
                </span>
                <ChevronDown size={14} className={`hidden sm:block text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {userData?.firstName} {userData?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userData?.email || '--'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <User size={16} /> Profile
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800"></div>

                  <div className="py-1">
                    <a
                      href="/"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut size={16} /> Sign Out
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
export default NavBar;
