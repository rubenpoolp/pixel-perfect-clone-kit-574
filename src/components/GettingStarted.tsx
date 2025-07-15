import React from 'react';
interface GettingStartedProps {
  className?: string;
}
export const GettingStarted: React.FC<GettingStartedProps> = ({
  className = ''
}) => {
  return <section className={`w-full max-w-[1504px] px-4 sm:px-8 ${className}`}>
      <h2 className="text-[rgba(28,28,28,1)] text-xl sm:text-2xl lg:text-3xl font-medium leading-tight tracking-[-0.8px] sm:tracking-[-1.2px] mt-16 sm:mt-20 lg:mt-[120px] max-md:max-w-full">
        Get started in 2 minutes, not 2 weeks
      </h2>
      
      <div className="border w-full max-w-[1473px] shrink-0 h-[2px] sm:h-[3px] mt-6 sm:mt-8 lg:mt-[30px] border-[rgba(206,206,206,1)] border-solid" />
      
      <ol className="text-[#1c1c1c] text-base sm:text-lg lg:text-xl font-normal leading-6 sm:leading-7 mt-8 sm:mt-10 lg:mt-[59px] max-md:max-w-full list-decimal list-inside space-y-3 sm:space-y-2">
        <li>Drop a single JS snippet or connect Segment</li>
        <li>GDPR-ready, EU hosting available</li>
        <li>Works with your team — PMs, Growth, Designers</li>
      </ol>
    </section>;
};