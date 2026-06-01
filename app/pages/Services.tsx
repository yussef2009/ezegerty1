import { Shirt, Briefcase, Scissors, SprayCan, Sofa, ShoppingBag, Zap } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { useLanguage } from "../context/LanguageContext";
import { useState, useEffect } from "react";
import { dbGet } from "../lib/db";

type Service = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export function Services() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Default hardcoded services
  const defaultServices = [
    {
      id: "dry-clean",
      title: t.servicesPage.dryClean,
      description: t.servicesPage.dryCleanDesc,
      icon: <Briefcase className="h-8 w-8 text-blue-500" />,
      price: `${t.servicesPage.priceStart} 50 EGP`,
    },
    {
      id: "laundry",
      title: t.servicesPage.laundry,
      description: t.servicesPage.laundryDesc,
      icon: <ShoppingBag className="h-8 w-8 text-blue-500" />,
      price: `${t.servicesPage.priceStart} 30 EGP / kg`,
    },
    {
      id: "fast-clean",
      title: t.servicesPage.fastClean,
      description: t.servicesPage.fastCleanDesc,
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      price: `${t.servicesPage.priceStart} 100 EGP`,
    },
    {
      id: "ironing",
      title: t.servicesPage.ironing,
      description: t.servicesPage.ironingDesc,
      icon: <Shirt className="h-8 w-8 text-blue-500" />,
      price: `${t.servicesPage.priceStart} 20 EGP`,
    },
    {
      id: "household",
      title: t.servicesPage.household,
      description: t.servicesPage.householdDesc,
      icon: <Sofa className="h-8 w-8 text-blue-500" />,
      price: t.servicesPage.contactQuote,
    },
    {
      id: "alterations",
      title: t.servicesPage.alterations,
      description: t.servicesPage.alterationsDesc,
      icon: <Scissors className="h-8 w-8 text-blue-500" />,
      price: t.servicesPage.complexity,
    },
    {
      id: "shoes",
      title: t.servicesPage.shoes,
      description: t.servicesPage.shoesDesc,
      icon: <SprayCan className="h-8 w-8 text-blue-500" />,
      price: `${t.servicesPage.priceStart} 100 EGP`,
    },
  ];

  // Fetch dynamic services from DB
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await dbGet("services");
        if (data && Array.isArray(data) && data.length > 0) {
          setServices(data);
        } else {
          // No DB services, use defaults
          setServices([]);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Use DB services if available, otherwise use hardcoded defaults
  const displayServices = services.length > 0 ? services.map(s => ({
    id: s.id,
    title: s.name,
    description: s.description || "",
    icon: <Briefcase className="h-8 w-8 text-blue-500" />,
    price: `${s.price} EGP`,
  })) : defaultServices;

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">{t.servicesPage.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t.servicesPage.subtitle}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900 dark:border-gray-800"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                {service.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{service.title}</h3>
              <p className="mb-4 flex-grow text-gray-600 dark:text-gray-400">{service.description}</p>
              <div className="flex items-center justify-between border-t pt-4 dark:border-gray-800">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{service.price}</span>
                <Link to="/order">
                  <Button variant="outline" size="sm" className="dark:border-gray-700 dark:text-white dark:hover:bg-gray-800">
                    {t.servicesPage.bookNow}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Table */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">{t.servicesPage.pricingTitle}</h2>
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.servicesPage.item}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.servicesPage.price}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {[
                  { name: "Shirt (Wash & Iron)", price: "35" },
                  { name: "Trousers (Dry Clean)", price: "45" },
                  { name: "Suit (2 Piece)", price: "90" },
                  { name: "Dress (Simple)", price: "80" },
                  { name: "Coat / Jacket", price: "100" },
                  { name: "Bed Sheet (Double)", price: "50" },
                ].map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 text-center">
             <Link to="/order">
              <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700 text-white border-none">{t.servicesPage.startOrder}</Button>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
