
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- Nervous System (Audio & Haptics) ---

const useNervousSystem = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const humOscillatorRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const humFilterRef = useRef<BiquadFilterNode | null>(null);
  const humPannerRef = useRef<StereoPannerNode | null>(null);

  // Initialize Audio Context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Haptic Engine
  const triggerHaptic = useCallback((type: 'light' | 'heavy') => {
    if (!navigator.vibrate) return;
    if (type === 'light') navigator.vibrate(5);
    if (type === 'heavy') navigator.vibrate(20);
  }, []);

  // Sound Engine: Digital Chirp (Click)
  const playClick = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [initAudio]);

  // Sound Engine: Low Thud (Heavy Interaction)
  const playThud = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [initAudio]);

  // Sound Engine: Void Hum (Background Loop)
  const toggleVoidHum = useCallback((playing: boolean) => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (playing && !humOscillatorRef.current) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter(); // For spatial effects/muffling
      const panner = ctx.createStereoPanner(); // For directional audio
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime); 
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Fade in

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      
      humOscillatorRef.current = osc;
      humGainRef.current = gain;
      humFilterRef.current = filter;
      humPannerRef.current = panner;
    } else if (!playing && humOscillatorRef.current) {
      const gain = humGainRef.current;
      if (gain) {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); // Fade out
      }
      setTimeout(() => {
        humOscillatorRef.current?.stop();
        humOscillatorRef.current = null;
        humGainRef.current = null;
        humFilterRef.current = null;
        humPannerRef.current = null;
      }, 1000);
    }
  }, [initAudio]);

  // Spatial Audio: Distance/Muffling (Ritual Exit)
  const modulateEnvironment = useCallback((intensity: number) => {
      // intensity: 1.0 = normal, 0.0 = muffled/distant
      const ctx = audioContextRef.current;
      const filter = humFilterRef.current;
      const gain = humGainRef.current;
      
      if (ctx && filter && gain) {
          const now = ctx.currentTime;
          // Muffle sound (Low Pass) - reduce cutoff freq as intensity drops
          const freq = 100 + (1900 * intensity); 
          filter.frequency.setTargetAtTime(freq, now, 0.1);
          
          // Drop volume slightly to simulate distance
          const vol = 0.005 + (0.045 * intensity);
          gain.gain.setTargetAtTime(vol, now, 0.1);
      }
  }, []);

  // Spatial Audio: Directional Panning
  const setSpatialPosition = useCallback((x: number) => {
    // x should be normalized between -1 (left) and 1 (right)
    const ctx = audioContextRef.current;
    const panner = humPannerRef.current;
    if (ctx && panner) {
       panner.pan.setTargetAtTime(x, ctx.currentTime, 0.1);
    }
  }, []);

  const playWhoosh = useCallback(() => {
     initAudio();
     const ctx = audioContextRef.current;
     if (!ctx) return;
     const bufferSize = ctx.sampleRate * 0.5;
     const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
     }
     const noise = ctx.createBufferSource();
     noise.buffer = buffer;
     const gain = ctx.createGain();
     const filter = ctx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.frequency.setValueAtTime(200, ctx.currentTime);
     filter.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.3);

     gain.gain.setValueAtTime(0.05, ctx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

     noise.connect(filter);
     filter.connect(gain);
     gain.connect(ctx.destination);
     noise.start();
  }, [initAudio]);

  const playMemoryUnlock = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const freqs = [261.63, 329.63, 392.00, 493.88, 523.25]; 
    const now = ctx.currentTime;

    freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0 + (i * 0.5));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 4.0);
    });
  }, [initAudio]);

  return { triggerHaptic, playClick, playThud, toggleVoidHum, playWhoosh, playMemoryUnlock, modulateEnvironment, setSpatialPosition };
};

// --- Data ---

interface RealityItem {
  id: string;
  title: string;
  subtitle: string;
  bgImage: string;
  themeColor: string;
  particleColor: string;
  particleShape: 'circle' | 'square' | 'diamond' | 'star';
  description: string;
  atmosphereType: 'smoke' | 'stars' | 'glitch' | 'light_shafts' | 'void';
}

const realities: RealityItem[] = [
  { 
    id: 'dragon', 
    title: "Dragon's Den", 
    subtitle: "Ancient Era",
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDso3MbbToJS5hclxf-6uzpc2MLOvsZBRBnKnnDCO6BVmKcF35rN_9vlw34B6cbAkurqDKrNMEhUEPFL0O8HMvcrybAg57NGHSbGG0RE47G6gnTcFizjZ1ie-WMW-_KrRcL2QksaU3pSWD7kflP1TdvN9yL9jio_e4sYfPQHKdG7xe3rDNQ2kBvip2xATno1SoUoYmRR_qyrQAZw6yZ5axF9X4jLikyWEPtT_zOR4zUMteNCOSpbUxnTQal89O0JcH8TcoDX_94N8Y3',
    themeColor: '#FF4E00',
    particleColor: '#FFD700', 
    particleShape: 'diamond',
    description: "A realm of fire and scales where ancient beasts guard treasures beyond imagination.",
    atmosphereType: 'smoke'
  },
  { 
    id: 'cosmic', 
    title: "Cosmic Voyage", 
    subtitle: "Future Echo",
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7yCfvOKUjs1tELcFEmvvOquG-UVzM71K2avNZxWQpc3ZqX39BSiYLz-PCDvTS1-XrFGXyL_ZJzjpC2fqi2f8nrXdojj81JUcNMFr9GBvIVFQIYq7cMQajOntdGASxVO_2qWEc81aGChhU3PsfPwIfYiJo0D1J3mykyuTF5b_2gm5wT6m0tRWNYMSPjgWetEwrHyxKkp0Io_wKe7IV413Ck2pAkNWj3R4ZxYoyxgGGmI39F8JgqYXmlvcwtk7W2JWEYSES95_BYCs6',
    themeColor: '#0070F3',
    particleColor: '#50E3C2', 
    particleShape: 'star',
    description: "Drifting through the stardust of a thousand dead suns, silence is your only companion.",
    atmosphereType: 'stars'
  },
  { 
    id: 'neon', 
    title: "Cyber City", 
    subtitle: "Digital Dream",
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Id3GFAYel2iaVZrVODrSxHDW2qYlaMPyAS226hWpQWLOHZiNE7kDPswd2FSE7WeXYSeQ3LsbL84PeQ4n-uMiWXqslNRYLmor-yC_Mo5iGS5yckRimbcUIwJCswEs50kEK971X737BrMTlficXDbSIwi99tcBbiZhebtKmo6CbdnFhQ2BU7HJk8jv_cMBCSLF1kgIXpcTJxLwgvwaV4SyeZ2nzEwFJad-cy_kuHJ7lCl92r1qKCVKwtqYaZ-OwrPkF4sp3IpPQkM_',
    themeColor: '#BD00FF',
    particleColor: '#FF00FF', 
    particleShape: 'square',
    description: "Neon lights reflect on wet pavement as the pulse of the city synchronizes with your heartbeat.",
    atmosphereType: 'glitch'
  },
  { 
    id: 'forest', 
    title: "Spirit Woods", 
    subtitle: "Nature's Whisper",
    bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWzf34Ia_sZeP_wAcehk5OtoRrwRg0w569_BrZMa9Xh4-DvvtCPsNAS-oLpPGZHiM-xgMtoQWatsS49NVqMRqrJ3bKyIfdjmKeH86mCW7dGpbWkgwQMe2RO9VZ1WLhos1d-CoABhbSC45Bkyp6JxUT1NevSllX78WwrWZcrdWh0gLItEZdC4-dAUaLKcAXdumjvvgNW2fdACggf7TAGCG2ZaYOp5fTNyLL1vhpuEZJaAXRsp7GLa_NWRqP9ullccc2QLPxQrNlOGSQ',
    themeColor: '#4ADE80',
    particleColor: '#10B981', 
    particleShape: 'circle',
    description: "Ancient trees guard secrets whispered by the wind, waiting for a soul quiet enough to listen.",
    atmosphereType: 'light_shafts'
  },
];

