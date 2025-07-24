import OpenAI from 'openai';

interface AnalysisRequest {
  websiteUrl: string;
  currentPage: string;
  productType: string;
  userQuestion: string;
}

interface AnalysisResponse {
  content: string;
  suggestions: string[];
}

export class OpenAIService {
  private static API_KEY_STORAGE_KEY = 'openai_api_key';
  private static openai: OpenAI | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static isConfigured(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const testOpenAI = new OpenAI({ 
        apiKey,
        dangerouslyAllowBrowser: true 
      });
      
      await testOpenAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      });
      
      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }

  static async analyzeWebsite({ websiteUrl, currentPage, productType, userQuestion }: AnalysisRequest): Promise<AnalysisResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!this.openai) {
      this.openai = new OpenAI({ 
        apiKey,
        dangerouslyAllowBrowser: true 
      });
    }

    const systemPrompt = `You are an expert website optimization consultant. Analyze the provided website and current page context to give actionable insights.

Website: ${websiteUrl}
Current Page: ${currentPage}
Product Type: ${productType}

Provide specific, actionable recommendations for improving:
- User experience and conversion rates
- Content optimization
- Design and layout improvements
- Call-to-action effectiveness
- Trust signals and credibility
- Mobile responsiveness
- Page performance

Be specific and practical in your suggestions.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuestion }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = completion.choices[0]?.message?.content || 'Unable to analyze the website at this time.';
      
      // Extract actionable suggestions from the response
      const suggestions = this.extractSuggestions(content);

      return { content, suggestions };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze website. Please check your API key and try again.');
    }
  }

  private static extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    
    // Look for bullet points, numbered lists, or action items
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const suggestion = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');
        if (suggestion.length > 10) {
          suggestions.push(suggestion);
        }
      }
    }

    // If no structured suggestions found, create some based on common optimization areas
    if (suggestions.length === 0) {
      suggestions.push(
        "Analyze page loading speed",
        "Review call-to-action placement",
        "Check mobile responsiveness",
        "Optimize headline clarity"
      );
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }
}