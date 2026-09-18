import { reactive } from 'vue'

const TOKEN_KEY = 'especializa-condutor.admin.token'
const USER_KEY = 'especializa-condutor.admin.user'

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch (_) {
    return null
  }
}

export const adminSession = reactive({
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: storedUser(),
})

export function setAdminSession({ token, user }) {
  adminSession.token = token
  adminSession.user = user
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function setAdminUser(user) {
  adminSession.user = user
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAdminSession() {
  adminSession.token = ''
  adminSession.user = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
