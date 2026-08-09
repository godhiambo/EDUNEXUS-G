import React, { useState } from 'react';
import {
  X,
  Check,
  Star,
  Crown,
  Sparkles,
  Zap,
  Smartphone,
  CreditCard,
  Building2,
  Clock,
  ShieldCheck,
  Coins,
  FileText,
  Video,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Download,
  AlertCircle,
  Globe
} from 'lucide-react';
import { SubscriptionPlan, BillingCycle, UserSubscription, PlanLimits } from '../types';

interface PricingSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscription | null;
  limits: PlanLimits | null;
  onUpgrade: (plan: SubscriptionPlan, cycle: BillingCycle, paymentMethod: string, phoneOrCard?: string) => Promise<any>;
  onStartTrial: () => Promise<any>;
  onBuyCredits: (packageId: string, amount: number, costUSD: number, paymentMethod: string) => Promise<any>;
}

export default function PricingSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  limits,
  onUpgrade,
  onStartTrial,
  onBuyCredits
}: PricingSubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [activeTab, setActiveTab] = useState<'plans' | 'credits' | 'history'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'paypal' | 'google_pay'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState<string>('254712345678');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [processing, setProcessing] = useState<boolean>(false);
  const [stkPushing, setStkPushing] = useState<boolean>(false);
  const [stkTimer, setStkTimer] = useState<number>(10);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCreditPack, setSelectedCreditPack] = useState<{ id: string; amount: number; costUSD: number } | null>(null);

  if (!isOpen) return null;

  const currentPlan = subscription?.plan || 'free';
  const hasUsedTrial = subscription?.hasUsedTrial || false;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;
    if (plan === 'free') return;
    setSelectedPlan(plan);
    setSuccessMessage(null);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    if (paymentMethod === 'mpesa') {
      setStkPushing(true);
      setStkTimer(8);
      
      const interval = setInterval(() => {
        setStkTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        setStkPushing(false);
        setProcessing(true);
        const res = await onUpgrade(selectedPlan, billingCycle, paymentMethod, mpesaPhone);
        setProcessing(false);
        if (res.success) {
          setSuccessMessage(res.message);
          setSelectedPlan(null);
        }
      }, 8000);
    } else {
      setProcessing(true);
      const res = await onUpgrade(selectedPlan, billingCycle, paymentMethod, cardNumber);
      setProcessing(false);
      if (res.success) {
        setSuccessMessage(res.message);
        setSelectedPlan(null);
      }
    }
  };

  const handleActivateTrial = async () => {
    setProcessing(true);
    const res = await onStartTrial();
    setProcessing(false);
    if (res.success) {
      setSuccessMessage(res.message);
    }
  };

  const handleBuyCreditPack = async (pack: { id: string; amount: number; costUSD: number }) => {
    setProcessing(true);
    const res = await onBuyCredits(pack.id, pack.amount, pack.costUSD, paymentMethod);
    setProcessing(false);
    if (res.success) {
      setSuccessMessage(res.message);
      setSelectedCreditPack(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden text-white my-8 flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>EduNexus Plans & Entitlements</span>
                <span className="text-xs uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  CURRENT: {currentPlan.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-300">Unlock unlimited AI tutoring, WhatsApp tools, video generation, and teacher playbooks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROMO / SUCCESS NOTIFICATION BAR */}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-between text-sm font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-xs underline text-emerald-200">Dismiss</button>
          </div>
        )}

        {/* 14-DAY TRIAL BANNER FOR FREE USERS */}
        {currentPlan === 'free' && !hasUsedTrial && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-emerald-500/20 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">Try EduNexus Premium Free for 14 Days</h4>
                <p className="text-xs text-slate-300">Enjoy 250 free AI credits, unlimited Socratic tutoring & WhatsApp AI with zero commitment.</p>
              </div>
            </div>
            <button
              onClick={handleActivateTrial}
              disabled={processing}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              {processing ? 'Activating...' : 'Start 14-Day Free Trial'}
            </button>
          </div>
        )}

        {/* NAVIGATION TABS & BILLING TOGGLE */}
        <div className="px-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'plans' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Subscription Plans</span>
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'credits' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>AI Credit Top-Ups</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Billing History</span>
            </button>
          </div>

          {activeTab === 'plans' && (
            <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-md">Save 20%</span>
              </button>
            </div>
          )}
        </div>

        {/* MODAL MAIN CONTENT BODY */}
        <div className="p-6 overflow-y-auto space-y-6 grow">
          {activeTab === 'plans' && (
            <div className="space-y-6">
              
              {/* PLAN CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 🆓 FREE PLAN CARD */}
                <div className={`relative p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  currentPlan === 'free'
                    ? 'bg-slate-950/80 border-slate-700'
                    : 'bg-slate-950/40 border-slate-800 opacity-90'
                }`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🆓</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free Tier</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">EduNexus Free</h3>
                      <p className="text-xs text-slate-400 mt-1">Essential tools for curious students and individual learners.</p>
                    </div>

                    <div className="py-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">$0</span>
                        <span className="text-xs text-slate-400">/ forever</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Basic Socratic AI Tutor (20 Qs/day)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>WhatsApp AI Tutoring (30 msgs/day)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Image Studio (5 diagrams/day)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Video Studio (2 clips/day)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Basic Teacher Playbook (3 docs/day)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    {currentPlan === 'free' ? (
                      <div className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs text-center border border-slate-700">
                        Your Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan('free')}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        Downgrade to Free
                      </button>
                    )}
                  </div>
                </div>

                {/* ⭐ PREMIUM PLAN CARD */}
                <div className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                  currentPlan === 'premium'
                    ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-500 shadow-xl shadow-amber-500/10'
                    : 'bg-slate-950/90 border-amber-500/50 hover:border-amber-400'
                }`}>
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                    Most Popular for Students
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Premium Tier</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                        <span>EduNexus Premium</span>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">Unlimited AI study assistance, revision flashcards & exports.</p>
                    </div>

                    <div className="py-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-amber-300 font-mono">
                          {billingCycle === 'annual' ? '$8.25' : '$9.99'}
                        </span>
                        <span className="text-xs text-slate-400">/ month {billingCycle === 'annual' && '(billed $99/yr)'}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>UNLIMITED AI Socratic Tutoring</span>
                      </div>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>UNLIMITED WhatsApp AI Companion</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Image Studio (50 diagrams/day)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Video Studio (10 AI clips/day)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>PDF, Word & PowerPoint Export</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-300 font-extrabold">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>+250 Monthly Bonus AI Credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    {currentPlan === 'premium' ? (
                      <div className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs text-center border border-amber-500/40">
                        Current Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan('premium')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        Upgrade to Premium
                      </button>
                    )}
                  </div>
                </div>

                {/* 👑 PRO PLAN CARD */}
                <div className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                  currentPlan === 'pro'
                    ? 'bg-gradient-to-b from-emerald-950/50 via-slate-900 to-slate-950 border-emerald-400 shadow-xl shadow-emerald-500/10'
                    : 'bg-slate-950/90 border-emerald-500/50 hover:border-emerald-400'
                }`}>
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                    Essential for Educators
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Crown className="w-7 h-7 text-emerald-400" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Pro Educator Tier</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                        <span>EduNexus Pro</span>
                        <Crown className="w-4 h-4 text-emerald-400" />
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">Complete suite for teachers, schools, exam writers & developers.</p>
                    </div>

                    <div className="py-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-emerald-300 font-mono">
                          {billingCycle === 'annual' ? '$20.75' : '$24.99'}
                        </span>
                        <span className="text-xs text-slate-400">/ month {billingCycle === 'annual' && '(billed $249/yr)'}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Everything in Premium +</span>
                      </div>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>UNLIMITED Lesson Plans & Schemes</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>CAT & Exam Generators with Rubrics</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>UNLIMITED AI Image & Video Studio</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Priority Gemini AI Model Queue</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-300 font-extrabold">
                        <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>+1,000 Monthly Bonus AI Credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    {currentPlan === 'pro' ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs text-center border border-emerald-500/40">
                        Current Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan('pro')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* ENTERPRISE SCHOOLS BANNER */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>EduNexus Enterprise for Schools & Ministries</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-black">
                        INSTITUTIONAL
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">Bulk student licensing, custom CBC curriculum fine-tuning, school analytics & dedicated SLA support.</p>
                  </div>
                </div>
                <button
                  onClick={() => alert('Contact our Institutional Licensing team at enterprise@edunexus.ai or WhatsApp +254700000000')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Contact Sales Team
                </button>
              </div>

              {/* CHECKOUT & PAYMENT METHOD DRAWER */}
              {selectedPlan && (
                <div className="p-6 rounded-3xl bg-slate-950 border-2 border-emerald-500/60 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>Checkout: Upgrade to EduNexus {selectedPlan.toUpperCase()} ({billingCycle.toUpperCase()})</span>
                    </h3>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* PAYMENT METHOD SELECTOR */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Select Secure Payment Gateway:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'mpesa'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-emerald-400" />
                        <span>M-PESA STK Push</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-cyan-400" />
                        <span>Visa / Mastercard</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-5 h-5 text-blue-400" />
                        <span>PayPal Checkout</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('google_pay')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'google_pay'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-5 h-5 text-amber-400" />
                        <span>Google Pay</span>
                      </button>
                    </div>
                  </div>

                  {/* PAYMENT INPUT FIELDS */}
                  {paymentMethod === 'mpesa' && (
                    <div className="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Safaricom M-PESA Phone Number:</span>
                        <span className="text-[10px] text-emerald-400">STK Push Instant Request</span>
                      </label>
                      <input
                        type="text"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="e.g. 254712345678"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <label className="text-xs font-bold text-slate-300 block">Credit / Debit Card Details:</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}

                  {stkPushing ? (
                    <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 space-y-2 text-center animate-pulse">
                      <div className="flex items-center justify-center gap-2 font-bold text-sm">
                        <Smartphone className="w-5 h-5 text-amber-400 animate-bounce" />
                        <span>Sending M-PESA STK Push Prompt to {mpesaPhone}...</span>
                      </div>
                      <p className="text-xs text-slate-300">Please check your phone screen and enter your M-PESA PIN to authorize transaction.</p>
                      <div className="text-xs font-mono font-extrabold text-amber-400">
                        Waiting for PIN entry ({stkTimer}s)...
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-slate-400">
                        Total Charge: <span className="text-white font-black font-mono text-sm">
                          ${selectedPlan === 'premium' ? (billingCycle === 'annual' ? '99.00' : '9.99') : (billingCycle === 'annual' ? '249.00' : '24.99')}
                        </span>
                      </div>

                      <button
                        onClick={handleConfirmUpgrade}
                        disabled={processing}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        {processing ? 'Authorizing Payment...' : 'Confirm & Authorize Subscription'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* AI CREDIT TOP-UPS TAB */}
          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Your AI Credit Balance</h3>
                    <p className="text-xs text-slate-400">Credits supplement daily quotas for extra images, videos, or AI document analysis.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-300 font-mono">{subscription?.aiCredits || 0}</span>
                  <span className="text-xs text-slate-400 block">Available Credits</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { id: 'pack_small', amount: 500, costUSD: 5, label: 'Starter Pack', popular: false },
                  { id: 'pack_medium', amount: 1200, costUSD: 10, label: 'Pro Pack (Save 15%)', popular: true },
                  { id: 'pack_large', amount: 3200, costUSD: 25, label: 'Mega Pack (Best Value)', popular: false }
                ].map((pack) => (
                  <div
                    key={pack.id}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                      pack.popular ? 'bg-slate-950 border-amber-500 shadow-lg' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {pack.popular && (
                        <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                          Most Popular
                        </span>
                      )}
                      <h4 className="text-base font-bold text-white">{pack.label}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-amber-300 font-mono">+{pack.amount}</span>
                        <span className="text-xs text-slate-400">Credits</span>
                      </div>
                      <p className="text-xs text-slate-400">${pack.costUSD}.00 USD one-time purchase</p>
                    </div>

                    <button
                      onClick={() => handleBuyCreditPack(pack)}
                      disabled={processing}
                      className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                    >
                      {processing ? 'Processing...' : `Buy for $${pack.costUSD}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BILLING HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Payment & Subscription Transactions</h3>
              {(!subscription?.transactions || subscription.transactions.length === 0) ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No payment invoices or transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {subscription.transactions.map((tx) => (
                    <div key={tx.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{tx.description}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleString()} • {tx.paymentMethod}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">${tx.amountUSD.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{tx.receiptNo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
