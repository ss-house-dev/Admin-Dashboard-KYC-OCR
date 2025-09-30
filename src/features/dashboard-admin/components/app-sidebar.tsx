"use client";

// logout
import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Bell,
  Settings,
  ChevronRight,
  LayoutDashboard,
  ArrowDownWideNarrow,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Menu items.
const items = [
  {
    title: "Verification",
    url: "#",
    icon: ArrowDownWideNarrow,
    active: true,
  },
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
    active: false,
  },
];

const secondaryItems = [
  {
    title: "Notifications",
    url: "#",
    icon: Bell,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  //logout
  const router = useRouter();
  const [_loading, _setLoading] = React.useState(false);

  // async function _handleLogout() {
  //   try {
  //     await fetch("/api/logout", { method: "POST" });
  //   } catch {}
  //   const origin = typeof window !== "undefined" ? window.location.origin : "";
  //   await signOut({ callbackUrl: `${origin}/sign-in`, redirect: true });
  // }

  const { open, setOpen } = useSidebar();

  //ดึง user จาก session
  const { data: session } = useSession();
  const displayName =
    (session?.user?.name && session.user.name.trim()) ||
    (session?.user?.email ? session.user.email.split("@")[0] : "") ||
    "User";
  const email = session?.user?.email ?? "whalaroratrading@gmail.com";

  const avatarSrc =
    typeof session?.user?.image === "string" ? session.user.image : undefined;

  // เมื่อมีการเปิด DetailView และ sidebar เปิดอยู่ → ปิด sidebar
  React.useEffect(() => {
    const handle = () => {
      if (open) setOpen(false);
    };
    window.addEventListener("dashboard:detail-opened", handle);
    return () => window.removeEventListener("dashboard:detail-opened", handle);
  }, [open, setOpen]);

  return (
    <Sidebar className="h-full border-r bg-white p-0" collapsible="icon">
      <SidebarTrigger
        className={cn(
          "size-7",
          "transition-transform",
          "group-data-[state=collapsed]:rotate-180",
          "group-data-[side=right]:left-0",
          "group-data-[side=right]:-translate-x-1/2",
          "group-data-[side=right]:right-auto",
          "group-data-[side=right]:translate-x-0"
        )}
      />
      <SidebarHeader>
        <div className="flex items-center space-x-2">
          <Image
            src="/logo/logo-kyra.svg"
            width={32}
            height={32}
            alt="Picture of the author"
          />
          <span className="calibri.className text-xl font-bold text-blue-600 group-data-[collapsible=icon]:hidden">
            Kyra
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 mt-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "flex w-full p-3 items-center justify-start rounded-xl text-left font-semibold transition-all duration-200",
                      item.active
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <a href={item.url} className="flex items-center space-x-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* เพิ่มส่วนคั่นระหว่างกลุ่มเมนู */}
        <div className="my-6 h-[1px] bg-gray-200" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="flex w-full items-center justify-start rounded-xl p-3 text-left font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <a href={item.url} className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* เพิ่มส่วน User Profile ที่ Sidebar Footer */}
      <SidebarFooter className="border-t p-4 pl-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                {/* ปุ่ม User Profile เดิม — คง className/layoutเดิมทุกจุด */}
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between py-2 pl-4"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {/* ถ้ามีรูปโปรไฟล์ใน session.user.image ก็ใส่ได้ */}
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>
                        {displayName?.slice(0, 2)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                      {/* เดิม: Username / Admin → ปรับเป็นชื่อจริง/อีเมลของ user */}
                      <span className="font-semibold text-gray-900">
                        {displayName}
                      </span>
                      <span className="text-sm text-gray-500 truncate max-w-[160px]">
                        {email}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-data-[collapsible=icon]:hidden" />
                </Button>
              </DropdownMenuTrigger>

              {/* เมนูเด้งขึ้น "ตรง User Profile" แบบในรูป */}
              <DropdownMenuContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-auto p-0"
              >
                <DropdownMenuLabel className="font-normal truncate px-3 py-2 text-sm">
                  {email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                  onClick={() => router.push("#")}
                  className="font-normal truncate px-3 py-2 text-sm"
                >
                  <Image
                    src="/icons/account_circle.svg"
                    alt=""
                    width={20}
                    height={20}
                    className=""
                  />
                  <span>Profile setting</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                  className="font-normal truncate px-3 py-2 text-sm"
                >
                  <Image
                    src="/icons/keyboard_return.svg"
                    alt=""
                    width={20}
                    height={20}
                    className=""
                  />
                  <span>sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
