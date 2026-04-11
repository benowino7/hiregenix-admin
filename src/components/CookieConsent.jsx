import React, { useState, useEffect, useCallback } from "react";
import { X, Cookie, Shield, BarChart3, Megaphone } from "lucide-react";

const STORAGE_KEY = "tdj_cookie_consent";

function getStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeConsent(preferences) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...preferences, timestamp: Date.now() })
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
        disabled
          ? "bg-teal-400 cursor-not-allowed opacity-70"
          : enabled
          ? "bg-teal-500 cursor-pointer"
          : "bg-gray-300 dark:bg-gray-600 cursor-pointer"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Cookie Policy Content                                              */
/* ------------------------------------------------------------------ */
function CookiePolicyContent() {
  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Cookie Policy - RatchetUp
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last Updated: March 2026
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          1. What Are Cookies
        </h4>
        <p>
          Cookies are small text files stored on your device when you visit our
          website. They help us provide you with a better experience by
          remembering your preferences and understanding how you use our
          platform.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          2. Types of Cookies We Use
        </h4>

        <div className="ml-2 space-y-4 mt-2">
          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200">
              Essential Cookies
            </h5>
            <p>
              These cookies are necessary for the website to function properly.
              They enable core features such as security, session management,
              and accessibility. You cannot opt out of these cookies.
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>Session authentication tokens</li>
              <li>Security preferences (CSRF protection)</li>
              <li>Cookie consent preferences</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200">
              Analytics Cookies
            </h5>
            <p>
              These cookies help us understand how visitors interact with our
              website by collecting and reporting information anonymously. This
              helps us improve our platform.
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>Page visit tracking</li>
              <li>Feature usage analytics</li>
              <li>Performance monitoring</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 dark:text-gray-200">
              Marketing Cookies
            </h5>
            <p>
              These cookies are used to deliver advertisements relevant to you
              and your interests. They may also be used to limit the number of
              times you see an advertisement and measure the effectiveness of
              advertising campaigns.
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>Ad targeting and retargeting</li>
              <li>Campaign performance tracking</li>
              <li>Social media integration</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          3. How to Control Cookies
        </h4>
        <p>
          You can manage your cookie preferences at any time by clicking
          &quot;Cookie Settings&quot; in the website footer. You can also
          control cookies through your browser settings. Note that disabling
          certain cookies may affect your experience on our website.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          4. Third-Party Cookies
        </h4>
        <p>
          We may use third-party services that set their own cookies. We do not
          control these cookies and recommend reviewing the privacy policies of
          these third parties.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          5. Changes to This Policy
        </h4>
        <p>
          We may update this Cookie Policy from time to time. Any changes will
          be posted on this page with an updated revision date.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          6. Contact Us
        </h4>
        <p>
          If you have questions about our use of cookies, please contact us at:
        </p>
        <address className="not-italic mt-1 ml-2 space-y-0.5">
          <p>RatchetUp</p>
          <p>Suite 502, 55 Commerce Valley</p>
          <p>Markham, ON, L3T 7V9</p>
          <p>Customer Care: 647-788-8715</p>
          <p>Support: 647-930-7516</p>
          <p>Email: support@ratchetup.ai</p>
        </address>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal Wrapper                                                      */
/* ------------------------------------------------------------------ */
function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={`relative w-full ${maxWidth} max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preferences Modal Content                                          */
/* ------------------------------------------------------------------ */
function PreferencesContent({
  analytics,
  setAnalytics,
  marketing,
  setMarketing,
  onSave,
  onOpenPolicy,
}) {
  const categories = [
    {
      icon: Shield,
      label: "Essential Cookies",
      description:
        "Required for the website to function. These cannot be disabled.",
      enabled: true,
      onChange: () => {},
      disabled: true,
    },
    {
      icon: BarChart3,
      label: "Analytics Cookies",
      description:
        "Help us understand how visitors interact with our website.",
      enabled: analytics,
      onChange: setAnalytics,
      disabled: false,
    },
    {
      icon: Megaphone,
      label: "Marketing Cookies",
      description:
        "Used to deliver relevant advertisements and track campaign performance.",
      enabled: marketing,
      onChange: setMarketing,
      disabled: false,
    },
  ];

  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <div
          key={cat.label}
          className="flex items-start gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
        >
          <div className="mt-0.5 p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
            <cat.icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                {cat.label}
              </h3>
              <Toggle
                enabled={cat.enabled}
                onChange={cat.onChange}
                disabled={cat.disabled}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {cat.description}
            </p>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onOpenPolicy}
          className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
        >
          Cookie Policy
        </button>
        <button
          onClick={onSave}
          className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CookieConsent Component                                       */
/* ------------------------------------------------------------------ */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    storeConsent({ essential: true, analytics: true, marketing: true });
    setVisible(false);
    setShowPreferences(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    storeConsent({ essential: true, analytics: false, marketing: false });
    setVisible(false);
    setShowPreferences(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    storeConsent({ essential: true, analytics, marketing });
    setVisible(false);
    setShowPreferences(false);
  }, [analytics, marketing]);

  const openPreferences = useCallback(() => {
    const consent = getStoredConsent();
    if (consent) {
      setAnalytics(consent.analytics ?? false);
      setMarketing(consent.marketing ?? false);
    }
    setShowPreferences(true);
  }, []);

  const openPolicyFromBanner = useCallback(() => {
    setShowPolicy(true);
  }, []);

  const openPolicyFromPrefs = useCallback(() => {
    setShowPreferences(false);
    setShowPolicy(true);
  }, []);

  return (
    <>
      {/* Banner */}
      {visible && !showPreferences && !showPolicy && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mt-0.5">
                <Cookie size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  We use cookies to enhance your experience. By continuing to
                  use this site, you consent to our use of cookies.{" "}
                  <button
                    onClick={openPolicyFromBanner}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    Cookie Policy
                  </button>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={openPreferences}
                    className="px-4 py-2 border border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-sm font-medium rounded-lg transition-colors"
                  >
                    Manage Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <Modal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        title="Cookie Preferences"
      >
        <PreferencesContent
          analytics={analytics}
          setAnalytics={setAnalytics}
          marketing={marketing}
          setMarketing={setMarketing}
          onSave={handleSavePreferences}
          onOpenPolicy={openPolicyFromPrefs}
        />
      </Modal>

      {/* Cookie Policy Modal */}
      <Modal
        open={showPolicy}
        onClose={() => setShowPolicy(false)}
        title="Cookie Policy"
        maxWidth="max-w-2xl"
      >
        <CookiePolicyContent />
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  CookieSettingsButton (for footers)                                 */
/* ------------------------------------------------------------------ */
export function CookieSettingsButton({ className = "" }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const openPreferences = useCallback(() => {
    const consent = getStoredConsent();
    if (consent) {
      setAnalytics(consent.analytics ?? false);
      setMarketing(consent.marketing ?? false);
    }
    setShowPreferences(true);
  }, []);

  const handleSave = useCallback(() => {
    storeConsent({ essential: true, analytics, marketing });
    setShowPreferences(false);
  }, [analytics, marketing]);

  const openPolicyFromPrefs = useCallback(() => {
    setShowPreferences(false);
    setShowPolicy(true);
  }, []);

  return (
    <>
      <button
        onClick={openPreferences}
        className={`text-sm text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors ${className}`}
      >
        Cookie Settings
      </button>

      <Modal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        title="Cookie Preferences"
      >
        <PreferencesContent
          analytics={analytics}
          setAnalytics={setAnalytics}
          marketing={marketing}
          setMarketing={setMarketing}
          onSave={handleSave}
          onOpenPolicy={openPolicyFromPrefs}
        />
      </Modal>

      <Modal
        open={showPolicy}
        onClose={() => setShowPolicy(false)}
        title="Cookie Policy"
        maxWidth="max-w-2xl"
      >
        <CookiePolicyContent />
      </Modal>
    </>
  );
}
