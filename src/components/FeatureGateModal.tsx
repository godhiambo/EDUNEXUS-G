import React from 'react';
import { Lock, Sparkles, Star, Crown, X, ArrowRight } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface FeatureGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  requiredPlan?: SubscriptionPlan;
  onOpenPricingModal: () => void;
  onStartTrial?: () => void;
}

export default function FeatureGateModal({
  isOpen,
  onClose,
  title = 'Daily Quota Limit Reached',
  description = 'You have reached the daily quota limit for your current free plan. Upgrade to EduNexus Premium or Pro to continue generating unlimited AI content.',
  requiredPlan = 'premium',
  onOpenPricingModal,
  onStartTrial
}: FeatureGateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 text-white shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Upgrade Unlocks:</div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span>Unlimited AI Tutoring & WhatsApp Companion</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Unlimited Image & Video Studio Generations</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>PDF, Word & PowerPoint Document Exports</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenPricingModal();
            }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Upgrade Subscription Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onStartTrial && (
            <button
              onClick={() => {
                onClose();
                onStartTrial();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Start 14-Day Free Premium Trial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
