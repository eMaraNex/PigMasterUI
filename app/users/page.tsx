"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** The team lives under Settings now; keep old links working. */
export default function UsersPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/settings?tab=team")
  }, [router])
  return null
}
