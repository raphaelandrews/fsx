"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "../theme-switcher";

import {
  CalendarDaysIcon,
  type CalendarDaysIconHandle,
  FileTextIcon,
  type FileTextIconHandle,
  SparklesIcon,
  type SparklesIconHandle,
  HomeIcon,
  type HomeIconHandle,
} from "../animated-icons";
import { MainNav } from "./main-nav";

export function Toolbar() {
  const homeIconRef = useRef<HomeIconHandle>(null);
  const fileTextIconRef = useRef<FileTextIconHandle>(null);
  const sparklesIconRef = useRef<SparklesIconHandle>(null);
  const calendarDaysIconRef = useRef<CalendarDaysIconHandle>(null);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background rounded-xl shadow-lg border p-3">
      <div className="flex items-center">
        <Link href="/" className="flex px-2">
          <span className="font-bold mt-0.5">FSX</span>
        </Link>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <MainNav/>

        <nav className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:text-forground"
            onMouseEnter={() => {
              homeIconRef.current?.startAnimation();
            }}
            onMouseLeave={() => {
              homeIconRef.current?.stopAnimation();
            }}
          >
            <HomeIcon
              ref={homeIconRef}
              size={16}
              className="text-foreground/60 hover:text-foreground"
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:text-forground"
            onMouseEnter={() => {
              sparklesIconRef.current?.startAnimation();
            }}
            onMouseLeave={() => {
              sparklesIconRef.current?.stopAnimation();
            }}
          >
            <SparklesIcon
              ref={sparklesIconRef}
              size={16}
              className="text-foreground/60 hover:text-foreground"
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="group p-2 hover:text-forground"
            onMouseEnter={() => {
              fileTextIconRef.current?.startAnimation();
            }}
            onMouseLeave={() => {
              fileTextIconRef.current?.stopAnimation();
            }}
          >
            <FileTextIcon
              ref={fileTextIconRef}
              size={16}
              className="text-foreground/60 group-hover:text-foreground"
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="group p-2 hover:text-forground"
            onMouseEnter={() => {
              calendarDaysIconRef.current?.startAnimation();
            }}
            onMouseLeave={() => {
              calendarDaysIconRef.current?.stopAnimation();
            }}
          >
            <CalendarDaysIcon
              ref={calendarDaysIconRef}
              size={16}
              className="text-foreground/60 group-hover:text-foreground"
            />
          </Button>
        </nav>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <ThemeSwitcher />
      </div>
    </div>
  );
}
