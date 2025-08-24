"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetDescription,
} from "@/components/ui/sheet";
import { Menu, LogOut, Plus, Users, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      // ユーザーが存在する場合、名前を取得
      if (data.user) {
        const { data: profile } = await supabase
          .from("user_setting")
          .select("name")
          .eq("user_id", data.user.id)
          .single();

        setUserName(profile?.name || "");
      } else {
        setUserName("");
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // sessionがあればユーザー情報を、なければnullを設定
        setUser(session?.user ?? null);

        // ユーザーが存在する場合、名前を取得
        if (session?.user) {
          const { data: profile } = await supabase
            .from("user_setting")
            .select("name")
            .eq("user_id", session.user.id)
            .single();

          setUserName(profile?.name || "");
        } else {
          setUserName("");
        }
      }
    );

    // コンポーネントが非表示になるときにリスナーを解除（メモリリーク防止）
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // ユーザー状態をクリア
      setUser(null);
      setUserName("");
      router.push("/login");
    } catch (error) {
      console.error("ログアウト処理でエラーが発生しました:", error);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="flex h-9 items-center justify-center rounded-lg bg-blue-400 px-3 text-xl font-bold text-white">
            TripList
          </span>
        </Link>

        {/* Spacer - 中央の空白スペース */}
        <div className="flex-1"></div>

        {/* Desktop Navigation - 適度に右寄りに配置 */}
        <div className="hidden items-center space-x-4 md:flex mr-4">
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
                type="button"
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

        {/* Mobile Menu - 適度に右寄りに配置 */}
        <div className="md:hidden mr-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="メニューを開く">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>メニュー</SheetTitle>
                <SheetDescription>
                  ナビゲーションメニューです。各機能にアクセスできます。
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <div className="flex-1 py-6">
                  {user ? (
                    <nav
                      className="space-y-2"
                      role="navigation"
                      aria-label="メインナビゲーション"
                    >
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
                        type="button"
                        onClick={handleLogout}
                        className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        ログアウト
                      </Button>
                    </nav>
                  ) : (
                    <nav
                      className="space-y-2"
                      role="navigation"
                      aria-label="メインナビゲーション"
                    >
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
