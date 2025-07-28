import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, BarChart3, TestTube, Zap, TrendingUp, Eye, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { CUAService, CUASessionResponse, ABTestConfig } from '@/services/CUAService';
import { useToast } from '@/hooks/use-toast';

interface CUAControlsProps {
  websiteUrl: string;
  websiteId?: string;
  onSessionUpdate?: (session: CUASessionResponse) => void;
}

export const CUAControls: React.FC<CUAControlsProps> = ({
  websiteUrl,
  websiteId,
  onSessionUpdate
}) => {
  const [activeSession, setActiveSession] = useState<CUASessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [abTestConfig, setAbTestConfig] = useState<Partial<ABTestConfig>>({
    testName: '',
    description: '',
    controlUrl: websiteUrl,
    variants: [{ name: 'Variant A', changes: [] }],
    successMetrics: [{ type: 'conversion_rate', goal: 10 }],
    duration: 7,
    trafficSplit: { control: 50, variant: 50 }
  });
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const { toast } = useToast();

  const startCUASession = async (sessionType: 'analysis' | 'testing' | 'optimization' | 'competitive') => {
    setIsLoading(true);
    try {
      const options: any = {};
      
      if (sessionType === 'competitive') {
        if (!competitorUrl) {
          toast({
            title: "Error",
            description: "Please enter a competitor URL for competitive analysis",
            variant: "destructive"
          });
          return;
        }
        options.competitor = competitorUrl;
        options.industry = industry;
      }

      const response = await CUAService.startSession({
        websiteId,
        targetUrl: websiteUrl,
        sessionType,
        options
      });

      setActiveSession(response);
      onSessionUpdate?.(response);

      toast({
        title: "CUA Session Started",
        description: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} session is now running`,
      });

      // Poll for session updates
      pollSessionStatus(response.sessionId);

    } catch (error) {
      console.error('Error starting CUA session:', error);
      toast({
        title: "Error",
        description: "Failed to start CUA session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    if (activeSession) {
      try {
        await CUAService.stopSession(activeSession.sessionId);
        setActiveSession(null);
        toast({
          title: "Session Stopped",
          description: "CUA session has been stopped",
        });
      } catch (error) {
        console.error('Error stopping session:', error);
        toast({
          title: "Error",
          description: "Failed to stop session",
          variant: "destructive"
        });
      }
    }
  };

  const pollSessionStatus = async (sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const session = await CUAService.getSession(sessionId);
        setActiveSession(session);
        onSessionUpdate?.(session);

        if (session.status === 'completed' || session.status === 'failed') {
          clearInterval(pollInterval);
          toast({
            title: session.status === 'completed' ? "Session Completed" : "Session Failed",
            description: session.status === 'completed' 
              ? "CUA analysis completed successfully" 
              : "CUA session encountered an error",
            variant: session.status === 'completed' ? "default" : "destructive"
          });
        }
      } catch (error) {
        console.error('Error polling session status:', error);
        clearInterval(pollInterval);
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const createABTest = async () => {
    try {
      const testId = await CUAService.createABTest(abTestConfig as ABTestConfig, websiteId);
      await CUAService.startABTest(testId);
      
      toast({
        title: "A/B Test Created",
        description: "Your A/B test has been created and started",
      });
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast({
        title: "Error",
        description: "Failed to create A/B test",
        variant: "destructive"
      });
    }
  };

  const runCompetitiveAnalysis = async () => {
    if (!competitorUrl) {
      toast({
        title: "Error",
        description: "Please enter a competitor URL",
        variant: "destructive"
      });
      return;
    }

    try {
      await CUAService.runCompetitiveAnalysis(
        competitorUrl,
        'full_site',
        industry,
        websiteId
      );
      
      toast({
        title: "Competitive Analysis Started",
        description: "Analysis is running and will complete shortly",
      });
    } catch (error) {
      console.error('Error starting competitive analysis:', error);
      toast({
        title: "Error",
        description: "Failed to start competitive analysis",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'running':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Computer-Using Agent (CUA)
        </CardTitle>
        <CardDescription>
          Autonomous website optimization and testing powered by AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeSession && (
          <Card className="mb-4 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(activeSession.status)}
                  <span className="font-medium">Active Session</span>
                  <Badge variant={getStatusColor(activeSession.status)}>
                    {activeSession.status}
                  </Badge>
                </div>
                {activeSession.status === 'running' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={stopSession}
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                )}
              </div>
              {activeSession.status === 'running' && (
                <Progress value={33} className="mt-2" />
              )}
            </CardHeader>
            {activeSession.interactions && activeSession.interactions.length > 0 && (
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {activeSession.interactions.slice(-3).map((interaction, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {interaction.success ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                      <span>{interaction.actionType}: {interaction.actionData?.description || 'Action executed'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze" className="gap-1">
              <Eye className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-1">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="optimize" className="gap-1">
              <TrendingUp className="h-4 w-4" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="compete" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              Compete
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Autonomous Website Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Let the CUA agent autonomously navigate and analyze your website to identify optimization opportunities.
                </p>
                <Button 
                  onClick={() => startCUASession('analysis')}
                  disabled={isLoading || activeSession?.status === 'running'}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isLoading ? 'Starting...' : 'Start Analysis'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Autonomous A/B Testing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create and run automated A/B tests to improve conversion rates.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    value={abTestConfig.testName}
                    onChange={(e) => setAbTestConfig(prev => ({ ...prev, testName: e.target.value }))}
                    placeholder="Homepage CTA Test"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={abTestConfig.duration}
                    onChange={(e) => setAbTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={abTestConfig.description}
                  onChange={(e) => setAbTestConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Testing different CTA button colors and positioning..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={createABTest}
                  disabled={!abTestConfig.testName || isLoading}
                  className="gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Create A/B Test
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => startCUASession('testing')}
                  disabled={isLoading || activeSession?.status === 'running'}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Testing
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Autonomous Optimization</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate and implement optimization recommendations automatically.
                </p>
                <Button 
                  onClick={() => startCUASession('optimization')}
                  disabled={isLoading || activeSession?.status === 'running'}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  {isLoading ? 'Starting...' : 'Start Optimization'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compete" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Competitive Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze competitors and benchmark your website performance.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="competitor">Competitor URL</Label>
                  <Input
                    id="competitor"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    placeholder="https://competitor.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={runCompetitiveAnalysis}
                  disabled={!competitorUrl || isLoading}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analyze Competitor
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => startCUASession('competitive')}
                  disabled={isLoading || activeSession?.status === 'running'}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Analysis
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};