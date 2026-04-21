import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEMES, getSavedTheme, applyTheme, saveThemeCookie } from '@/config/theme';
import type { ThemeId } from '@/config/theme';
import ThemeCard from '@/components/settings/ThemeCard';
import Navbar from '@/components/profile/ProfileNavbar';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedTheme,  setSavedTheme]  = useState<ThemeId>(getSavedTheme);
  const [activeTheme, setActiveTheme] = useState<ThemeId>(getSavedTheme);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSaved,    setHasSaved]    = useState(false);

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const hasChanges = activeTheme !== savedTheme;

  const handleSave = () => {
    saveThemeCookie(activeTheme);
    setSavedTheme(activeTheme);
    setSaveSuccess(true);
    setHasSaved(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleThemeSelect = (id: ThemeId) => {
    setActiveTheme(id);
    if (id !== savedTheme) setHasSaved(false);
  };

  const handleCancel = () => {
    applyTheme(savedTheme);
    setActiveTheme(savedTheme);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">

      <Navbar />

      {/* Page body — pt-20 clears the fixed navbar */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-8">
        <section>
          <div className="mb-4">
            <h2 className="font-serif text-xl font-semibold text-base-content">Themes</h2>
            <p className="text-sm text-base-content/60 mt-1">
              Choose a color theme for your InkBoard workspace. Changes preview instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={activeTheme === theme.id}
                onSelect={handleThemeSelect}
              />
            ))}
          </div>
        </section>

        {/* Action bar */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-base-100/95 backdrop-blur border-t border-base-300">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">

            {saveSuccess && (
              <span className="text-sm text-success flex items-center gap-1.5 font-medium mr-auto">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Theme saved!
              </span>
            )}

            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <button type="button" onClick={handleCancel} className="btn btn-ghost flex-1 sm:flex-none">
                {hasSaved ? 'Go Back' : 'Cancel'}
              </button>
              <button type="button" onClick={handleSave} disabled={!hasChanges} className="btn btn-primary flex-1 sm:flex-none">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
