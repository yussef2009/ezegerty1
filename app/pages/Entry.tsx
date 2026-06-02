import { Link, useNavigate } from "react-router";
import { User, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
const logo = "/logo.png";

export function Entry() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "delivery") {
        navigate("/delivery/dashboard");
      } else {
        navigate("/client/dashboard");
      }
    }
  }, [user, role, loading, navigate]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <img src={logo} alt="Ezgerty" className="mx-auto h-24 mb-6 dark:brightness-200" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Welcome to Ezgerty</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Please select your role to continue</p>
      </motion.div>

      <div className="grid w-full max-w-4xl gap-8 md:grid-cols-2">
        <Link to="/home" className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20"></div>
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-blue-100 p-6 dark:bg-blue-900/30">
              <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Client</h2>
            <p className="text-gray-600 dark:text-gray-400">
              I want to schedule a pickup or track my order.
            </p>
          </div>
        </Link>

        <Link to="/admin-login" className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-purple-900/20"></div>
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-purple-100 p-6 dark:bg-purple-900/30">
              <ShieldCheck className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Admin</h2>
            <p className="text-gray-600 dark:text-gray-400">
              I am an administrator or staff member.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
