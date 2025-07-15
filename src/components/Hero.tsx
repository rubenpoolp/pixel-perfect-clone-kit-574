import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
interface HeroProps {
  className?: string;
}
export const Hero: React.FC<HeroProps> = ({
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const suggestions = [{
    icon: 'https://cdn.builder.io/api/v1/image/assets/TEMP/d18eb418fc165b4bf968bc92fd27747fe76ee458?placeholderIfAbsent=true',
    text: 'How competitors are dealing with subscriptions ?'
  }, {
    icon: 'https://cdn.builder.io/api/v1/image/assets/TEMP/91e4a8fdd5d2e5cd09929a96db2f7794848e1dcc?placeholderIfAbsent=true',
    text: 'A/B Test my onboarding'
  }];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to Calendly
    window.open('https://calendly.com/ruben-friendsofjackie/30min', '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Redirect to Calendly
      window.open('https://calendly.com/ruben-friendsofjackie/30min', '_blank');
    }
  };
  return <section className={`self-center flex w-full max-w-[1504px] flex-col mt-32 sm:mt-40 lg:mt-[260px] px-4 sm:px-8 max-md:max-w-full ${className}`}>
      <h1 className="text-[rgba(28,28,28,1)] text-xl sm:text-2xl lg:text-3xl font-medium leading-tight tracking-[-0.8px] sm:tracking-[-1.2px] text-center self-center ml-2.5 max-md:max-w-full">
        What do you want to improve today ?
      </h1>
      <p className="text-[#1c1c1c] text-base sm:text-lg font-normal leading-relaxed text-center self-center mt-3 sm:mt-[15px] max-md:max-w-full">
        Get insights & analytics - test & improve your product by chatting with AI
      </p>
      
      <form onSubmit={handleSubmit} className="bg-[rgba(247,244,237,1)] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)] border self-center flex w-full max-w-[768px] flex-col overflow-hidden items-stretch text-[rgba(95,95,93,1)] mt-6 sm:mt-8 lg:mt-[46px] pt-4 sm:pt-[22px] pb-3 sm:pb-[13px] px-4 sm:px-[17px] rounded-2xl sm:rounded-[28px] border-[rgba(28,28,28,0.2)] border-solid">
        <div className="flex items-stretch gap-[3px] text-sm sm:text-base font-normal leading-relaxed flex-wrap">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} className="grow shrink basis-auto max-md:max-w-full bg-transparent border-none outline-none placeholder-[rgba(95,95,93,1)] text-sm sm:text-base py-2" placeholder="Optimize conversions by giving insights through heatmaps" />
          
        </div>
        
        {/* Desktop suggestions - hidden on mobile */}
        <div className="hidden sm:flex items-stretch gap-4 sm:gap-10 text-xs sm:text-sm font-medium text-center flex-wrap mt-8 sm:mt-12 lg:mt-[60px] justify-end">
          <div className="flex items-stretch gap-5 flex-wrap grow shrink basis-auto">
            {suggestions.map((suggestion, index) => <button key={index} type="button" onClick={() => setSearchQuery(suggestion.text)} className="bg-[rgba(247,244,237,1)] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border flex items-stretch gap-1 text-black leading-relaxed px-2 sm:px-[13px] py-1.5 sm:py-2 rounded-full border-[rgba(236,234,228,1)] border-solid hover:bg-[rgba(236,234,228,1)] transition-colors text-xs sm:text-sm">
                <img src={suggestion.icon} className="aspect-[1] object-contain w-3 sm:w-4 shrink-0" alt="" />
                <span className="basis-auto grow shrink">
                  {suggestion.text}
                </span>
              </button>)}
          </div>
          <button type="submit" className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${searchQuery.trim() ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 hover:bg-gray-500'}`}>
            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </button>
        </div>

        {/* Mobile submit button - shown only on mobile */}
        <div className="flex sm:hidden justify-end mt-4">
          <button type="submit" className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${searchQuery.trim() ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 hover:bg-gray-500'}`}>
            <ArrowUp className="w-3 h-3 text-white" />
          </button>
        </div>
      </form>

      {/* Mobile suggestions - shown only on mobile, outside the form */}
      <div className="flex sm:hidden items-stretch gap-3 text-xs font-medium text-center flex-wrap mt-6 self-center w-full max-w-[768px] px-4">
        {suggestions.map((suggestion, index) => <button key={index} type="button" onClick={() => setSearchQuery(suggestion.text)} className="bg-[rgba(247,244,237,1)] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border flex items-stretch gap-1 text-black leading-relaxed px-3 py-2 rounded-full border-[rgba(236,234,228,1)] border-solid hover:bg-[rgba(236,234,228,1)] transition-colors text-[10px] whitespace-nowrap flex-1 justify-center">
            <img src={suggestion.icon} className="aspect-[1] object-contain w-3 shrink-0" alt="" />
            <span className="basis-auto grow shrink">
              {suggestion.text}
            </span>
          </button>)}
      </div>
    </section>;
};
