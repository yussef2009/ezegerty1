import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../context/AuthContext";
import { dbSet } from "../../lib/db";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function ClientAccountRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await dbSet(`account_request:${requestId}`, {
        id: requestId,
        userId: user?.id || 'anonymous',
        ...data,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      
      setSubmitted(true);
      reset();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-950">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <CheckCircle className="mb-6 h-24 w-24 text-green-500" />
        </motion.div>
        <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Request Submitted!</h2>
        <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
          We have received your account request. Our team will review it and get back to you shortly.
        </p>
        <Button onClick={() => navigate("/client/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="mb-6 pl-0 hover:bg-transparent hover:text-blue-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request Business Account</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Apply for a corporate or special account to get exclusive rates and monthly billing.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="E.g. Ezgerty Corp"
                  {...register("companyName", { required: "Company Name is required" })}
                />
                {errors.companyName && <p className="text-xs text-red-500">{String(errors.companyName.message)}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  placeholder="Full Name"
                  {...register("contactPerson", { required: "Contact Person is required" })}
                />
                {errors.contactPerson && <p className="text-xs text-red-500">{String(errors.contactPerson.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@company.com"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-red-500">{String(errors.email.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+20 1xx xxx xxxx"
                {...register("phone", { required: "Phone is required" })}
              />
              {errors.phone && <p className="text-xs text-red-500">{String(errors.phone.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Estimated Monthly Volume (Items)</Label>
              <Input
                id="volume"
                type="number"
                placeholder="E.g. 50"
                {...register("volume", { required: "Volume is required" })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Tell us about your specific needs..."
                {...register("notes")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
