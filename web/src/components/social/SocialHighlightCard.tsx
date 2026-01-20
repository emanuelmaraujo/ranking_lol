import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SocialHighlightCardProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    color: string; // e.g., 'cyan', 'purple'
    children: React.ReactNode;
}

export function SocialHighlightCard({ title, subtitle, icon: Icon, color, children }: SocialHighlightCardProps) {
    // Note: Tailwind dynamic classes (bg-${color}-500) might not purge correctly if not safelisted.
    // Be sure to use standard colors or safe-list them in tailwind.config.js
    const colorMap: any = {
        cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', iconBg: 'bg-purple-500/20' },
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', iconBg: 'bg-orange-500/20' },
        green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', iconBg: 'bg-green-500/20' },
        pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', iconBg: 'bg-pink-500/20' },
    };

    const theme = colorMap[color] || colorMap['purple'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col h-full rounded-2xl ${theme.bg} border ${theme.border} p-5 overflow-hidden relative group`}
        >
            <div className="flex items-center gap-3 mb-4 z-10">
                <div className={`p-2 rounded-lg ${theme.iconBg}`}>
                    <Icon className={`w-5 h-5 ${theme.text}`} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} opacity-80`}>{subtitle}</p>
                </div>
            </div>

            <div className="flex-1 z-10 relative">
                {children}
            </div>

            {/* Background Decor */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${theme.bg} blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
}
