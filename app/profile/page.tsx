"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Profile lives under Settings now; keep old links working. */
export default function ProfilePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/settings?tab=profile")
  }, [router])
  return null
}
