import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { validateAndSanitizeUrl } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';

const AddWebsite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [productType, setProductType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate and sanitize URL
    const { isValid, sanitizedUrl, error } = validateAndSanitizeUrl(websiteUrl);
    
    if (!isValid) {
      toast({
        title: "Invalid URL",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Store the sanitized data
    localStorage.setItem('websiteData', JSON.stringify({ 
      websiteUrl: sanitizedUrl, 
      productType 
    }));
    
    // Redirect to chat interface
    navigate('/chat');
  };

  return (
    <div className="bg-white flex flex-col items-stretch py-[17px] min-h-screen">
      <Header />
      
      <main className="self-center flex w-full max-w-[800px] flex-col max-md:max-w-full px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-[rgba(28,28,28,1)] text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight tracking-[-0.8px] sm:tracking-[-1.2px] mb-4">
            Start analyzing your website
          </h1>
          <p className="text-[#1c1c1c] text-base sm:text-lg font-normal leading-relaxed">
            Enter the URL of your website to get started with analytics and insights
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[rgba(247,244,237,1)] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)] border flex flex-col items-stretch p-6 sm:p-8 rounded-2xl sm:rounded-[28px] border-[rgba(28,28,28,0.2)] border-solid">
          <div className="mb-6">
            <label htmlFor="website-url" className="block text-[rgba(28,28,28,1)] text-sm font-medium mb-2">
              URL of the Page
            </label>
            <input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full bg-white border border-[rgba(28,28,28,0.2)] rounded-lg px-4 py-3 text-[rgba(28,28,28,1)] placeholder-[rgba(95,95,93,1)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,28,28,0.3)] focus:border-transparent"
              placeholder="https://your-website.com"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="product-type" className="block text-[rgba(28,28,28,1)] text-sm font-medium mb-2">
              Website Type
            </label>
            <select
              id="product-type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full bg-white border border-[rgba(28,28,28,0.2)] rounded-lg px-4 py-3 text-[rgba(28,28,28,1)] focus:outline-none focus:ring-2 focus:ring-[rgba(28,28,28,0.3)] focus:border-transparent"
              required
            >
              <option value="">Select your product type</option>
              <option value="ecommerce">E-commerce</option>
              <option value="saas">SaaS</option>
              <option value="blog">Blog/Content Site</option>
              <option value="portfolio">Portfolio</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Button 
            type="submit" 
            className="bg-[rgba(28,28,28,1)] text-[rgba(252,251,248,1)] hover:bg-[rgba(28,28,28,0.9)] font-medium py-3 px-6 rounded-lg transition-colors"
            disabled={!websiteUrl.trim() || !productType.trim()}
          >
            Start Analyzing
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[rgba(95,95,93,1)] text-sm">
            Need help getting started? 
            <button 
              onClick={() => window.open('https://calendly.com/ruben-clutch/30min', '_blank')}
              className="text-[rgba(28,28,28,1)] font-medium ml-1 hover:underline"
            >
              Request a demo
            </button>
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AddWebsite;