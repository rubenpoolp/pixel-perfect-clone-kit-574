import React, { useState } from 'react';

interface HeroProps {
  className?: string;
}

export const Hero: React.FC<HeroProps> = ({ className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('Ask Clutch to optimize conversions by giving insights through heatmaps');

  const suggestions = [
    {
      icon: 'https://cdn.builder.io/api/v1/image/assets/TEMP/d18eb418fc165b4bf968bc92fd27747fe76ee458?placeholderIfAbsent=true',
      text: 'How competitors are dealing with subscriptions ?'
    },
    {
      icon: 'https://cdn.builder.io/api/v1/image/assets/TEMP/91e4a8fdd5d2e5cd09929a96db2f7794848e1dcc?placeholderIfAbsent=true',
      text: 'A/B Test my onboarding'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
  };

  return (
    <section className={`self-center flex w-full max-w-[1504px] flex-col mt-[260px] max-md:max-w-full max-md:mt-10 ${className}`}>
      <h1 className="text-[rgba(28,28,28,1)] text-3xl font-medium leading-none tracking-[-1.2px] text-center self-center ml-2.5 max-md:max-w-full max-md:text-2xl">
        What do you want to improve today ?
      </h1>
      <p className="text-[#1c1c1c] text-lg font-normal leading-none text-center self-center mt-[15px] max-md:max-w-full">
        Get insights & analytics - test & improve your product by chatting with AI
      </p>
      
      <form onSubmit={handleSubmit} className="bg-[rgba(247,244,237,1)] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)] border self-center flex w-[768px] max-w-full flex-col overflow-hidden items-stretch text-[rgba(95,95,93,1)] mt-[46px] pt-[22px] pb-[13px] px-[17px] rounded-[28px] border-[rgba(28,28,28,0.2)] border-solid max-md:mt-10 max-md:pl-5">
        <div className="flex items-stretch gap-[3px] text-base font-normal leading-none flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="grow shrink basis-auto max-md:max-w-full bg-transparent border-none outline-none placeholder-[rgba(95,95,93,1)]"
            placeholder="Ask Clutch to optimize conversions by giving insights through heatmaps"
          />
          <div className="border w-px shrink-0 h-[19px] border-[rgba(95,95,93,1)] border-solid" />
        </div>
        
        <div className="flex items-stretch gap-10 text-sm font-medium text-center flex-wrap mt-[60px] max-md:mt-10">
          <div className="flex items-stretch gap-5 flex-wrap grow shrink basis-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSearchQuery(suggestion.text)}
                className="bg-[rgba(247,244,237,1)] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border flex items-stretch gap-1 text-black leading-none px-[13px] py-2 rounded-full border-[rgba(236,234,228,1)] border-solid hover:bg-[rgba(236,234,228,1)] transition-colors"
              >
                <img
                  src={suggestion.icon}
                  className="aspect-[1] object-contain w-4 shrink-0"
                  alt=""
                />
                <span className="basis-auto grow shrink">
                  {suggestion.text}
                </span>
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="hover:scale-105 transition-transform"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/2be089ad9905a0a554adf52ae105b290c1c24802?placeholderIfAbsent=true"
              className="aspect-[1] object-contain w-8 shrink-0 rounded-full"
              alt="Submit"
            />
          </button>
        </div>
      </form>
    </section>
  );
};
