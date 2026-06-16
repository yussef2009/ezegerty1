import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon, Settings, History, LogOut, LayoutDashboard, Truck, LayoutGrid, ShieldCheck } from "lucide-react";
import { ClientNotificationBell } from "./ClientNotificationBell";
import { Button } from "./ui/button";
import { cn } from "../../lib/utils";
const logo = "/logo.png";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: t.nav.home, href: "/" },
    { name: t.nav.services, href: "/services" },
    { name: t.nav.about, href: "/about" },
    { name: t.nav.contact, href: "/contact" },
    { name: "Track Order", href: "/track" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isAdmin = role === "admin";
  const isDelivery = role === "delivery";
  const isClient = !isAdmin && !isDelivery;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:border-gray-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Ezgerty" className="h-12 w-auto dark:brightness-200" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                  location.pathname === link.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="mr-1"
            >
              <span className="font-bold text-sm">{language === 'en' ? 'عربي' : 'EN'}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user && isClient && <ClientNotificationBell />}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-full px-4 border-blue-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-800">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {isDelivery && (
                    <DropdownMenuItem onClick={() => navigate("/delivery/dashboard")}>
                      <Truck className="mr-2 h-4 w-4" />
                      Delivery App
                    </DropdownMenuItem>
                  )}
                  {isClient && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/client/dashboard")}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        My Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/client/history")}>
                        <History className="mr-2 h-4 w-4" />
                        Order History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/client/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/track")}>
                        <Truck className="mr-2 h-4 w-4" />
                        Track
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/client-login">
                <Button variant="ghost">Log in</Button>
              </Link>
            )}

            <Link to="/order">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">{t.nav.schedule}</Button>
            </Link>

            <Link
              to="/admin-login"
              className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
              title="Admin"
              aria-label="Admin login"
            >
              <ShieldCheck className="h-3.5 w-3.5 opacity-40 hover:opacity-70" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            >
              <span className="font-bold text-sm">{language === 'en' ? 'عربي' : 'EN'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <button
              className="p-2 text-gray-600 dark:text-gray-300"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="border-b bg-white dark:bg-gray-900 md:hidden animate-in slide-in-from-top-5 dark:border-gray-800">
          <div className="container mx-auto grid gap-4 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                  location.pathname === link.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
               <div className="grid gap-2 border-t pt-4 dark:border-gray-800">
                 {isAdmin && (
                   <Link to="/admin/dashboard" onClick={() => setIsOpen(false)}>
                     <Button variant="ghost" className="w-full justify-start gap-2">
                       <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                     </Button>
                   </Link>
                 )}
                 {isDelivery && (
                   <Link to="/delivery/dashboard" onClick={() => setIsOpen(false)}>
                     <Button variant="ghost" className="w-full justify-start gap-2">
                       <Truck className="h-4 w-4" /> Delivery App
                     </Button>
                   </Link>
                 )}
                 {isClient && (
                   <>
                     <Link to="/client/dashboard" onClick={() => setIsOpen(false)}>
                       <Button variant="ghost" className="w-full justify-start gap-2">
                         <LayoutGrid className="h-4 w-4" /> My Dashboard
                       </Button>
                     </Link>
                     <Link to="/client/history" onClick={() => setIsOpen(false)}>
                       <Button variant="ghost" className="w-full justify-start gap-2">
                         <History className="h-4 w-4" /> Order History
                       </Button>
                     </Link>
                     <Link to="/client/settings" onClick={() => setIsOpen(false)}>
                       <Button variant="ghost" className="w-full justify-start gap-2">
                         <Settings className="h-4 w-4" /> Settings
                       </Button>
                     </Link>
                     <Link to="/track" onClick={() => setIsOpen(false)}>
                       <Button variant="ghost" className="w-full justify-start gap-2">
                         <Truck className="h-4 w-4" /> Track
                       </Button>
                     </Link>
                   </>
                 )}
                 <Button variant="ghost" className="w-full justify-start gap-2 text-red-600" onClick={handleSignOut}>
                   <LogOut className="h-4 w-4" /> Sign Out
                 </Button>
               </div>
            ) : (
               <Link to="/client-login" onClick={() => setIsOpen(false)}>
                 <Button variant="ghost" className="w-full">Log in</Button>
               </Link>
            )}
            <Link to="/order" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-blue-600">{t.nav.schedule}</Button>
            </Link>
            <Link
              to="/admin-login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-end gap-1 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 pt-2"
              aria-label="Admin login"
            >
              <ShieldCheck className="h-3 w-3 opacity-40" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
