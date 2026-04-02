import React, { useState } from 'react';
import { UserPlus, Copy, Check, Loader, Mail, Phone, User, Shield } from 'lucide-react';
import { BASE_URL } from '../BaseUrl';
import successMessage from '../utilities/successMessage';
import ErrorMessage from '../utilities/ErrorMessage';

const AdminCreateUser = () => {
    const token = JSON.parse(sessionStorage?.getItem('accessToken'));
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        countryCode: '+971',
        role: 'JOB_SEEKER',
    });

    const countryCodes = [
        { code: '+971', label: 'UAE (+971)' },
        { code: '+1', label: 'US (+1)' },
        { code: '+44', label: 'UK (+44)' },
        { code: '+91', label: 'India (+91)' },
        { code: '+254', label: 'Kenya (+254)' },
        { code: '+966', label: 'Saudi (+966)' },
        { code: '+974', label: 'Qatar (+974)' },
        { code: '+973', label: 'Bahrain (+973)' },
        { code: '+968', label: 'Oman (+968)' },
        { code: '+965', label: 'Kuwait (+965)' },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setCreatedUser(null);

        try {
            const response = await fetch(`${BASE_URL}/admin/users/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create user');

            setCreatedUser(data.data);
            successMessage('User created successfully');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
                countryCode: '+971',
                role: 'JOB_SEEKER',
            });
        } catch (err) {
            ErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyCredentials = () => {
        if (!createdUser) return;
        const text = `Email: ${createdUser.email}\nPassword: ${createdUser.plainPassword}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <UserPlus className="text-teal-500" size={28} />
                    Create New User
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Add a new job seeker or recruiter account to the system
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    First Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="John"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Code
                                </label>
                                <select
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleChange}
                                    className="w-full px-2 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                >
                                    {countryCodes.map((c) => (
                                        <option key={c.code} value={c.code}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="501234567"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Account Type
                            </label>
                            <div className="relative">
                                <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="JOB_SEEKER">Job Seeker</option>
                                    <option value="RECRUITER">Recruiter</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Result Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Account Credentials
                    </h3>

                    {createdUser ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-green-800 dark:text-green-300 font-medium mb-3">
                                    Account created successfully!
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {createdUser.firstName} {createdUser.lastName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Role:</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            createdUser.role === 'RECRUITER'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        }`}>
                                            {createdUser.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                                        <p className="text-gray-900 dark:text-white font-mono text-sm mt-0.5">
                                            {createdUser.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Password</label>
                                        <p className="text-gray-900 dark:text-white font-mono text-sm mt-0.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                                            {createdUser.plainPassword}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={copyCredentials}
                                className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                    copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check size={16} />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        Copy Credentials
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                            <UserPlus size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Create a user account to see credentials here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCreateUser;
