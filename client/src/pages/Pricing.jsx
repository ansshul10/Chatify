"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  ChevronDown, MessageSquare, Bot, Users, Lock, Ticket, 
  AlertCircle, Loader2, X, Copy, CheckCircle2, Sparkles, Zap, ShieldCheck 
} from "lucide-react";

import { useAuthContext } from "@/context/AuthContext";
import axiosInstance from "@/utils/axiosInstance";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PrimaryButton } from "@/components/Button";

// --- Configuration & Data ---
const PLANS = [
  {
    id: "pro",
    name: "Plus",
    tagline: "For Enthusiasts",
    price: { monthly: 199, yearly: 1490 },
    recommended: true,
    features: [
      { text: "End-to-End Encryption", icon: <Lock className="w-4 h-4"/> },
      { text: "500 Active Conversations", icon: <MessageSquare className="w-4 h-4"/> },
      { text: "1-Year Message Archive", icon: <ShieldCheck className="w-4 h-4"/> },
      { text: "AI Smart Replies", icon: <Zap className="w-4 h-4"/> },
    ],
  },
  {
    id: "enterprise",
    name: "Ultra",
    tagline: "Professional Power",
    price: { monthly: 499, yearly: 3990 },
    recommended: false,
    features: [
      { text: "End-to-End Encryption", icon: <Lock className="w-4 h-4"/> },
      { text: "Unlimited Active Chats", icon: <Users className="w-4 h-4"/> },
      { text: "Permanent Archive", icon: <ShieldCheck className="w-4 h-4"/> },
      { text: "Full AI Messaging Suite", icon: <Bot className="w-4 h-4"/> },
    ],
  },
];

const FAQS = [
  { q: "Is my data safe on Chatify?", a: "Yes. End-to-End Encryption is standard across all plans. This means only you and the recipient can read your messages." },
  { q: "How does verification work?", a: "We use Unique Decimal Pricing (e.g., ₹199.47) and Reference IDs to verify payments instantly. Admin matches this in the bank statement to approve you." },
];

