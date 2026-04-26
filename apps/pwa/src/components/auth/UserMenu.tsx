import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, FileText, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const displayName = user.name ?? user.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-amber-400 text-xs font-bold text-black transition-all hover:bg-amber-300 hover:shadow-[0_0_0_2px_rgba(247,184,75,0.4)]"
          aria-label={`Account menu for ${displayName}`}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
        <DropdownMenuLabel className="font-normal py-3">
          <div className="text-sm font-semibold text-white truncate">{displayName}</div>
          <div className="text-xs text-white/50 truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2.5 text-white/70 focus:text-white">
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2.5 text-white/70 focus:text-white">
          <FileText className="h-4 w-4" />
          My documents
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2.5 text-white/70 focus:text-white">
          <PenLine className="h-4 w-4" />
          Signature requests
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          className="cursor-pointer gap-2.5 text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
