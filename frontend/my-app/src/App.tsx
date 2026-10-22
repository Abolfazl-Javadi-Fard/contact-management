
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";
import ContactsPage from "./assets/pages/Contacts/ContactsPage";
import LoginPage from "./assets/pages/Login/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from "./assets/pages/Signup/SignupPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/contacts" element={<ContactsPage />} />
        </Route>
        
        <Route path="/signup" element={<SignupPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;