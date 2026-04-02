import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldOff, Loader2, QrCode, CheckCircle } from "lucide-react";
import { BASE_URL } from "../BaseUrl";

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = () => {
    try { return JSON.parse(sessionStorage.getItem("accessToken")); }
    catch { return sessionStorage.getItem("accessToken"); }
  };

  const headers = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/2fa-status`, { headers: headers() });
      const data = await res.json();
      setEnabled(data.result?.enabled || false);
    } catch {
      setError("Failed to check 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/setup-2fa`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setSetupData(data.result);
      } else {
        setError(data.message || "Failed to set up 2FA");
      }
    } catch {
      setError("Failed to set up 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setMessage("2FA enabled successfully!");
        setEnabled(true);
        setSetupData(null);
        setCode("");
      } else {
        setError(data.message || "Invalid code");
      }
    } catch {
      setError("Failed to verify code");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/auth/disable-2fa`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setMessage("2FA has been disabled");
        setEnabled(false);
        setDisableCode("");
      } else {
        setError(data.message || "Invalid code");
      }
    } catch {
      setError("Failed to disable 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-500" />
          Security Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${enabled ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
              {enabled ? (
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <ShieldOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Google Authenticator
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {enabled
                  ? "Two-factor authentication is enabled"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enabled
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
          }`}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {/* Not enabled and not in setup mode */}
        {!enabled && !setupData && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Two-factor authentication adds an extra layer of security. When enabled, you can use your authenticator app to reset your password without email verification.
            </p>
            <button
              onClick={handleSetup}
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Set Up 2FA
            </button>
          </div>
        )}

        {/* Setup mode - show QR code */}
        {!enabled && setupData && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">Step 1: Scan QR Code</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                Open Google Authenticator on your phone and scan the QR code below.
              </p>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200 dark:border-gray-700">
              <img
                src={setupData.qrCodeUrl}
                alt="QR Code for Google Authenticator"
                className="w-[200px] h-[200px]"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Manual entry key:</p>
              <code className="text-sm font-mono text-gray-900 dark:text-white break-all select-all">
                {setupData.secret}
              </code>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">Step 2: Enter Verification Code</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                Enter the 6-digit code from Google Authenticator to verify setup.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-center text-xl font-mono tracking-[0.4em] text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={actionLoading || code.length !== 6}
                className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-md disabled:opacity-50"
              >
                {actionLoading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        )}

        {/* Enabled - show disable option */}
        {enabled && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can use Google Authenticator to reset your password from the forgot password page. To disable 2FA, enter your current authenticator code below.
            </p>
            <form onSubmit={handleDisable} className="flex gap-3">
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter code to disable"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-center text-xl font-mono tracking-[0.4em] text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={actionLoading || disableCode.length !== 6}
                className="px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md disabled:opacity-50"
              >
                {actionLoading ? "Disabling..." : "Disable 2FA"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
