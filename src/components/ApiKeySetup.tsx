import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, CheckCircle, XCircle } from 'lucide-react';
import { OpenAIService } from '@/services/OpenAIService';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeySetupProps {
  onSuccess: () => void;
}

export const ApiKeySetup = ({ onSuccess }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await OpenAIService.testApiKey(apiKey.trim());
      
      if (isValid) {
        OpenAIService.saveApiKey(apiKey.trim());
        toast({
          title: "Success!",
          description: "OpenAI API key verified and saved",
        });
        onSuccess();
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setError('Failed to verify API key. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Key className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Setup OpenAI Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              To get real AI-powered website insights, you need to provide your OpenAI API key. 
              Your key is stored locally and never shared.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify & Save API Key
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an API key?{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get one from OpenAI
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};