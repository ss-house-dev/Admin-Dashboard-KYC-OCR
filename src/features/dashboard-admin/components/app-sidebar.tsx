"use client";

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
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { calibri } from "@/app/font";

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
      <SidebarFooter className="border-t px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 group-data-[collapsible=icon]:px-1"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src="https://avatars.githubusercontent.com/u/89658253?v=4"
                    alt="@shadcn"
                  />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-gray-900">Username</span>
                  <span className="text-sm text-gray-500">Admin</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500 group-data-[collapsible=icon]:hidden" />
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
