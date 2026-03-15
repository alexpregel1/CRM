import { SpinningLogo } from "@/components/spinning-logo";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-[#09090b]">
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#4684A0]/20 rounded-full blur-[80px]" />

                <div className="flex flex-col items-center gap-6 relative">
                    <SpinningLogo size="lg" />
                    <p className="text-zinc-500 uppercase text-[10px] tracking-[0.3em] font-medium animate-pulse">
                        Cargando sistema...
                    </p>
                </div>
            </div>
        </div>
    );
}