const systemModes = [
  { index: 0, id: 'gateway', label: 'PORTAL', icon: 'auto_awesome_mosaic', color: '#50E3C2' },
  { index: 1, id: 'scanner', label: 'SCANNER', icon: 'remove_red_eye', color: '#FF4E00' },
  { index: 2, id: 'vault', label: 'VAULT', icon: 'memory', color: '#BD00FF' },
];

// --- Systems (Logic) ---

const useCorruption = (isActive: boolean) => {
  const [corruption, setCorruption] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCorruption(0);
      return;
    }
    const interval = setInterval(() => {
      setCorruption(prev => {
        if (prev >= 1) return 1;
        return prev + 0.005;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isActive]);

  return corruption;
};

// --- Sub-Components ---

const TakingOverParticles = ({ corruption, color, speed = 'normal', shape = 'circle' }: { corruption: number; color: string; speed?: 'fast' | 'normal' | 'slow'; shape?: 'circle' | 'square' | 'diamond' | 'star' }) => {
  const particleCount = 40;
  const particles = useMemo(() => Array.from({ length: particleCount }), []);
  
  const getDurationMultiplier = () => {
      if (speed === 'fast') return 0.2;
      if (speed === 'slow') return 3.0;
      return 1.0;
  };
  const mult = getDurationMultiplier();

  // Theme-specific shape styles
  const getShapeStyle = (s: string) => {
    switch(s) {
        case 'square': return { borderRadius: '0' };
        case 'diamond': return { borderRadius: '0', transform: 'rotate(45deg)' };
        case 'star': return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', borderRadius: '0' };
        default: return { borderRadius: '50%' };
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden mix-blend-screen">
      {particles.map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 50;
        const duration = (2 + Math.random() * 3) * mult;
        const delay = Math.random() * 2;
        const shapeStyle = getShapeStyle(shape);
        const windX = Math.sin(Date.now() / 1000 + i) * 20;

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              ...shapeStyle,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
              // @ts-ignore
              '--tx': `${Math.cos(angle) * distance + windX}vw`,
              '--ty': `${Math.sin(angle) * distance}vh`,
              animation: `float-out ${duration}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
              animationDelay: `${delay}s`,
              opacity: 0,
              transform: `translate(0, 0)`
            }}
          />
        );
      })}
    </div>
  );
};

// Magical Portal Particles
const PortalHoverParticles = ({ realityId, color, isHovered }: { realityId: string; color: string; isHovered: boolean }) => {
  const particles = useMemo(() => Array.from({ length: 60 }), []); 
  
  return (
    <div className={`pointer-events-none absolute inset-0 z-50 overflow-visible transition-opacity duration-1000 ${isHovered ? 'opacity-100' : 'opacity-40'}`}>
      {particles.map((_, i) => {
        let animationStyle = '';
        let size = 0;
        
        // Leaking Atmosphere Logic
        if (realityId === 'dragon') {
            size = 2 + Math.random() * 3;
            const tx = (Math.random() - 0.5) * 40; 
            const ty = -60 - Math.random() * 80; // Vertical rise mostly
            // @ts-ignore
            animationStyle = `spark-rise ${4 + Math.random() * 3}s ease-out infinite`; 
             // @ts-ignore
             document.documentElement.style.setProperty(`--leak-tx-${i}`, `${tx}px`);
             // @ts-ignore
             document.documentElement.style.setProperty(`--leak-ty-${i}`, `${ty}px`);
        } else if (realityId === 'cosmic') {
            size = 1 + Math.random() * 2;
            const tx = (Math.random() - 0.5) * 150; 
            const ty = (Math.random() - 0.5) * 150;
            // @ts-ignore
            animationStyle = `atmosphere-leak ${8 + Math.random() * 4}s linear infinite`;
             // @ts-ignore
             document.documentElement.style.setProperty(`--leak-tx-${i}`, `${tx}px`);
             // @ts-ignore
             document.documentElement.style.setProperty(`--leak-ty-${i}`, `${ty}px`);
        } else {
             // Magical Portal Flow (default/general)
             size = 2 + Math.random() * 4;
             const angle = Math.random() * Math.PI * 2;
             const dist = 50 + Math.random() * 100;
             const tx = Math.cos(angle) * dist;
             const ty = Math.sin(angle) * dist;
             // @ts-ignore
             document.documentElement.style.setProperty(`--magic-tx-${i}`, `${tx}px`);
             // @ts-ignore
             document.documentElement.style.setProperty(`--magic-ty-${i}`, `${ty}px`);
             // @ts-ignore
             animationStyle = `magical-flow ${2 + Math.random() * 2}s ease-out infinite`;
        }

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full mix-blend-screen blur-[2px]"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: realityId === 'dragon' ? (Math.random() > 0.7 ? '#FFD700' : color) : color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              // @ts-ignore
              '--tx': realityId === 'dragon' || realityId === 'cosmic' ? `var(--leak-tx-${i})` : `var(--magic-tx-${i})`,
              // @ts-ignore
              '--ty': realityId === 'dragon' || realityId === 'cosmic' ? `var(--leak-ty-${i})` : `var(--magic-ty-${i})`,
              animation: animationStyle,
              animationDelay: `${Math.random()}s`,
              opacity: 0
            }}
          />
        );
      })}
    </div>
  );
};


const DynamicAtmosphere = ({ atmosphereType, color }: { atmosphereType: string; color: string }) => {
  const stars = useMemo(() => Array.from({ length: 50 }), []);
  
  if (atmosphereType === 'smoke') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute -bottom-1/2 left-[-20%] w-[140%] h-[100%] rounded-[100%] blur-[80px] opacity-[0.15] mix-blend-screen animate-smoke-drift"
            style={{
              background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
              animationDelay: `${i * -7}s`,
              animationDuration: `${20 + i * 5}s`,
              transformOrigin: 'center bottom'
            }}
          />
        ))}
      </div>
    );
  }

  if (atmosphereType === 'stars') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 
            }}
          />
        ))}
      </div>
    );
  }

  if (atmosphereType === 'glitch') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-cyan-900/10 animate-neon-pulse opacity-50" />
         {[...Array(6)].map((_, i) => (
            <div key={i} 
                 className="absolute bg-cyan-400/20 w-full h-[1px] animate-glitch-bar mix-blend-overlay"
                 style={{ 
                   top: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 3}s`,
                   animationDuration: `${0.1 + Math.random() * 0.3}s`
                 }}
            />
         ))}
         <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent animate-pulse-slow" />
      </div>
    );
  }

  if (atmosphereType === 'light_shafts') {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {[...Array(3)].map((_, i) => (
                <div key={i}
                     className="absolute -top-20 w-[300px] h-[150%] bg-gradient-to-b from-emerald-100/5 to-transparent blur-[100px] transform rotate-[25deg] animate-light-shaft mix-blend-overlay"
                     style={{
                         left: `${10 + i * 35}%`,
                         animationDelay: `${i * 1.5}s`,
                         transformOrigin: 'top center'
                     }}
                />
            ))}
             {[...Array(12)].map((_, i) => (
                <div key={i}
                     className="absolute w-1 h-1 bg-yellow-200 rounded-full blur-[1px] animate-firefly-burst"
                     style={{
                         left: `${Math.random() * 100}%`,
                         top: `${Math.random() * 100}%`,
                         animationDelay: `${Math.random() * 8}s`,
                         animationDuration: `${6 + Math.random() * 6}s`
                     }}
                />
            ))}
        </div>
    )
  }

  return (
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
         <div className="absolute inset-0 animate-pulse-slow" style={{ background: `radial-gradient(circle at center, ${color}10 0%, transparent 50%)` }} />
      </div>
  );
};

