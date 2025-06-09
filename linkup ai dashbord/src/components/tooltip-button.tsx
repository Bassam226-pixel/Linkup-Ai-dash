import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

// تعريف أنواع الأزرار المتاحة
type ButtonVariant =
  | "ghost"
  | "link"
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | null
  | undefined;

interface TooltipButtonProps {
  content: string;
  icon: React.ReactNode;
  onClick: () => void;
  buttonVariant?: ButtonVariant;
  buttonClassName?: string;
  delay?: number;
  disabled?: boolean; // تصحيح الـ typo من disbaled إلى disabled
  loading?: boolean;
}

export const TooltipButton = ({
  content,
  icon,
  onClick,
  buttonVariant = "ghost",
  buttonClassName = "",
  delay = 0,
  disabled = false, // تصحيح الـ typo من disbaled إلى disabled
  loading = false,
}: TooltipButtonProps) => {
  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={disabled ? "cursor-not-allowed" : "cursor-pointer"}> {/* تصحيح disbaled إلى disabled */}
            <Button
              size="icon"
              disabled={disabled} // تصحيح disbaled إلى disabled
              variant={buttonVariant}
              className={buttonClassName}
              onClick={onClick}
            >
              {loading ? (
                <Loader className="min-w-4 min-h-4 animate-spin text-emerald-400" />
              ) : (
                icon
              )}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{loading ? "Loading..." : content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};