import { Link } from "react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Truck, Clock, Leaf, ShieldCheck, Sparkles, Check, Crown } from "lucide-react";
import { Button } from "../components/ui/button";
import { useLanguage } from "../context/LanguageContext";

export function Home() {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly" | "yearly" | "pieces">("monthly");
  
  const features = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: t.features.quality,
      description: t.features.qualityDesc,
    },
    {
      icon: <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: t.features.pickup,
      description: t.features.pickupDesc,
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: t.features.express,
      description: t.features.expressDesc,
    },
    {
      icon: <Leaf className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: t.features.eco,
      description: t.features.ecoDesc,
    },
  ];

  const plans = {
    weekly: {
      price: "150",
      period: "week",
      features: ["Up to 10 items/week", "Priority 24h Delivery", "Free Pickup & Delivery"]
    },
    monthly: {
      price: "500",
      period: "month",
      features: ["Up to 50 items/month", "Priority 24h Delivery", "Free Pickup & Delivery", "15% Off Extra Items"]
    },
    yearly: {
      price: "5000",
      period: "year",
      features: ["Unlimited Standard items", "Priority 12h Delivery", "Free Pickup & Delivery", "Dedicated Support", "20% Off Dry Cleaning"]
    },
    pieces: {
      price: "Pay as you go",
      period: "item",
      features: ["No commitment", "Standard pricing", "Pay per item", "Standard Delivery"]
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1713700743303-8e52427cf872?q=80&w=2070&auto=format&fit=crop"
            alt="Modern Laundry Shop"
            className="h-full w-full object-cover opacity-40"
          />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {t.home.heroTitle} <br className="hidden sm:inline" />
              <span className="text-blue-400">{t.home.heroTitleHighlight}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300 md:text-xl">
              {t.home.heroSubtitle}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/order">
                <Button size="lg" className="h-12 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none">
                  {t.home.cta}
                  <ArrowRight className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg text-black bg-white hover:bg-gray-100 border-none">
                  {t.home.viewServices}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t.home.whyChooseUs}</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              {t.home.whyChooseUsSub}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Plan Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t.home.premiumPlans}</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              {t.home.premiumSub}
            </p>
            
            <div className="mt-8 flex justify-center gap-2">
              {(["weekly", "monthly", "yearly", "pieces"] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPlan === plan
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
             <motion.div 
                key={selectedPlan}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-md w-full rounded-2xl border border-blue-200 bg-white p-8 shadow-xl dark:bg-gray-950 dark:border-gray-800 relative overflow-hidden"
             >
                {selectedPlan !== 'pieces' && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rtl:right-auto rtl:left-0 rtl:rounded-br-lg rtl:rounded-bl-none flex items-center gap-1">
                    <Crown className="h-3 w-3" /> PREMIUM
                  </div>
                )}
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-400 capitalize">{selectedPlan} Plan</h3>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plans[selectedPlan].price !== "Pay as you go" ? `${plans[selectedPlan].price} EGP` : "Pay as you go"}
                  </span>
                  {plans[selectedPlan].period !== "item" && (
                    <span className="text-base font-normal text-gray-500 dark:text-gray-400">/{plans[selectedPlan].period}</span>
                  )}
                </div>
                <ul className="space-y-4 mb-8">
                   {plans[selectedPlan].features.map((feature, i) => (
                     <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                       <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                         <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                       </div>
                       {feature}
                     </li>
                   ))}
                </ul>
                <Link to="/order">
                  <Button className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                    {selectedPlan === 'pieces' ? 'Book Now' : 'Subscribe Now'}
                  </Button>
                </Link>
             </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-950 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t.home.howItWorks}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t.home.howItWorksSub}</p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-4">
            {[
              { title: t.steps.book, desc: t.steps.bookDesc, step: "1" },
              { title: t.steps.pickup, desc: t.steps.pickupDesc, step: "2" },
              { title: t.steps.clean, desc: t.steps.cleanDesc, step: "3" },
              { title: t.steps.delivery, desc: t.steps.deliveryDesc, step: "4" },
            ].map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-lg">
                  {step.step}
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-blue-600 py-24 text-white">
        <div className="absolute inset-0 z-0 opacity-10">
           <Sparkles className="h-full w-full rotate-12 scale-150" />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center md:px-6">
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t.home.readyToExperience}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
            {t.home.joinThousands}
          </p>
          <Link to="/order">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold bg-white text-blue-600 hover:bg-gray-100 border-none">
              {t.home.bookNow}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
