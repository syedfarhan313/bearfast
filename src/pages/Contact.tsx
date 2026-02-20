import React, { useState } from 'react';
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  SendIcon,
  CheckCircleIcon } from
'lucide-react';
export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };
  const handleChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>

  {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  return (
    <main className="w-full pt-20 min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-full mb-4">
            CONTACT US
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Get in <span className="text-orange-500">Touch</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Have a question or need a quote? We're here to help. Reach out to
            our team and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <PhoneIcon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Phone</h3>
                <p className="text-slate-600 mb-2">Mon-Fri from 8am to 6pm</p>
                <a
                  href="tel:+441234567890"
                  className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">

                  +44 123 456 7890
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <MailIcon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Email</h3>
                <p className="text-slate-600 mb-2">
                  We'll respond within 24 hours
                </p>
                <a
                  href="mailto:hello@bearfast.co.uk"
                  className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">

                  hello@bearfast.co.uk
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <MapPinIcon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Office
                </h3>
                <p className="text-slate-600">
                  123 Courier Street
                  <br />
                  London, EC1A 1BB
                  <br />
                  United Kingdom
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <ClockIcon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hours</h3>
                <p className="text-slate-600">
                  Monday - Friday: 8am - 6pm
                  <br />
                  Saturday: 9am - 4pm
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-8 shadow-md">
                {isSubmitted ?
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Thank you for contacting us. We'll get back to you within
                      24 hours.
                    </p>
                    <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: ''
                      });
                    }}
                    className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">

                      Send Another Message
                    </button>
                  </div> :

                <>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">
                      Send us a Message
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                          htmlFor="name"
                          className="block text-sm font-medium text-slate-700 mb-2">

                            Full Name *
                          </label>
                          <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="John Smith" />

                        </div>
                        <div>
                          <label
                          htmlFor="email"
                          className="block text-sm font-medium text-slate-700 mb-2">

                            Email Address *
                          </label>
                          <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="john@example.com" />

                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-slate-700 mb-2">

                            Phone Number
                          </label>
                          <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="+44 123 456 7890" />

                        </div>
                        <div>
                          <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-slate-700 mb-2">

                            Subject *
                          </label>
                          <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white">

                            <option value="">Select a subject</option>
                            <option value="quote">Get a Quote</option>
                            <option value="support">Customer Support</option>
                            <option value="business">Business Inquiry</option>
                            <option value="feedback">Feedback</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label
                        htmlFor="message"
                        className="block text-sm font-medium text-slate-700 mb-2">

                          Message *
                        </label>
                        <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                        placeholder="How can we help you?" />

                      </div>

                      <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70">

                        {isSubmitting ?
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :

                      <>
                            <SendIcon className="w-5 h-5" />
                            Send Message
                          </>
                      }
                      </button>
                    </form>
                  </>
                }
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="mt-12 bg-slate-200 rounded-xl h-80 flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">Map Integration</p>
              <p className="text-sm text-slate-400">
                123 Courier Street, London
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>);

}