"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageShell from "@/components/shared/page-shell";

const VIDEOS = [
    { id: "St7bTntJX-o", title: "Pig management software", description: "A tour of PigMaster: rows, pens, pigs, breeding and reports." },
    { id: "xcA1KRyjZYs", title: "Install PigMaster on your phone", description: "Add PigMaster to your home screen so it works like an app." },
];

export default function YouTubePage() {
    return (
        <PageShell title="Video tutorials" description="Short guides to get the most out of PigMaster." width="xl">
            <div className="grid gap-6 lg:grid-cols-2">
                {VIDEOS.map(video => (
                    <Card key={video.id} className="overflow-hidden bg-white/80 dark:bg-gray-800/70">
                        <div className="relative aspect-video bg-black">
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1`}
                                title={video.title}
                                loading="lazy"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute inset-0 h-full w-full border-0"
                            />
                        </div>
                        <CardHeader className="pb-2"><CardTitle className="text-base">{video.title}</CardTitle></CardHeader>
                        <CardContent className="text-sm text-gray-600 dark:text-gray-300">{video.description}</CardContent>
                    </Card>
                ))}
            </div>
        </PageShell>
    );
}
