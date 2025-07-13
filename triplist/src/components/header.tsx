"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, [isOpen, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setIsOpen(false);
  };

  const handleLogin = () => {
    router.push("/login");
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="flex h-9 items-center justify-center rounded-lg bg-blue-400 px-3 text-xl font-bold text-white">
            TripList
          </span>
        </Link>

        {/* Desktop CTA */}
        <div className="hidden items-center space-x-4 md:flex">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
              >
                ログイン
              </Button>
              <Button
                size="sm"
                className="bg-blue-400 text-white hover:bg-blue-500"
                onClick={() => router.push("/register")}
              >
                新規登録
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          {/* ... (Sheetの中身は変更なし) ... */}
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="mt-4 flex flex-col space-y-4">
              {user ? (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Button>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button variant="ghost" onClick={handleLogin}>
                    ログイン
                  </Button>
                  <Button
                    onClick={() => {
                      router.push("/signup");
                      setIsOpen(false);
                    }}
                    className="bg-blue-400 text-white hover:bg-blue-500"
                  >
                    新規登録
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
