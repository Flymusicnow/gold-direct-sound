import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
  loading: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    loading: true,
  });

  useEffect(() => {
    checkSupport();
  }, [user]);

  const checkSupport = async () => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window;
    
    if (!isSupported) {
      setState(prev => ({ ...prev, isSupported: false, loading: false }));
      return;
    }

    const permission = Notification.permission;
    let isSubscribed = false;

    if (user && permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        const pm = (registration as any).pushManager;
        const subscription = pm ? await pm.getSubscription() : null;
        isSubscribed = !!subscription;
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }

    setState({
      isSupported: true,
      permission,
      isSubscribed,
      loading: false,
    });
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await registration.update();
      return registration;
    } catch (error) {
      console.error("Service worker registration failed:", error);
      throw error;
    }
  };

  const subscribe = useCallback(async () => {
    if (!user || !state.isSupported) return { success: false, error: "Not supported" };

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(prev => ({ ...prev, permission, loading: false }));
        return { success: false, error: "Permission denied" };
      }

      // Register service worker
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment or use placeholder
      // In production, this should come from the server/environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured");
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: "Push notifications not configured" };
      }

      // Subscribe to push
      const pm = (registration as any).pushManager;
      const subscription = await pm.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Extract keys
      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys;

      if (!keys?.p256dh || !keys?.auth) {
        throw new Error("Failed to get subscription keys");
      }

      // Save to database
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, {
          onConflict: "user_id,endpoint"
        });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        permission: "granted",
        isSubscribed: true,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      console.error("Failed to subscribe:", error);
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error: error.message };
    }
  }, [user, state.isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return { success: false, error: "Not authenticated" };

    setState(prev => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const pm = (registration as any).pushManager;
      const subscription = pm ? await pm.getSubscription() : null;

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      console.error("Failed to unsubscribe:", error);
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error: error.message };
    }
  }, [user]);

  return {
    isSupported: state.isSupported,
    permission: state.permission,
    isSubscribed: state.isSubscribed,
    isLoading: state.loading,
    loading: state.loading,
    subscribe,
    unsubscribe,
    checkSupport,
  };
}
