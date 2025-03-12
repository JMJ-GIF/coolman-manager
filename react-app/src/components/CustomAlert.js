import "./CustomAlert.scss";
import { motion } from "framer-motion";
import info from "../assets/icons/info.svg";
import confirm from "../assets/icons/confirm.svg";
import warning from "../assets/icons/warning.svg";
import success from "../assets/icons/success.svg";
import celebration from "../assets/icons/celebration.svg";

const iconMap = {
  confirm: confirm,
  success: success,
  warning: warning,
  info: info,
  celebration: celebration
};

const CustomAlert = ({ type, message, onClose, onConfirm }) => {
  return (
    <div className="alert-overlay">
      <motion.div
        className={`custom-alert ${type}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <img src={iconMap[type]} alt={`${type} icon`} className="alert-icon" />
        <p className="alert-message">{message}</p>
        <div className="alert-buttons">          
          <button className="close-btn" onClick={onClose}>닫기</button>
          {type === "confirm" && (
            <button className="confirm-btn" onClick={onConfirm}>확인</button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomAlert;
