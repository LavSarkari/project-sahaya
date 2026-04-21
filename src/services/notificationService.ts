import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Issue } from '../types';

/**
 * Handles dispatching multi-channel notifications to users upon task assignment.
 * Integrates directly with Telegram Bot API for real messages.
 * Simulates Email and SMS delivery for hackathon purposes.
 */
export const NotificationService = {
  async notifyAssignment(volunteerId: string, issueId: string) {
    try {
      const userRef = doc(db, 'users', volunteerId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn('NotificationService: User not found', volunteerId);
        return;
      }

      const userData = userSnap.data() as UserProfile;
      const prefs = userData.notificationPreferences || { email: true, sms: false, telegram: false };
      
      const issueRef = doc(db, 'issues', issueId);
      const issueSnap = await getDoc(issueRef);
      const issueData = issueSnap.exists() ? (issueSnap.data() as Issue) : null;
      
      const categoryText = issueData ? issueData.category : 'a new pending task';
      const addressText = issueData?.location?.address ? ` at ${issueData.location.address}` : '';
      
      const message = `🚨 Sahaya Alert: You have been assigned to: [${categoryText}]${addressText}. Please check your active dashboard for coordinates and details.`;
      
      const methodsUsed: string[] = [];

      // Email Simulation
      if (prefs.email && userData.email) {
        methodsUsed.push(`Email (${userData.email})`);
        console.log(`[Notification Service] 📩 EMAIL SENT to ${userData.email}`);
      }

      // SMS Simulation
      if (prefs.sms && userData.phone) {
        methodsUsed.push(`SMS (${userData.phone})`);
        console.log(`[Notification Service] 💬 SMS SENT to ${userData.phone}`);
      }

      // Real Telegram Integration
      if (prefs.telegram && userData.telegramChatId) {
        methodsUsed.push(`Telegram (${userData.telegramChatId})`);
        
        const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: userData.telegramChatId,
                text: message,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "📱 Open Dashboard",
                        web_app: {
                          url: "https://projectsahaya.web.app/"
                        }
                      }
                    ]
                  ]
                }
              })
            });
            if (!res.ok) {
              console.error('Telegram notification failed:', await res.text());
            } else {
              console.log(`[Notification Service] ✈️ TELEGRAM DELIVERED to ${userData.telegramChatId}`);
            }
          } catch (tErr) {
            console.error('Error hitting Telegram API', tErr);
          }
        } else {
          console.warn('[Notification Service] Telegram enabled, but VITE_TELEGRAM_BOT_TOKEN is missing in .env');
        }
      }

      // Persist log to Firestore (serves as the system's "Outbox" receipt)
      if (methodsUsed.length > 0) {
        await addDoc(collection(db, 'notifications_log'), {
          volunteerId,
          issueId,
          message,
          methods: methodsUsed,
          timestamp: serverTimestamp()
        });
        console.log(`[Notification Engine] Dispatch to ${userData.name || volunteerId} logged to Firestore.`);
      }

    } catch (error) {
      console.error('NotificationService setup failed:', error);
    }
  }
};
