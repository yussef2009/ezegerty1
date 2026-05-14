import { Link } from "react-router";
import { Shirt, Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";
import logo from "figma:asset/811d8ca945b29bf3de2536f0f56fcdbe02cb9813.png";
import { useLanguage } from "../context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/home" className="flex items-center gap-2 mb-4">
               <img src={logo} alt="Ezgerty" className="h-10 w-auto dark:brightness-200" />
            </Link>
            <p className="text-sm leading-relaxed">
              {t.footer.companyDesc}
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t.footer.services}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400">Dry Cleaning</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400">Laundry & Fold</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400">Carpet Cleaning</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400">Ironing Service</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 dark:hover:text-blue-400">Alterations</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t.footer.company}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400">{t.nav.about}</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">{t.nav.contact}</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Locations</Link></li>
              <li><Link to="/order" className="hover:text-blue-600 dark:hover:text-blue-400">{t.nav.schedule}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t.footer.contactUs}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>136 El-Shaheed Galal El-Desouky, Bab Sharqi WA Wabour Al Meyah, Bab Shar', Alexandria Governorate 5422020</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>+20 123 456 7890</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>info@ezgerty.com</span>
              </li>
            </ul>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm dark:border-gray-800">
          <p>&copy; {new Date().getFullYear()} Ezgerty. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