// --- Sub-Components ---
const FAQItem = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-none group">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full py-6 flex justify-between items-center text-left">
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-primary-400' : 'text-white/70 group-hover:text-white'}`}>{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-white/20"><ChevronDown className="w-5 h-5" /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-6 text-white/40 leading-relaxed text-md">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Pricing = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [coupon, setCoupon] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminConfig, setAdminConfig] = useState({ upiId: "", prices: { pro: {}, enterprise: {} } });
  const [finalUniquePrice, setFinalUniquePrice] = useState("0.00");
  const [paymentRef, setPaymentRef] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axiosInstance.get("/pricing/config");
        setAdminConfig(res.data);
      } catch (err) { console.error("Config fetch failed"); }
    };
    fetchConfig();
  }, []);

  const applyCoupon = async () => {
    if (!coupon || !user) { !user && navigate("/login"); return; }
    setIsVerifyingCoupon(true);
    try {
      const res = await axiosInstance.post("/pricing/verify-coupon", { code: coupon });
      if (res.data.success) {
        setDiscountPct(res.data.discount);
        setStatusMsg({ type: "success", text: `Success! ${res.data.discount}% Discount Unlocked.` });
      }
    } catch (error) {
      setDiscountPct(0);
      setStatusMsg({ type: "error", text: "Invalid promo code." });
    } finally { setIsVerifyingCoupon(false); }
  };

  const handlePurchaseInit = (plan) => {
    if (!user) return navigate("/login");
    const basePrice = adminConfig.prices[plan.id]?.[billingCycle] || plan.price[billingCycle];
    const discountedBase = basePrice - (basePrice * (discountPct / 100));
    const randomCents = (Math.floor(Math.random() * 90) + 10) / 100;
    const uniqueAmount = (parseFloat(discountedBase) + randomCents).toFixed(2);
    const refCode = `CH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    setFinalUniquePrice(uniqueAmount);
    setPaymentRef(refCode);
    setSelectedPlan({ ...plan, basePrice: discountedBase });
    setStep(1);
    setShowPayModal(true);
  };

  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshot(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (!utr || utr.length < 8) return setStatusMsg({ type: "error", text: "Invalid Transaction ID." });
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/pricing/request", {
        planId: selectedPlan.id,
        billingCycle,
        pricePaid: finalUniquePrice,
        utr: utr,
        screenshot: screenshot,
        paymentNote: paymentRef,
        couponCode: discountPct > 0 ? coupon : null
      });
      setShowPayModal(false);
      setStatusMsg({ type: "success", text: "Request Submitted! Verification in progress." });
      setUtr(""); setScreenshot(null);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Submission failed." });
    } finally { setIsSubmitting(false); }
  };

  const upiIntent = `upi://pay?pa=${adminConfig.upiId}&pn=Chatify&am=${finalUniquePrice}&cu=INR&tn=${paymentRef}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntent)}`;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans selection:bg-primary-500/40 selection:text-white">
      <Navbar />

      <main className="relative z-10 pt-40 pb-24 px-6 max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" /> Premium Membership
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
            Upgrade <span className="text-primary-500 italic">Chatify.</span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mx-auto font-medium">
            Unlock advanced AI features and higher limits with our instant manual verification system.
          </p>
        </header>

        <AnimatePresence>
          {statusMsg.text && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 max-w-md mx-auto ${statusMsg.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold flex-1">{statusMsg.text}</span>
              <button onClick={() => setStatusMsg({type:"", text:""})} className="text-[10px] uppercase font-black opacity-40 hover:opacity-100"><X className="w-4 h-4"/></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white/[0.02] border border-white/5 p-4 rounded-[2.5rem]">
          <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
            <button onClick={() => setBillingCycle("monthly")} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${billingCycle === "monthly" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-white/40 hover:text-white"}`}>MONTHLY</button>
            <button onClick={() => setBillingCycle("yearly")} className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${billingCycle === "yearly" ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-white/40 hover:text-white"}`}>YEARLY <span className="bg-green-500/20 text-green-400 text-[8px] px-1.5 py-0.5 rounded-md">-25%</span></button>
          </div>

          <div className="relative group w-full md:w-80">
            <Ticket className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${discountPct > 0 ? 'text-green-500' : 'text-white/20'}`} />
            <input 
              type="text" 
              placeholder="PROMO CODE" 
              value={coupon} 
              onChange={(e) => setCoupon(e.target.value.toUpperCase())} 
              className={`w-full bg-black/40 border rounded-2xl py-3.5 pl-11 pr-24 text-[11px] font-black tracking-widest focus:outline-none transition-all ${discountPct > 0 ? 'border-green-500/50' : 'border-white/5 focus:border-primary-500/50'}`}
            />
            <button onClick={applyCoupon} disabled={isVerifyingCoupon} className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5">
              {isVerifyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
            </button>
          </div>
        </div>

        {/* --- PRICING CARDS WITH SMART LOGIC --- */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-32">
          <LayoutGroup>
            {PLANS.map((plan) => {
              const originalPrice = adminConfig.prices[plan.id]?.[billingCycle] || plan.price[billingCycle];
              
              // Smart Logic for User Subscription
              const userCurrentPlan = user?.subscription?.plan || "free";
              const isCurrentPlan = userCurrentPlan === plan.id;
              
              // Button Text Logic
              let buttonText = `Select ${plan.name}`;
              if (isCurrentPlan) buttonText = "Current Plan";
              else if (userCurrentPlan === "pro" && plan.id === "enterprise") buttonText = "Upgrade to Ultra";
              else if (userCurrentPlan === "enterprise" && plan.id === "pro") buttonText = "Downgrade (Contact Support)";

              return (
                <motion.div 
                  layout 
                  key={plan.id} 
                  className={`relative p-8 rounded-[3rem] border transition-all duration-500 flex flex-col ${
                    isCurrentPlan 
                    ? "border-green-500/50 bg-green-500/[0.03] shadow-[0_0_50px_-12px_rgba(34,197,94,0.2)]" 
                    : plan.recommended 
                      ? "bg-gradient-to-br from-primary-500/[0.07] to-transparent border-primary-500/30 shadow-2xl" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  }`}
                >
                  {isCurrentPlan ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-xl flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3"/> Active Plan
                    </div>
                  ) : plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-xl shadow-primary-500/40">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <p className="text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{plan.tagline}</p>
                    <h3 className="text-3xl font-black italic mb-4">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter italic">₹{Math.floor(originalPrice - (originalPrice * discountPct / 100))}</span>
                      {discountPct > 0 && <span className="text-white/20 text-xl line-through">₹{originalPrice}</span>}
                      <span className="text-white/20 text-sm font-bold uppercase tracking-widest">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-10 flex-1">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-white/50 font-semibold p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
                        <div className="text-primary-500">{feat.icon}</div> {feat.text}
                      </div>
                    ))}
                  </div>

                  <PrimaryButton 
                    onClick={() => !isCurrentPlan && handlePurchaseInit(plan)} 
                    disabled={isCurrentPlan || (userCurrentPlan === "enterprise" && plan.id === "pro")}
                    className={`w-full py-5 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${
                      isCurrentPlan 
                      ? "bg-white/5 text-white/40 border-white/5 cursor-default shadow-none" 
                      : "shadow-primary-500/10"
                    }`}
                  >
                    {buttonText}
                  </PrimaryButton>
                </motion.div>
              );
            })}
          </LayoutGroup>
        </div>

        <section className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-[1px] flex-1 bg-white/5"></div>
             <h2 className="text-2xl font-black tracking-tighter italic opacity-50 uppercase">FAQ.</h2>
             <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>
          <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        <AnimatePresence>
          {showPayModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-[#0a0d14] border border-white/10 rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Step 0{step} / 03</span>
                  <button onClick={() => setShowPayModal(false)} className="hover:text-primary-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-8">
                  {step === 1 && (
                    <div className="text-center space-y-6">
                      <div className="py-6">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Amount to Pay</p>
                        <h4 className="text-5xl font-black text-primary-400 tracking-tighter italic">₹{finalUniquePrice}</h4>
                      </div>
                      <PrimaryButton onClick={() => setStep(2)} className="w-full rounded-2xl font-black uppercase">Get QR Code</PrimaryButton>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="text-center space-y-6">
                      <div className="bg-white p-4 rounded-3xl inline-block border-[6px] border-primary-500/20">
                        <img src={qrUrl} alt="UPI QR" className="w-40 h-40" />
                      </div>
                      <div className="space-y-3">
                         <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] text-white/30 uppercase font-bold mb-1">Ref ID: {paymentRef}</p>
                            <code className="text-xs font-mono text-primary-500">{adminConfig.upiId}</code>
                         </div>
                         <button onClick={() => navigator.clipboard.writeText(adminConfig.upiId)} className="text-[10px] font-black uppercase text-white/40 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 w-full"><Copy className="w-3 h-3"/> Copy UPI ID</button>
                      </div>
                      <PrimaryButton onClick={() => setStep(3)} className="w-full rounded-2xl uppercase">I Have Paid</PrimaryButton>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <input type="text" placeholder="UTR / TRANSACTION ID" value={utr} onChange={(e) => setUtr(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black text-xs tracking-widest outline-none focus:border-primary-500 uppercase" />
                      <div className="relative border border-dashed border-white/10 p-6 rounded-xl text-center hover:border-primary-500/50 transition-all">
                        <input type="file" accept="image/*" onChange={handleScreenshot} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {screenshot ? <span className="text-green-400 text-[10px] font-black uppercase flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> Selected</span> : <span className="text-white/20 text-[10px] font-black uppercase">Upload Screenshot</span>}
                      </div>
                      <PrimaryButton onClick={handleFinalSubmit} loading={isSubmitting} className="w-full rounded-2xl font-black uppercase">Verify Now</PrimaryButton>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;