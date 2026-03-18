import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NotificationSettingsProps {
  onTriggerDailyProblem?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onTriggerDailyProblem }) => {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [dailyNotifications, setDailyNotifications] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');

  useEffect(() => {
    if (user) {
      const savedSettings = localStorage.getItem(`notifications_${user.id}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDailyNotifications(settings.dailyNotifications ?? true);
        setNotificationTime(settings.notificationTime ?? '09:00');
      }
    }
  }, [user]);

  const saveSettings = () => {
    if (user) {
      const settings = {
        dailyNotifications,
        notificationTime
      };
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(settings));
      setShowSettings(false);
    }
  };

  const resetDailyProblem = () => {
    if (user) {
      const today = new Date().toDateString();
      localStorage.removeItem(`dailyProblem_${user.id}_dismissed_${today}`);
      localStorage.removeItem(`dailyProblem_${user.id}_lastShown`);
      onTriggerDailyProblem?.();
    }
  };

  return (
    <>
      {/* Settings Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={resetDailyProblem}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-full shadow-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-110 transition-all duration-200 group"
            title="Show Today's Problem"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="hidden group-hover:block text-sm font-medium whitespace-nowrap">Today's Challenge</span>
            </div>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-110 transition-all duration-200"
            title="Notification Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowSettings(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚙️</span>
                    <h2 className="text-xl font-bold">Notification Settings</h2>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Daily Problem Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about daily coding challenges</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={dailyNotifications}
                      onChange={(e) => setDailyNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preferred notification time
                  </label>
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={!dailyNotifications}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Note: Browser notifications depend on your system settings
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 text-lg">💡</span>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Quick Access</p>
                      <p>Use the floating challenge button to instantly get today's problem anytime!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NotificationSettings;