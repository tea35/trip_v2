"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Plus, Users, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // sessionがあればユーザー情報を、なければnullを設定
        setUser(session?.user ?? null);
      }
    );

    // コンポーネントが非表示になるときにリスナーを解除（メモリリーク防止）
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
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

        {/* Desktop Navigation - メニューボタンを横並び */}
        <div className="hidden items-center space-x-4 md:flex">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/createtrip")}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                旅行作成
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/groups/create")}
                className="flex items-center"
              >
                <Users className="mr-2 h-4 w-4" />
                グループ作成
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/groups")}
                className="flex items-center"
              >
                <Settings className="mr-2 h-4 w-4" />
                グループ管理
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </>
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

        {/* Mobile Menu - モバイルのみ表示 */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">メニュー</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <div className="flex flex-col h-full">
                <div className="flex-1 py-6">
                  {user ? (
                    <nav className="space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/createtrip")}
                        className="w-full justify-start text-left"
                      >
                        <Plus className="mr-3 h-4 w-4" />
                        旅行の新規作成
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/groups/create")}
                        className="w-full justify-start text-left"
                      >
                        <Users className="mr-3 h-4 w-4" />
                        グループ作成
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/groups")}
                        className="w-full justify-start text-left"
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        グループ管理
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        ログアウト
                      </Button>
                    </nav>
                  ) : (
                    <nav className="space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/login")}
                        className="w-full justify-start text-left"
                      >
                        ログイン
                      </Button>
                      <Button
                        onClick={() => handleNavigation("/register")}
                        className="w-full justify-start text-left bg-blue-400 text-white hover:bg-blue-500"
                      >
                        新規登録
                      </Button>
                    </nav>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
