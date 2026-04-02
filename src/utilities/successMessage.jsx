import { CircleCheckBig, X } from "lucide-react";
import { toast } from "react-toastify";

function successMessage(message) {
  return toast.success(
    <div className="flex gap-4 relative">
      <span className="custom-toast-icon pt-1">
        <CircleCheckBig className="text-3xl" />
      </span>{" "}
      <div className="flex flex-col">
        <span className="font-bold text-white">Request Successfull!!</span>
        <span className="capitalize text-white">{message}</span>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: 3000,
      className: "custom-toast-success",
      icon: false,
      progress: undefined,
      closeButton: ({ closeToast }) => (
        <button
          onClick={closeToast}
          className="custom-close-button text-white absolute top-1 right-2"
        >
          <X className="text-white text-2xl" />
        </button>
      ),
    }
  );
}

export default successMessage;
