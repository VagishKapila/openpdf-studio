import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { useAuth } from '@/stores/auth';
import { brand, gradients } from '@/lib/brand';
import { LogOut, Settings, FileText, PenLine } from 'lucide-react';

export function UserMenu() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(59,169,255,0.5)]"
          style={{
            background: gradients.primary,
            border: '2px solid rgba(255,255,255,0.12)',
          }}
          aria-label={`Account menu for ${user.name}`}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[260px] overflow-hidden rounded-[14px] border border-white/10 p-0 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
        style={{
          background: brand.surfaceSolid,
          backdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        <DropdownMenuLabel className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 font-normal">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: gradients.primary }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-white">
              {user.name}
            </div>
            <div className="truncate text-[12px] text-zinc-400">
              {user.email}
            </div>
          </div>
        </DropdownMenuLabel>

        <div className="py-1">
          <DropdownMenuItem className="cursor-pointer gap-3 px-4 py-2.5 text-[13px] text-zinc-300 focus:bg-white/5 focus:text-white">
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-3 px-4 py-2.5 text-[13px] text-zinc-300 focus:bg-white/5 focus:text-white">
            <FileText className="h-4 w-4" />
            My documents
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-3 px-4 py-2.5 text-[13px] text-zinc-300 focus:bg-white/5 focus:text-white">
            <PenLine className="h-4 w-4" />
            Signature requests
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0 bg-white/[0.06]" />

        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer gap-3 px-4 py-2.5 text-[13px] text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
