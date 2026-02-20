import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ArrowRightIcon } from 'lucide-react';
interface FAQItem {
  question: string;
  answer: string;
}
export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs: FAQItem[] = [
  {
    question: 'How does same-day delivery work?',
    answer:
    "Book your parcel before 2 PM and we'll collect it within 2 hours. Your package will be delivered the same day, typically within 4-6 hours depending on the distance. Real-time tracking is available throughout the journey."
  },
  {
    question: 'What areas do you cover?',
    answer:
    'We cover all major cities across the UK including London, Manchester, Birmingham, Leeds, Glasgow, Edinburgh, and over 50 other cities. For international shipping, we deliver to 200+ countries worldwide.'
  },
  {
    question: 'How do I track my parcel?',
    answer:
    "Once your parcel is collected, you'll receive a tracking number via email and SMS. You can enter this number on our tracking page to see real-time updates on your delivery status, including GPS location for same-day deliveries."
  },
  {
    question: 'What happens if my parcel is damaged?',
    answer:
    "All our deliveries include basic insurance coverage. If your parcel is damaged during transit, please contact our support team within 48 hours with photos of the damage. We'll process your claim and arrange compensation or replacement shipping."
  },
  {
    question: 'Can I schedule a specific delivery time?',
    answer:
    'Yes! For Express deliveries, you can select a 2-hour delivery window. For Standard deliveries, you can choose morning (before 12 PM) or afternoon (12 PM - 6 PM) delivery slots.'
  },
  {
    question: "What items can't be shipped?",
    answer:
    "We cannot ship hazardous materials, illegal items, perishable food without proper packaging, live animals, or items exceeding our size/weight limits. Please check our full prohibited items list or contact support if you're unsure."
  },
  {
    question: 'How do I get a quote for bulk orders?',
    answer:
    'For businesses shipping more than 50 parcels per month, we offer custom pricing with volume discounts. Contact our sales team through the Contact page or call us directly to discuss your requirements.'
  },
  {
    question: 'What payment methods do you accept?',
    answer:
    'We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for business accounts. Payment is processed securely at the time of booking.'
  },
  {
    question: 'Can I change my delivery address after booking?',
    answer:
    'Yes, you can modify the delivery address up until the parcel is out for delivery. Log into your account or contact our support team with your tracking number to make changes.'
  },
  {
    question: 'Do you offer returns management for businesses?',
    answer:
    'Yes! We provide comprehensive returns management solutions for e-commerce businesses. This includes pre-paid return labels, customer-friendly drop-off points, and integration with major e-commerce platforms.'
  }];

  return (
    <main className="w-full pt-20 min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-full mb-4">
            FAQ
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Frequently Asked <span className="text-orange-500">Questions</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Find answers to common questions about our courier services,
            pricing, and delivery options.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) =>
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden">

                <button
                onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full flex items-center justify-between p-6 text-left"
                aria-expanded={openIndex === index}>

                  <span className="text-lg font-bold text-slate-800 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDownIcon
                  className={`w-6 h-6 text-orange-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />

                </button>
                <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>

                  <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Can't find what you're looking for? Our support team is here to
              help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors">

                Contact Support <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <a
                href="tel:+441234567890"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white hover:bg-white hover:text-slate-800 transition-colors">

                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>);

}