import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-dvh bg-[#f6f7f9]">
      <Outlet />
    </div>
  );
}
