import React from 'react';
import { Sparkles, Star, Crown, Zap, TrendingUp } from 'lucide-react';
import { UserSubscription, PlanLimits } from '../types';

interface SubscriptionBadgeWidgetProps {
  subscription: UserSubscription | null;
  limits: PlanLimits | null;
  onOpenPricingModal: () => void;
  compact?: boolean;
}

export default function SubscriptionBadgeWidget({
  subscription,
  limits,
  onOpenPricingModal,
  compact = false
}: SubscriptionBadgeWidgetProps) {
  const plan = subscription?.plan || 'free';
  const usage = subscription?.usageToday || {
    aiQuestions: 0,
    images: 0,
    videos: 0,
    lessonPlans: 0
  };

  const getPlanBadge = () => {
    if (plan === 'pro') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <Crown className="w-3.5 h-3.5" /> PRO EDUCATOR
        </span>
      );
    }
    if (plan === 'premium') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Star className="w-3.5 h-3.5 fill-amber-400" /> PREMIUM PLAN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
        🆓 FREE PLAN
      </span>
    );
  };

  if (compact) {
    return (
      <button
        onClick={onOpenPricingModal}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer text-xs"
      >
        {getPlanBadge()}
        <span className="text-[11px] text-amber-300 font-mono font-bold flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> {subscription?.aiCredits || 0}
        </span>
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border border-emerald-500/30 text-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getPlanBadge()}
        </div>

        <button
          onClick={onOpenPricingModal}
          className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer hover:shadow-md"
        >
          {plan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">AI Questions Today</div>
          <div className="font-mono font-extrabold text-emerald-300">
            {limits?.aiQuestionsPerDay === -1 ? 'Unlimited' : `${usage.aiQuestions} / ${limits?.aiQuestionsPerDay || 20}`}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">AI Credits Balance</div>
          <div className="font-mono font-extrabold text-amber-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> {subscription?.aiCredits || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
