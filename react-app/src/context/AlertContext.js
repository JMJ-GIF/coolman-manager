import { createContext, useContext, useState } from "react";
import CustomAlert from "../components/CustomAlert";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message, onConfirm) => {
    setAlert({ type, message, onConfirm });
  };

  const closeAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <CustomAlert
          type={alert.type}
          message={alert.message}
          onClose={closeAlert}
          onConfirm={() => {
            alert.onConfirm && alert.onConfirm();
            closeAlert();
          }}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);