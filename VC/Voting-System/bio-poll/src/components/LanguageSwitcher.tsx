import { useState } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("en");

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    // if using i18next, you can do: i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-5 w-5 text-muted-foreground" />
      <select
        value={language}
        onChange={handleLanguageChange}
        className="bg-transparent border rounded-md px-2 py-1 text-sm focus:outline-none"
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="fr">French</option>
      </select>
    </div>
  );
}
