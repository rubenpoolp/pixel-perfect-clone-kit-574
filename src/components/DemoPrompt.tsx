import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight } from 'lucide-react';

interface DemoPromptProps {
  messageCount: number;
  onClose: () => void;
}

export function DemoPrompt({ messageCount, onClose }: DemoPromptProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after 3 messages or 30 seconds
    if (messageCount >= 3) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [messageCount]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleRequestDemo = () => {
    window.open('https://calendly.com/ruben-friendsofjackie/30min', '_blank');
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[rgba(28,28,28,1)] mb-2">
                🚀 Loving the insights?
              </h3>
              <p className="text-sm text-[rgba(95,95,93,1)] mb-4">
                You've tested our AI analysis! Get a personalized demo to see how we can transform your website's performance.
              </p>
            </div>
            <button 
              onClick={handleClose}
              className="text-[rgba(95,95,93,1)] hover:text-[rgba(28,28,28,1)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRequestDemo}
              className="w-full bg-[rgba(28,28,28,1)] text-[rgba(252,251,248,1)] hover:bg-[rgba(28,28,28,0.9)] font-medium py-3 rounded-lg transition-colors"
            >
              Request a Demo
              <ArrowRight size={16} className="ml-2" />
            </Button>
            
            <button 
              onClick={handleClose}
              className="w-full text-sm text-[rgba(95,95,93,1)] hover:text-[rgba(28,28,28,1)] transition-colors py-2"
            >
              Continue testing
            </button>
          </div>
          
          <div className="mt-4 text-xs text-[rgba(95,95,93,1)] text-center">
            ✨ Free 15-minute consultation • No commitment required
          </div>
        </CardContent>
      </Card>
    </div>
  );
}