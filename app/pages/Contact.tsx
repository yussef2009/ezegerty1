import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

type ContactForm = { name: string; email: string; subject: string; message: string };

export function Contact() {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = (_data: ContactForm) => {
    console.log(_data);
    setIsSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <div className="bg-blue-600 py-16 text-center text-white">
        <h1 className="text-4xl font-bold">{t.nav.contact}</h1>
        <p className="mt-2 text-blue-100">{t.contact.subtitle}</p>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800"
            >
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t.contact.getInTouch}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.contact.visitUs}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      136 El-Shaheed Galal El-Desouky<br />
                      Bab Sharqi WA Wabour Al Meyah, Bab Shar'<br />
                      Alexandria Governorate 5422020
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.contact.callUs}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{t.contact.phonePlaceholder || "Contact us for phone number"}</p>
                    <p className="text-sm text-gray-500">{t.contact.supportHours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.contact.emailUs}</h3>
                    <p className="text-gray-600 dark:text-gray-400">info@ezgerty.com</p>
                    <p className="text-gray-600 dark:text-gray-400">support@ezgerty.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.contact.hours}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Sat - Thu: 9:00 AM - 9:00 PM</p>
                    <p className="text-gray-600 dark:text-gray-400">Fri: 2:00 PM - 9:00 PM</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map Placeholder */}
            <div className="h-64 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3412.571477465942!2d29.9242!3d31.2001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDEyJzAwLjQiTiAyOcKwNTUnMjcuMSJF!5e0!3m2!1sen!2seg!4v1620000000000!5m2!1sen!2seg" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800"
          >
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t.contact.sendMessage}</h2>
            {isSubmitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                  <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.contact.messageSent}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t.contact.messageSentDesc}</p>
                <Button onClick={() => setIsSubmitted(false)} className="mt-6" variant="outline">
                  {t.contact.sendAnother}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    {t.order.name}
                  </label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register("name", { required: true })}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  {errors.name && <span className="text-xs text-red-500">{String(t.order.required)}</span>}
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register("email", { required: true })}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  {errors.email && <span className="text-xs text-red-500">{String(t.order.required)}</span>}
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    {...register("subject", { required: true })}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  {errors.subject && <span className="text-xs text-red-500">{String(t.order.required)}</span>}
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    rows={4}
                    placeholder="Your message..."
                    {...register("message", { required: true })}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  {errors.message && <span className="text-xs text-red-500">{String(t.order.required)}</span>}
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {t.contact.submit}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