const ScannerDimension = ({ active, isScanning }: { active: boolean; isScanning: boolean }) => {
  return (
    <div className={`fixed inset-0 z-40 flex flex-col bg-black transition-all duration-500 ease-in-out ${active ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md pointer-events-none'}`}>
       {/* Camera Feed - Raw World */}
       <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518544806308-c8f325cc77cc?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" 
            style={{ filter: 'contrast(1.1) saturate(1.1)' }}></div>
            
       {/* Minimalist Viewfinder UI */}
       <div className="absolute inset-0 z-10">
          {/* Center Reticle - Pure Focus */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <div className={`relative w-24 h-24 transition-all duration-300 ${isScanning ? 'scale-90' : 'scale-100'}`}>
                {/* Central Focus Ring */}
                <div className={`absolute inset-0 rounded-full border border-white/40 ${isScanning ? 'border-red-400 animate-pulse border-2' : 'border-white/20'}`}></div>
                
                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/80 rounded-full shadow-[0_0_5px_white]"></div>
             </div>
          </div>
       </div>
    </div>
  );
}

const VaultDimension = ({ active, onSelectReality }: { active: boolean; onSelectReality: (id: string) => void }) => {
  const nervous = useNervousSystem();
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const newOpacity = Math.max(0, 1 - scrollTop / 200);
    setHeaderOpacity(newOpacity);
  };
  
  const vaultItems = useMemo(() => {
      const baseItems = [
        ...realities,
        ...realities.map(r => ({ ...r, id: `${r.id}-dup` })), 
        ...realities.map(r => ({ ...r, id: `${r.id}-dup2` })),
        ...realities.map(r => ({ ...r, id: `${r.id}-dup3` })),
        { ...realities[0], id: 'locked-1', title: 'Locked Memory', subtitle: 'Encrypted' },
        { ...realities[1], id: 'locked-2', title: 'Locked Memory', subtitle: 'Encrypted' },
        { ...realities[2], id: 'locked-3', title: 'Locked Memory', subtitle: 'Encrypted' }
      ];
      
      // DNA Double Helix Layout
      return baseItems.map((item, i) => {
        const strand = i % 2 === 0 ? 'A' : 'B'; // Alternate strands
        const verticalSpacing = 110; // Spacing
        const amplitude = 90; // Width of the helix
        const frequency = 0.4; // Speed of twist
        
        // Phase shift: Strand B is 180 degrees (PI) offset from Strand A
        const phaseOffset = strand === 'A' ? 0 : Math.PI;
        const angle = (i * frequency) + phaseOffset;
        
        // X Position: Sine wave
        const xOffset = Math.sin(angle) * amplitude;
        
        // Z Depth (Scale/Opacity/Index): Cosine wave (90 deg offset from Sine)
        // Items 'in front' are larger/brighter
        const depth = Math.cos(angle);
        const zScale = 0.6 + ((depth + 1) / 2) * 0.5; // Scale range 0.6 to 1.1
        const zIndex = Math.floor(zScale * 100);
        const opacity = 0.4 + ((depth + 1) / 2) * 0.6; // Opacity range 0.4 to 1.0

        return {
          ...item,
          left: 50 + xOffset, // Percentage centered at 50
          top: 150 + i * verticalSpacing,
          scale: zScale,
          zIndex: zIndex,
          opacity: opacity,
          rotation: Math.sin(angle) * 10, // Subtle tilt following the curve
          delay: i * 0.05,
          strand: strand
        };
      });
  }, []);
  
  return (
    <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`fixed inset-0 z-40 overflow-y-auto no-scrollbar transition-all duration-700 cubic-bezier(0.25, 1, 0.5, 1) ${active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
       <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80 pointer-events-none"></div>

       <div 
            className="fixed top-0 left-0 right-0 z-50 text-center pt-[calc(3rem+env(safe-area-inset-top))] pb-12 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none transition-opacity duration-300"
            style={{ opacity: headerOpacity }}
        >
          <h1 className="font-cinzel text-3xl text-white drop-shadow-[0_0_25px_rgba(189,0,255,0.6)] tracking-[0.2em]">MEMORY HELIX</h1>
       </div>

       <div className="relative min-h-[400vh] w-full px-4 pt-[calc(10rem+env(safe-area-inset-top))] pb-[calc(12rem+env(safe-area-inset-bottom))]">
           <div className="relative w-full mx-auto max-w-lg perspective-1000" style={{ height: `${vaultItems.length * 110 + 200}px` }}>
              {/* DNA Central Axis - Optional, adds structure */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent -translate-x-1/2 blur-[2px]"></div>

              {vaultItems.map((item, i) => {
                 const isLocked = item.id.startsWith('locked');
                 return (
                   <React.Fragment key={i}>
                       <div 
                          className="absolute w-40 aspect-square group cursor-pointer animate-float-slow filter drop-shadow-2xl transition-all duration-700 hover:scale-110 hover:z-[200] hover:brightness-125"
                          style={{ 
                              left: `calc(${item.left}% - 5rem)`, // Center the 10rem (w-40) item
                              top: `${item.top}px`,
                              transform: `scale(${item.scale}) rotate(${item.rotation}deg)`,
                              zIndex: item.zIndex,
                              opacity: item.opacity,
                              animationDelay: `${item.delay}s` 
                          }}
                          onMouseEnter={() => nervous.triggerHaptic('light')}
                          onClick={() => {
                            if (isLocked) {
                              nervous.playThud();
                            } else {
                              nervous.playMemoryUnlock();
                              onSelectReality(item.id.replace(/-dup\d?$/, '')); 
                            }
                          }}
                       >
                          <div 
                            className={`absolute inset-0 backdrop-blur-md border transition-all duration-700 bg-cover bg-center rounded-full
                              ${isLocked 
                                ? 'bg-white/5 border-white/5 grayscale opacity-30 shadow-none' 
                                : 'bg-white/5 border-white/20 hover:border-white/60 shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]'}`}
                            style={{ 
                              backgroundImage: isLocked ? 'none' : `url(${item.bgImage})`,
                              // Diamond/Crystal shape or Organic Orb
                              borderRadius: isLocked ? '50%' : '40% 60% 50% 50% / 50% 50% 60% 40%', 
                            }}
                          >
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/60 pointer-events-none rounded-[inherit]"></div>
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                                {isLocked ? (
                                   <div className="flex flex-col items-center justify-center h-full">
                                      <span className="material-symbols-outlined text-3xl text-white/10 mb-2">lock</span>
                                   </div>
                                ) : (
                                   <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform scale-90 group-hover:scale-100">
                                      <span className="font-rajdhani text-[9px] font-bold text-white/90 tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-md shadow-lg">{item.title}</span>
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                   </React.Fragment>
                 );
              })}
           </div>
       </div>
    </div>
  );
}

const CinematicCard = ({ 
  reality, 
  corruption,
  onWarp,
}: { 
  reality: RealityItem; 
  corruption: number;
  onWarp: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const nervous = useNervousSystem();
  
  const updateTilt = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const card = currentTarget.getBoundingClientRect();
    const x = (clientX - card.left - card.width / 2) / 20;
    const y = (clientY - card.top - card.height / 2) / 20;
    setTilt({ x, y });
    setIsHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateTilt(e.clientX, e.clientY, e.currentTarget as HTMLElement);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      updateTilt(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget as HTMLElement);
    }
  };

  const handleReset = () => {
      setIsHovered(false);
      setTilt({ x: 0, y: 0 }); 
  };

  return (
    <div className="relative flex items-center justify-center perspective-1000">
      <div 
        className="relative w-[75vw] max-w-[360px] cursor-pointer group touch-action-none transition-transform duration-200 ease-out"
        onClick={() => { onWarp(); nervous.playThud(); nervous.triggerHaptic('heavy'); }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleReset}
        onTouchStart={() => { setIsHovered(true); nervous.triggerHaptic('light'); }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleReset}
        style={{ 
            transform: `
                rotateX(${-tilt.y}deg) 
                rotateY(${tilt.x}deg) 
                rotate(${corruption * 2}deg)
                scale(${isHovered ? 1.05 : 1})
            `,
            transformStyle: 'preserve-3d'
        }}
      >
        <div className="animate-portal-drift">
            <div 
              className="absolute inset-[-60px] -z-20 rounded-[40%] blur-[60px] animate-portal-pulse-glow transition-colors duration-700"
              style={{ backgroundColor: reality.themeColor }}
            ></div>

            {/* Liquid Energy Shell Layers - Hyper-Reality Upgrade */}
            <div 
              className="absolute -inset-[40px] z-0 animate-liquid-border transition-all duration-700 opacity-60 mix-blend-color-dodge blur-xl"
              style={{
                 background: `conic-gradient(from 0deg, ${reality.themeColor}, transparent, ${reality.particleColor}, transparent, ${reality.themeColor})`,
                 animationDuration: '10s'
              }}
            />
            <div 
              className="absolute -inset-[20px] z-0 animate-liquid-border transition-all duration-500 opacity-80 mix-blend-screen blur-md"
              style={{
                 background: `radial-gradient(circle at 50% 0%, ${reality.particleColor}, transparent 70%)`,
                 animationDuration: '7s',
                 animationDirection: 'reverse'
              }}
            />
             <div 
              className="absolute -inset-[5px] z-0 animate-liquid-border transition-all duration-300 opacity-100 mix-blend-overlay blur-[2px]"
              style={{
                 border: `2px solid ${reality.themeColor}`,
                 boxShadow: `0 0 20px ${reality.themeColor}, inset 0 0 20px ${reality.themeColor}`,
                 animationDuration: '5s'
              }}
            />

            {/* Main Portal Window - CINEMATIC FLUID VORTEX */}
            <div className="relative z-10 aspect-[4/5] w-full overflow-hidden border-t border-l border-white/20 bg-black/95 backdrop-blur-xl shadow-2xl transition-all duration-500 animate-liquid-border"
                 style={{
                   boxShadow: `0 30px 100px -20px ${reality.themeColor}80, 0 0 40px ${reality.themeColor}40`,
                   borderColor: `rgba(255,255,255,${0.2 + corruption * 0.5})`,
                   transform: 'translateZ(20px)'
                 }}
            >
              <div className="absolute inset-0 z-40 pointer-events-none rounded-[inherit] overflow-hidden">
                   {/* Vignette */}
                   <div className="absolute inset-0 bg-radial-gradient-to-transparent from-transparent via-black/20 to-black/80 opacity-60"></div>
              </div>

              <div className="absolute inset-0 animate-portal-pulse origin-center">
                  {/* INFINITE VORTEX SHADER - Rick and Morty Fluid Style */}
                  <div className="absolute inset-[-100%] flex items-center justify-center overflow-hidden">
                      
                      {/* Deep Space Background */}
                      <div 
                        className="absolute inset-0 bg-black"
                         style={{ 
                          backgroundImage: `url("${reality.bgImage}")`,
                          backgroundSize: 'cover',
                          opacity: 0.2,
                          filter: 'blur(30px)'
                        }}
                      />

                      {/* Layer 1: Chaotic Liquid Swirl (Outer) */}
                      <div 
                         className="absolute w-[220%] h-[220%] rounded-full animate-spin-slow blur-xl opacity-80"
                         style={{ 
                             background: `conic-gradient(from 0deg, ${reality.themeColor} 0%, transparent 20%, ${reality.themeColor} 40%, transparent 60%, ${reality.themeColor} 80%, transparent 100%)`,
                             mixBlendMode: 'hard-light',
                             animationDuration: '20s',
                             filter: 'blur(40px)'
                         }}
                      />

                      {/* Layer 2: Fast Fluid Energy (Middle) */}
                      <div 
                         className="absolute w-[160%] h-[160%] rounded-full animate-liquid-swirl opacity-90"
                         style={{ 
                             background: `conic-gradient(from 180deg, ${reality.particleColor} 0%, transparent 15%, ${reality.particleColor} 30%, transparent 45%, ${reality.particleColor} 60%, transparent 100%)`,
                             mixBlendMode: 'screen',
                             animationDuration: '8s',
                             filter: 'blur(20px)'
                         }}
                      />
                      
                      {/* Layer 3: Tunnel Perspective (The "Depth") */}
                      <div 
                         className="absolute w-[120%] h-[120%] rounded-full opacity-80 animate-warp-spin"
                         style={{
                             background: `radial-gradient(circle, transparent 25%, ${reality.themeColor} 60%, black 90%)`,
                             transform: `translateX(${tilt.x * -5}px) translateY(${tilt.y * -5}px) scale(1.2)`,
                             mixBlendMode: 'multiply'
                         }}
                      />
                      
                      {/* Distortion Layer - Heat Haze/Fluidity */}
                      <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none">
                         <filter id="noise">
                             <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
                             <feDisplacementMap in="SourceGraphic" scale="20" />
                         </filter>
                         <rect width="100%" height="100%" filter="url(#noise)" />
                      </svg>

                      {/* Unstable Singularity - Morphing Core */}
                      <div className="absolute w-[15%] h-[15%] z-20">
                          <div className="absolute inset-0 bg-white rounded-full blur-xl animate-singularity opacity-90" />
                          <div className="absolute inset-[-50%] bg-white/40 rounded-full blur-2xl animate-pulse" />
                      </div>
                  </div>
              </div>
              
              <PortalHoverParticles realityId={reality.id} color={reality.particleColor} isHovered={true} />
            </div>
        </div>

      </div>
    </div>
  );
};

const OrbitalHud = ({ 
  currentMode, 
  onSwitchMode,
  onCapture,
  isScanning
}: { 
  currentMode: number; 
  onSwitchMode: (index: number) => void;
  onCapture: () => void;
  isScanning: boolean;
}) => {
  const nervous = useNervousSystem();
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const handleClick = (index: number) => {
      setClickedIndex(index);
      nervous.playClick();
      nervous.triggerHaptic('heavy');
      setTimeout(() => setClickedIndex(null), 300); 

      // If clicking Scanner while already in Scanner mode -> CAPTURE
      if (currentMode === 1 && index === 1) {
          onCapture();
      } else {
          onSwitchMode(index);
      }
  };

  return (
    <div className="w-full flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-end justify-center gap-8">
        {systemModes.map((mode) => {
          const isSelected = currentMode === mode.index;
          const isBursting = clickedIndex === mode.index;
          const yOffset = (mode.index === 0 || mode.index === 2) ? -20 : 0;
          
          // Transform Scanner button if active
          const isScannerActive = isSelected && mode.id === 'scanner';
          const buttonIcon = isScannerActive ? (isScanning ? 'hourglass_empty' : 'radio_button_checked') : mode.icon;

          return (
            <button
              key={mode.id}
              onClick={() => handleClick(mode.index)}
              onMouseEnter={() => { nervous.triggerHaptic('light'); }}
              className={`group relative flex flex-col items-center outline-none transition-all duration-500 ease-out`}
              style={{ transform: `translateY(${yOffset}px) scale(${isSelected ? 1.1 : 0.9})` }}
            >
              <div className="relative flex items-center justify-center overflow-visible">
                {isBursting && (
                    <div className="absolute inset-0 rounded-full bg-white/50 animate-ping"></div>
                )}
                
                {/* Active State - Cohesive Lens */}
                <div 
                  className={`relative z-10 size-14 rounded-full flex items-center justify-center transition-all duration-300
                    ${isSelected 
                      ? 'bg-white/10 text-white backdrop-blur-md border-[2px] border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                      : 'bg-black/40 border border-white/10 text-white/30 backdrop-blur-md hover:border-white/40 hover:text-white/60 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    }
                    ${isScannerActive && isScanning ? 'border-red-500 bg-red-500/20 shadow-[0_0_20px_red]' : ''}
                  `}
                >
                   <span className={`material-symbols-outlined text-2xl ${isScannerActive ? 'scale-125' : ''}`}>{buttonIcon}</span>
                   {isSelected && <div className="absolute inset-2 rounded-full border border-white/20"></div>}
                </div>
                
                {isSelected && mode.id === 'scanner' && (
                   <div className="absolute -top-3 -right-3 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[6px] font-rajdhani text-emerald-300 tracking-widest backdrop-blur-md animate-fade-in-slow shadow-lg">
                     {isScanning ? 'REC' : 'RDY'}
                   </div>
                )}
              </div>
              
               <div className={`mt-4 font-rajdhani text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isSelected ? 'opacity-100 text-white translate-y-0 text-shadow-glow' : 'opacity-0 text-white/40 -translate-y-2'}`}>
                  {mode.label}
               </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ImmersivePlayer = ({ reality, onExit }: { reality: RealityItem; onExit: () => void }) => {
  const [stage, setStage] = useState<'materializing' | 'active'>('materializing');
  const [exitProgress, setExitProgress] = useState(0);
  const pressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nervous = useNervousSystem();

  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
       elem.requestFullscreen().catch(err => console.log(err));
    }
    const timer = setTimeout(() => {
        setStage('active');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleInteraction = useCallback((clientX: number) => {
      const width = window.innerWidth;
      // normalize 0..width to -1..1
      const norm = (clientX / width) * 2 - 1;
      nervous.setSpatialPosition(norm);
  }, [nervous]);

  const handleMouseMove = (e: React.MouseEvent) => handleInteraction(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length > 0) handleInteraction(e.touches[0].clientX);
  };

  // Ritual Exit Logic with Audio Modulation
  const startExit = () => {
    pressTimer.current = setInterval(() => {
        setExitProgress(prev => {
            const next = prev + 2;
            // Modulate Audio: As progress increases, intensity decreases (muffles sound)
            nervous.modulateEnvironment(1 - (next / 100));
            
            if (next >= 100) {
                clearInterval(pressTimer.current!);
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                nervous.modulateEnvironment(1); // Reset
                onExit();
                return 100;
            }
            return next;
        });
    }, 20);
  };

  const cancelExit = () => {
      if (pressTimer.current) clearInterval(pressTimer.current);
      setExitProgress(0);
      nervous.modulateEnvironment(1); // Reset
  };

  return (
    <div 
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-display text-white z-[100]"
      onMouseDown={startExit} onMouseUp={cancelExit} onMouseLeave={cancelExit}
      onTouchStart={startExit} onTouchEnd={cancelExit}
      onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}
    >
       <div className={`absolute inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-1000 ${stage === 'active' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           <div className="flex flex-col items-center">
               <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden mb-4">
                   <div className="h-full bg-white animate-[width_3s_ease-out_forwards]" style={{ width: '0%' }}></div>
               </div>
               <span className="font-rajdhani text-xs tracking-[0.5em] text-white/50 animate-pulse">MATERIALIZING...</span>
           </div>
       </div>

       <div 
         className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-[20s] ease-linear hover:scale-110" 
         style={{ backgroundImage: `url("${reality.bgImage}")`, animation: 'pan-video 30s infinite alternate' }} 
       />
       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
       <div className="bg-noise absolute inset-0 mix-blend-overlay opacity-30"></div>
       
       <TakingOverParticles 
          corruption={0.8} 
          color={reality.particleColor} 
          speed={reality.id === 'dragon' ? 'fast' : (reality.id === 'cosmic' ? 'slow' : 'normal')}
          shape={reality.particleShape}
       />

       <div className={`relative z-10 flex flex-col items-center text-center p-8 transition-opacity duration-1000 ${stage === 'active' ? 'opacity-100' : 'opacity-0'}`}>
          <p className="font-rajdhani text-xs md:text-sm font-bold tracking-[0.5em] text-white/60 uppercase animate-slide-up-fade text-shadow-glow">{reality.subtitle}</p>
          <h1 className="font-cinzel mt-4 text-4xl md:text-8xl font-bold text-white tracking-tighter drop-shadow-2xl animate-scale-up-fade text-shadow-glow leading-tight">{reality.title}</h1>
          <p className="font-rajdhani mt-6 max-w-md text-sm md:text-lg text-white/80 font-medium leading-relaxed animate-fade-in-delay drop-shadow-md">{reality.description}</p>
       </div>

       <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-100"
          style={{ 
              background: 'radial-gradient(circle, transparent 20%, black 150%)',
              opacity: exitProgress / 100 
          }}
       />
       
       {exitProgress > 0 && (
           <div className="absolute bottom-20 flex flex-col items-center pointer-events-none">
               <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                   <div className="w-16 h-16 rounded-full border-2 border-white transition-all duration-75" style={{ transform: `scale(${exitProgress/100})` }}></div>
               </div>
               <span className="mt-4 font-rajdhani text-xs tracking-widest text-white/70">HOLD TO WAKE</span>
           </div>
       )}
    </div>
  );
};

