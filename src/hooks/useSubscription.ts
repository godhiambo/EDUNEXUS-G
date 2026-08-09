import { useState, useEffect, useCallback } from 'react';
import { UserSubscription, PlanLimits, SubscriptionPlan, BillingCycle } from '../types';

export function useSubscription(userId: string = 'guest') {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subscription/status?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        setLimits(data.limits);
      }
    } catch (err: any) {
      console.error('Error fetching subscription status:', err);
      setError(err.message || 'Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const checkAndConsumeQuota = async (
    feature: 'aiQuestions' | 'whatsappMsgs' | 'images' | 'videos' | 'lessonPlans' | 'documents',
    count: number = 1
  ): Promise<{ allowed: boolean; remaining: number; plan: string; creditsUsed?: boolean; reason?: string }> => {
    try {
      const res = await fetch('/api/subscription/check-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, feature, count })
      });
      const data = await res.json();
      fetchStatus(); // Refresh counters
      return data;
    } catch (err: any) {
      console.error('Error checking quota:', err);
      return { allowed: true, remaining: 99, plan: 'free' };
    }
  };

  const upgradePlan = async (
    plan: SubscriptionPlan,
    billingCycle: BillingCycle = 'monthly',
    paymentMethod: string = 'mpesa',
    phoneOrCard?: string
  ) => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan, billingCycle, paymentMethod, phoneOrCard })
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
        setLimits(data.limits);
      }
      return data;
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      return { success: false, message: err.message || 'Upgrade failed' };
    } finally {
      setLoading(false);
    }
  };

  const startTrial = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
        setLimits(data.limits);
      }
      return data;
    } catch (err: any) {
      console.error('Error starting free trial:', err);
      return { success: false, message: err.message || 'Trial activation failed' };
    } finally {
      setLoading(false);
    }
  };

  const buyCredits = async (
    packageId: string,
    creditAmount: number,
    costUSD: number,
    paymentMethod: string = 'mpesa'
  ) => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription/buy-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, packageId, creditAmount, costUSD, paymentMethod })
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
      return data;
    } catch (err: any) {
      console.error('Error purchasing credits:', err);
      return { success: false, message: err.message || 'Credit purchase failed' };
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenew = async () => {
    try {
      const res = await fetch('/api/subscription/toggle-auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
      return data;
    } catch (err: any) {
      console.error('Error toggling auto-renew:', err);
    }
  };

  return {
    subscription,
    limits,
    loading,
    error,
    refreshSubscription: fetchStatus,
    checkAndConsumeQuota,
    upgradePlan,
    startTrial,
    buyCredits,
    toggleAutoRenew
  };
}
