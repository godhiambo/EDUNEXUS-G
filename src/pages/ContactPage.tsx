import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import FAQComponent from '../components/FAQComponent';
import { Mail, Clock, Send, CheckCircle2, Building, ShieldAlert, LifeBuoy, Wrench, Phone, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('Technical Support');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEscalateToSupport = (dept: string, queryText: string) => {
    if (dept) {
      setDepartment(dept);
    }
    setSubject(`Inquiry: ${queryText.substring(0, 60)}`);
    setMessage(`Hello EduNexus Support Team,\n\nI asked our AI Support Desk regarding: "${queryText}", but would like additional human guidance for my school setup.\n\nAdditional details:\n`);
    
    // Smooth scroll to form
    const formElement = document.getElementById('contact-inquiry-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <SEO 
        title="Contact Us - Technical Support & Enquiries" 
        description="Get in touch with the EduNexus team. Technical support, help desk, general enquiries, and administration contacts."
        canonicalPath="/contact"
      />

      <PublicNavbar />

      {/* Header Banner */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>Support & Communications</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white">Contact EduNexus</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Reach out to our dedicated support teams, administrative offices, or help desk for prompt assistance.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-12 flex-1">
        
        {/* FAQ & AI Assistant Component */}
        <FAQComponent onEscalateToSupport={handleEscalateToSupport} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-800">

          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-white">Contact Information</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with the appropriate department for rapid inquiry routing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Direct Phone & WhatsApp Helpline Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Direct Phone & WhatsApp Helpline</h3>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                          Primary Contact
                        </span>
                      </div>
                      <a 
                        href="tel:+254740183394" 
                        className="text-lg font-black text-white hover:text-amber-300 transition block font-mono mt-0.5"
                      >
                        +254 740 183394
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-snug">
                  Reach out directly via phone or WhatsApp for instant technical support, school onboarding, teacher assistance, and administrative consultations.
                </p>

                {/* Quick Interactive Action Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href="tel:+254740183394"
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md active:scale-95 text-center cursor-pointer"
                    title="Call +254740183394 directly"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Click-to-Call (+254 740 183394)</span>
                  </a>

                  <a
                    href="https://wa.me/254740183394"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md active:scale-95 text-center cursor-pointer"
                    title="Send a message to +254740183394 on WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Technical Support */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Technical Support</h3>
                  <a 
                    href="mailto:support@joinedunexus.app" 
                    className="text-sm font-extrabold text-emerald-400 hover:underline block truncate"
                  >
                    support@joinedunexus.app
                  </a>
                  <p className="text-[11px] text-slate-400">System errors, bugs, AI model & platform access</p>
                </div>
              </div>

              {/* General Enquiries */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">General Enquiries</h3>
                  <a 
                    href="mailto:info@joinedunexus.app" 
                    className="text-sm font-extrabold text-teal-400 hover:underline block truncate"
                  >
                    info@joinedunexus.app
                  </a>
                  <p className="text-[11px] text-slate-400">Institutional partnerships & general information</p>
                </div>
              </div>

              {/* Help Desk */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Help Desk</h3>
                  <a 
                    href="mailto:help@joinedunexus.app" 
                    className="text-sm font-extrabold text-cyan-400 hover:underline block truncate"
                  >
                    help@joinedunexus.app
                  </a>
                  <p className="text-[11px] text-slate-400">Teacher tools, curriculum navigation & user guides</p>
                </div>
              </div>

              {/* Administrative & Legal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Administrative & Legal Matters</h3>
                  <a 
                    href="mailto:admin@joinedunexus.app" 
                    className="text-sm font-extrabold text-indigo-400 hover:underline block truncate"
                  >
                    admin@joinedunexus.app
                  </a>
                  <p className="text-[11px] text-slate-400">Data protection, compliance, terms & legal inquiries</p>
                </div>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Support Hours & Response Time</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <p><strong className="text-white">Operating Hours:</strong> Monday–Friday, 8:00 AM–5:00 PM (East Africa Time)</p>
                <p><strong className="text-white">Typical Response Time:</strong> Within 24–48 hours.</p>
              </div>
            </div>

          </div>

          {/* Form Column */}
          <div id="contact-inquiry-form" className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">Message Transmitted</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you for contacting EduNexus. Your message has been routed to the <strong className="text-emerald-400">{department}</strong> team. We will respond within 24–48 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1 border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-serif font-bold text-white">Inquiry Form</h2>
                  <p className="text-xs text-slate-400">Select the relevant department to reach the appropriate specialist.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. jane@school.edu"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Department *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value="Technical Support">Technical Support</option>
                      <option value="Help Desk">Help Desk</option>
                      <option value="General Enquiries">General Enquiries</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Subject *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. CBC Lesson Plan Tool Issue"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide detailed information regarding your inquiry..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Submitting Inquiry...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