const CinematicIntro = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const s1 = setTimeout(() => setStep(1), 500); 
        const s2 = setTimeout(() => setStep(2), 1500);
        const s3 = setTimeout(() => setStep(3), 2800);
        const s4 = setTimeout(() => {
            setStep(4);
            onComplete();
        }, 2900);

        return () => { clearTimeout(s1); clearTimeout(s2); clearTimeout(s3); clearTimeout(s4); clearTimeout(s1); clearTimeout(s2); clearTimeout(s3); clearTimeout(s4); };
    }, [onComplete]);

    if (step === 4) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-1000 ${step === 3 ? 'opacity-0' : 'opacity-100'}`}>
            {step === 3 && <div className="absolute inset-0 bg-white animate-[fadeOut_0.1s_ease-out_forwards]"></div>}
            {step >= 1 && (
                <div className="relative flex flex-col items-center">
                    <div className={`h-[2px] bg-cyan-400 shadow-[0_0_20px_cyan] transition-all duration-700 ease-out ${step >= 2 ? 'w-0 opacity-0' : 'w-64 opacity-100'}`}></div>
                    <div className={`transition-all duration-500 transform ${step === 2 ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`}>
                         <span className="material-symbols-outlined text-6xl text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">auto_awesome_mosaic</span>
                    </div>
                </div>
            )}
        </div>
    );
}

const PortalScreen = () => {
  const [activeDimension, setActiveDimension] = useState(0); 
  const [selectedRealityId, setSelectedRealityId] = useState('dragon');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [warpPhase, setWarpPhase] = useState<'idle' | 'accelerating' | 'warped'>('idle');
  const [introComplete, setIntroComplete] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const nervous = useNervousSystem();

  useEffect(() => {
    const handleInteract = () => {
        nervous.toggleVoidHum(true);
        window.removeEventListener('click', handleInteract);
    };
    window.addEventListener('click', handleInteract);
    return () => nervous.toggleVoidHum(false);
  }, [nervous]);

  useEffect(() => {
      const hash = window.location.hash;
      if (hash.includes('open')) {
          const params = new URLSearchParams(hash.split('?')[1]);
          const id = params.get('id');
          if (id) {
              const matchedReality = realities.find(r => r.id === id);
              if (matchedReality) {
                 setIsProcessingFile(true); 
                 nervous.playThud();
                 setTimeout(() => {
                    setSelectedRealityId(matchedReality.id);
                    setIntroComplete(true);
                    setWarpPhase('warped');
                    setIsProcessingFile(false);
                 }, 1500);
              }
          }
      }
  }, [nervous]);

  const corruption = useCorruption(!isTransitioning && warpPhase === 'idle' && activeDimension === 0);
  const currentReality = useMemo(() => realities.find(r => r.id === selectedRealityId) || realities[0], [selectedRealityId]);

  const handleSwitchMode = (index: number) => {
    if (index === activeDimension) return;
    setIsTransitioning(true);
    nervous.playWhoosh();
    setTimeout(() => {
      setActiveDimension(index);
      setIsTransitioning(false);
    }, 500);
  };
  
  const handleCapture = () => {
      if (isScanning) return;
      setIsScanning(true);
      nervous.playThud();
      nervous.triggerHaptic('heavy');
      setTimeout(() => {
          setIsScanning(false);
          nervous.playClick();
      }, 2000);
  };

  const handleWarp = () => {
    if (warpPhase !== 'idle') return;
    nervous.playClick();
    nervous.triggerHaptic('heavy');
    setWarpPhase('accelerating');
    setTimeout(() => {
      setWarpPhase('warped');
    }, 1000);
  };
  
  const handleSelectReality = (id: string) => {
      setSelectedRealityId(id);
      handleSwitchMode(0); 
  };

  if (warpPhase === 'warped') {
    return <ImmersivePlayer reality={currentReality} onExit={() => setWarpPhase('idle')} />;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0A0010] font-display text-white selection:bg-cyan-500/30">
      
      {!introComplete && <CinematicIntro onComplete={() => setIntroComplete(true)} />}

      {isProcessingFile && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-300">
             <div className="w-16 h-16 border-t-2 border-cyan-400 rounded-full animate-spin mb-4"></div>
             <span className="font-rajdhani text-sm tracking-[0.3em] text-cyan-400 animate-pulse">PARSING DATA...</span>
          </div>
      )}
      
      <style>{`
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E");
        }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3); }
        @keyframes pan-video { 0% { transform: scale(1.0); } 100% { transform: scale(1.2); } }
        @keyframes rotate-bg { 0% { transform: rotate(0deg) scale(1.5); } 100% { transform: rotate(360deg) scale(1.5); } }
        @keyframes pan-rays { 0% { background-position: 0% 50%; opacity: 0.3; } 50% { background-position: 100% 50%; opacity: 0.6; } 100% { background-position: 0% 50%; opacity: 0.3; } }
        .animate-spin-very-slow { animation: rotate-bg 60s linear infinite; }
        .animate-pan-rays { animation: pan-rays 10s ease-in-out infinite; background-size: 200% 200%; }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-shockwave { animation: shockwave 0.6s ease-out; }
        @keyframes liquid-border { 
            0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            33% { border-radius: 50% 50% 60% 40% / 50% 60% 40% 60%; }
            66% { border-radius: 40% 60% 50% 50% / 40% 50% 60% 50%; }
            100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        .animate-liquid-border { animation: liquid-border 8s ease-in-out infinite alternate; }
        @keyframes border-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes portal-pulse { 
            0% { transform: scale(1); filter: brightness(1); } 
            50% { transform: scale(1.15); filter: brightness(1.3); } 
            100% { transform: scale(1); filter: brightness(1); } 
        }
        .animate-portal-pulse { animation: portal-pulse 6s ease-in-out infinite; }
        @keyframes portal-pulse-glow { 0% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.4); opacity: 0.8; } 100% { transform: scale(1); opacity: 0.4; } }
        .animate-portal-pulse-glow { animation: portal-pulse-glow 6s ease-in-out infinite; }
        @keyframes shimmer-flow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes float-out { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 0; } }
        @keyframes shimmer-burst { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; } }
        @keyframes spark-rise { 
            0% { transform: translate(0, 0) scale(1); opacity: 0; } 
            20% { opacity: 1; } 
            100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } 
        }
        .animate-fade-in-slow { animation: fadeIn 2s ease-out forwards; }
        .animate-slide-up-fade { animation: slideUpFade 1s ease-out forwards; opacity: 0; animation-delay: 0.5s; }
        .animate-scale-up-fade { animation: scaleUpFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; animation-delay: 0.8s; }
        .animate-fade-in-delay { animation: fadeIn 1.5s ease-out forwards; opacity: 0; animation-delay: 1.5s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUpFade { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes float-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes smoke-drift { 0% { transform: translateX(0) scale(1); opacity: 0.1; } 50% { transform: translateX(20px) scale(1.2); opacity: 0.2; } 100% { transform: translateX(0) scale(1); opacity: 0.1; } }
        .animate-smoke-drift { animation: smoke-drift 20s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.5); } }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        @keyframes glitch-bar { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        .animate-glitch-bar { animation: glitch-bar 2s linear infinite; }
        @keyframes neon-pulse { 0%, 100% { opacity: 0.3; filter: hue-rotate(0deg); } 50% { opacity: 0.6; filter: hue-rotate(20deg); } }
        .animate-neon-pulse { animation: neon-pulse 4s ease-in-out infinite; }
        @keyframes light-shaft { 0%, 100% { opacity: 0.1; transform: rotate(25deg) scaleX(1); } 50% { opacity: 0.25; transform: rotate(25deg) scaleX(1.3); } }
        .animate-light-shaft { animation: light-shaft 12s ease-in-out infinite; }
        @keyframes firefly-burst { 0%, 80% { transform: translate(0,0); opacity: 0; } 85% { opacity: 1; } 90% { transform: translate(10px, -10px); opacity: 1; } 100% { transform: translate(20px, -20px); opacity: 0; } }
        .animate-firefly-burst { animation: firefly-burst 8s ease-out infinite; }
        @keyframes breath-slow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .animate-breath-slow { animation: breath-slow 6s ease-in-out infinite; }
        @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        @keyframes grid-scroll { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
        .animate-data-stream { animation: grid-scroll 3s linear infinite; }
        
        @keyframes portal-drift {
            0% { transform: translate(0,0) rotate(0deg); }
            25% { transform: translate(4px, -6px) rotate(1deg); }
            50% { transform: translate(-3px, 5px) rotate(-0.5deg); }
            75% { transform: translate(-5px, -3px) rotate(0.5deg); }
            100% { transform: translate(0,0) rotate(0deg); }
        }
        .animate-portal-drift { animation: portal-drift 12s ease-in-out infinite; }
        
        @keyframes portal-spin {
             0% { transform: scale(1.2) rotate(0deg); }
             100% { transform: scale(1.2) rotate(360deg); }
        }
        .animate-portal-spin { animation: portal-spin 60s linear infinite; }
        
        @keyframes warp-spin {
             0% { transform: scale(1.4) rotate(0deg); filter: contrast(1.5) saturate(1.5) hue-rotate(0deg); }
             100% { transform: scale(1.4) rotate(-360deg); filter: contrast(1.5) saturate(1.5) hue-rotate(90deg); }
        }
        .animate-warp-spin { animation: warp-spin 20s linear infinite; }
        
        @keyframes atmosphere-leak {
             0% { transform: translate(0,0) scale(0); opacity: 0; }
             20% { opacity: 1; }
             100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; }
        }

        @keyframes magical-flow {
            0% { transform: scale(0); opacity: 0; filter: blur(2px); }
            40% { opacity: 0.8; filter: blur(0px); }
            100% { transform: scale(2.5) translate(var(--tx), var(--ty)); opacity: 0; filter: blur(4px); }
        }
        
        @keyframes liquid-swirl {
            0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
            50% { transform: rotate(180deg) scale(1.1); filter: hue-rotate(15deg); }
            100% { transform: rotate(360deg) scale(1); filter: hue-rotate(0deg); }
        }
        .animate-liquid-swirl { animation: liquid-swirl 15s linear infinite; }

        @keyframes energy-crackle {
            0%, 100% { opacity: 0; transform: scaleX(1); }
            10% { opacity: 0.8; transform: scaleX(1.5) skewX(20deg); }
            20% { opacity: 0; }
            60% { opacity: 0.6; transform: scaleX(0.8) skewX(-10deg); }
        }
        .animate-energy-crackle { animation: energy-crackle 2s linear infinite; }
        
        @keyframes singularity-pulse {
            0% { transform: scale(1) rotate(0deg); opacity: 0.8; border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%; }
            33% { transform: scale(1.1) rotate(120deg); opacity: 1; border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            66% { transform: scale(0.9) rotate(240deg); opacity: 0.9; border-radius: 50% 50% 60% 40% / 40% 60% 50% 50%; }
            100% { transform: scale(1) rotate(360deg); opacity: 0.8; border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%; }
        }
        .animate-singularity { animation: singularity-pulse 4s linear infinite; }
        
        @keyframes wobble {
            0% { border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%; transform: rotate(0deg); }
            25% { border-radius: 50% 50% 40% 60% / 60% 40% 50% 50%; }
            50% { border-radius: 60% 40% 60% 40% / 40% 60% 40% 60%; transform: rotate(180deg); }
            75% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; }
            100% { border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%; transform: rotate(360deg); }
        }
        .animate-wobble { animation: wobble 8s linear infinite; }
      `}</style>
      
      {/* Warp Whiteout */}
      <div className={`pointer-events-none fixed inset-0 z-[100] bg-white transition-opacity duration-500 ease-in delay-300`} style={{ opacity: warpPhase === 'accelerating' ? 1 : 0 }} />

      {/* Background Stack (z-0) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0010]">
          <DynamicAtmosphere atmosphereType={currentReality.atmosphereType} color={currentReality.themeColor} />
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-very-slow opacity-60"
            style={{ background: `radial-gradient(circle at center, ${currentReality.themeColor}20 0%, #0A0010 60%, #000 100%)` }} />
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-[1000ms] ease-in-out opacity-20 blur-2xl mix-blend-screen"
            style={{ backgroundImage: `url("${currentReality.bgImage}")` }} />
      </div>
      <div className="bg-noise absolute inset-0 z-0 mix-blend-overlay opacity-[0.07] pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 animate-pan-rays pointer-events-none"></div>
      
      {/* Particles only in Gateway mode - Mobile Friendly */}
      {activeDimension === 0 && <TakingOverParticles corruption={isTransitioning || warpPhase === 'accelerating' ? 0 : corruption} color={currentReality.particleColor} speed={currentReality.id === 'dragon' ? 'fast' : (currentReality.id === 'cosmic' ? 'slow' : 'normal')} shape={currentReality.particleShape} />}

      {/* 1. Gateway (Portal) (z-10) */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-500 ${activeDimension === 0 && !isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'} ${warpPhase === 'accelerating' ? 'scale-[30] rotate-1 blur-sm opacity-100' : ''}`}>
          <CinematicCard reality={currentReality} corruption={corruption} onWarp={handleWarp} />
      </div>

      {/* 2. Scanner (z-40) - Full Screen Overlay */}
      <ScannerDimension active={activeDimension === 1 && !isTransitioning} isScanning={isScanning} />

      {/* 3. Vault (z-40) - Full Screen Overlay */}
      <VaultDimension active={activeDimension === 2 && !isTransitioning} onSelectReality={handleSelectReality} />
      
      {/* Bottom Controls (z-50) */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 pb-6 transition-transform duration-500 ${warpPhase === 'accelerating' ? 'translate-y-full opacity-0' : ''}`}>
         <OrbitalHud 
            currentMode={activeDimension} 
            onSwitchMode={handleSwitchMode} 
            onCapture={handleCapture}
            isScanning={isScanning}
         />
      </div>

    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PortalScreen />);
}
