"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function YouTubePage() {

    const router = useRouter();
    const videos = [
        {
            id: "St7bTntJX-o",
            title: "Pig management software",

        },
        {
            id: "xcA1KRyjZYs",
            title: "Install Sungura Master on your Mobile device",

        },
    ]

    return (
        <div className="min-h-screen bg-background">
            <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="mb-2 mt-6 ml-4 flex items-center gap-2 rounded-full border-2 border-blue-500 dark:border-blue-400 bg-white/50 dark:bg-gray-800/50 px-4 py-2 text-blue-600 dark:text-blue-300 font-semibold shadow-sm hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 ease-in-out hover:shadow-md"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Button>
            <div className="container mx-auto px-4 py-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground gradient-to-r from-green-600 to-blue-600 mb-4">YouTube Videos Collection</h1>
                </div>

                <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto">
                    {videos.map((video, index) => (
                        <Card key={video.id} className="overflow-hidden">
                            <CardHeader>
                                <CardTitle>{video.title}</CardTitle>

                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative aspect-video">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full border-0"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
