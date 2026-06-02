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
  category?: string;
};

export function Services() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from DB (managed in Admin → Manage Services)
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

  const displayServices = services.map((s) => ({
    id: s.id,
    title: s.name,
    description: s.description || "",
    icon: <Briefcase className="h-8 w-8 text-blue-500" />,
    price: `${s.price} EGP`,
    category: s.category,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-950 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">{t.servicesPage.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {t.servicesPage.subtitle}
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading services...</p>
        ) : displayServices.length === 0 ? (
          <p className="text-center text-gray-500 max-w-md mx-auto">
            Services will appear here once added in the admin panel (Manage Services).
          </p>
        ) : (
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
        )}

        {displayServices.length > 0 && (
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
                {displayServices.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.title}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">{item.price.replace(" EGP", "")}</td>
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
        )}
      </div>
    </div>
  );
}
