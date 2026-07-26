"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import { Starfield } from "@/components/ui/starfield";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';

// --- KSP ASCII ART STRING ---
const KSP_ASCII_ART = `
                          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                        
                    @@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@                  
                @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@              
             @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@           
           @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@         
         @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@       
        @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@     
       @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@    
     @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#*+*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@   
     @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%**##****###**%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@  
    @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%**###%***####**%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@ 
   @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##%%%%%%%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@ 
   @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#+===%%%%%%%%%%%%%%%%%%%%%%#===*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#==+*+=%%%%%%=-=+*==-%%%%%%#=+*+=+%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@
  @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#++%%+++%%%%%+=+*-*+-#%%%%#=+#%#=*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#==#%%%#%%%%%+#+*-**+#%%%%%#%%%*=+%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%#=**===-===-==+*%%%%%%%***##*##*#%%%%%%%%=+=--===-===*+*%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%###+--==+--=-+#%%%%%%*==+++*+*+=+*%%%%%%*=---=+=---*%#%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%#==+==+++=-:+%%%%%%%%%**+*******#%%%%%%%%#=:-=+++==+=+%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%%########+=*%%%%%%%%%%%%%%@%%%%%%%%%%%%%%+=*#######%%%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%#########%%%%%%%*+***%@@@@@@@@@%***+#%%%%%%%#########%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%##########%%%%+=*%@@@@@@%##%%@@@@@@%==*%%%###########%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%%%%%%%%%######%###%#====@@@%#########*###%@@@+==+#####%#%###%%%%%%%%%%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%#*++*+*%%%####%##%####+=*%@@%##=::-+#=-.-*##%@%#+=*##%##%######%%%++*+*##%%%%%%%%%%%%@
  @%%%%%%%%%%#++=+%%#=%%%#%#########*+#%%%@@######-.=######@@%%%*+*##########%%%*+%%#==++%%%%%%%%%%%@
  @%%%%%%%%%%+====%%++%%%+=====------*%%%@@%#::::==-==.-:=#@@%%%%+------+====*%%#=#%#===+*%%%%%%%%%%@
  @%%%%%%%%%#++++#*=*%%%*=-------===-*%%%@@%-:::-==-==-:::=%@@%%%+-==--------=#%%#+=#*++++%%%%%%%%%%@
  @%%%%%%%%%#*%*==#%%%%#=------=*#*=-*%%@@%#--===--=--+=---#%@@%%=-=##+=------+%%%%%*=+##*%%%%%%%%%%@
  @%%%%%%%%%%#==#%%%%*=-----=+###%*=-+%@@@%#=-+##+=-=*##+-+#%@@%#===#%###==-----+#%%%%+=+%%%%%%%%%%%@
  @%%%%%%%%%%++%%%%+----==+*###%%%%%*==%@@%##+####=-+###**##%@@*-=#%%%%####*===---=*%%%#=*%%%%%%%%%%@
  @%%%%%%%%%%==%%%=----=*##*==--=#%%%#=*@@@%%###=-:-:-+###%%@@%+=%%%%*=--=+###+----=*%%#=*%%%%%%%%%%@
  @%%%%%%%%%%#+====----=**-----=*%%%%%*=*%@@@%####-:+###%@@@@%+=#%%%%%+=----=*=-----====+%%%%%%%%%%%@
  @%%%%%%%%%%%%%%*=----==-=+=-=#%%%%%%%%%%%%@@@%%#####%@@@@%%%%%%%%%%%%+--=+===-----=#%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%*=----*%%%*--*%%%%%%%%%%###%%@@@@@%@@@@%%%###%%%%%%%%%%=-=#%%#+----=#%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%%*=-==%%%%+-=--==+##############%%@@@%%##############===-==-#%%%#=--=#%%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%*=-+#%%%#%%%%#*#######%%####%%%##%%#%%##%%%####%%#######*%%%%%#%%%#=-=#%%%%%%%%%%%%%@
  @%%%%%%%%%%%%%+-*%%%%##%%%##########%%%%%%%%%###%%%##%%%%%%%%%###########%%###%%%%+=#%%%%%%%%%%%%%@
  @%%%%%%%%%%#%%#=%%%%############%%%%%%%#####%%%#%%%#%%%#####%%%%%%############%%%%*+%%%#%%%%%%%%%%@
  @%%%%%%%%%%##%*-=*%%%%########%%%%%###%%%#%%%%%%###%#%%%##%%%###%%%%#########%%%#*==#%##%%%%%%%%%%@
  @%%%%%%%%%%####################%%%%%%=-==+*#%%%%###%%%%#**+=-+%%%%%#####################%%%%%%%%%@@
  @%%%%%%%%%%%%%#########%#%%%%%#%#%%%+=#+**+=--+====---=***+*=-*%%%#%#%%%%##%########%%%%%%%%%%%%%@ 
   @%%%%%%%%%%%%%%%%%%%%%#%%%%%%%%#%**+======*+*++**+-=*+=======**##%%%%%%%%%%%%%%#%%%%%%%%%%%%%%%%@ 
   @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#*===*%%%#*+=-----=+*#%%%*===*#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@  
    @%%%%%%%%%%%%%%%%%%%%%%%#*+++*#%%%%%**%%%%%%%%%%%%%%%%%%%+*%%%%%#*+++*#%%%%%%%%%%%%%%%%%%%%%%%@  
     @%%%%%%%%%%%%%%%%%%%%%#%#+=-=+=--==++#%%%%%%%%%%%%%%%%%*++==-==+=--+#%#%%%%%%%%%%%%%%%%%%%%%@   
     @@%%%%%%%%%%%%%%%%%%%%%+=+##*+=---==*%%%%%%%%%%%%%%%%%%%*===--=+*##+=*%%%%%%%%%%%%%%%%%%%%%@    
       @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@     
        @%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@      
         @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@        
           @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@          
             @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@            
                @@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@              
                    @@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@                   
                          @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                        
`;

