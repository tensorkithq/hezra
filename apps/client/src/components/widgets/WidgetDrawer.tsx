/**
 * Widget Drawer Component
 *
 * A right side drawer specifically designed for displaying widgets with:
 * - Slides in from the right
 * - Full height
 * - Max width: 428px
 * - Black background with transparency
 * - Positioned similar to account information modal
 */

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  isExpanded?: boolean;
  onExpand?: () => void;
}

export function WidgetDrawer({ open, onOpenChange, children, isExpanded = false, onExpand }: WidgetDrawerProps) {
  return (
    <>
      {/* Semi-transparent backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Widget Sidebar - Slides in from right on desktop, bottom on mobile */}
      <div 
        className={cn(
          "fixed right-0 top-0 md:top-0 md:right-0 bottom-0 left-0 md:bottom-auto md:left-auto h-full md:h-full z-40 transition-all duration-500 ease-out",
          open ? "translate-y-0 md:translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"
        )}
      >
        <div className="h-full flex items-end md:items-center justify-center md:justify-end p-4 md:p-8">
          <div className={cn(
            "max-w-md w-full md:w-96 shadow-2xl relative rounded-t-[32px] md:rounded-[32px] transition-all duration-500 ease-out flex flex-col overflow-hidden",
            isExpanded ? 'h-full max-h-[90vh] md:max-h-full' : 'h-[60vh] max-h-[60vh] md:h-full md:max-h-full'
          )}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
