
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function UserMenu() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (!user) return null;

  const userInitials = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass" align="end">
        <DropdownMenuItem className="flex items-center">
          <User className="mr-2 h-4 w-4" />
          <span>{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