function AnimatedAsciiEmblem() {
    const [displayedText, setDisplayedText] = useState(KSP_ASCII_ART);
    const glyphs = "01#$%&@*+=~";

    useEffect(() => {
        const interval = setInterval(() => {
            const charArray = KSP_ASCII_ART.split("");
            for (let i = 0; i < 20; i++) {
                const randomIndex = Math.floor(Math.random() * charArray.length);
                if (charArray[randomIndex] !== "\n" && charArray[randomIndex] !== " ") {
                    charArray[randomIndex] = glyphs[Math.floor(Math.random() * glyphs.length)];
                }
            }
            setDisplayedText(charArray.join(""));
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center p-6 select-none">
            <div className="absolute inset-0 bg-emerald-950/20 rounded-3xl blur-3xl pointer-events-none" />
            <pre className="relative z-10 font-mono text-[8px] sm:text-[9.5px] md:text-[10.5px] lg:text-[11.5px] leading-[0.82] text-emerald-500/80 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] tracking-tighter">
                {displayedText}
            </pre>
        </div>
    );
}

interface HyperTextProps {
    text: string;
    duration?: number;
    framerProps?: Variants;
    className?: string;
    animateOnLoad?: boolean;
}

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const getRandomInt = (max: number) => Math.floor(Math.random() * max);

export function HyperText({
    text,
    duration = 800,
    framerProps = {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 3 },
    },
    className,
    animateOnLoad = true,
}: HyperTextProps) {
    const [displayText, setDisplayText] = useState(text.split(""));
    const [trigger, setTrigger] = useState(false);
    const interations = useRef(0);
    const isFirstRender = useRef(true);

    const triggerAnimation = () => {
        interations.current = 0;
        setTrigger(true);
    };

    useEffect(() => {
        const interval = setInterval(
            () => {
                if (!animateOnLoad && isFirstRender.current) {
                    clearInterval(interval);
                    isFirstRender.current = false;
                    return;
                }
                if (interations.current < text.length) {
                    setDisplayText((t) =>
                        t.map((l, i) =>
                            l === " "
                                ? l
                                : i <= interations.current
                                    ? text[i]
                                    : alphabets[getRandomInt(26)]
                        )
                    );
                    interations.current = interations.current + 0.1;
                } else {
                    setTrigger(false);
                    clearInterval(interval);
                }
            },
            duration / (text.length * 10)
        );
        return () => clearInterval(interval);
    }, [text, duration, trigger, animateOnLoad]);

    return (
        <div
            className="flex scale-100 cursor-pointer overflow-hidden py-1"
            onMouseEnter={triggerAnimation}
        >
            <AnimatePresence mode="wait">
                {displayText.map((letter, i) => (
                    <motion.span
                        key={i}
                        className={cn("font-mono", letter === " " ? "w-3" : "", className)}
                        {...framerProps}
                    >
                        {letter.toUpperCase()}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default function LoginPageContent() {
    const router = useRouter();
    const [kgid, setKgid] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/catalyst/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: kgid, password }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.detail || 'Invalid credentials or server error.');
            }

            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                router.push('/biometric');
            } else {
                throw new Error('No access token received.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-black text-white flex flex-col md:flex-row items-center justify-center overflow-hidden">
            {/* Green rotating starfield background */}
            <Starfield />

            {/* Left Half (ASCII Art) */}
            <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center p-8 bg-transparent">
                <AnimatedAsciiEmblem />
            </div>

            {/* Right Half (Logo + Form Box) */}
            <div className="relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-transparent">
                <div className="w-full max-w-md space-y-6 flex flex-col items-center">

                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-zinc-950/70 p-2 rounded-2xl border border-zinc-800/60 shadow-[0_0_25px_rgba(16,185,129,0.12)] backdrop-blur-sm">
                        <Image
                            src="/ksp-logo.png"
                            alt="KSP Emblem"
                            width={100}
                            height={100}
                            className="object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        />
                    </div>

                    <div className="flex flex-col items-center text-center -mt-1">
                        <HyperText
                            text="KSP-CHANAKYA"
                            className="text-3xl sm:text-4xl font-extrabold text-white tracking-widest"
                        />
                        <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mt-1">
                            KSP IDENTITY ACCESS MANAGEMENT
                        </p>
                    </div>

                    <div className="w-full bg-black/70 border border-white/10 p-6 sm:p-8 rounded-2xl space-y-5 backdrop-blur-md shadow-2xl">
                        <h2 className="text-xl font-semibold text-center text-white tracking-wide">
                            Secure Login
                        </h2>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-950/40 border border-red-900/50 p-3 rounded-lg flex items-start gap-2.5">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400 leading-relaxed">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                    KGID / Police Email
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your KGID or Email"
                                    value={kgid}
                                    required
                                    onChange={(e) => setKgid(e.target.value)}
                                    className="w-full bg-black/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !kgid || !password}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-4 rounded-lg transition-all font-mono text-sm tracking-wide border border-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    'Login to Terminal'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-zinc-500 font-mono pt-2">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-emerald-400 hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}