"use client"

import { MessageCircle, MessageCircleMore } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WhatsAppButtonProps {
    phoneNumber: string
    message?: string
    className?: string
}

export function WhatsAppButton({
    phoneNumber,
    message = "Hi! I need help with...",
    className = "",
}: WhatsAppButtonProps) {
    const handleWhatsAppClick = () => {

        const cleanPhoneNumber = phoneNumber.replace(/\D/g, "")

        const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`

        window.open(whatsappUrl, "_blank")
    }

    return (
        <Button
            onClick={handleWhatsAppClick}
            className={`
        fixed bottom-6 right-6 z-50 
        h-14 w-14 rounded-full 
        bg-green-500 hover:bg-green-600 
        text-white shadow-lg hover:shadow-xl 
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        ${className}
      `}
            size="icon"
            aria-label="Contact us on WhatsApp"
        >
            <MessageCircleMore className="h-6 w-6" />
        </Button>
    )
}
