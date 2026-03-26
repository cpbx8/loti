/**
 * Push notification service — local-first, Capacitor-only.
 * Schedules a single daily reminder with smart suppression:
 * - If user already logged today → evening check-in
 * - If not logged → midday nudge
 * Gracefully degrades on web (silent no-op).
 */

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getDistinctScanDates, trackEvent } from '@/db/queries'
import { formatDate } from '@/hooks/useDailyLog'

const DAILY_NOTIFICATION_ID = 1001

/** i18n notification copy — keyed by language */
const COPY = {
  es: {
    notLogged: {
      title: 'Loti 🌸',
      body: '¿Cómo va tu alimentación hoy? Registra lo que comiste.',
    },
    alreadyLogged: {
      title: 'Loti 🌸',
      body: '¡Buen trabajo hoy! Revisa tu curva de glucosa.',
    },
  },
  en: {
    notLogged: {
      title: 'Loti 🌸',
      body: "How's your eating going today? Log what you had.",
    },
    alreadyLogged: {
      title: 'Loti 🌸',
      body: 'Nice work today! Check your glucose curve.',
    },
  },
} as const

export async function scheduleNotifications(language: 'es' | 'en' = 'es'): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Loti Notifications] Skipping — not native platform')
    return
  }

  try {
    // Request permission
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') {
      console.log('[Loti Notifications] Permission denied')
      await trackEvent('notification_permission_denied')
      return
    }

    // Cancel any existing scheduled notifications
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending)
    }

    // Check if user logged today (smart suppression)
    const dates = await getDistinctScanDates(1)
    const today = formatDate(new Date())
    const loggedToday = dates.includes(today)

    const copy = COPY[language] ?? COPY.es
    const message = loggedToday ? copy.alreadyLogged : copy.notLogged

    // Schedule for either noon (not logged) or 7pm (already logged)
    const now = new Date()
    const scheduleDate = new Date()
    const targetHour = loggedToday ? 19 : 12

    if (now.getHours() >= targetHour) {
      // Already past target time today → schedule for tomorrow
      scheduleDate.setDate(scheduleDate.getDate() + 1)
    }
    scheduleDate.setHours(targetHour, 0, 0, 0)

    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_NOTIFICATION_ID,
          title: message.title,
          body: message.body,
          schedule: { at: scheduleDate },
          sound: undefined,
          smallIcon: undefined,
          largeIcon: undefined,
        },
      ],
    })

    console.log(`[Loti Notifications] Scheduled for ${scheduleDate.toISOString()} (loggedToday=${loggedToday})`)
    await trackEvent('notification_scheduled', { loggedToday, targetHour })
  } catch (err) {
    console.warn('[Loti Notifications] Failed to schedule:', err)
  }
}
