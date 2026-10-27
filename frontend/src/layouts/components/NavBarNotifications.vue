<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const notifications = computed(() => store.state.notification?.notifications || [])

let pollTimer = null

const fetchNotifications = () => {
  const token = localStorage.getItem('App-Token')
  if (token) {
    store.dispatch('notification/GetNotifications')
  }
}

onMounted(() => {
  fetchNotifications()

  // Polling pembaruan notifikasi berkala setiap 30 detik
  pollTimer = setInterval(fetchNotifications, 30000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

const removeNotification = notificationId => {
  store.dispatch('notification/RemoveNotification', notificationId)
}

const markRead = notificationIds => {
  if (Array.isArray(notificationIds)) {
    if (notificationIds.length > 1 && notificationIds.length === notifications.value.length) {
      store.dispatch('notification/MarkAllRead')
    } else {
      notificationIds.forEach(id => {
        store.dispatch('notification/MarkRead', id)
      })
    }
  } else if (notificationIds) {
    store.dispatch('notification/MarkRead', notificationIds)
  }
}

const markUnRead = notificationIds => {
  if (Array.isArray(notificationIds)) {
    notificationIds.forEach(id => {
      store.dispatch('notification/MarkUnread', id)
    })
  } else if (notificationIds) {
    store.dispatch('notification/MarkUnread', notificationIds)
  }
}

const handleNotificationClick = notification => {
  if (!notification.isSeen) {
    store.dispatch('notification/MarkRead', notification.id)
  }

  if (notification.link) {
    router.push(notification.link).catch(() => {})
  }
}
</script>

<template>
  <Notifications
    :notifications="notifications"
    @remove="removeNotification"
    @read="markRead"
    @unread="markUnRead"
    @click:notification="handleNotificationClick"
  />
</template>
