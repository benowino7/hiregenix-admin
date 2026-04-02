import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { BASE_URL } from "../BaseUrl";

const AdminProfile = () => {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", countryCode: "" });
  const [message, setMessage] = useState(null);

  const getToken = () => {
    try {
      return JSON.parse(sessionStorage.getItem("accessToken"));
    } catch { return null; }
  };

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        setForm({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          phoneNumber: parsed.phoneNumber || "",
          countryCode: parsed.countryCode || "",
        });
      }
    } catch (err) {
      console.error("Error reading user data from session:", err);
    }
  }, []);

  const handleEdit = () => {
    setEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage(null);
    setForm({
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
      countryCode: userData.countryCode || "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "SUCCESS") {
        throw new Error(json.message || "Failed to update profile");
      }
      const updated = json.result;
      // Update sessionStorage so sidebar/navbar reflect changes
      const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const merged = { ...storedUser, ...updated };
      sessionStorage.setItem("user", JSON.stringify(merged));
      setUserData(merged);
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toDateString() + ", " + date.toLocaleTimeString();
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold mb-2 dark:text-white">
            No Profile Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load admin profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <div className="w-full">
        {/* Header */}
        <div className="pt-4 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              My Profile
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Admin account information
            </p>
          </div>
          {!editing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 text-sm font-medium transition-colors"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                  <User className="text-theme_color" size={24} />
                  Personal Information
                </h2>
                {editing && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="mt-1 text-base dark:text-white">
                        {userData.firstName || "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Last Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="mt-1 text-base dark:text-white">
                        {userData.lastName || "N/A"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="mt-1 text-base dark:text-white">
                      {userData.email || "N/A"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  {editing ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={form.countryCode}
                        onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                        placeholder="+971"
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={form.phoneNumber}
                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        placeholder="Phone number"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-base dark:text-white">
                      {userData.countryCode
                        ? `${userData.countryCode} `
                        : ""}
                      {userData.phoneNumber || "N/A"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar size={16} />
                    Member Since
                  </label>
                  <p className="mt-1 text-base dark:text-white">
                    {userData.createdAt
                      ? formatDate(userData.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
                <Shield className="text-theme_color" size={20} />
                Account Status
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Role
                  </label>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                      <Shield size={16} />
                      {userData.roles?.length > 0
                        ? userData.roles.join(", ")
                        : "ADMIN"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Account ID
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {userData.id || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Email Verified
                  </label>
                  <div className="mt-2">
                    {userData.isEmailVerified ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
