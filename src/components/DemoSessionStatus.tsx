import { useState, useEffect } from 'react';
import { DemoSessionService } from '@/services/DemoSessionService';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

interface DemoSessionStatusProps {
  onRequestDemo?: () => void;
}

export function DemoSessionStatus({ onRequestDemo }: DemoSessionStatusProps) {
  const [sessionStats, setSessionStats] = useState({
    totalAnalyses: 0,
    timeRemaining: 0,
    remainingAnalyses: 10,
    createdAt: null as Date | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessionStats() {
      try {
        const sessionId = DemoSessionService.getDemoSessionId();
        const [stats, limits] = await Promise.all([
          DemoSessionService.getDemoSessionStats(sessionId),
          DemoSessionService.checkSessionLimits(sessionId)
        ]);

        setSessionStats({
          ...stats,
          remainingAnalyses: limits.remainingAnalyses
        });
      } catch (error) {
        console.error('Error loading session stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSessionStats();
  }, []);

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const progressPercentage = Math.max(0, (sessionStats.remainingAnalyses / 10) * 100);
  const isLowOnAnalyses = sessionStats.remainingAnalyses <= 3;
  const isOutOfAnalyses = sessionStats.remainingAnalyses <= 0;

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Demo session status card */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Demo Session</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTimeRemaining(sessionStats.timeRemaining)} left
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Analyses remaining</span>
            <span className={`font-medium ${isLowOnAnalyses ? 'text-warning' : 'text-foreground'}`}>
              {sessionStats.remainingAnalyses} / 10
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isLowOnAnalyses ? '[&>div]:bg-warning' : ''}`}
          />
        </div>

        {sessionStats.totalAnalyses > 0 && (
          <div className="text-xs text-muted-foreground">
            You've used {sessionStats.totalAnalyses} analyses in this session
          </div>
        )}
      </div>

      {/* Warning alerts */}
      {isOutOfAnalyses && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Demo limit reached!</strong> You've used all 10 analyses in this session.
            {onRequestDemo && (
              <Button
                onClick={onRequestDemo}
                variant="destructive"
                size="sm"
                className="ml-2"
              >
                Request Full Demo
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLowOnAnalyses && !isOutOfAnalyses && (
        <Alert className="border-warning bg-warning/10">
          <Zap className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            <strong>Running low!</strong> Only {sessionStats.remainingAnalyses} analyses left in your demo session.
            {onRequestDemo && (
              <Button
                onClick={onRequestDemo}
                variant="outline"
                size="sm"
                className="ml-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
              >
                Get Unlimited Access
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}