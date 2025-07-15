import React from 'react';

interface GettingStartedProps {
  className?: string;
}

export const GettingStarted: React.FC<GettingStartedProps> = ({ className = '' }) => {
  return (
    <section className={`w-full max-w-[1504px] ${className}`}>
      <h2 className="text-[rgba(28,28,28,1)] text-3xl font-medium leading-none tracking-[-1.2px] mt-[120px] max-md:max-w-full max-md:text-2xl max-md:mt-10">
        Get started in 2 minutes, not 2 weeks
      </h2>
      
      <div className="border w-[1473px] shrink-0 max-w-full h-[3px] mt-[30px] border-[rgba(206,206,206,1)] border-solid" />
      
      <div className="text-[#1c1c1c] text-2xl font-normal leading-[40px] mt-[59px] max-md:max-w-full max-md:mt-10">
        Drop a single JS snippet or connect Segment
        <br />
        GDPR-ready, EU hosting available
        <br />
        Works with your team — PMs, Growth, Designers
      </div>
    </section>
  );
};
