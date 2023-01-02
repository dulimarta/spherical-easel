import { getCurrentInstance } from "vue";
export function useRouter() {
  const { proxy } = getCurrentInstance()!
  return proxy.$router
}