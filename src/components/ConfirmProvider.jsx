import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmModal from "./ConfirmModal";

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmConfig, setConfirmConfig] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    isDanger: true,
  });
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        open: true,
        title: options.title || "Confirm Action",
        message,
        confirmText: options.confirmText || "Confirm",
        isDanger: options.isDanger !== undefined ? options.isDanger : true,
      });
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    if (resolver) resolver(true);
    closeConfirm();
  };

  const handleClose = () => {
    if (resolver) resolver(false);
    closeConfirm();
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, open: false }));
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDanger={confirmConfig.isDanger}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </ConfirmContext.Provider>
  );
};
