import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function Toaster() {
  const { toasts } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [currentToast, setCurrentToast] = useState<typeof toasts[0] | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (toasts.length > 0 && isMobile) {
      setCurrentToast(toasts[0]);
    } else {
      setCurrentToast(null);
    }
  }, [toasts, isMobile]);

  const handleClose = () => {
    if (currentToast) {
      currentToast.onOpenChange?.(false);
    }
  };

  if (isMobile && currentToast) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="h-[50vh] w-[90%] max-w-[90%] flex flex-col justify-center items-center text-center p-8">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
          {currentToast.title && (
            <h3 className="text-2xl font-bold mb-4">{currentToast.title}</h3>
          )}
          {currentToast.description && (
            <p className="text-lg text-muted-foreground">{currentToast.description}</p>
          )}
          {currentToast.action}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
