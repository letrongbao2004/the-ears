import { SignedOut, UserButton } from "@clerk/clerk-react";
import { LayoutDashboardIcon, Search } from "lucide-react";
import { Link } from "react-router";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

const Topbar = () => {
  const { isAdmin } = useAuthStore();
  console.log({ isAdmin });
  return (
    <div className="flex items-center justify-between p-4 sticky top-0 bg-black/50
    backdrop-blur-md z-10 ">
        <div className="flex gap-2 items-center">
          <img src="/logo.png" className="size-10" alt="TheEars logo" />
            TheEars
        </div>
        <div className="flex items-center gap-4">
            <Link 
              to="/search"
              className={cn(buttonVariants({ variant: "ghost" }), "text-white hover:text-green-400")}
            >
              <Search className="size-4 mr-2"/>
              Search
            </Link>

            { isAdmin && (
              <Link to ={"/admin"}
              className={cn(buttonVariants({ variant: "outline" }))}
              >
                <LayoutDashboardIcon className="size-4 mr-2"/>
                Admin Dashboard
              </Link>
            )}

            <SignedOut>
              <SignInOAuthButtons/>
            </SignedOut>

            <UserButton />
        </div>
    </div>
  )
}

export default Topbar
