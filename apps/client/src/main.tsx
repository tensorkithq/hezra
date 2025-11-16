import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Styles for Widget and the client app
import "./styles/widgets.css";
// Import client last for CSS precedence
import "./styles/index.css";

// Set dark mode as default
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
