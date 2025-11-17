import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // <-- ADD THIS LINE

createRoot(document.getElementById("root")!).render(<App />);