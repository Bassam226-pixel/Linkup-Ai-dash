import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PlaceholderHandler = () => {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Navigated to:", pathname);
  }, [pathname, navigate]);

  return null;
};

export default PlaceholderHandler;
