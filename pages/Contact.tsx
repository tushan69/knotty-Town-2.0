import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import AIConcierge from '../components/AIConcierge';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save enquiry to local storage for Admin
    const enquiry = {
      id: 'ENQ-' + Date.now(),
      ...formState,
      date: new Date().toISOString(),
      status: 'New'
    };
    
    const existingEnquiries = JSON.parse(localStorage.getItem('knotty_enquiries') || '[]');
    localStorage.setItem('knotty_enquiries', JSON.stringify([enquiry, ...existingEnquiries]));

    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="py-32 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 mb-32">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
          <span className="text-[10px] uppercase tracking-[0.5em] text-accent font-body opacity-60">
            Client Services & Concierge
          </span>
          <h1 className="font-headline text-6xl md:text-8xl text-primary leading-tight italic font-light tracking-tighter">
            The Atelier Contact.
          </h1>
          <p className="text-secondary font-body font-light text-sm tracking-widest mt-6 max-w-xl leading-relaxed">
            Our advisors remain at your disposal to assist with inquiries regarding silhouettes, sizing, and bespoke acquisitions.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 mb-32">
        <a 
          href="https://wa.me/918105622713?text=Hello%20Knotty%20Town!%20I%20have%20an%20inquiry." 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-surface border border-primary/5 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between group hover:border-accent/20 transition-all duration-1000 ease-out shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)]"
        >
          <div className="flex flex-col md:flex-row items-center md:space-x-12 text-center md:text-left">
            <div className="p-6 rounded-full bg-background mb-8 md:mb-0 transform transition-transform duration-1000 group-hover:scale-110">
               <MessageCircle className="w-10 h-10 text-accent/60" strokeWidth={1} />
            </div>
            <div>
              <h2 className="font-headline text-3xl text-primary italic font-light">WhatsApp Concierge</h2>
              <p className="text-secondary font-body font-light text-[10px] tracking-[0.3em] uppercase mt-4 opacity-50">
                Direct access to our studio advisors
              </p>
            </div>
          </div>
          <div className="mt-10 md:mt-0 px-10 py-5 text-[9px] uppercase tracking-[0.4em] bg-primary text-white hover:bg-black transition-all duration-1000 active:scale-95 shadow-xl">
             Start Conversation
          </div>
        </a>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-start">
          <div className="space-y-16 pr-0 lg:pr-16">
            <div>
               <span className="text-accent font-body text-[10px] tracking-[0.5em] uppercase mb-4 block opacity-60 italic">Geographic Presence</span>
               <h2 className="font-headline text-4xl text-primary italic font-light">The Studio.</h2>
            </div>
            
            <div className="space-y-12">
              <div className="flex items-start group">
                <div className="w-12 h-12 flex items-center justify-center bg-primary/5 text-accent/40 mr-8 transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                   <Mail className="w-5 h-5" strokeWidth={1} />
                </div>
                <div>
                  <h4 className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-3 opacity-40">Electronic Post</h4>
                  <p className="text-primary font-body text-sm tracking-widest font-medium">knottytown64@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start group">
                <div className="w-12 h-12 flex items-center justify-center bg-primary/5 text-accent/40 mr-8 transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                   <Phone className="w-5 h-5" strokeWidth={1} />
                </div>
                <div>
                  <h4 className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-3 opacity-40">Direct Dial</h4>
                  <p className="text-primary font-body text-sm tracking-widest font-medium">+91 8105622713</p>
                </div>
              </div>
              <div className="flex items-start group">
                <div className="w-12 h-12 flex items-center justify-center bg-primary/5 text-accent/40 mr-8 transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                   <MapPin className="w-5 h-5" strokeWidth={1} />
                </div>
                <div>
                  <h4 className="font-body text-[10px] uppercase tracking-[0.3em] text-primary mb-3 opacity-40">Heritage Boutique</h4>
                  <p className="text-primary font-body text-sm tracking-widest leading-relaxed font-medium">
                    #3-21-1835/2 swastik,<br />
                    Student lane Alveres road,<br />
                    Near Kadri Market,<br />
                    Kadri,<br />
                    VTC: Mangalore,<br />
                    PO: Kankanady,<br />
                    District: Dakshina Kannada,<br />
                    State: Karnataka,<br />
                    PIN Code: 575002
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface p-12 md:p-16 border border-primary/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Send className="w-32 h-32 text-primary" strokeWidth={0.5} />
            </div>
            <h2 className="font-headline text-3xl text-primary italic font-light mb-12 border-b border-primary/5 pb-8 relative z-10">Personal Inquiry.</h2>
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative group">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-accent opacity-50 mb-3 block italic">Full Identity</label>
                  <input required type="text" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} className="w-full bg-transparent border-b border-primary/10 py-3 text-sm font-body text-primary outline-none focus:border-accent transition-all duration-700 ease-in-out placeholder:text-primary/10" placeholder="Your Name" />
                </div>
                <div className="relative group">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-accent opacity-50 mb-3 block italic">Electronic Mail</label>
                  <input required type="email" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} className="w-full bg-transparent border-b border-primary/10 py-3 text-sm font-body text-primary outline-none focus:border-accent transition-all duration-700 ease-in-out placeholder:text-primary/10" placeholder="email@address.com" />
                </div>
              </div>
              <div className="relative group">
                <label className="text-[9px] uppercase tracking-[0.4em] text-accent opacity-50 mb-3 block italic">Subject of Inquiry</label>
                <input required type="text" value={formState.subject} onChange={(e) => setFormState({ ...formState, subject: e.target.value })} className="w-full bg-transparent border-b border-primary/10 py-3 text-sm font-body text-primary outline-none focus:border-accent transition-all duration-700 ease-in-out placeholder:text-primary/10" placeholder="Ref: Order / Silhouette / Press" />
              </div>
              <div className="relative group">
                <label className="text-[9px] uppercase tracking-[0.4em] text-accent opacity-50 mb-3 block italic">Inquiry Narrative</label>
                <textarea required rows={5} value={formState.message} onChange={(e) => setFormState({ ...formState, message: e.target.value })} className="w-full bg-transparent border-b border-primary/10 py-3 text-sm font-body text-primary outline-none resize-none focus:border-accent transition-all duration-700 ease-in-out placeholder:text-primary/10 leading-relaxed" placeholder="Please describe your requirements..."></textarea>
              </div>
              <div className="pt-8">
                 <button type="submit" className={`w-full py-6 flex items-center justify-center transition-all duration-1000 text-[10px] uppercase tracking-[0.5em] ${sent ? 'bg-accent/5 text-accent' : 'bg-primary text-white hover:bg-black shadow-xl ring-1 ring-primary/5 active:scale-[0.98]'}`}>
                   {sent ? "Archive Updated — We shall respond" : "Dispatch Inquiry"}
                   {!sent && <Send className="ml-4 w-4 h-4 opacity-40 transform transition-transform group-hover:translate-x-2" strokeWidth={1} />}
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-32">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <span className="text-[10px] uppercase tracking-[0.5em] text-accent font-body opacity-60 block">
            AI-powered stylist
          </span>
          <h2 className="font-headline text-4xl md:text-5xl text-primary italic font-light tracking-tighter">
            Ask the archive.
          </h2>
          <p className="text-secondary font-body text-sm font-light tracking-wide">
            Instant pairing and sizing guidance from your catalog. Set{' '}
            <code className="text-xs bg-primary/5 px-1">GEMINI_API_KEY</code> or{' '}
            <code className="text-xs bg-primary/5 px-1">VITE_GEMINI_API_KEY</code> in{' '}
            <code className="text-xs bg-primary/5 px-1">.env</code>, then restart the dev server.
          </p>
        </div>
        <AIConcierge />
      </section>
    </div>
  );
};

export default Contact;